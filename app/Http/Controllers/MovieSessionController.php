<?php

namespace App\Http\Controllers;

use App\Models\MovieSession;
use App\Models\Movie;
use App\Models\CinemaHall;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MovieSessionController extends Controller
{
    private function validateSessionTime($sessionStart, $movieDuration)
    {
        $advertisingTime = 10;
        $cleaningTime = 15;
        $sessionEnd = $sessionStart->copy()->addMinutes($movieDuration + $advertisingTime + $cleaningTime);
        
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
            'errors' => $errors,
            'session_end' => $sessionEnd
        ];
    }

    public function index()
    {
        return MovieSession::with(['movie', 'cinemaHall'])
            ->orderBy('session_start')
            ->get();
    }

    public function store(Request $request)
    {
        \Log::info('🎯 === SESSION STORE METHOD CALLED ===');
        \Log::info('📦 Request data:', $request->all());
        
        try {
            // ИСПРАВЛЕННАЯ ВАЛИДАЦИЯ
            $validated = $request->validate([
                'movie_id' => 'required|exists:movies,id',
                'cinema_hall_id' => 'required|exists:cinema_halls,id',
                'session_date' => 'required|date',
                'session_time' => 'required|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/', // ИСПРАВЛЕНО!
            ]);

            \Log::info('✅ Validation passed:', $validated);

            // ПРОСТОЕ СОЗДАНИЕ СЕАНСА
            $sessionStart = \Carbon\Carbon::createFromFormat(
                'Y-m-d H:i', 
                $validated['session_date'] . ' ' . $validated['session_time']
            );

            \Log::info('📅 Session start parsed:', ['start' => $sessionStart]);

            $session = \App\Models\MovieSession::create([
                'movie_id' => $validated['movie_id'],
                'cinema_hall_id' => $validated['cinema_hall_id'],
                'session_start' => $sessionStart,
                'session_end' => $sessionStart->copy()->addHours(3), // фиксированное время
                'is_actual' => true
            ]);

            \Log::info('🎉 Session created successfully:', ['id' => $session->id]);

            return response()->json([
                'success' => true,
                'message' => 'Сеанс успешно создан!',
                'session' => $session
            ]);

        } catch (\Exception $e) {
            \Log::error('💥 CRITICAL ERROR: ' . $e->getMessage());
            \Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Критическая ошибка: ' . $e->getMessage()
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

            $movie = Movie::findOrFail($validated['movie_id']);
            $sessionStart = Carbon::parse($validated['session_start']);

            $timeValidation = $this->validateSessionTime($sessionStart, $movie->movie_duration);
            
            if (!$timeValidation['is_valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации времени',
                    'errors' => $timeValidation['errors']
                ], 422);
            }

            // Проверка конфликтов времени (исключая текущий сеанс)
            $tempSession = clone $movieSession;
            $tempSession->fill($validated);
            $tempSession->session_end = $timeValidation['session_end'];
            
            if ($tempSession->hasTimeConflict()) {
                return response()->json([
                    'success' => false,
                    'message' => 'В выбранном зале в это время уже есть сеанс'
                ], 422);
            }

            $validated['session_end'] = $timeValidation['session_end'];
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
            \Log::info('=== EDIT METHOD STARTED ===');
            \Log::info('Session ID: ' . $movieSession->id);
            \Log::info('Session exists: ' . ($movieSession->exists ? 'YES' : 'NO'));

            // Проверим базовые данные
            \Log::info('Session data:', [
                'id' => $movieSession->id,
                'movie_id' => $movieSession->movie_id,
                'cinema_hall_id' => $movieSession->cinema_hall_id,
                'session_start' => $movieSession->session_start,
                'session_end' => $movieSession->session_end,
            ]);

            // Явно загружаем отношения
            $movieSession->load(['movie', 'cinemaHall']);
            \Log::info('Relations loaded');

            // Проверим отношения
            \Log::info('Movie relation: ' . ($movieSession->movie ? 'EXISTS' : 'MISSING'));
            \Log::info('CinemaHall relation: ' . ($movieSession->cinemaHall ? 'EXISTS' : 'MISSING'));

            if (!$movieSession->movie || !$movieSession->cinemaHall) {
                \Log::error('Missing relations for session', [
                    'session_id' => $movieSession->id,
                    'movie' => $movieSession->movie ? 'exists' : 'missing',
                    'cinema_hall' => $movieSession->cinemaHall ? 'exists' : 'missing'
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Данные сеанса неполные'
                ], 404);
            }

            $responseData = [
                'id' => $movieSession->id,
                'movie_id' => $movieSession->movie_id,
                'cinema_hall_id' => $movieSession->cinema_hall_id,
                'session_start' => $movieSession->session_start->format('Y-m-d\TH:i'),
                'session_end' => $movieSession->session_end ? $movieSession->session_end->format('Y-m-d H:i:s') : null,
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
            ];

            \Log::info('Response data prepared:', $responseData);
            \Log::info('=== EDIT METHOD COMPLETED SUCCESSFULLY ===');

            return response()->json($responseData);

        } catch (\Exception $e) {
            \Log::error('Error in session edit method: ' . $e->getMessage(), [
                'session_id' => $movieSession->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
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
