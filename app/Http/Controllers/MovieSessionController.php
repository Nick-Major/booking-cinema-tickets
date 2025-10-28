<?php

namespace App\Http\Controllers;

use App\Models\MovieSession;
use App\Models\Movie;
use App\Models\CinemaHall;
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
        $validated = $request->validate([
            'movie_id' => 'required|exists:movies,id',
            'cinema_hall_id' => 'required|exists:cinema_halls,id',
            'session_start' => 'required|date|after:now',
            'is_actual' => 'sometimes|boolean'
        ]);

        // Получаем длительность фильма
        $movie = Movie::findOrFail($validated['movie_id']);
        $validated['session_end'] = MovieSession::calculateSessionEnd(
            $validated['session_start'], 
            $movie->movie_duration
        );

        // Создаем сеанс для проверки конфликтов
        $session = new MovieSession($validated);

        // Проверяем конфликты по времени
        if ($session->hasTimeConflict()) {
            return redirect()->route('admin.dashboard')
                ->with('error', 'В выбранное время в этом зале уже есть сеанс');
        }

        // Сохраняем сеанс
        MovieSession::create($validated);

        return redirect()->route('admin.dashboard')
            ->with('success', 'Сеанс успешно создан!');
    }

    public function show(MovieSession $movieSession)
    {
        return $movieSession->load(['movie', 'cinemaHall', 'tickets.seat']);
    }

    public function update(Request $request, MovieSession $movieSession)
    {
        $validated = $request->validate([
            'movie_id' => 'sometimes|exists:movies,id',
            'cinema_hall_id' => 'sometimes|exists:cinema_halls,id',
            'session_start' => 'sometimes|date',
            'is_actual' => 'sometimes|boolean'
        ]);

        // Если меняется фильм или время - пересчитываем окончание
        if (isset($validated['movie_id']) || isset($validated['session_start'])) {
            $movieId = $validated['movie_id'] ?? $movieSession->movie_id;
            $sessionStart = $validated['session_start'] ?? $movieSession->session_start;
            
            $movie = Movie::findOrFail($movieId);
            $validated['session_end'] = MovieSession::calculateSessionEnd(
                $sessionStart, 
                $movie->movie_duration
            );
        }

        // Создаем временный объект для проверки конфликтов
        $tempSession = clone $movieSession;
        $tempSession->fill($validated);

        // Проверяем конфликты по времени (кроме текущего сеанса)
        if ($tempSession->hasTimeConflict()) {
            return redirect()->route('admin.dashboard')
                ->with('error', 'В выбранное время в этом зале уже есть сеанс');
        }

        $movieSession->update($validated);

        return redirect()->route('admin.dashboard')
            ->with('success', 'Сеанс успешно обновлен!');
    }

    public function destroy(MovieSession $movieSession)
    {
        $movieSession->delete();
        
        return redirect()->route('admin.dashboard')
            ->with('success', 'Сеанс успешно удален!');
    }

    // AJAX методы для админки
    
    public function edit(MovieSession $movieSession)
    {
        $movies = Movie::active()->get();
        $halls = CinemaHall::active()->get();
        
        return view('admin.modals.edit-session-modal', compact('movieSession', 'movies', 'halls'));
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
