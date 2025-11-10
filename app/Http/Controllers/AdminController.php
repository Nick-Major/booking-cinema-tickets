<?php

namespace App\Http\Controllers;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        $halls = CinemaHall::all();
        $movies = Movie::all();
        
        $currentDate = request('date', now()->format('Y-m-d'));
        $selectedDate = Carbon::parse($currentDate);
        
        // Получаем сеансы для выбранной даты
        $sessions = MovieSession::with(['movie', 'cinemaHall'])
            ->whereDate('session_start', $selectedDate)
            ->orderBy('session_start')
            ->get();

        return view('admin.dashboard', compact('halls', 'movies', 'sessions', 'currentDate', 'selectedDate'));
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
