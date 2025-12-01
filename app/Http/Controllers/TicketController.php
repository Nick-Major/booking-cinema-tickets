<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\MovieSession;
use App\Models\Seat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    public function index()
    {
        return Ticket::with(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // Страница выбора места
    public function showBookingPage($movieSession)
    {
        try {
            \Log::info('=== SHOW BOOKING PAGE ===');
            
            if (is_numeric($movieSession)) {
                $session = \App\Models\MovieSession::with(['movie', 'cinemaHall', 'tickets'])->find($movieSession);
            } else {
                $session = $movieSession;
            }
            
            if (!$session) {
                \Log::error('Session not found. Parameter was: ' . $movieSession);
                abort(404, 'Сеанс не найден');
            }

            // Явная загрузка отношений
            $session->load(['movie', 'cinemaHall', 'tickets']);
            
            if (!$session->movie) {
                abort(404, 'Фильм не найден');
            }

            if (!$session->cinemaHall) {
                abort(404, 'Зал не найден');
            }

            // Проверяем доступность сеанса
            if (!$session->isAvailable()) {
                return redirect()->route('home')->with('error', 'Этот сеанс недоступен для бронирования.');
            }

            // Загружаем места с правильной сортировкой
            $seats = $session->cinemaHall->seats()
                ->orderBy('row_number')
                ->orderBy('row_seat_number')
                ->get();

            $seatsByRow = $seats->groupBy('row_number');
            $occupiedSeats = $session->tickets()->where('status', 'reserved')->pluck('seat_id')->toArray();

            \Log::info('Booking page loaded - Session: ' . $session->id . ', Seats: ' . $seats->count() . ', Occupied: ' . count($occupiedSeats));
            
            return view('client.booking', compact('session', 'seatsByRow', 'occupiedSeats'));
            
        } catch (\Exception $e) {
            \Log::error('Booking page error: ' . $e->getMessage());
            return redirect()->route('home')->with('error', 'Ошибка загрузки страницы бронирования.');
        }
    }

    // Обработка бронирования
    public function bookTicket(Request $request)
    {
        \Log::info('Booking ticket request:', $request->all());
        
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_ids' => 'required|array|min:1',
            'seat_ids.*' => 'exists:seats,id',
            'user_id' => 'nullable|exists:users,id',
            'guest_email' => 'nullable|email|max:255',
            'guest_phone' => 'nullable|string|max:20',
            'guest_name' => 'nullable|string|max:100',
        ]);

        // Декодируем JSON если он пришел как строка
        if (is_string($validated['seat_ids'])) {
            $validated['seat_ids'] = json_decode($validated['seat_ids'], true);
            \Log::info('Decoded seat_ids:', $validated['seat_ids']);
        }

        // Проверяем доступность всех мест
        $checkResult = $this->checkMultipleSeatsAvailability(
            $validated['movie_session_id'], 
            $validated['seat_ids']
        );
        
        if (!$checkResult['available']) {
            return response()->json([
                'success' => false,
                'message' => $checkResult['message'],
                'unavailable_seats' => $checkResult['unavailable_seats']
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $session = MovieSession::with('cinemaHall')->findOrFail($validated['movie_session_id']);
            
            // Определяем user_id: если пользователь авторизован, используем его ID
            // Если нет, то null (гость)
            $user_id = auth()->check() ? auth()->id() : null;
            
            // Создаем бронирование
            $booking = \App\Models\Booking::create([
                'booking_code' => \App\Models\Booking::generateBookingCode(),
                'user_id' => $user_id,
                'guest_email' => $validated['guest_email'] ?? null,
                'guest_phone' => $validated['guest_phone'] ?? null,
                'guest_name' => $validated['guest_name'] ?? null,
                'movie_session_id' => $validated['movie_session_id'],
                'total_price' => $checkResult['total_price'],
                'status' => 'reserved',
                'expires_at' => now()->addHours(24),
            ]);
            
            // Создаем билеты для каждого места
            $tickets = [];
            foreach ($checkResult['available_seats'] as $seatId) {
                $seat = Seat::findOrFail($seatId);
                $price = $seat->seat_status === 'vip' 
                    ? $session->cinemaHall->vip_price 
                    : $session->cinemaHall->regular_price;
                
                $ticket = Ticket::create([
                    'booking_id' => $booking->id,
                    'movie_session_id' => $validated['movie_session_id'],
                    'seat_id' => $seatId,
                    'status' => 'reserved',
                    'final_price' => $price,
                    'unique_code' => Ticket::generateUniqueCode(),
                    'expires_at' => now()->addHours(24),
                ]);
                
                $tickets[] = $ticket;
            }
            
            DB::commit();
            
            \Log::info('Booking created successfully:', [
                'booking_id' => $booking->id,
                'user_id' => $booking->user_id,
                'is_guest' => is_null($booking->user_id),
                'tickets_count' => count($tickets)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Билеты успешно забронированы',
                'booking' => $booking,
                'redirect_url' => route('tickets.booking-confirmation', $booking->booking_code)
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error booking tickets: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при бронировании: ' . $e->getMessage()
            ], 500);
        }
    }

    // Страница подтверждения бронирования (для всей брони)
    public function showBookingConfirmation($bookingCode)
    {
        try {
            $booking = \App\Models\Booking::where('booking_code', $bookingCode)
                ->with(['movieSession.movie', 'movieSession.cinemaHall', 'tickets.seat', 'user'])
                ->firstOrFail();
            
            return view('client.booking-confirmation', compact('booking'));
            
        } catch (\Exception $e) {
            \Log::error('Error loading booking confirmation: ' . $e->getMessage());
            return redirect()->route('home')->with('error', 'Бронирование не найдено.');
        }
    }

    // Страница подтверждения бронирования
    public function showConfirmation(Ticket $ticket)
    {
        $ticket->load(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user']);
        return view('client.booking-confirmation', compact('ticket'));
    }

    public function showTicket($code)
    {
        $ticket = Ticket::where('unique_code', $code)
            ->with(['booking', 'movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user'])
            ->firstOrFail();

        return view('client.ticket', compact('ticket'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
            'user_id' => 'required|exists:users,id',
        ]);

        $checkResult = $this->checkBookingAvailability(
            $validated['movie_session_id'], 
            $validated['seat_id']
        );

        if (!$checkResult['available']) {
            return response()->json([
                'message' => $checkResult['message']
            ], 422);
        }

        return DB::transaction(function () use ($validated, $checkResult) {
            $ticket = Ticket::create([
                'movie_session_id' => $validated['movie_session_id'],
                'seat_id' => $validated['seat_id'],
                'user_id' => $validated['user_id'],
                'final_price' => $checkResult['final_price'],
                'unique_code' => Ticket::generateUniqueCode(),
                'status' => 'reserved'
            ]);

            return response()->json($ticket->load(['movieSession.movie', 'seat', 'user']), 201);
        });
    }

    public function show(Ticket $ticket)
    {
        return $ticket->load(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user']);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:reserved,cancelled'
        ]);

        $ticket->update($validated);

        return response()->json($ticket->load(['movieSession.movie', 'seat', 'user']));
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();
        return response()->json(null, 204);
    }

    // Метод для проверки доступности массива мест
    private function checkMultipleSeatsAvailability($movieSessionId, array $seatIds): array
    {
        $unavailableSeats = [];
        $availableSeats = [];
        $totalPrice = 0;
        
        foreach ($seatIds as $seatId) {
            $checkResult = $this->checkBookingAvailability($movieSessionId, $seatId);
            
            if ($checkResult['available']) {
                $availableSeats[] = $seatId;
                $totalPrice += $checkResult['final_price'];
            } else {
                $seat = Seat::find($seatId);
                $unavailableSeats[] = [
                    'seat_id' => $seatId,
                    'message' => $checkResult['message'],
                    'row' => $seat->row_number ?? 'N/A',
                    'seat' => $seat->row_seat_number ?? 'N/A'
                ];
            }
        }
        
        return [
            'available' => empty($unavailableSeats),
            'available_seats' => $availableSeats,
            'unavailable_seats' => $unavailableSeats,
            'total_price' => $totalPrice,
            'message' => empty($unavailableSeats) 
                ? 'Все места доступны для бронирования' 
                : 'Некоторые места недоступны'
        ];
    }

    public function checkSeatAvailability(Request $request)
    {
        \Log::info('Check seat availability request:', $request->all());
        
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_ids' => 'required|array|min:1',
            'seat_ids.*' => 'exists:seats,id',
        ]);

        $result = $this->checkMultipleSeatsAvailability(
            $validated['movie_session_id'], 
            $validated['seat_ids']
        );

        return response()->json($result);
    }

    // Метод проверки доступности бронирования
    private function checkBookingAvailability($movieSessionId, $seatId): array
    {
        // Загружаем сеанс с отношениями
        $movieSession = MovieSession::with(['cinemaHall', 'movie'])->findOrFail($movieSessionId);
        $seat = Seat::with(['cinemaHall'])->findOrFail($seatId);

        // Проверяем, что зал сеанса и зал места совпадают
        if ($movieSession->cinema_hall_id !== $seat->cinema_hall_id) {
            return [
                'available' => false,
                'message' => 'Место не принадлежит залу сеанса'
            ];
        }

        // Проверяем доступность зала
        if (!$movieSession->cinemaHall || !$movieSession->cinemaHall->is_active) {
            return [
                'available' => false,
                'message' => 'Продажа билетов в этом зале приостановлена'
            ];
        }

        // Проверяем доступность сеанса
        if (!$movieSession->isAvailable()) {
            return [
                'available' => false,
                'message' => 'Сеанс недоступен для бронирования'
            ];
        }

        // Проверяем доступность места
        if (!$seat->isAvailable()) {
            return [
                'available' => false,
                'message' => 'Место недоступно для бронирования'
            ];
        }

        // Проверяем, не занято ли уже место на этом сеансе
        $existingTicket = Ticket::where('movie_session_id', $movieSessionId)
            ->where('seat_id', $seatId)
            ->where('status', 'reserved')
            ->first();

        if ($existingTicket) {
            return [
                'available' => false,
                'message' => 'Место уже забронировано на этот сеанс'
            ];
        }

        // Рассчитываем цену (только для информации)
        $finalPrice = $seat->price;

        return [
            'available' => true,
            'message' => 'Место доступно для бронирования',
            'movie_session' => $movieSession,
            'seat' => $seat,
            'final_price' => $finalPrice
        ];
    }

    // Получить билет по уникальному коду
    public function findByCode($code)
    {
        $ticket = Ticket::where('unique_code', $code)
            ->with(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user'])
            ->firstOrFail();

        return response()->json($ticket);
    }
}
