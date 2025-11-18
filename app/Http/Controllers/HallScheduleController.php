<?php

namespace App\Http\Controllers;

use App\Models\HallSchedule;
use App\Models\CinemaHall;
use App\Models\MovieSession;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HallScheduleController extends Controller
{
    public function store(Request $request)
    {
        try {
            Log::info('Creating hall schedule', $request->all());
            
            $validated = $request->validate([
                'cinema_hall_id' => 'required|exists:cinema_halls,id',
                'date' => 'required|date',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i',
            ]);

            // Определяем ночной режим
            $start = Carbon::parse($validated['start_time']);
            $end = Carbon::parse($validated['end_time']);
            $overnight = $end->lessThan($start);

            // Проверяем, не существует ли уже расписание для этого зала на эту дату
            $existingSchedule = HallSchedule::where('cinema_hall_id', $validated['cinema_hall_id'])
                ->where('date', $validated['date'])
                ->first();

            if ($existingSchedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Расписание для этого зала на выбранную дату уже существует'
                ], 422);
            }

            $schedule = HallSchedule::create([
                'cinema_hall_id' => $validated['cinema_hall_id'],
                'date' => $validated['date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'overnight' => $overnight,
            ]);

            Log::info('Hall schedule created successfully', ['id' => $schedule->id]);

            return response()->json([
                'success' => true,
                'message' => 'Расписание успешно создано!',
                'schedule' => $schedule
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating hall schedule: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Ошибка при создании расписания: ' . $e->getMessage()
            ], 500);
        }
    }

    public function edit(HallSchedule $hallSchedule)
    {
        try {
            return response()->json([
                'id' => $hallSchedule->id,
                'cinema_hall_id' => $hallSchedule->cinema_hall_id,
                'date' => $hallSchedule->date,
                'start_time' => $hallSchedule->start_time,
                'end_time' => $hallSchedule->end_time,
                'hall_name' => $hallSchedule->cinemaHall->hall_name ?? 'Неизвестный зал',
            ]);
        } catch (\Exception $e) {
            Log::error('Error editing hall schedule: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при загрузке расписания'
            ], 500);
        }
    }

    public function update(Request $request, HallSchedule $hallSchedule)
    {
        try {
            $validated = $request->validate([
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i',
            ]);

            \Log::info('Updating schedule', [
                'schedule_id' => $hallSchedule->id,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'current_date' => $hallSchedule->date
            ]);

            // Определяем ночной режим
            $start = \Carbon\Carbon::parse($validated['start_time']);
            $end = \Carbon\Carbon::parse($validated['end_time']);
            $overnight = $end->lessThan($start);

            // Проверяем конфликты с существующими сеансами
            if ($this->hasSessionConflicts($hallSchedule->cinema_hall_id, $hallSchedule->date, $validated['start_time'], $validated['end_time'], $overnight, $hallSchedule->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Невозможно изменить расписание: есть конфликтующие сеансы'
                ], 422);
            }

            $hallSchedule->update([
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'overnight' => $overnight,
            ]);

            \Log::info('Schedule updated successfully', ['schedule_id' => $hallSchedule->id]);

            return response()->json([
                'success' => true,
                'message' => 'Расписание успешно обновлено!'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating hall schedule: ' . $e->getMessage(), [
                'schedule_id' => $hallSchedule->id,
                'request_data' => $request->all(),
                'exception' => $e
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении расписания: ' . $e->getMessage()
            ], 500);
        }
    }

    private function hasSessionConflicts($hallId, $date, $startTime, $endTime, $overnight, $excludeScheduleId = null)
    {
        try {
            // Правильно формируем дату и время
            $scheduleStart = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $date->format('Y-m-d') . ' ' . $startTime);
            
            $scheduleEnd = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $date->format('Y-m-d') . ' ' . $endTime);
            if ($overnight) {
                $scheduleEnd->addDay();
            }

            \Log::info('Checking session conflicts', [
                'hall_id' => $hallId,
                'date' => $date->format('Y-m-d'),
                'start' => $scheduleStart->format('Y-m-d H:i'),
                'end' => $scheduleEnd->format('Y-m-d H:i'),
                'overnight' => $overnight
            ]);

            // Ищем сеансы, которые пересекаются с новым расписанием
            $query = MovieSession::where('cinema_hall_id', $hallId)
                ->where(function($query) use ($scheduleStart, $scheduleEnd) {
                    $query->where(function($q) use ($scheduleStart, $scheduleEnd) {
                        $q->where('session_start', '<', $scheduleEnd)
                        ->where('session_end', '>', $scheduleStart);
                    });
                });

            if ($excludeScheduleId) {
                // Для обновления исключаем текущее расписание
                $query->where('id', '!=', $excludeScheduleId);
            }

            $hasConflicts = $query->exists();
            
            \Log::info('Conflict check result', ['has_conflicts' => $hasConflicts]);

            return $hasConflicts;

        } catch (\Exception $e) {
            \Log::error('Error in hasSessionConflicts: ' . $e->getMessage());
            return true; // В случае ошибки считаем, что есть конфликт
        }
    }

    public function isWithinSchedule(\Carbon\Carbon $time): bool
    {
        $scheduleTime = \Carbon\Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->start_time);
        $scheduleEndTime = \Carbon\Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->end_time);
        
        if ($this->overnight) {
            $scheduleEndTime->addDay();
        }
        
        return $time->between($scheduleTime, $scheduleEndTime);
    }

    public function destroy(Request $request, HallSchedule $hallSchedule)
    {
        try {
            // Проверяем, активен ли зал
            if ($hallSchedule->cinemaHall->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Нельзя удалить расписание для зала с открытыми продажами!'
                ], 422);
            }

            // Получаем дату из запроса (текущая дата в интерфейсе)
            $currentDate = $request->input('current_date');
            
            // Проверяем, что удаляем расписание на правильную дату
            if ($hallSchedule->date->format('Y-m-d') !== $currentDate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Нельзя удалить расписание на другую дату'
                ], 422);
            }

            // Удаляем все сеансы на эту дату в этом зале
            $deletedSessionsCount = MovieSession::where('cinema_hall_id', $hallSchedule->cinema_hall_id)
                ->whereDate('session_start', $hallSchedule->date)
                ->delete();

            // Удаляем само расписание
            $hallSchedule->delete();

            return response()->json([
                'success' => true,
                'message' => "Расписание удалено. Удалено сеансов: {$deletedSessionsCount}",
                'deleted_sessions_count' => $deletedSessionsCount
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting schedule: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении расписания: ' . $e->getMessage()
            ], 500);
        }
    }

    // Метод для проверки возможности редактирования расписания
    public function checkEditPossibility(HallSchedule $hallSchedule)
    {
        try {
            // Находим самый поздний сеанс на эту дату
            $latestSession = MovieSession::where('cinema_hall_id', $hallSchedule->cinema_hall_id)
                ->whereDate('session_start', $hallSchedule->date)
                ->orderBy('session_start', 'desc')
                ->first();

            $minEndTime = '00:00'; // Минимальное время окончания
            
            if ($latestSession) {
                // Время окончания последнего сеанса (фильм + реклама + уборка)
                $sessionEnd = $latestSession->session_start->copy()
                    ->addMinutes($latestSession->getTotalDuration());
                $minEndTime = $sessionEnd->format('H:i');
            }

            return response()->json([
                'success' => true,
                'min_end_time' => $minEndTime,
                'has_sessions' => !is_null($latestSession),
                'latest_session_end' => $minEndTime
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при проверке возможности редактирования'
            ], 500);
        }
    }
}
