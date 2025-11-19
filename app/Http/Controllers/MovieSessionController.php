<?php

namespace App\Http\Controllers;

use App\Models\MovieSession;
use App\Models\Movie;
use App\Models\CinemaHall;
use App\Models\HallSchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MovieSessionController extends Controller
{
    public function index()
    {
        return MovieSession::with(['movie', 'cinemaHall'])
            ->orderBy('session_start')
            ->get();
    }

    private function validateSessionTime($sessionStart, $sessionEnd)
    {
        $dayStart = $sessionStart->copy()->setTime(8, 0);
        $dayEnd = $sessionStart->copy()->setTime(23, 59, 59);
        $nextDay4AM = $sessionStart->copy()->addDay()->setTime(4, 0);
        
        $errors = [];
        
        if ($sessionStart->lt($dayStart)) {
            $errors[] = 'Сеанс не может начинаться раньше 8:00';
        }
        
        if ($sessionStart->gt($dayEnd)) {
            $errors[] = 'Сеанс не может начинаться позже 24:00';
        }
        
        if ($sessionEnd->gt($nextDay4AM)) {
            $errors[] = 'Сеанс не может заканчиваться позже 4:00 утра следующего дня';
        }
        
        return [
            'is_valid' => empty($errors),
            'errors' => $errors
        ];
    }

    private function validateSessionAgainstSchedule($sessionStart, $sessionEnd, $cinemaHallId, $date)
    {
        $hall = CinemaHall::find($cinemaHallId);
        $schedule = $hall->getScheduleForDate($date);
        
        if (!$schedule) {
            return [
                'is_valid' => false,
                'errors' => ['Для выбранной даты не создано расписание зала']
            ];
        }
        
        // Определяем рабочие часы зала
        $workStart = \Carbon\Carbon::parse($schedule->date->format('Y-m-d') . ' ' . $schedule->start_time);
        $workEnd = \Carbon\Carbon::parse($schedule->date->format('Y-m-d') . ' ' . $schedule->end_time);
        
        if ($schedule->overnight) {
            $workEnd->addDay();
        }
        
        $errors = [];
        
        // Проверяем начало сеанса
        if ($sessionStart->lt($workStart)) {
            $errors[] = "Сеанс не может начинаться раньше {$schedule->start_time}";
        }
        
        if ($sessionStart->gte($workEnd)) {
            $errors[] = "Сеанс не может начинаться позже или в момент окончания работы зала";
        }
        
        // Проверяем окончание сеанса
        if ($sessionEnd->gt($workEnd)) {
            $errors[] = "Сеанс не может заканчиваться позже {$schedule->end_time}";
        }
        
        // Дополнительная проверка для ночных сеансов
        if ($schedule->overnight && $sessionStart->isSameDay($workEnd)) {
            $errors[] = "При ночном расписании сеанс должен начинаться в день начала работы зала";
        }
        
        return [
            'is_valid' => empty($errors),
            'errors' => $errors
        ];
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'movie_id' => 'required|exists:movies,id',
                'cinema_hall_id' => 'required|exists:cinema_halls,id',
                'session_date' => 'required|date',
                'session_time' => 'required|date_format:H:i',
            ]);

            $cinemaHallId = $validated['cinema_hall_id'];
            $sessionDate = $validated['session_date']; // "2025-11-19"
            $sessionTime = $validated['session_time']; // "00:30"
            
            // Создаем объект DateTime для сеанса
            $sessionDateTime = Carbon::createFromFormat('Y-m-d H:i', $sessionDate . ' ' . $sessionTime);
            
            \Log::info('Session creation started:', [
                'cinema_hall_id' => $cinemaHallId,
                'session_date' => $sessionDate,
                'session_time' => $sessionTime,
                'session_datetime' => $sessionDateTime->format('Y-m-d H:i:s')
            ]);

            // Ищем расписания для этого зала
            $schedules = HallSchedule::where('cinema_hall_id', $cinemaHallId)
                ->get();

            $validSchedule = null;
            foreach ($schedules as $schedule) {
                // Извлекаем только дату из datetime поля (обрезаем время)
                $scheduleDate = $schedule->date instanceof \Carbon\Carbon 
                    ? $schedule->date->format('Y-m-d')
                    : substr($schedule->date, 0, 10);
                
                \Log::info('Processing schedule:', [
                    'schedule_id' => $schedule->id,
                    'schedule_date_raw' => $schedule->date,
                    'schedule_date_extracted' => $scheduleDate,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'overnight' => $schedule->overnight
                ]);

                // Создаем объекты времени для расписания
                $scheduleStart = Carbon::createFromFormat('Y-m-d H:i:s', $scheduleDate . ' ' . $schedule->start_time);
                $scheduleEnd = Carbon::createFromFormat('Y-m-d H:i:s', $scheduleDate . ' ' . $schedule->end_time);
                
                // Если ночной режим, добавляем день к времени окончания
                if ($schedule->overnight) {
                    $scheduleEnd->addDay();
                }

                \Log::info('Checking schedule compatibility:', [
                    'schedule_id' => $schedule->id,
                    'schedule_start' => $scheduleStart->format('Y-m-d H:i:s'),
                    'schedule_end' => $scheduleEnd->format('Y-m-d H:i:s'),
                    'session_datetime' => $sessionDateTime->format('Y-m-d H:i:s'),
                    'is_within_schedule' => ($sessionDateTime >= $scheduleStart && $sessionDateTime < $scheduleEnd)
                ]);

                // Проверяем, что сеанс попадает в интервал расписания
                if ($sessionDateTime >= $scheduleStart && $sessionDateTime < $scheduleEnd) {
                    $validSchedule = $schedule;
                    \Log::info('Valid schedule found!', ['schedule_id' => $schedule->id]);
                    break;
                }
            }

            if (!$validSchedule) {
                \Log::warning('No valid schedule found for session', [
                    'cinema_hall_id' => $cinemaHallId,
                    'session_datetime' => $sessionDateTime->format('Y-m-d H:i:s')
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Время сеанса не попадает в расписание зала. ' .
                            'Сеанс должен начинаться в пределах рабочего времени зала.'
                ], 422);
            }

            // Получаем длительность фильма
            $movie = Movie::find($validated['movie_id']);
            $sessionEnd = $sessionDateTime->copy()->addMinutes($movie->movie_duration + 25);

            \Log::info('Session timing calculated:', [
                'movie_title' => $movie->title,
                'movie_duration' => $movie->movie_duration,
                'session_start' => $sessionDateTime->format('Y-m-d H:i:s'),
                'session_end' => $sessionEnd->format('Y-m-d H:i:s')
            ]);

            // Проверяем конфликты с другими сеансами
            $conflictingSession = MovieSession::where('cinema_hall_id', $cinemaHallId)
                ->where(function($query) use ($sessionDateTime, $sessionEnd) {
                    $query->where('session_start', '<', $sessionEnd)
                        ->where('session_end', '>', $sessionDateTime);
                })
                ->where('id', '!=', $request->session_id ?? 0)
                ->first();

            if ($conflictingSession) {
                \Log::warning('Session conflict detected', [
                    'existing_session_id' => $conflictingSession->id,
                    'existing_start' => $conflictingSession->session_start->format('Y-m-d H:i:s'),
                    'existing_end' => $conflictingSession->session_end->format('Y-m-d H:i:s')
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Время сеанса пересекается с существующим сеансом'
                ], 422);
            }

            // Создаем сеанс
            $movieSession = MovieSession::create([
                'movie_id' => $validated['movie_id'],
                'cinema_hall_id' => $cinemaHallId,
                'session_start' => $sessionDateTime,
                'session_end' => $sessionEnd,
                'is_actual' => true,
            ]);

            \Log::info('Session created successfully!', [
                'session_id' => $movieSession->id,
                'movie' => $movie->title,
                'hall' => $cinemaHallId,
                'start' => $sessionDateTime->format('Y-m-d H:i:s'),
                'end' => $sessionEnd->format('Y-m-d H:i:s')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно создан',
                'session' => $movieSession
            ]);

        } catch (\Exception $e) {
            \Log::error('Error creating movie session: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при создании сеанса: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(MovieSession $movieSession)
    {
        // Загружаем связанные данные
        $movieSession->load(['movie', 'cinemaHall']);
        
        return response()->json([
            'id' => $movieSession->id,
            'movie_id' => $movieSession->movie_id,
            'cinema_hall_id' => $movieSession->cinema_hall_id,
            'session_start' => $movieSession->session_start,
            'session_end' => $movieSession->session_end,
            'is_actual' => $movieSession->is_actual,
            'movie' => $movieSession->movie,
            'cinema_hall' => $movieSession->cinemaHall
        ]);
    }

    public function update(Request $request, MovieSession $movieSession)
    {
        try {
            $validated = $request->validate([
                'movie_id' => 'required|exists:movies,id',
                'cinema_hall_id' => 'required|exists:cinema_halls,id',
                'session_date' => 'required|date',
                'session_time' => 'required|date_format:H:i',
                'is_actual' => 'sometimes|boolean'
            ]);

            $movie = Movie::findOrFail($validated['movie_id']);
            
            // Создаем объект времени начала
            $sessionStart = \Carbon\Carbon::createFromFormat(
                'Y-m-d H:i', 
                $validated['session_date'] . ' ' . $validated['session_time']
            );

            // Рассчитываем время окончания
            $totalDuration = $movie->movie_duration + 10 + 15;
            $sessionEnd = $sessionStart->copy()->addMinutes($totalDuration);

            // ПРЯМАЯ ПРОВЕРКА КОНФЛИКТОВ (исключая текущий сеанс)
            $conflictingSession = MovieSession::where('cinema_hall_id', $validated['cinema_hall_id'])
                ->where('id', '!=', $movieSession->id)
                ->where('is_actual', true)
                ->where(function($query) use ($sessionStart, $sessionEnd) {
                    $query->where('session_start', '<', $sessionEnd)
                        ->where('session_end', '>', $sessionStart);
                })
                ->first();

            if ($conflictingSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'В выбранном зале в это время уже есть сеанс'
                ], 422);
            }

            // Обновляем сеанс
            $movieSession->update([
                'movie_id' => $validated['movie_id'],
                'cinema_hall_id' => $validated['cinema_hall_id'],
                'session_start' => $sessionStart,
                'session_end' => $sessionEnd,
                'is_actual' => $validated['is_actual'] ?? $movieSession->is_actual
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно обновлен',
                'session' => $movieSession->load(['movie', 'cinemaHall'])
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating session: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении сеанса: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(MovieSession $movieSession)
    {
        try {
            if ($movieSession->tickets()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Нельзя удалить сеанс с забронированными билетами'
                ], 422);
            }

            $movieSession->delete();

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно удален!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении сеанса: ' . $e->getMessage()
            ], 500);
        }
    }

    public function edit(MovieSession $movieSession)
    {
        try {
            $movieSession->load(['movie', 'cinemaHall']);

            if (!$movieSession->movie || !$movieSession->cinemaHall) {
                return response()->json([
                    'success' => false,
                    'message' => 'Данные сеанса неполные'
                ], 404);
            }

            return response()->json([
                'id' => $movieSession->id,
                'movie_id' => $movieSession->movie_id,
                'cinema_hall_id' => $movieSession->cinema_hall_id,
                'session_start' => $movieSession->session_start->toISOString(),
                'is_actual' => $movieSession->is_actual,
                'movie' => [
                    'id' => $movieSession->movie->id,
                    'title' => $movieSession->movie->title,
                    'movie_duration' => $movieSession->movie->movie_duration,
                ],
                'cinema_hall' => [
                    'id' => $movieSession->cinemaHall->id,
                    'hall_name' => $movieSession->cinemaHall->hall_name,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in session edit method: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при загрузке данных сеанса: ' . $e->getMessage()
            ], 500);
        }
    }

    public function toggleActual(MovieSession $movieSession)
    {
        $movieSession->update(['is_actual' => !$movieSession->is_actual]);
        
        return response()->json([
            'success' => true,
            'is_actual' => $movieSession->is_actual,
            'message' => $movieSession->is_actual ? 'Сеанс активирован' : 'Сеанс деактивирован'
        ]);
    }

    public function getHallSessions($hallId, $date = null)
    {
        $query = MovieSession::with('movie')
            ->where('cinema_hall_id', $hallId)
            ->where('is_actual', true);

        if ($date) {
            $query->whereDate('session_start', $date);
        } else {
            $query->where('session_start', '>=', now());
        }

        $sessions = $query->orderBy('session_start')->get();

        return response()->json($sessions);
    }

    public function listSessions(Request $request)
    {
        $query = MovieSession::with(['movie', 'cinemaHall'])
            ->where('is_actual', true)
            ->where('session_start', '>=', now())
            ->orderBy('session_start');

        if ($request->has('date')) {
            $query->whereDate('session_start', $request->date);
        }

        if ($request->has('cinema_hall_id')) {
            $query->where('cinema_hall_id', $request->cinema_hall_id);
        }

        if ($request->has('movie_id')) {
            $query->where('movie_id', $request->movie_id);
        }

        $sessions = $query->get();

        return response()->json($sessions);
    }

    public function availableSeats(MovieSession $movieSession)
    {
        if (!$movieSession->isAvailable()) {
            return response()->json([
                'message' => 'Сеанс недоступен для бронирования'
            ], 422);
        }

        $availableSeats = $movieSession->getAvailableSeats();

        return response()->json([
            'session' => $movieSession->load(['movie', 'cinemaHall']),
            'available_seats' => $availableSeats,
            'occupied_seats_count' => $movieSession->tickets()->count()
        ]);
    }

    public function occupiedSeats(MovieSession $movieSession)
    {
        $occupiedSeats = $movieSession->getOccupiedSeats();

        return response()->json([
            'session' => $movieSession,
            'occupied_seats' => $occupiedSeats
        ]);
    }

    public function cleanupOldSessions()
    {
        $deletedCount = MovieSession::where('session_end', '<', now())->delete();
        
        return response()->json([
            'success' => true,
            'message' => "Удалено $deletedCount устаревших сеансов"
        ]);
    }
}
