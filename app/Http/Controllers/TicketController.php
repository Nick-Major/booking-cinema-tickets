<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\MovieSession;
use App\Models\Seat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    public function index()
    {
        return Ticket::with(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    private function getGuestUser(): User
    {
        $guestEmail = 'guest@cinema.local';
        
        $user = User::where('email', $guestEmail)->first();
        
        if (!$user) {
            $user = User::create([
                'name' => 'Гость',
                'email' => $guestEmail,
                'password' => bcrypt(\Str::random(32)),
                'is_admin' => false
            ]);
        }
        
        return $user;
    }

    // Страница выбора места
    public function showBookingPage($movieSession)
    {
        try {
            \Log::info('=== SHOW BOOKING PAGE DEBUG ===');
            \Log::info('Raw parameter: ' . $movieSession);
            \Log::info('Parameter type: ' . gettype($movieSession));
            
            // Если пришел ID, находим сеанс
            if (is_numeric($movieSession)) {
                $session = \App\Models\MovieSession::with(['movie', 'cinemaHall', 'tickets'])->find($movieSession);
            } else {
                $session = $movieSession;
            }
            
            if (!$session) {
                \Log::error('Session not found. Parameter was: ' . $movieSession);
                abort(404, 'Сеанс не найден');
            }

            \Log::info('Session loaded - ID: ' . $session->id . ', Movie: ' . ($session->movie ? $session->movie->title : 'NULL'));
            
            // Явная загрузка отношений на всякий случай
            $session->load(['movie', 'cinemaHall', 'tickets']);
            
            if (!$session->movie) {
                \Log::error('Movie relation failed for session: ' . $session->id);
                abort(404, 'Фильм не найден');
            }

            if (!$session->cinemaHall) {
                \Log::error('Hall relation failed for session: ' . $session->id);
                abort(404, 'Зал не найден');
            }

            // Загружаем места с правильной сортировкой
            $seats = $session->cinemaHall->seats()
                ->orderBy('row_number')
                ->orderBy('row_seat_number')
                ->get();

            $seatsByRow = $seats->groupBy('row_number');
            $occupiedSeats = $session->tickets->pluck('seat_id')->toArray();

            \Log::info('Booking page SUCCESS - seats: ' . $seats->count() . ', occupied: ' . count($occupiedSeats));
            
            return view('client.booking', compact('session', 'seatsByRow', 'occupiedSeats'));
            
        } catch (\Exception $e) {
            \Log::error('Booking page error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return redirect()->route('home')->with('error', 'Ошибка загрузки страницы бронирования: ' . $e->getMessage());
        }
    }

    // Обработка бронирования
    public function bookTicket(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
        ]);

        // ПРОВЕРКА ДОСТУПНОСТИ
        $checkResult = $this->checkBookingAvailability(
            $validated['movie_session_id'],
            $validated['seat_id']
        );

        if (!$checkResult['available']) {
            return response()->json([
                'success' => false,
                'message' => $checkResult['message']
            ], 422);
        }

        return DB::transaction(function () use ($validated, $checkResult) {
            $guestUser = $this->getGuestUser();

            $ticket = Ticket::create([
                'movie_session_id' => $validated['movie_session_id'],
                'seat_id' => $validated['seat_id'],
                'user_id' => $guestUser->id,
                'final_price' => $checkResult['final_price'],
                'unique_code' => Ticket::generateUniqueCode(),
                'status' => 'booked',
                'expires_at' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Билет успешно забронирован',
                'ticket_id' => $ticket->id,
                'redirect_url' => route('tickets.confirmation', $ticket)
            ]);
        });
    }

    // Страница подтверждения бронирования
    public function showConfirmation(Ticket $ticket)
    {
        $ticket->load(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user']);
        return view('client.booking-confirmation', compact('ticket'));
    }

    // Страница электронного билета
    public function showTicket($code)
    {
        $ticket = Ticket::where('unique_code', $code)
            ->with(['movieSession.movie', 'movieSession.cinemaHall', 'seat', 'user'])
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
                'status' => 'booked'
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
            'status' => 'sometimes|in:booked,cancelled'
        ]);

        $ticket->update($validated);

        return response()->json($ticket->load(['movieSession.movie', 'seat', 'user']));
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();
        return response()->json(null, 204);
    }

    // Метод для проверки доступности места
    public function checkSeatAvailability(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
        ]);

        $checkResult = $this->checkBookingAvailability(
            $validated['movie_session_id'], 
            $validated['seat_id']
        );

        return response()->json($checkResult);
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
            ->where('status', 'booked')
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
