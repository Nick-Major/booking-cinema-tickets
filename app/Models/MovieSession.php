<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class MovieSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'movie_id',
        'cinema_hall_id', 
        'session_start',
        'session_end',
        'is_actual'
    ];

    protected $casts = [
        'session_start' => 'datetime',
        'session_end' => 'datetime',
        'is_actual' => 'boolean'
    ];

    public function hallSchedule()
    {
        return $this->belongsTo(HallSchedule::class, 'hall_schedule_id');
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function cinemaHall(): BelongsTo
    {
        return $this->belongsTo(CinemaHall::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    // Получить доступные места для сеанса
    public function getAvailableSeats()
    {
        $occupiedSeatIds = $this->tickets()
            ->where('status', 'reserved')
            ->pluck('seat_id')
            ->toArray();

        return $this->cinemaHall->seats()
            ->whereNotIn('id', $occupiedSeatIds)
            ->where('seat_status', '!=', 'blocked')
            ->orderBy('row_number')
            ->orderBy('row_seat_number')
            ->get();
    }

    // Получить занятые места для сеанса
    public function getOccupiedSeats()
    {
        return $this->tickets()
            ->where('status', 'reserved')
            ->with('seat')
            ->get()
            ->map(function ($ticket) {
                return [
                    'seat' => $ticket->seat,
                    'ticket_status' => $ticket->status,
                    'ticket_code' => $ticket->unique_code
                ];
            });
    }

    // Длительность фильма с рекламой
    public function getDisplayDuration(): int
    {
        if (!$this->movie) {
            return 0;
        }
        
        return $this->movie->movie_duration + 10; // фильм + реклама
    }

    // Полная длительность занятия зала (фильм + реклама + уборка)
    public function getTotalDuration(): int
    {
        return $this->getDisplayDuration() + 15; // + 15 минут уборки
    }

    // Время окончания фильма (без уборки)
    public function getMovieEndTime(): Carbon
    {
        return $this->session_start->copy()->addMinutes($this->getDisplayDuration());
    }

    // Время полного освобождения зала
    public function getSessionEndWithCleaning(): Carbon
    {
        return $this->session_start->copy()->addMinutes($this->getTotalDuration());
    }

    public function getTimelinePosition($dayStart, $pixelsPerMinute = 2): array
    {
        $sessionStart = $this->session_start;
        $movieEnd = $this->getMovieEndTime();

        // Расчет позиции относительно переданного начала дня
        $left = $dayStart->diffInMinutes($sessionStart) * $pixelsPerMinute;
        
        // Ширина элемента (фильм + реклама + уборка)
        $width = $this->getTotalDuration() * $pixelsPerMinute;

        // Проверка на ночной сеанс
        $isOvernight = !$sessionStart->isSameDay($movieEnd);

        return [
            'left' => max(0, $left),
            'width' => $width,
            'is_overnight' => $isOvernight,
            'start_time' => $sessionStart->format('H:i'),
            'end_time' => $movieEnd->format('H:i'),
            'display_duration' => $this->getDisplayDuration()
        ];
    }

    // Расчет позиции относительно расписания зала
    public function getTimelinePositionForSchedule(HallSchedule $schedule, $pixelsPerMinute = 2): array
    {
        $sessionStart = $this->session_start;
        $movieEnd = $this->getMovieEndTime();
        
        $scheduleStart = $schedule->getScheduleStart();
        $scheduleEnd = $schedule->getScheduleEnd();
        
        // Расчет позиции относительно начала расписания
        $left = $scheduleStart->diffInMinutes($sessionStart) * $pixelsPerMinute;
        
        // Ширина элемента (фильм + реклама + уборка)
        $width = $this->getTotalDuration() * $pixelsPerMinute;
        
        // Максимальная ширина - не выходить за пределы расписания
        $maxWidth = $scheduleStart->diffInMinutes($scheduleEnd) * $pixelsPerMinute - $left;
        $width = min($width, $maxWidth);
        
        // Проверка на ночной сеанс
        $isOvernight = !$sessionStart->isSameDay($movieEnd);

        return [
            'left' => max(0, $left),
            'width' => max(10, $width),
            'is_overnight' => $isOvernight,
            'start_time' => $sessionStart->format('H:i'),
            'end_time' => $movieEnd->format('H:i'),
            'display_duration' => $this->getDisplayDuration(),
            'within_schedule' => $schedule->isTimeWithinSchedule($sessionStart)
        ];
    }

    // Проверка доступности
    public function isAvailable(): bool
    {
        return $this->is_actual && 
               $this->session_start > now() &&
               optional($this->cinemaHall)->is_active;
    }

    // Проверка пересечения сеансов
    public function hasTimeConflict(): bool
    {
        $currentSessionEnd = $this->getSessionEndWithCleaning();
        
        $conflictingSessions = MovieSession::where('cinema_hall_id', $this->cinema_hall_id)
            ->where('id', '!=', $this->id ?? 0)
            ->where('is_actual', true)
            ->where(function($query) use ($currentSessionEnd) {
                $query->where(function($q) use ($currentSessionEnd) {
                    $q->where('session_start', '<', $currentSessionEnd)
                    ->where('session_end', '>', $this->session_start);
                });
            })
            ->exists();

        return $conflictingSessions;
    }
}
