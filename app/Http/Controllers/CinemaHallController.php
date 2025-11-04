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

        $hall = CinemaHall::create([
            'hall_name' => $validated['hall_name'],
            'row_count' => 0,
            'max_seats_number_in_row' => 0,
            'regular_price' => 300,
            'vip_price' => 500,
            'is_active' => false,
        ]);

        return redirect()->route('admin.dashboard')
            ->with('success', 'Зал успешно создан!');
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
        \Log::info('=== START DELETE HALL ===', ['id' => $hall]);

        try {
            // Найдем зал вручную
            $cinemaHall = \App\Models\CinemaHall::findOrFail($hall);
            
            \Log::info('Found hall', [
                'id' => $cinemaHall->id,
                'name' => $cinemaHall->hall_name
            ]);

            // Проверим связанные записи перед удалением
            $seatsCount = $cinemaHall->seats()->count();
            $sessionsCount = $cinemaHall->movieSessions()->count();
            
            \Log::info('Hall relationships before delete', [
                'seats' => $seatsCount,
                'sessions' => $sessionsCount
            ]);

            $cinemaHall->delete();

            \Log::info('Hall deleted successfully', ['id' => $cinemaHall->id]);
            \Log::info('=== END DELETE HALL ===');

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Зал успешно удален'
                ]);
            }

            return redirect()->route('admin.dashboard')
                ->with('success', 'Зал успешно удален!');

        } catch (\Exception $e) {
            \Log::error('Error deleting hall', [
                'id' => $hall,
                'error' => $e->getMessage()
            ]);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка при удалении зала: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->route('admin.dashboard')
                ->with('error', 'Ошибка при удалении зала: ' . $e->getMessage());
        }
    }

    // Конфигурация зала
    public function configuration($hallId)
    {
        $hall = CinemaHall::findOrFail($hallId);
        return view('admin.modals.hall-configuration', ['hall' => $hall]);
    }

    // Конфигурация цен
    public function prices($hallId)
    {
        $hall = CinemaHall::findOrFail($hallId);
        return view('admin.modals.price-configuration', ['hall' => $hall]);
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
        // Найдем зал вручную
        $cinemaHall = CinemaHall::find($hallId);
        
        if (!$cinemaHall) {
            return response()->json(['success' => false, 'message' => 'Ошибка: зал не найден'], 500);
        }

        $validated = $request->validate([
            'seats' => 'required|array',
            'seats.*.row' => 'required|numeric|min:1',
            'seats.*.seat' => 'required|numeric|min:1',
            'seats.*.type' => 'required|in:regular,vip,blocked'
        ]);

        try {
            // Принудительное удаление
            Seat::where('cinema_hall_id', $cinemaHall->id)->delete();

            // Создаем новые места
            foreach ($validated['seats'] as $seatData) {
                $seat = new Seat();
                $seat->cinema_hall_id = $cinemaHall->id;
                $seat->row_number = (int)$seatData['row'];
                $seat->row_seat_number = (int)$seatData['seat'];
                $seat->seat_status = $seatData['type'];
                $seat->save();
            }

            return response()->json(['success' => true, 'message' => 'Конфигурация сохранена']);

        } catch (\Exception $e) {
            \Log::error('Error saving hall configuration', [
                'hall_id' => $cinemaHall->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['success' => false, 'message' => 'Ошибка при сохранении: ' . $e->getMessage()], 500);
        }
    }

    // Обновление цен
    public function updatePrices(Request $request, $hallId)
    {
        $hall = CinemaHall::findOrFail($hallId);
        
        $validated = $request->validate([
            'regular_price' => 'required|numeric|min:0',
            'vip_price' => 'required|numeric|min:0'
        ]);

        $hall->update($validated);

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
}
