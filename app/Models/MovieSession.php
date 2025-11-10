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
        if (!$this->movie) {
            return 0;
        }
        
        // фильм + реклама (15 мин) + уборка (10 мин)
        return $this->movie->movie_duration + 25;
    }

    // Дополнительный метод для удобства
    public function getTotalDurationInHours(): float
    {
        return round($this->getTotalDuration() / 60, 1);
    }

    // Расчет времени окончания сеанса
    public static function calculateSessionEnd($startTime, $movieDuration): Carbon
    {
        $start = Carbon::parse($startTime);
        return $start->copy()->addMinutes($movieDuration + 25); // фильм + реклама + уборка
    }

    public function getCleaningEndTime(): Carbon
    {
        return $this->session_end->addMinutes(15);
    }

    // Проверка пересечения сеансов
    public function hasTimeConflict(): bool
    {
        return MovieSession::where('cinema_hall_id', $this->cinema_hall_id)
            ->where('id', '!=', $this->id ?? 0)
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

    // Проверка пересечения сеансов через полночь
    public function spansMultipleDays(): bool
    {
        return !$this->session_start->isSameDay($this->getCleaningEndTime());
    }

    // Проверка доступности сеанса
    public function isAvailable(): bool
    {
        return $this->is_actual && 
            $this->session_start > now() &&
            $this->cinemaHall->is_active;
    }

    // Расчет позиции для таймлайна
    public function getTimelinePosition(): array
    {
        $start = $this->session_start;
        $end = $this->getCleaningEndTime();
        
        // Определяем рабочие часы кинотеатра (8:00 - 4:00 следующего дня)
        $workStart = $start->copy()->setTime(8, 0);
        $workEnd = $start->copy()->addDay()->setTime(4, 0);
        
        // Если сеанс начинается до рабочего времени, обрезаем
        $sessionStart = $start->greaterThan($workStart) ? $start : $workStart;
        // Если сеанс заканчивается после рабочего времени, обрезаем
        $sessionEnd = $end->lessThan($workEnd) ? $end : $workEnd;
        
        // Рассчитываем позиции в процентах
        $totalWorkMinutes = $workStart->diffInMinutes($workEnd);
        $startOffset = $workStart->diffInMinutes($sessionStart);
        $duration = $sessionStart->diffInMinutes($sessionEnd);
        
        $left = ($startOffset / $totalWorkMinutes) * 100;
        $width = ($duration / $totalWorkMinutes) * 100;
        
        // Ограничиваем значения
        $left = max(0, min(100, $left));
        $width = max(1, min(100 - $left, $width));
        
        return [
            'left' => $left,
            'width' => $width,
            'spans_days' => !$start->isSameDay($end),
            'start_time' => $start->format('H:i'),
            'end_time' => $end->format('H:i')
        ];
    }

    // Расчет позиции для таймлайна в пикселях
    public function getTimelinePositionPixels(): array
    {
        $start = $this->session_start;
        $end = $this->getCleaningEndTime();
        
        // Время начала в минутах от 0:00
        $startMinutes = $start->hour * 60 + $start->minute;
        
        // Общая длительность в минутах
        $totalDuration = $this->getTotalDuration();
        
        return [
            'left' => $startMinutes, // в пикселях (1 минута = 1 пиксель)
            'width' => $totalDuration, // в пикселях
            'spans_days' => $this->spansMultipleDays()
        ];
    }

    // Расчет позиции для отображения (с учетом перехода через полночь)
    public function getDisplayPosition($currentDate): array
    {
        $start = $this->session_start;
        $end = $this->getCleaningEndTime();
        
        // Если сеанс полностью в текущем дне
        if ($start->isSameDay($end)) {
            $startMinutes = $start->hour * 60 + $start->minute;
            $duration = $this->getTotalDuration();
            
            return [
                'left' => $startMinutes,
                'width' => $duration,
                'spans_days' => false
            ];
        }
        
        // Если сеанс переходит через полночь
        $dayEnd = $currentDate->copy()->endOfDay();
        $minutesInFirstDay = $dayEnd->diffInMinutes($start);
        $minutesInSecondDay = $end->diffInMinutes($dayEnd);
        
        return [
            'left' => $start->hour * 60 + $start->minute,
            'width' => $minutesInFirstDay,
            'spans_days' => true,
            'next_day_width' => $minutesInSecondDay
        ];
    }
}
