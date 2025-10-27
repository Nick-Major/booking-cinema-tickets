<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MovieController extends Controller
{
    public function index()
    {
        return Movie::withCount('movieSessions')->get();
    }

    public function create()
    {
        return response()->json(['message' => 'Form data for movie creation']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'movie_description' => 'nullable|string',
            'movie_poster' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'movie_duration' => 'required|integer|min:1',
            'is_active' => 'sometimes|boolean'
        ]);

        // Обработка загрузки постера
        if ($request->hasFile('movie_poster')) {
            $path = $request->file('movie_poster')->store('posters', 'public');
            $validated['movie_poster'] = $path;
        }

        $movie = Movie::create($validated);

        return response()->json($movie, 201);
    }

    public function show(Movie $movie)
    {
        return $movie->load(['movieSessions' => function($query) {
            $query->where('session_start', '>', now())
                  ->where('is_actual', true)
                  ->orderBy('session_start')
                  ->with('cinemaHall');
        }]);
    }

    public function edit(Movie $movie)
    {
        return $movie;
    }

    public function update(Request $request, Movie $movie)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'movie_description' => 'nullable|string',
            'movie_poster' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'movie_duration' => 'sometimes|integer|min:1',
            'is_active' => 'sometimes|boolean'
        ]);

        // Обработка загрузки постера
        if ($request->hasFile('movie_poster')) {
            // Удаляем старый постер если существует
            if ($movie->movie_poster) {
                Storage::disk('public')->delete($movie->movie_poster);
            }
            
            $path = $request->file('movie_poster')->store('posters', 'public');
            $validated['movie_poster'] = $path;
        }

        $movie->update($validated);

        return response()->json($movie);
    }

    public function destroy(Movie $movie)
    {
        // Удаляем постер если существует
        if ($movie->movie_poster) {
            Storage::disk('public')->delete($movie->movie_poster);
        }

        $movie->delete();
        return response()->json(null, 204);
    }

    public function listAllActiveMovies()
    {
        $movies = Movie::listAllActiveMovies();
        return response()->json($movies);
    }

    
    // Метод для получения фильмов с активными сеансами
    
    public function withActiveSessions()
    {
        $movies = Movie::active()
            ->whereHas('movieSessions', function($query) {
                $query->where('session_start', '>', now())
                      ->where('is_actual', true);
            })
            ->with(['movieSessions' => function($query) {
                $query->where('session_start', '>', now())
                      ->where('is_actual', true)
                      ->orderBy('session_start')
                      ->with('cinemaHall');
            }])
            ->get();

        return response()->json($movies);
    }

    // Метод для поиска фильмов по названию
    public function search(Request $request)
    {
        $request->validate([
            'title' => 'required|string|min:1'
        ]);

        $movies = Movie::active()
            ->where('title', 'like', "%{$request->title}%")
            ->get();

        return response()->json($movies);
    }
}
