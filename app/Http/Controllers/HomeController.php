<?php

namespace App\Http\Controllers;

use App\Models\Movie;

class HomeController extends Controller
{
    public function index()
    {
        $movies = Movie::with(['movieSessions' => function($query) {
            $query->where('session_start', '>', now())
                ->where('is_actual', true)
                ->orderBy('session_start')
                ->with('cinemaHall');
        }])
        ->whereHas('movieSessions', function($query) {
            $query->where('session_start', '>', now())
                ->where('is_actual', true);
        })
        ->active()
        ->get();

        return view('client.home', [
            'movies' => $movies
        ]);
    }
}
