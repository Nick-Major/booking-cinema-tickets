<?php

namespace App\Services;

use App\Models\MovieSession;
use App\Models\HallSchedule;
use App\Models\CinemaHall;
use App\Models\Movie;
use Carbon\Carbon;

class SessionValidationService
{
    // Константы для длительностей
    const ADVERTISEMENT_DURATION = 10; // минут рекламы
    const CLEANING_DURATION = 15;      // минут уборки
    
    // Проверить возможность создания сеанса
    public function validateSession($cinemaHallId, $movieId, Carbon $sessionStart, $ignoreSessionId = null): array
    {
        $cinemaHall = CinemaHall::find($cinemaHallId);
        $movie = Movie::find($movieId);
        
        if (!$cinemaHall || !$movie) {
            return ['valid' => false, 'message' => 'Зал или фильм не найдены'];
        }
        
        // 1. Проверка что зал активен
        if (!$cinemaHall->is_active) {
            return ['valid' => false, 'message' => 'Продажа билетов в этом зале приостановлена'];
        }
        
        // 2. Проверка что сеанс не в прошлом
        if ($sessionStart <= now()) {
            return ['valid' => false, 'message' => 'Нельзя создать сеанс в прошлом'];
        }
        
        // 3. Получить расписание на эту дату
        $schedule = $cinemaHall->getScheduleForDate($sessionStart);
        if (!$schedule) {
            return ['valid' => false, 'message' => 'Для выбранной даты нет расписания работы зала'];
        }
        
        // 4. Рассчитать время окончания сеанса (фильм + реклама)
        $sessionEnd = $this->calculateSessionEnd($sessionStart, $movie->movie_duration);
        
        // 5. Проверить что сеанс помещается в расписание (только фильм + реклама, без уборки)
        if (!$this->isWithinSchedule($schedule, $sessionStart, $sessionEnd)) {
            $startTime = Carbon::parse($schedule->start_time)->format('H:i');
            $endTime = Carbon::parse($schedule->end_time)->format('H:i');
            return [
                'valid' => false, 
                'message' => "Сеанс не помещается в расписание зала ({$startTime} - {$endTime})"
            ];
        }
        
        // 6. Проверить конфликты с другими сеансами (с учетом уборки)
        $sessionEndWithCleaning = $this->calculateSessionEndWithCleaning($sessionStart, $movie->movie_duration);
        
        if ($this->hasTimeConflict($cinemaHallId, $sessionStart, $sessionEndWithCleaning, $ignoreSessionId)) {
            return ['valid' => false, 'message' => 'Время сеанса пересекается с существующим сеансом'];
        }
        
        return [
            'valid' => true,
            'session_end' => $sessionEnd, // Окончание сеанса (фильм + реклама)
            'session_end_with_cleaning' => $sessionEndWithCleaning, // + уборка
            'schedule' => $schedule,
            'movie_duration' => $movie->movie_duration,
            'total_duration' => $movie->movie_duration + self::ADVERTISEMENT_DURATION + self::CLEANING_DURATION
        ];
    }
    
    // Рассчитать время окончания сеанса (фильм + реклама)
    public function calculateSessionEnd(Carbon $start, int $movieDuration): Carbon
    {
        return $start->copy()->addMinutes($movieDuration + self::ADVERTISEMENT_DURATION);
    }
    
    // Рассчитать время окончания с уборкой (для проверки конфликтов)
    public function calculateSessionEndWithCleaning(Carbon $start, int $movieDuration): Carbon
    {
        return $start->copy()->addMinutes($movieDuration + self::ADVERTISEMENT_DURATION + self::CLEANING_DURATION);
    }
    
    // Проверить, помещается ли сеанс в расписание (без уборки)
    private function isWithinSchedule(HallSchedule $schedule, Carbon $sessionStart, Carbon $sessionEnd): bool
    {
        $scheduleStart = $schedule->getScheduleStart();
        $scheduleEnd = $schedule->getScheduleEnd();
        
        return $sessionStart >= $scheduleStart && $sessionEnd <= $scheduleEnd;
    }
    
    // Проверить конфликт по времени с другими сеансами (с учетом уборки)
    private function hasTimeConflict($cinemaHallId, Carbon $sessionStart, Carbon $sessionEndWithCleaning, $ignoreSessionId = null): bool
    {
        $query = MovieSession::where('cinema_hall_id', $cinemaHallId)
            ->where('is_actual', true)
            ->where(function($q) use ($sessionStart, $sessionEndWithCleaning) {
                // Проверяем пересечение интервалов: [session_start, session_end_with_cleaning) 
                // пересекается с [existing.session_start, existing.session_end)
                $q->where('session_start', '<', $sessionEndWithCleaning)
                  ->where('session_end', '>', $sessionStart);
            });
            
        if ($ignoreSessionId) {
            $query->where('id', '!=', $ignoreSessionId);
        }
        
        return $query->exists();
    }
    
    // Найти ближайшее доступное время для сеанса с округлением до 15 минут
    public function findAvailableTime($cinemaHallId, $movieId, Carbon $preferredStart): array
    {
        $cinemaHall = CinemaHall::find($cinemaHallId);
        $movie = Movie::find($movieId);
        
        if (!$cinemaHall || !$movie) {
            return ['success' => false, 'message' => 'Зал или фильм не найдены'];
        }
        
        // Получить расписание на эту дату
        $schedule = $cinemaHall->getScheduleForDate($preferredStart);
        if (!$schedule) {
            return ['success' => false, 'message' => 'Для выбранной даты нет расписания'];
        }
        
        $scheduleStart = $schedule->getScheduleStart();
        $scheduleEnd = $schedule->getScheduleEnd();
        $movieDuration = $movie->movie_duration + self::ADVERTISEMENT_DURATION; // фильм + реклама
        
        // Округляем время до ближайших 15 минут
        $currentTime = $this->roundToNearest15($preferredStart->copy());
        
        // Если время уже прошло, начинаем с текущего времени + 15 минут
        if ($currentTime <= now()) {
            $currentTime = $this->roundToNearest15(now()->addMinutes(15));
        }
        
        // Искать в течение 12 часов
        $maxAttempts = 48; // 48 * 15 минут = 12 часов
        $attempt = 0;
        
        while ($attempt < $maxAttempts) {
            // Проверить, что время в пределах расписания (без уборки)
            $sessionEnd = $currentTime->copy()->addMinutes($movieDuration);
            
            if ($currentTime >= $scheduleStart && $sessionEnd <= $scheduleEnd) {
                
                // Проверить конфликты (с учетом уборки)
                $sessionEndWithCleaning = $currentTime->copy()->addMinutes($movieDuration + self::CLEANING_DURATION);
                $hasConflict = $this->hasTimeConflict($cinemaHallId, $currentTime, $sessionEndWithCleaning);
                
                if (!$hasConflict) {
                    return [
                        'success' => true,
                        'available_time' => $currentTime,
                        'session_end' => $sessionEnd
                    ];
                }
            }
            
            // Перейти к следующему временному промежутку (каждые 15 минут)
            $currentTime->addMinutes(15);
            $attempt++;
        }
        
        return ['success' => false, 'message' => 'Не удалось найти свободное время для сеанса в течение 12 часов'];
    }
    
    // Округлить время до ближайших 15 минут
    private function roundToNearest15(Carbon $time): Carbon
    {
        $minutes = $time->minute;
        $rounded = round($minutes / 15) * 15;
        
        if ($rounded == 60) {
            $time->addHour();
            $time->minute(0);
        } else {
            $time->minute($rounded);
        }
        
        $time->second(0);
        return $time;
    }
}
