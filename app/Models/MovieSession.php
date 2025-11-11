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

    // Длительность фильма с рекламой (для отображения элемента)
    public function getDisplayDuration(): int
    {
        if (!$this->movie) {
            return 0;
        }
        
        return $this->movie->movie_duration + 10;
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

    // Расчет позиции для таймлайна в пикселях
    public function getTimelinePosition($dayStart, $pixelsPerMinute = 2): array
    {
        $sessionStart = $this->session_start;
        $movieEnd = $this->getMovieEndTime();

        // ИСПРАВЛЕНИЕ: Меняем порядок расчета!
        // Было: $sessionStart->diffInMinutes($dayStart) - это дает отрицательные значения
        // Стало: $dayStart->diffInMinutes($sessionStart) - это дает положительные значения
        $left = $dayStart->diffInMinutes($sessionStart) * $pixelsPerMinute;

        // Ширина элемента (только фильм + реклама)
        $width = $this->getDisplayDuration() * $pixelsPerMinute;

        // Проверка на ночной сеанс
        $isOvernight = !$sessionStart->isSameDay($movieEnd);

        return [
            'left' => max(0, $left), // Защита от отрицательных значений
            'width' => $width,
            'is_overnight' => $isOvernight,
            'start_time' => $sessionStart->format('H:i'),
            'end_time' => $movieEnd->format('H:i'),
            'display_duration' => $this->getDisplayDuration()
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
        $sessionEnd = $this->session_start->copy()->addMinutes($this->getTotalDuration());
        
        return MovieSession::where('cinema_hall_id', $this->cinema_hall_id)
            ->where('id', '!=', $this->id ?? 0)
            ->where(function($query) use ($sessionEnd) {
                $query->whereBetween('session_start', [$this->session_start, $sessionEnd])
                    ->orWhereBetween('session_end', [$this->session_start, $sessionEnd])
                    ->orWhere(function($q) use ($sessionEnd) {
                        $q->where('session_start', '<', $this->session_start)
                          ->where('session_end', '>', $sessionEnd);
                    });
            })
            ->exists();
    }
}
