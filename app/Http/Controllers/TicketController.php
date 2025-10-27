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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
            'user_id' => 'required|exists:users,id',
        ]);

        // Используем общий метод проверки
        $checkResult = $this->checkBookingAvailability(
            $validated['movie_session_id'], 
            $validated['seat_id']
        );

        if (!$checkResult['available']) {
            return response()->json([
                'message' => $checkResult['message']
            ], 422);
        }

        // Используем транзакцию для безопасности
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

    public function chooseSeat(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
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

        return response()->json([
            'movie_session' => $checkResult['movie_session'],
            'seat' => $checkResult['seat'],
            'final_price' => $checkResult['final_price'],
            'is_available' => true
        ]);
    }

    public function bookTicket(Request $request)
    {
        $validated = $request->validate([
            'movie_session_id' => 'required|exists:movie_sessions,id',
            'seat_id' => 'required|exists:seats,id',
        ]);

        // Автоматически берем текущего пользователя
        $userId = auth()->id() ?? 1; // временно для тестов

        // Используем транзакцию для безопасности
        return DB::transaction(function () use ($validated, $userId) {
            $checkResult = $this->checkBookingAvailability(
                $validated['movie_session_id'], 
                $validated['seat_id']
            );

            if (!$checkResult['available']) {
                throw new \Exception($checkResult['message']);
            }

            // Создаем билет
            $ticket = Ticket::create([
                'movie_session_id' => $validated['movie_session_id'],
                'seat_id' => $validated['seat_id'],
                'user_id' => $userId,
                'final_price' => $checkResult['final_price'],
                'unique_code' => Ticket::generateUniqueCode(),
                'expires_at' => now()->addMinutes(30)
            ]);

            return response()->json([
                'message' => 'Билет успешно забронирован',
                'ticket' => $ticket->load(['movieSession.movie', 'seat', 'user']),
                'expires_at' => $ticket->expires_at
            ], 201);
        });
    }

    // Общий метод проверки доступности бронирования
    private function checkBookingAvailability($movieSessionId, $seatId): array
    {
        // Проверяем существование сущностей
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
            ->where('status', '!=', 'cancelled') // ← ИСПРАВИЛИ ЗДЕСЬ!
            ->first();

        if ($existingTicket) {
            return [
                'available' => false,
                'message' => 'Место уже забронировано на этот сеанс'
            ];
        }

        // Рассчитываем цену
        $finalPrice = Ticket::calculateFinalPrice(
            $movieSession->base_price,
            $seat->seat_status
        );

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

    // Получить билеты пользователя
    public function userTickets(Request $request)
    {
        $userId = auth()->id() ?? 1; // временно для тестов
        
        $tickets = Ticket::where('user_id', $userId)
            ->with(['movieSession.movie', 'movieSession.cinemaHall', 'seat'])
            ->orderBy('booking_date', 'desc')
            ->get();

        return response()->json($tickets);
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
