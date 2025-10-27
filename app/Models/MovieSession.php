<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MovieSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'movie_id',
        'cinema_hall_id',
        'session_start',
        'session_end',
        'is_actual',
        'base_price'
    ];

    protected $casts = [
        'session_start' => 'datetime',
        'session_end' => 'datetime',
        'is_actual' => 'boolean',
        'base_price' => 'decimal:2'
    ];

    // Связь: сеанс принадлежит фильму
    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    // Связь: сеанс принадлежит залу
    public function cinemaHall(): BelongsTo
    {
        return $this->belongsTo(CinemaHall::class);
    }

    // Связь: сеанс имеет много билетов
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    // Scope: актуальные сеансы
    public function scopeActual($query)
    {
        return $query->where('is_actual', true);
    }

    // Scope: будущие сеансы
    public function scopeFuture($query)
    {
        return $query->where('session_start', '>', now());
    }

    // Scope: сеансы по дате
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('session_start', $date);
    }

    // Scope: сеансы для конкретного зала
    public function scopeByHall($query, $cinemaHallId)
    {
        return $query->where('cinema_hall_id', $cinemaHallId);
    }

    // Проверка, доступен ли сеанс для бронирования
    public function isAvailable(): bool
    {
        return $this->is_actual && $this->session_start > now();
    }

    // Получить занятые места на сеансе
    public function getOccupiedSeats()
    {
        return $this->tickets()
            ->whereHas('seat')
            ->with('seat')
            ->get()
            ->pluck('seat');
    }

    // Получить доступные места на сеансе
    public function getAvailableSeats()
    {
        $occupiedSeatIds = $this->tickets()->pluck('seat_id');
        
        return $this->cinemaHall->seats()
            ->whereNotIn('id', $occupiedSeatIds)
            ->active()
            ->get();
    }

    // Проверка конфликтов сеансов в зале
    public function hasTimeConflict(): bool
    {
        return self::where('cinema_hall_id', $this->cinema_hall_id)
            ->where('id', '!=', $this->id)
            ->where('is_actual', true)
            ->where(function($query) {
                $query->whereBetween('session_start', [$this->session_start, $this->session_end])
                      ->orWhereBetween('session_end', [$this->session_start, $this->session_end])
                      ->orWhere(function($q) {
                          $q->where('session_start', '<', $this->session_start)
                            ->where('session_end', '>', $this->session_end);
                      });
            })
            ->exists();
    }

    // Автоматический расчет окончания сеанса на основе длительности фильма
    public static function calculateSessionEnd($sessionStart, $movieDuration, $breakMinutes = 15): string
    {
        return \Carbon\Carbon::parse($sessionStart)
            ->addMinutes($movieDuration)
            ->addMinutes($breakMinutes)
            ->toDateTimeString();
    }
}
