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
            ->orderBy('booking_date', 'desc')
            ->get();
    }

    // Страница выбора места
    public function showBookingPage(MovieSession $session)
    {
        // Получаем все места зала
        $seats = $session->cinemaHall->seats()
            ->orderBy('row_number')
            ->orderBy('row_seat_number')
            ->get();
            
        // Группируем места по рядам
        $seatsByRow = $seats->groupBy('row_number');
        
        // Получаем занятые места на этот сеанс
        $occupiedSeats = $session->tickets()
            ->whereIn('status', ['reserved', 'paid'])
            ->pluck('seat_id')
            ->toArray();

        return view('client.booking', compact('session', 'seatsByRow', 'occupiedSeats'));
    }

    // Обработка бронирования
    public function bookTicket(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
        ]);

        // Для гостей создаем временного пользователя
        // В реальном приложении здесь была бы регистрация/авторизация
        $guestUser = User::firstOrCreate(
            ['email' => 'guest@cinema.local'],
            [
                'name' => 'Гость',
                'password' => bcrypt(uniqid()),
                'is_admin' => false
            ]
        );

        // Используем транзакцию для защиты от дублирования
        return DB::transaction(function () use ($validated, $guestUser) {
            $checkResult = $this->checkBookingAvailability(
                $validated['movie_session_id'], 
                $validated['seat_id']
            );

            if (!$checkResult['available']) {
                return back()->with('error', $checkResult['message']);
            }

            // Создаем билет
            $ticket = Ticket::create([
                'movie_session_id' => $validated['movie_session_id'],
                'seat_id' => $validated['seat_id'],
                'user_id' => $guestUser->id,
                'final_price' => $checkResult['final_price'],
                'unique_code' => Ticket::generateUniqueCode(),
                'expires_at' => now()->addMinutes(30)
            ]);

            // Перенаправляем на страницу подтверждения
            return redirect()->route('tickets.confirmation', $ticket);
        });
    }

    // Страница подтверждения бронирования
    public function showConfirmation(Ticket $ticket)
    {
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

        // Используем транзакцию для защиты от дублирования
        return DB::transaction(function () use ($validated, $checkResult) {
            // Создаем билет
            $ticket = Ticket::create([
                'movie_session_id' => $validated['movie_session_id'],
                'seat_id' => $validated['seat_id'],
                'user_id' => $validated['user_id'],
                'final_price' => $checkResult['final_price'],
                'unique_code' => Ticket::generateUniqueCode(),
                'expires_at' => now()->addMinutes(30)
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
            'status' => 'sometimes|in:reserved,paid,cancelled'
        ]);

        // Если меняем статус на "оплачено"
        if (isset($validated['status']) && $validated['status'] === 'paid') {
            $ticket->markAsPaid();
        } else {
            $ticket->update($validated);
        }

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
        // Проверяем существование сеанса
        $movieSession = MovieSession::findOrFail($movieSessionId);
        $seat = Seat::findOrFail($seatId);

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
            ->where('status', '!=', 'cancelled')
            ->first();

        if ($existingTicket) {
            return [
                'available' => false,
                'message' => 'Место уже забронировано на этот сеанс'
            ];
        }

        // Рассчитываем цену
        $finalPrice = $seat->price;

        return [
            'available' => true,
            'message' => 'Место доступно для бронирования',
            'movie_session' => $movieSession->load(['movie', 'cinemaHall']),
            'seat' => $seat,
            'final_price' => $finalPrice
        ];
    }

    // Метод для оплаты билета
    public function payTicket(Ticket $ticket)
    {
        if ($ticket->isPaid()) {
            return response()->json([
                'message' => 'Билет уже оплачен'
            ], 422);
        }

        if ($ticket->isExpired()) {
            return response()->json([
                'message' => 'Время бронирования истекло'
            ], 422);
        }

        $ticket->markAsPaid();

        return response()->json([
            'message' => 'Билет успешно оплачен',
            'ticket' => $ticket->load(['movieSession.movie', 'seat', 'user'])
        ]);
    }

    // Метод для отмены билета
    public function cancelTicket(Ticket $ticket)
    {
        if ($ticket->isPaid()) {
            return response()->json([
                'message' => 'Оплаченный билет нельзя отменить'
            ], 422);
        }

        $ticket->cancel();

        return response()->json([
            'message' => 'Бронь отменена',
            'ticket' => $ticket
        ]);
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
