<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\EloquentSortable\Sortable;
use Spatie\EloquentSortable\SortableTrait;

class MovieSession extends Model implements Sortable
{
    use HasFactory, SortableTrait;

    protected $fillable = [
        'movie_id',
        'cinema_hall_id',
        'session_start',
        'session_end',
        'is_actual',
        'order_column'
    ];

    protected $casts = [
        'session_start' => 'datetime',
        'session_end' => 'datetime',
        'is_actual' => 'boolean'
    ];

    public $sortable = [
        'order_column_name' => 'order_column',
        'sort_when_creating' => true,
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

    // Проверка, доступен ли сеанс для бронирования
    public function isAvailable(): bool
    {
        return $this->session_start > now();
    }

    // Расчет времени окончания сеанса
    public static function calculateSessionEnd($sessionStart, $movieDuration): string
    {
        $start = \Carbon\Carbon::parse($sessionStart);
        return $start->addMinutes($movieDuration)->toDateTimeString();
    }

    // Проверка конфликтов по времени в зале
    public function hasTimeConflict(): bool
    {
        return self::where('cinema_hall_id', $this->cinema_hall_id)
            ->where('id', '!=', $this->id ?? 0)
            ->where(function ($query) {
                $query->whereBetween('session_start', [$this->session_start, $this->session_end])
                    ->orWhereBetween('session_end', [$this->session_start, $this->session_end])
                    ->orWhere(function ($query) {
                        $query->where('session_start', '<=', $this->session_start)
                            ->where('session_end', '>=', $this->session_end);
                    });
            })
            ->exists();
    }

    // Scope: активные сеансы
    public function scopeActual($query)
    {
        return $query->where('is_actual', true);
    }

    // Scope: будущие сеансы
    public function scopeFuture($query)
    {
        return $query->where('session_start', '>=', now());
    }

    // Scope: по дате
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('session_start', $date);
    }

    // Scope: по залу
    public function scopeByHall($query, $hallId)
    {
        return $query->where('cinema_hall_id', $hallId);
    }

    // Получить доступные места
    public function getAvailableSeats()
    {
        $occupiedSeatIds = $this->tickets()
            ->whereIn('status', ['reserved', 'paid'])
            ->pluck('seat_id');

        return $this->cinemaHall->seats()
            ->whereNotIn('id', $occupiedSeatIds)
            ->active()
            ->get();
    }

    // Получить занятые места
    public function getOccupiedSeats()
    {
        return $this->tickets()
            ->with('seat')
            ->whereIn('status', ['reserved', 'paid'])
            ->get()
            ->pluck('seat');
    }
}
