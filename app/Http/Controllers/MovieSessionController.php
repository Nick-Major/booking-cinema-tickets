<?php

namespace App\Http\Controllers;

use App\Models\MovieSession;
use App\Models\Movie;
use App\Models\CinemaHall;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MovieSessionController extends Controller
{
    public function index()
    {
        return MovieSession::with(['movie', 'cinemaHall'])
            ->orderBy('session_start')
            ->get();
    }

    public function store(Request $request)
    {
        \Log::info('Store method called with data:', $request->all());
        
        try {
            $validated = $request->validate([
                'movie_id' => 'required|exists:movies,id',
                'cinema_hall_id' => 'required|exists:cinema_halls,id',
                'session_start' => 'required|date',
            ]);

            \Log::info('Validation passed', $validated);

            // Вычисляем session_end на основе длительности фильма
            $movie = Movie::findOrFail($validated['movie_id']);
            $sessionStart = Carbon::parse($validated['session_start']);
            $sessionEnd = $sessionStart->copy()->addMinutes($movie->movie_duration + 25); // +25 минут на уборку

            // Добавляем session_end в данные
            $validated['session_end'] = $sessionEnd;

            \Log::info('Calculated session end:', ['session_end' => $sessionEnd]);

            // Создаем сеанс
            $session = MovieSession::create($validated);

            \Log::info('Session created successfully', ['session_id' => $session->id]);

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно создан',
                'session' => $session
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error', ['errors' => $e->errors()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Error creating session: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при создании сеанса: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(MovieSession $movieSession)
    {
        return $movieSession->load(['movie', 'cinemaHall', 'tickets.seat']);
    }

    public function update(Request $request, MovieSession $movieSession)
    {
        try {
            $validated = $request->validate([
                'movie_id' => 'required|exists:movies,id',
                'cinema_hall_id' => 'required|exists:cinema_halls,id',
                'session_start' => 'required|date',
                'is_actual' => 'sometimes|boolean'
            ]);

            // Вычисляем session_end на основе длительности фильма
            $movie = Movie::findOrFail($validated['movie_id']);
            $sessionStart = Carbon::parse($validated['session_start']);
            $sessionEnd = $sessionStart->copy()->addMinutes($movie->movie_duration + 25);

            // Добавляем session_end в данные
            $validated['session_end'] = $sessionEnd;

            $movieSession->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно обновлен',
                'session' => $movieSession
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
            // Проверяем есть ли связанные билеты
            if ($movieSession->tickets()->exists()) {
                if (request()->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Нельзя удалить сеанс с забронированными билетами'
                    ], 422);
                }
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Нельзя удалить сеанс с забронированными билетами');
            }

            $movieSession->delete();

            // Всегда возвращаем JSON для AJAX запросов
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Сеанс успешно удален!'
                ]);
            }

            return redirect()->route('admin.dashboard')
                ->with('success', 'Сеанс успешно удален!');

        } catch (\Exception $e) {
            // Всегда возвращаем JSON для AJAX запросов
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка при удалении сеанса: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->route('admin.dashboard')
                ->with('error', 'Ошибка при удалении сеанса');
        }
    }

    // ПЕРЕМЕЩЕНИЕ СЕАНСА В ДРУГОЙ ЗАЛ
    public function moveToHall(MovieSession $movieSession, Request $request)
    {
        \Log::info('MoveToHall called', [
            'session_id' => $movieSession->id,
            'current_hall' => $movieSession->cinema_hall_id,
            'request_data' => $request->all()
        ]);

        $validated = $request->validate([
            'cinema_hall_id' => 'required|exists:cinema_halls,id'
        ]);

        try {
            // ВРЕМЕННО КОММЕНТИРУЕМ ПРОВЕРКУ КОНФЛИКТОВ
            // $tempSession = clone $movieSession;
            // $tempSession->cinema_hall_id = $validated['cinema_hall_id'];
            
            // if ($tempSession->hasTimeConflict()) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'В выбранном зале в это время уже есть сеанс'
            //     ], 422);
            // }

            $movieSession->update($validated);
            
            \Log::info('Session moved successfully', [
                'from_hall' => $movieSession->getOriginal('cinema_hall_id'),
                'to_hall' => $validated['cinema_hall_id']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно перемещен в другой зал'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in moveToHall: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при перемещении сеанса: ' . $e->getMessage()
            ], 500);
        }
    }

    // ИЗМЕНЕНИЕ ПОРЯДКА СЕАНСОВ
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'sessions' => 'required|array',
            'sessions.*.id' => 'required|exists:movie_sessions,id',
            'sessions.*.order' => 'required|integer|min:1'
        ]);

        try {
            foreach ($validated['sessions'] as $sessionData) {
                MovieSession::where('id', $sessionData['id'])
                    ->update(['order_column' => $sessionData['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Порядок сеансов успешно обновлен'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении порядка: ' . $e->getMessage()
            ], 500);
        }
    }

    // AJAX методы для админки
    
    public function edit(MovieSession $movieSession)
    {
        // Загружаем необходимые отношения
        $movieSession->load(['movie', 'cinemaHall']);

        // Возвращаем данные в JSON
        return response()->json([
            'id' => $movieSession->id,
            'movie_id' => $movieSession->movie_id,
            'cinema_hall_id' => $movieSession->cinema_hall_id,
            'session_start' => $movieSession->session_start->format('Y-m-d H:i:s'),
            'session_end' => $movieSession->session_end->format('Y-m-d H:i:s'),
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

    public function getSessionsForTimeline()
    {
        $sessions = MovieSession::with(['movie', 'cinemaHall'])
            ->where('session_start', '>=', now()->startOfDay())
            ->where('session_start', '<=', now()->addDays(7)->endOfDay())
            ->orderBy('session_start')
            ->get();

        return response()->json($sessions);
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
            ->actual()
            ->future()
            ->orderBy('session_start');

        if ($request->has('date')) {
            $query->byDate($request->date);
        }

        if ($request->has('cinema_hall_id')) {
            $query->byHall($request->cinema_hall_id);
        }

        if ($request->has('movie_id')) {
            $query->where('movie_id', $request->movie_id);
        }

        $sessions = $query->get();

        return response()->json($sessions);
    }

    // Получить доступные места для сеанса
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

    // Получить занятые места для сеанса
    public function occupiedSeats(MovieSession $movieSession)
    {
        $occupiedSeats = $movieSession->getOccupiedSeats();

        return response()->json([
            'session' => $movieSession,
            'occupied_seats' => $occupiedSeats
        ]);
    }

    // Массовое удаление устаревших сеансов
    public function cleanupOldSessions()
    {
        $deletedCount = MovieSession::where('session_end', '<', now())->delete();
        
        return response()->json([
            'success' => true,
            'message' => "Удалено $deletedCount устаревших сеансов"
        ]);
    }
}
