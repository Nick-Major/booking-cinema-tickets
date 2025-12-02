<?php

namespace App\Http\Controllers;

use App\Models\CinemaHall;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CinemaHallController extends Controller
{
    public function index()
    {
        return CinemaHall::withCount('seats')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hall_name' => 'required|string|max:100|unique:cinema_halls,hall_name',
        ]);

        try {
            $hall = CinemaHall::create([
                'hall_name' => $validated['hall_name'],
                'row_count' => 0,
                'max_seats_number_in_row' => 0,
                'regular_price' => 300,
                'vip_price' => 500,
                'is_active' => false,
            ]);

            // Если запрос AJAX, возвращаем JSON
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Зал успешно создан!',
                    'hall' => $hall,
                    'redirect' => route('admin.dashboard')
                ]);
            }

            return redirect()->route('admin.dashboard')
                ->with('success', 'Зал успешно создан!');
                
        } catch (\Exception $e) {
            \Log::error('Error creating hall: ' . $e->getMessage());
            
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка при создании зала: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Ошибка при создании зала']);
        }
    }

    public function show(CinemaHall $cinemaHall)
    {
        return $cinemaHall->load('seats');
    }

    public function update(Request $request, CinemaHall $cinemaHall)
    {
        $validated = $request->validate([
            'hall_name' => 'sometimes|string|max:100',
            'row_count' => 'sometimes|integer|min:1',
            'max_seats_number_in_row' => 'sometimes|integer|min:1',
            'regular_price' => 'sometimes|numeric|min:0',
            'vip_price' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean'
        ]);

        $cinemaHall->update($validated);
        return response()->json($cinemaHall);
    }

    public function destroy($hall)
    {
        try {
            $cinemaHall = \App\Models\CinemaHall::find($hall);
            
            if (!$cinemaHall) {
                return response()->json([
                    'success' => false,
                    'message' => 'Зал не найден или уже удален'
                ], 404);
            }

            $cinemaHall->delete();

            return response()->json([
                'success' => true,
                'message' => 'Зал успешно удален'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении зала: ' . $e->getMessage()
            ], 500);
        }
    }

    // Конфигурация зала
    public function configuration($hallId)
    {
        $hall = CinemaHall::findOrFail($hallId);
        return view('admin.components.hall-configuration', ['hall' => $hall]);
    }

    // Конфигурация цен
    public function prices($hallId)
    {
        $hall = CinemaHall::findOrFail($hallId);
        return view('admin.components.price-configuration', ['hall' => $hall]);
    }

    // Генерация схемы зала
    public function generateLayout(Request $request, $hallId)
    {
        $hall = CinemaHall::findOrFail($hallId);
        
        $validated = $request->validate([
            'rows' => 'required|integer|min:1|max:20',
            'seats_per_row' => 'required|integer|min:1|max:20'
        ]);

        // Обновляем данные зала
        $hall->update([
            'row_count' => $validated['rows'],
            'max_seats_number_in_row' => $validated['seats_per_row']
        ]);

        // Генерируем HTML для схемы
        $html = $this->generateHallLayoutHTML($hall, $validated['rows'], $validated['seats_per_row']);

        return response($html);
    }

    // Сохранение конфигурации зала
    public function saveConfiguration(Request $request, $hallId)
    {
        \Log::info('=== START SAVE CONFIGURATION ===');
        
        $cinemaHall = CinemaHall::find($hallId);
        
        if (!$cinemaHall) {
            \Log::error('Hall not found', ['hall_id' => $hallId]);
            return response()->json(['success' => false, 'message' => 'Ошибка: зал не найден'], 500);
        }

        $validated = $request->validate([
            'seats' => 'required|array',
            'seats.*.row' => 'required|numeric|min:1',
            'seats.*.seat' => 'required|numeric|min:1',
            'seats.*.type' => 'required|in:regular,vip,blocked'
        ]);

        \Log::info('Validated data', [
            'hall_id' => $hallId,
            'seats_count' => count($validated['seats']),
            'sample_seats' => array_slice($validated['seats'], 0, 3)
        ]);

        try {
            // Логируем существующие места перед удалением
            $existingSeats = Seat::where('cinema_hall_id', $cinemaHall->id)->get();
            \Log::info('Existing seats before delete', [
                'count' => $existingSeats->count(),
                'seats' => $existingSeats->pluck('id', 'row_number', 'row_seat_number')
            ]);

            DB::transaction(function () use ($cinemaHall, $validated) {
                // Удаляем ВСЕ места этого зала
                $deletedCount = Seat::where('cinema_hall_id', $cinemaHall->id)->delete();
                \Log::info('Deleted seats', ['count' => $deletedCount]);

                // Создаем новые места
                foreach ($validated['seats'] as $index => $seatData) {
                    \Log::info('Creating seat', [
                        'index' => $index,
                        'row' => $seatData['row'],
                        'seat' => $seatData['seat'],
                        'type' => $seatData['type']
                    ]);

                    $seat = Seat::create([
                        'cinema_hall_id' => $cinemaHall->id,
                        'row_number' => (int)$seatData['row'],
                        'row_seat_number' => (int)$seatData['seat'],
                        'seat_status' => $seatData['type'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    \Log::info('Seat created', ['seat_id' => $seat->id]);
                }
            });

            \Log::info('=== SUCCESS: Configuration saved ===');
            return response()->json(['success' => true, 'message' => 'Конфигурация сохранена']);

        } catch (\Exception $e) {
            \Log::error('=== ERROR: Save configuration failed ===', [
                'hall_id' => $cinemaHall->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $validated['seats']
            ]);
            return response()->json(['success' => false, 'message' => 'Ошибка при сохранении: ' . $e->getMessage()], 500);
        }
    }

    // Сброс конфигурации зала
    public function resetConfiguration(Request $request, $hallId)
    {
        try {
            $cinemaHall = CinemaHall::findOrFail($hallId);
            
            \Log::info('Resetting configuration for hall:', ['hall_id' => $hallId]);

            // Удаляем все места зала
            $deletedSeats = $cinemaHall->seats()->delete();
            \Log::info('Deleted seats:', ['count' => $deletedSeats]);

            // Сбрасываем размеры зала
            $cinemaHall->update([
                'row_count' => 0,
                'max_seats_number_in_row' => 0
            ]);

            \Log::info('Hall configuration reset successfully');

            return response()->json([
                'success' => true,
                'message' => 'Конфигурация зала сброшена успешно'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error resetting hall configuration:', [
                'hall_id' => $hallId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Ошибка при сбросе конфигурации: ' . $e->getMessage()
            ], 500);
        }
    }

    // Обновление цен
    public function updatePrices(Request $request, $hallId)
    {
        \Log::info('Update prices request received', [
            'hall_id' => $hallId,
            'request_data' => $request->all()
        ]);

        $hall = CinemaHall::findOrFail($hallId);
        
        $validated = $request->validate([
            'regular_price' => 'required|numeric|min:0',
            'vip_price' => 'required|numeric|min:0'
        ]);

        \Log::info('Validated data', $validated);

        $hall->update($validated);

        \Log::info('Prices updated successfully', [
            'hall_id' => $hallId,
            'new_regular_price' => $validated['regular_price'],
            'new_vip_price' => $validated['vip_price']
        ]);

        return response()->json(['success' => true, 'message' => 'Цены обновлены']);
    }

    // Генерация HTML для схемы зала
    private function generateHallLayoutHTML(CinemaHall $hall, $rows, $seatsPerRow)
    {
        $html = '';
        for ($row = 1; $row <= $rows; $row++) {
            $html .= '<div class="conf-step__row" data-row="' . $row . '">';
            
            for ($seatNum = 1; $seatNum <= $seatsPerRow; $seatNum++) {
                // Проверяем, существует ли уже такое место в БД
                $existingSeat = $hall->seats()
                    ->where('row_number', $row)
                    ->where('row_seat_number', $seatNum)
                    ->first();
                
                if ($existingSeat) {
                    // Используем существующий тип места
                    $seatType = $existingSeat->seat_status;
                } else {
                    // По умолчанию все новые места обычные
                    $seatType = 'regular';
                }
                
                $seatClass = match($seatType) {
                    'regular' => 'conf-step__chair_standart',
                    'vip' => 'conf-step__chair_vip',
                    'blocked' => 'conf-step__chair_disabled',
                    default => 'conf-step__chair_standart'
                };
                
                $html .= '<span class="conf-step__chair ' . $seatClass . '" 
                            data-row="' . $row . '" 
                            data-seat="' . $seatNum . '"
                            data-type="' . $seatType . '"
                            onclick="changeSeatType(this)"></span>';
            }
            
            $html .= '</div>';
        }
        
        return $html;
    }

    public function scheduleInfo(CinemaHall $hall, Request $request)
    {
        try {
            $date = $request->get('date', now()->format('Y-m-d'));
            
            $schedule = $hall->getScheduleForDate($date);
            
            if ($schedule) {
                // ФОРМАТИРУЕМ ВРЕМЯ БЕЗ СЕКУНД
                $startTime = \Carbon\Carbon::parse($schedule->start_time)->format('H:i');
                $endTime = \Carbon\Carbon::parse($schedule->end_time)->format('H:i');
                
                return response()->json([
                    'success' => true,
                    'schedule' => [
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'overnight' => $schedule->overnight
                    ]
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Расписание не найдено'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error getting schedule info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении информации о расписании'
            ], 500);
        }
    }

    public function indexJson(Request $request)
    {
        try {
            $halls = CinemaHall::withCount('seats')->orderBy('created_at', 'desc')->get();
            
            return response()->json($halls);
            
        } catch (\Exception $e) {
            \Log::error('Error fetching halls: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении списка залов'
            ], 500);
        }
    }
}
