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

            // Определяем ночной режим
            $start = Carbon::parse($validated['start_time']);
            $end = Carbon::parse($validated['end_time']);
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

            return response()->json([
                'success' => true,
                'message' => 'Расписание успешно обновлено!'
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating hall schedule: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении расписания: ' . $e->getMessage()
            ], 500);
        }
    }

    private function hasSessionConflicts($hallId, $date, $startTime, $endTime, $overnight, $excludeScheduleId = null)
    {
        $scheduleStart = Carbon::parse($date . ' ' . $startTime);
        $scheduleEnd = $overnight 
            ? Carbon::parse($date . ' ' . $endTime)->addDay()
            : Carbon::parse($date . ' ' . $endTime);

        // Ищем сеансы, которые пересекаются с новым расписанием
        $query = MovieSession::where('cinema_hall_id', $hallId)
            ->where(function($query) use ($scheduleStart, $scheduleEnd) {
                $query->where(function($q) use ($scheduleStart, $scheduleEnd) {
                    $q->where('session_start', '<', $scheduleEnd)
                      ->where('session_end', '>', $scheduleStart);
                });
            });

        return $query->exists();
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

    public function destroy(HallSchedule $hallSchedule)
    {
        try {
            // Проверяем, активен ли зал
            if ($hallSchedule->cinemaHall->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Нельзя удалить расписание для зала с открытыми продажами!'
                ], 422);
            }

            $hallSchedule->delete();

            return response()->json([
                'success' => true,
                'message' => 'Расписание успешно удалено'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении расписания: ' . $e->getMessage()
            ], 500);
        }
    }
}
