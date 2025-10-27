<?php

namespace App\Http\Controllers;

use App\Models\MovieSession;
use App\Models\Movie;
use App\Models\CinemaHall;
use Illuminate\Http\Request;

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
            'base_price' => 'required|numeric|min:0',
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
            return response()->json([
                'message' => 'В выбранное время в этом зале уже есть сеанс'
            ], 422);
        }

        // Сохраняем сеанс
        $movieSession = MovieSession::create($validated);

        return response()->json($movieSession->load(['movie', 'cinemaHall']), 201);
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
            'base_price' => 'sometimes|numeric|min:0',
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
            return response()->json([
                'message' => 'В выбранное время в этом зале уже есть сеанс'
            ], 422);
        }

        $movieSession->update($validated);

        return response()->json($movieSession->load(['movie', 'cinemaHall']));
    }

    public function destroy(MovieSession $movieSession)
    {
        $movieSession->delete();
        return response()->json(null, 204);
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
}
