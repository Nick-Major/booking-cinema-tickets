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
    ];

    protected $casts = [
        'session_start' => 'datetime',
        'session_end' => 'datetime',
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
}
