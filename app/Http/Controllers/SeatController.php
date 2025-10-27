<?php

namespace App\Http\Controllers;

use App\Models\Seat;
use App\Models\CinemaHall;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function index()
    {
        return Seat::with('cinemaHall')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cinema_hall_id' => 'required|exists:cinema_halls,id',
            'row_number' => 'required|integer|min:1',
            'row_seat_number' => 'required|integer|min:1',
            'seat_status' => 'sometimes|in:regular,vip,blocked'
        ]);

        // Проверяем, не существует ли уже такое место в зале
        $existingSeat = Seat::where('cinema_hall_id', $validated['cinema_hall_id'])
            ->where('row_number', $validated['row_number'])
            ->where('row_seat_number', $validated['row_seat_number'])
            ->first();

        if ($existingSeat) {
            return response()->json([
                'message' => 'Место с такими координатами уже существует в этом зале'
            ], 422);
        }

        $seat = Seat::create($validated);

        return response()->json($seat, 201);
    }

    public function show(Seat $seat)
    {
        return $seat->load('cinemaHall');
    }

    public function update(Request $request, Seat $seat)
    {
        $validated = $request->validate([
            'cinema_hall_id' => 'sometimes|exists:cinema_halls,id',
            'row_number' => 'sometimes|integer|min:1',
            'row_seat_number' => 'sometimes|integer|min:1',
            'seat_status' => 'sometimes|in:regular,vip,blocked'
        ]);

        // Если меняются координаты места, проверяем на уникальность
        if (isset($validated['cinema_hall_id']) || isset($validated['row_number']) || isset($validated['row_seat_number'])) {
            $cinemaHallId = $validated['cinema_hall_id'] ?? $seat->cinema_hall_id;
            $rowNumber = $validated['row_number'] ?? $seat->row_number;
            $rowSeatNumber = $validated['row_seat_number'] ?? $seat->row_seat_number;

            $existingSeat = Seat::where('cinema_hall_id', $cinemaHallId)
                ->where('row_number', $rowNumber)
                ->where('row_seat_number', $rowSeatNumber)
                ->where('id', '!=', $seat->id)
                ->first();

            if ($existingSeat) {
                return response()->json([
                    'message' => 'Место с такими координатами уже существует в этом зале'
                ], 422);
            }
        }

        $seat->update($validated);

        return response()->json($seat);
    }

    public function destroy(Seat $seat)
    {
        $seat->delete();
        return response()->json(null, 204);
    }

    public function bulkCreateForHall(Request $request, CinemaHall $cinemaHall)
    {
        $validated = $request->validate([
            'rows' => 'required|integer|min:1',
            'seats_per_row' => 'required|integer|min:1',
            'vip_rows' => 'sometimes|array',
            'vip_rows.*' => 'integer|min:1'
        ]);

        $createdSeats = [];

        for ($row = 1; $row <= $validated['rows']; $row++) {
            for ($seatNumber = 1; $seatNumber <= $validated['seats_per_row']; $seatNumber++) {
                $status = in_array($row, $validated['vip_rows'] ?? []) ? 'vip' : 'regular';

                $seat = Seat::create([
                    'cinema_hall_id' => $cinemaHall->id,
                    'row_number' => $row,
                    'row_seat_number' => $seatNumber,
                    'seat_status' => $status
                ]);

                $createdSeats[] = $seat;
            }
        }

        return response()->json([
            'message' => 'Места успешно созданы',
            'seats_created' => count($createdSeats),
            'seats' => $createdSeats
        ], 201);
    }

    // Установить статус места
    public function setSeatStatus(string $status): void
    {
        $allowedStatuses = ['regular', 'vip', 'blocked'];
        
        if (!in_array($status, $allowedStatuses)) {
            throw new \InvalidArgumentException("Недопустимый статус места: {$status}");
        }
        
        $this->update(['seat_status' => $status]);
    }

    public function setRegular(Seat $seat)
    {
        $seat->setSeatStatus('regular');
        return response()->json(['message' => 'Место установлено как обычное', 'seat' => $seat]);
    }

    public function setVip(Seat $seat)
    {
        $seat->setSeatStatus('vip');
        return response()->json(['message' => 'Место установлено как VIP', 'seat' => $seat]);
    }

    public function setBlocked(Seat $seat)
    {
        $seat->setSeatStatus('blocked');
        return response()->json(['message' => 'Место заблокировано', 'seat' => $seat]);
    }
}
