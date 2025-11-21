<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class HallSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'cinema_hall_id',
        'date',
        'start_time',
        'end_time',
        'overnight'
    ];

    protected $casts = [
        'date' => 'date',
        'overnight' => 'boolean'
    ];

    // Отношение с залом
    public function cinemaHall()
    {
        return $this->belongsTo(CinemaHall::class);
    }

    // Автоматическое определение ночного режима при сохранении
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($schedule) {
            $start = Carbon::parse($schedule->start_time);
            $end = Carbon::parse($schedule->end_time);
            $schedule->overnight = $end->lessThan($start);
        });
    }

    public function getEffectiveEndTimeAttribute()
    {
        $end = Carbon::parse($this->end_time);
        return $this->overnight ? $end->addDay() : $end;
    }

    public function getFormattedTimeAttribute()
    {
        $start = Carbon::parse($this->start_time)->format('H:i');
        $end = Carbon::parse($this->end_time)->format('H:i');
        
        return $this->overnight ? "{$start} - {$end} (ночной)" : "{$start} - {$end}";
    }
    
    public function getScheduleStart(): Carbon
    {
        return Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->start_time);
    }

    public function getScheduleEnd(): Carbon
    {
        $end = Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->end_time);
        return $this->overnight ? $end->addDay() : $end;
    }

    // Получить общую длительность расписания в минутах
    public function getTotalDuration(): int
    {
        return $this->getScheduleStart()->diffInMinutes($this->getScheduleEnd());
    }

    // Проверить, попадает ли время в расписание (включая ночные сеансы)
    public function isTimeWithinSchedule(Carbon $time): bool
    {
        $scheduleStart = $this->getScheduleStart();
        $scheduleEnd = $this->getScheduleEnd();
        
        return $time->between($scheduleStart, $scheduleEnd);
    }

    // Получить все сеансы, которые попадают в это расписание
    public function getSessionsWithinSchedule()
    {
        return MovieSession::where('cinema_hall_id', $this->cinema_hall_id)
            ->where('session_start', '>=', $this->getScheduleStart())
            ->where('session_start', '<', $this->getScheduleEnd())
            ->with('movie')
            ->get();
    }
}
