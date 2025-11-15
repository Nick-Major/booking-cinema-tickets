<?php

namespace App\Http\Controllers;

use App\Models\HallSchedule;
use App\Models\CinemaHall;
use Illuminate\Http\Request;

class HallScheduleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cinema_hall_id' => 'required|exists:cinema_halls,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        // Проверяем, нет ли уже расписания на эту дату
        $existingSchedule = HallSchedule::where('cinema_hall_id', $validated['cinema_hall_id'])
            ->where('date', $validated['date'])
            ->first();

        if ($existingSchedule) {
            return response()->json([
                'success' => false, 
                'message' => 'Расписание на эту дату уже существует'
            ], 422);
        }

        try {
            HallSchedule::create($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Расписание успешно создано'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при создании расписания: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, HallSchedule $hallSchedule)
    {
        $validated = $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        try {
            $hallSchedule->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Расписание успешно обновлено'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении расписания'
            ], 500);
        }
    }
}
