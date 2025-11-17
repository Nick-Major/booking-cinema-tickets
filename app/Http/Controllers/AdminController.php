<?php

namespace App\Http\Controllers;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use App\Models\HallSchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        $currentDate = request('date', now()->format('Y-m-d'));
        $selectedDate = Carbon::parse($currentDate);
        
        $halls = CinemaHall::all();
        $movies = Movie::all();
        
        // Получаем расписания для каждого зала на выбранную дату
        $hallSchedules = HallSchedule::where('date', $currentDate)
            ->get()
            ->keyBy('cinema_hall_id');
        
        // Получаем сеансы для отображения в таймлайне
        $sessions = MovieSession::whereDate('session_start', $currentDate)
            ->with('movie')
            ->get()
            ->groupBy('cinema_hall_id');
        
        // Вычисляем даты для навигации ← ДОБАВИТЬ ЭТО
        $prevDate = $selectedDate->copy()->subDay()->format('Y-m-d');
        $nextDate = $selectedDate->copy()->addDay()->format('Y-m-d');
        
        return view('admin.dashboard', compact(
            'halls', 
            'movies', 
            'currentDate', 
            'selectedDate',
            'hallSchedules',
            'sessions',
            'prevDate',    // ← ДОБАВИТЬ ЭТО
            'nextDate'     // ← ДОБАВИТЬ ЭТО
        ));
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
