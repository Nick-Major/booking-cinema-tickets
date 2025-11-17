<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MovieController extends Controller
{
    public function index()
    {
        $movies = Movie::listAllActiveMovies();
        return view('client.home', compact('movies'));
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
            'country' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean'
        ]);

        // Обработка загрузки постера
        if ($request->hasFile('movie_poster')) {
            $path = $request->file('movie_poster')->store('posters', 'public');
            $validated['movie_poster'] = $path;
        }

        $movie = Movie::create($validated);

        // Проверяем, является ли запрос AJAX по заголовку
        if ($request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'message' => 'Фильм успешно добавлен!',
                'movie' => $movie
            ]);
        }

        return redirect()->route('admin.dashboard')
            ->with('success', 'Фильм успешно добавлен!');
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

    public function edit($id)
    {
        $movie = Movie::findOrFail($id);
        return response()->json($movie);
    }

    public function update(Request $request, Movie $movie)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'movie_description' => 'nullable|string',
            'movie_poster' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'movie_duration' => 'sometimes|integer|min:1',
            'country' => 'nullable|string|max:100',
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

        $validated['is_active'] = $request->has('is_active');

        $movie->update($validated);

        // Возвращаем JSON ответ для AJAX запросов
        return response()->json([
            'success' => true, 
            'message' => 'Фильм успешно обновлен!'
        ]);
    }

    public function destroy(Movie $movie)
    {
        try {
            // Удаляем постер если существует
            if ($movie->movie_poster) {
                Storage::disk('public')->delete($movie->movie_poster);
            }

            $movie->delete();

            // Проверяем, это AJAX запрос или обычный
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Фильм успешно удален!'
                ]);
            }

            return redirect()->route('admin.dashboard')
                ->with('success', 'Фильм успешно удален!');

        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка при удалении фильма: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->route('admin.dashboard')
                ->with('error', 'Ошибка при удалении фильма');
        }
    }

    // AJAX методы для админки
    
    public function toggleActive(Movie $movie)
    {
        $movie->update(['is_active' => !$movie->is_active]);
        
        return response()->json([
            'success' => true,
            'is_active' => $movie->is_active,
            'message' => $movie->is_active ? 'Фильм активирован' : 'Фильм деактивирован'
        ]);
    }

    public function getMoviesForTimeline()
    {
        $movies = Movie::active()->get(['id', 'title', 'movie_duration']);
        return response()->json($movies);
    }

    public function listAllActiveMovies()
    {
        $movies = Movie::listAllActiveMovies();
        return response()->json($movies);
    }

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
