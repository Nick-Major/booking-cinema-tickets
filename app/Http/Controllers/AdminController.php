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

    public function toggleSales(Request $request)
    {
        $hallId = $request->input('hall_id');
        $action = $request->input('action');
        
        $hall = CinemaHall::findOrFail($hallId);
        $isActive = $action === 'activate';
        
        $hall->update(['is_active' => $isActive]);

        return response()->json([
            'success' => true,
            'is_active' => $isActive,
            'message' => $isActive 
                ? "Продажа билетов включена для зала {$hall->hall_name}" 
                : "Продажа билетов приостановлена для зала {$hall->hall_name}"
        ]);
    }
}
