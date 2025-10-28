<?php

namespace App\Http\Controllers;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        return view('admin.dashboard', [
            'halls' => CinemaHall::all(),
            'movies' => Movie::all(), 
            'sessions' => MovieSession::with(['movie', 'cinemaHall'])->get()
        ]);
    }
}
