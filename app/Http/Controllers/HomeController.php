<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        // Получаем выбранную дату из запроса или используем сегодня
        $selectedDate = $request->get('date', now()->format('Y-m-d'));
        $currentDate = Carbon::parse($selectedDate);
        
        // Генерируем даты для навигации (7 дней от сегодня)
        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $date = now()->addDays($i);
            $dates[] = [
                'date' => $date->format('Y-m-d'),
                'dayOfWeek' => $this->getDayOfWeek($date->dayOfWeek),
                'dayNumber' => $date->format('d'),
                'isToday' => $date->isToday(),
                'isSelected' => $date->format('Y-m-d') === $selectedDate,
                'isWeekend' => in_array($date->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]),
            ];
        }

        // Используем существующую логику из MovieController, но с фильтрацией по дате
        $movies = Movie::active()
            ->whereHas('movieSessions', function($query) use ($selectedDate) {
                $query->whereDate('session_start', $selectedDate)
                    ->where('is_actual', true)
                    ->where('session_start', '>', now());
            })
            ->with(['movieSessions' => function($query) use ($selectedDate) {
                $query->whereDate('session_start', $selectedDate)
                    ->where('is_actual', true)
                    ->where('session_start', '>', now())
                    ->orderBy('session_start')
                    ->with('cinemaHall');
            }])
            ->get();

        return view('client.home', [
            'movies' => $movies,
            'dates' => $dates,
            'selectedDate' => $selectedDate,
            'currentDate' => $currentDate
        ]);
    }

    private function getDayOfWeek($dayNumber): string
    {
        $days = [
            'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'
        ];
        return $days[$dayNumber] ?? '--';
    }
}
