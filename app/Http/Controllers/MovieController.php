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
            'title' => 'required|string|max:255|unique:movies',
            'movie_description' => 'required|string',
            'movie_duration' => 'required|integer|min:1',
            'country' => 'required|string|max:100',
            'movie_poster' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'is_active' => 'boolean'
        ]);

        $movie = new Movie();
        $movie->title = $validated['title'];
        $movie->movie_description = $validated['movie_description'];
        $movie->movie_duration = $validated['movie_duration'];
        $movie->country = $validated['country'];
        $movie->is_active = $request->boolean('is_active', true);
        
        // Обработка загрузки постера
        if ($request->hasFile('movie_poster')) {
            $path = $request->file('movie_poster')->store('posters', 'public');
            $movie->movie_poster = $path;
        }
        
        $movie->save();

        return response()->json([
            'success' => true,
            'message' => 'Фильм успешно добавлен',
            'movie' => $movie
        ]);
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
            'title' => 'required|string|max:255|unique:movies,title,' . $movie->id,
            'movie_description' => 'required|string',
            'movie_duration' => 'required|integer|min:1',
            'country' => 'required|string|max:100',
            'movie_poster' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'is_active' => 'boolean'
        ]);

        $movie->title = $validated['title'];
        $movie->movie_description = $validated['movie_description'];
        $movie->movie_duration = $validated['movie_duration'];
        $movie->country = $validated['country'];
        $movie->is_active = $request->boolean('is_active', true);
        
        // Обработка загрузки нового постера
        if ($request->hasFile('movie_poster')) {
            // Удаляем старый постер, если он существует
            if ($movie->movie_poster && Storage::disk('public')->exists($movie->movie_poster)) {
                Storage::disk('public')->delete($movie->movie_poster);
            }
            
            $path = $request->file('movie_poster')->store('posters', 'public');
            $movie->movie_poster = $path;
        } elseif ($request->has('remove_poster')) {
            // Удаляем постер, если пользователь хочет его убрать
            if ($movie->movie_poster && Storage::disk('public')->exists($movie->movie_poster)) {
                Storage::disk('public')->delete($movie->movie_poster);
            }
            $movie->movie_poster = null;
        }
        
        $movie->save();

        return response()->json([
            'success' => true,
            'message' => 'Фильм успешно обновлен',
            'movie' => $movie
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
