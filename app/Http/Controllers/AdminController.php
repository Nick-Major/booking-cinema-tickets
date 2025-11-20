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
        $data = $this->getTimelineData(request('date', now()->format('Y-m-d')));
        $data['movies'] = Movie::all(); // Добавляем фильмы только для полной страницы
        
        return view('admin.dashboard', $data);
    }

    public function loadSessionsTimeline(Request $request)
    {
        $data = $this->getTimelineData($request->get('date', now()->format('Y-m-d')));
        
        // Возвращаем только HTML таймлайна
        return view('admin.components.sessions-timeline', $data);
    }

    /**
     * Общий метод для получения данных таймлайна
     */
    private function getTimelineData($date)
    {
        $currentDate = $date;
        $selectedDate = Carbon::parse($currentDate);

        $halls = CinemaHall::all();
        
        // Получаем расписания для каждого зала на выбранную дату
        $hallSchedules = HallSchedule::where('date', $currentDate)
            ->get()
            ->keyBy('cinema_hall_id');

        // Получаем сеансы для каждой даты
        $sessions = collect();
        foreach ($halls as $hall) {
            $schedule = $hallSchedules[$hall->id] ?? null;

            if ($schedule) {
                $hallSessions = $schedule->getSessionsWithinSchedule();
                $sessions = $sessions->merge($hallSessions);
            } else {
                $hallSessions = MovieSession::where('cinema_hall_id', $hall->id)
                    ->whereDate('session_start', $currentDate)
                    ->with('movie')
                    ->get();
                $sessions = $sessions->merge($hallSessions);
            }
        }
        $sessions = $sessions->groupBy('cinema_hall_id');

        $prevDate = $selectedDate->copy()->subDay()->format('Y-m-d');
        $nextDate = $selectedDate->copy()->addDay()->format('Y-m-d');

        return compact(
            'halls',
            'currentDate',
            'selectedDate',
            'hallSchedules',
            'sessions',
            'prevDate',
            'nextDate'
        );
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
