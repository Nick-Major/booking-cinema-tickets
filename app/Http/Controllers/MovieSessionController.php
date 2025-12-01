<?php

namespace App\Http\Controllers;

use App\Models\MovieSession;
use App\Models\Movie;
use App\Models\CinemaHall;
use App\Models\HallSchedule;
use App\Services\SessionValidationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MovieSessionController extends Controller
{
    protected $validationService;

    public function __construct(SessionValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

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

            // Создаем объект времени начала
            $sessionStart = Carbon::createFromFormat('Y-m-d H:i', 
                $validated['session_date'] . ' ' . $validated['session_time']
            );
            
            // Валидируем сеанс
            $validationResult = $this->validationService->validateSession(
                $validated['cinema_hall_id'],
                $validated['movie_id'],
                $sessionStart
            );
            
            if (!$validationResult['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message']
                ], 422);
            }
            
            // Создаем сеанс
            $movieSession = MovieSession::create([
                'movie_id' => $validated['movie_id'],
                'cinema_hall_id' => $validated['cinema_hall_id'],
                'session_start' => $sessionStart,
                'session_end' => $validationResult['session_end'], // Фильм + реклама
                'is_actual' => true,
            ]);

            \Log::info('Session created successfully!', [
                'session_id' => $movieSession->id,
                'movie' => $movieSession->movie->title ?? 'Unknown',
                'hall' => $movieSession->cinemaHall->hall_name ?? 'Unknown',
                'start' => $sessionStart->format('Y-m-d H:i'),
                'end' => $validationResult['session_end']->format('Y-m-d H:i'),
                'end_with_cleaning' => $validationResult['session_end_with_cleaning']->format('Y-m-d H:i')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно создан',
                'session' => $movieSession->load(['movie', 'cinemaHall'])
            ]);

        } catch (\Exception $e) {
            \Log::error('Error creating movie session: ' . $e->getMessage());
            
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

            // Создаем объект времени начала
            $sessionStart = Carbon::createFromFormat('Y-m-d H:i', 
                $validated['session_date'] . ' ' . $validated['session_time']
            );
            
            // Валидируем сеанс, исключая текущий
            $validationResult = $this->validationService->validateSession(
                $validated['cinema_hall_id'],
                $validated['movie_id'],
                $sessionStart,
                $movieSession->id
            );
            
            if (!$validationResult['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message']
                ], 422);
            }

            // Обновляем сеанс
            $movieSession->update([
                'movie_id' => $validated['movie_id'],
                'cinema_hall_id' => $validated['cinema_hall_id'],
                'session_start' => $sessionStart,
                'session_end' => $validationResult['session_end'], // Фильм + реклама
                'is_actual' => $validated['is_actual'] ?? $movieSession->is_actual
            ]);

            \Log::info('Session updated successfully!', [
                'session_id' => $movieSession->id,
                'new_start' => $sessionStart->format('Y-m-d H:i'),
                'new_end' => $validationResult['session_end']->format('Y-m-d H:i')
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
            \Log::info('Запрос данных сеанса для редактирования', [
                'session_id' => $movieSession->id,
                'movie_id' => $movieSession->movie_id,
                'hall_id' => $movieSession->cinema_hall_id,
                'original_session_start' => $movieSession->session_start
            ]);

            $movieSession->load(['movie', 'cinemaHall']);

            // ПРЕОБРАЗОВАНИЕ ВРЕМЕНИ С УЧЕТОМ ЧАСОВОГО ПОЯСА ПРИЛОЖЕНИЯ
            $sessionStart = $movieSession->session_start;
            $timezone = config('app.timezone', 'Europe/Moscow');
            
            \Log::info('Информация о времени:', [
                'original_utc' => $movieSession->session_start->format('Y-m-d H:i:s'),
                'app_timezone' => $timezone,
                'converted_local' => $sessionStart->setTimezone($timezone)->format('Y-m-d H:i:s')
            ]);

            $responseData = [
                'id' => $movieSession->id,
                'movie_id' => $movieSession->movie_id,
                'cinema_hall_id' => $movieSession->cinema_hall_id,
                'session_start' => $movieSession->session_start->toISOString(),
                'is_actual' => $movieSession->is_actual,
                'movie' => [
                    'id' => $movieSession->movie->id ?? null,
                    'title' => $movieSession->movie->title ?? 'Неизвестный фильм',
                    'movie_duration' => $movieSession->movie->movie_duration ?? 0,
                ],
                'cinema_hall' => [
                    'id' => $movieSession->cinemaHall->id ?? null,
                    'hall_name' => $movieSession->cinemaHall->hall_name ?? 'Неизвестный зал',
                ],
                
                'parsed_date' => $sessionStart->setTimezone($timezone)->format('Y-m-d'),
                'parsed_time' => $sessionStart->setTimezone($timezone)->format('H:i'),
                'timezone' => $timezone,
                'timezone_offset' => $sessionStart->setTimezone($timezone)->format('P')
            ];

            \Log::info('Данные сеанса подготовлены для ответа', $responseData);

            return response()->json($responseData);

        } catch (\Exception $e) {
            \Log::error('Ошибка в методе edit сеанса: ' . $e->getMessage(), [
                'session_id' => $movieSession->id,
                'exception' => $e
            ]);
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
