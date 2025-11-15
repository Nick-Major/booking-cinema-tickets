<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CinemaHall extends Model
{
    use HasFactory;

    protected $fillable = [
        'hall_name',
        'row_count', 
        'max_seats_number_in_row',
        'regular_price',
        'vip_price',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Отношение с расписанием
    // public function schedules()
    // {
    //     return $this->hasMany(HallSchedule::class);
    // }

    public function schedules()
    {
        return $this->hasMany(\App\Models\HallSchedule::class, 'cinema_hall_id');
    }

    // Связь: один зал имеет много мест
    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    // Связь: один зал имеет много сеансов
    public function movieSessions(): HasMany
    {
        return $this->hasMany(MovieSession::class);
    }

    // Scope: активные залы
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Метод для получения расписания на конкретную дату
    // public function getScheduleForDate($date)
    // {
    //     $dateString = $date instanceof \Carbon\Carbon ? $date->toDateString() : $date;
        
    //     // Если отношения уже загружены, ищем в коллекции
    //     if ($this->relationLoaded('schedules')) {
    //         return $this->schedules->firstWhere('date', $dateString);
    //     }
        
    //     // Иначе делаем запрос к БД
    //     return $this->schedules()->where('date', $dateString)->first();
    // }

    public function getScheduleForDate($date)
    {
        try {
            $dateString = $date instanceof \Carbon\Carbon ? $date->toDateString() : $date;
            
            // Простая версия - всегда возвращаем null
            return null;
            
            // Или если хотите проверить:
            // return $this->schedules()->where('date', $dateString)->first();
        } catch (\Exception $e) {
            \Log::error('Error in getScheduleForDate: ' . $e->getMessage());
            return null;
        }
    }
}
