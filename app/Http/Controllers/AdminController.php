<?php

namespace App\Http\Controllers;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // public function dashboard(Request $request)
    // {
    //     $currentDate = $request->get('date', now()->format('Y-m-d'));
    //     $selectedDate = Carbon::parse($currentDate);
        
    //     // Загружаем залы с их расписаниями на выбранную дату
    //     $halls = CinemaHall::with(['schedules' => function($query) use ($selectedDate) {
    //         $query->where('date', $selectedDate->toDateString());
    //     }])->get();

    //     $movies = Movie::all();
        
    //     // Получаем сеансы для выбранной даты
    //     $sessions = MovieSession::with(['movie', 'cinemaHall'])
    //         ->whereDate('session_start', $selectedDate)
    //         ->orderBy('session_start')
    //         ->get();

    //     // Даты для навигации
    //     $prevDate = $selectedDate->copy()->subDay()->format('Y-m-d');
    //     $nextDate = $selectedDate->copy()->addDay()->format('Y-m-d');

    //     // Передаем пустую переменную $movie для модального окна
    //     $movie = null;

    //     return view('admin.dashboard', compact(
    //         'halls', 
    //         'movies', 
    //         'sessions', 
    //         'currentDate', 
    //         'selectedDate',
    //         'prevDate',
    //         'nextDate',
    //         'movie' // Добавляем переменную
    //     ));
    // }

    public function dashboard(Request $request)
    {
        try {
            \Log::info('=== DASHBOARD START ===');
            
            $currentDate = $request->get('date', now()->format('Y-m-d'));
            $selectedDate = \Carbon\Carbon::parse($currentDate);
            
            \Log::info('Loading basic data...');
            
            // Минимальная версия - только основные данные
            $halls = \App\Models\CinemaHall::all();
            $movies = \App\Models\Movie::all();
            
            $sessions = \App\Models\MovieSession::with(['movie', 'cinemaHall'])
                ->whereDate('session_start', $selectedDate)
                ->orderBy('session_start')
                ->get();

            // Даты для навигации
            $prevDate = $selectedDate->copy()->subDay()->format('Y-m-d');
            $nextDate = $selectedDate->copy()->addDay()->format('Y-m-d');

            \Log::info('Rendering view...');
            
            return view('admin.dashboard', compact(
                'halls', 
                'movies', 
                'sessions', 
                'currentDate', 
                'selectedDate',
                'prevDate',
                'nextDate'
            ));
            
        } catch (\Exception $e) {
            \Log::error('DASHBOARD ERROR: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->view('errors.500', ['message' => $e->getMessage()], 500);
        }
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
