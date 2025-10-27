<?php

namespace App\Http\Controllers;

use App\Models\CinemaHall;
use Illuminate\Http\Request;

class CinemaHallController extends Controller
{
    public function index()
    {
        return CinemaHall::withCount('seats')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hall_name' => 'required|string|max:100',
            'row_count' => 'required|integer|min:1',
            'max_seats_number_in_row' => 'required|integer|min:1',
            'is_active' => 'sometimes|boolean'
        ]);

        $cinemaHall = CinemaHall::create($validated);
        return response()->json($cinemaHall, 201);
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
            'is_active' => 'sometimes|boolean'
        ]);

        $cinemaHall->update($validated);
        return response()->json($cinemaHall);
    }

    public function destroy(CinemaHall $cinemaHall)
    {
        $cinemaHall->delete();
        return response()->json(null, 204);
    }
}
