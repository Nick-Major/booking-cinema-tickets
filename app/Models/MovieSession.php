<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\EloquentSortable\Sortable;
use Spatie\EloquentSortable\SortableTrait;
use Carbon\Carbon; // Добавьте этот импорт

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
        'sort_on_has_many' => true,
    ];

    // === ДОБАВЬТЕ ЭТИ ОТНОШЕНИЯ ===
    
    /**
     * Отношение к фильму
     */
    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    /**
     * Отношение к кинозалу
     */
    public function cinemaHall(): BelongsTo
    {
        return $this->belongsTo(CinemaHall::class);
    }

    /**
     * Отношение к билетам (если нужно)
     */
    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    // === КОНЕЦ ОТНОШЕНИЙ ===

    // Указываем группировку для сортировки (по залу и дате)
    public function buildSortQuery()
    {
        return static::query()
            ->where('cinema_hall_id', $this->cinema_hall_id)
            ->whereDate('session_start', $this->session_start->format('Y-m-d'));
    }

    // Полная длительность сеанса (фильм + реклама + уборка)
    public function getTotalDuration(): int
    {
        // Добавляем проверку на существование отношения
        if (!$this->movie) {
            return 0;
        }
        return $this->movie->movie_duration + 25; // +25 минут
    }

    public function getCleaningEndTime(): Carbon
    {
        return $this->session_end->addMinutes(15);
    }

    // Проверка пересечения сеансов через полночь
    public function spansMultipleDays(): bool
    {
        return !$this->session_start->isSameDay($this->getCleaningEndTime());
    }

    // Расчет позиции для таймлайна
    public function getTimelinePosition(): array
    {
        $start = $this->session_start;
        $end = $this->getCleaningEndTime();
        
        $startMinutes = $start->hour * 60 + $start->minute;
        $endMinutes = $end->hour * 60 + $end->minute;
        
        // Если сеанс через полночь, корректируем расчет
        if ($endMinutes < $startMinutes) {
            $endMinutes += 1440; // добавляем сутки в минутах
        }
        
        $duration = $endMinutes - $startMinutes;
        
        return [
            'left' => ($startMinutes / 1440) * 100,
            'width' => ($duration / 1440) * 100,
            'spans_days' => $this->spansMultipleDays()
        ];
    }
}
