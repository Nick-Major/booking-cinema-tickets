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
    public function showBookingPage(MovieSession $session)
    {
        try {
            \Log::info('=== SHOW BOOKING PAGE START ===');
            \Log::info('Session ID: ' . $session->id);
            \Log::info('Raw session data: ', $session->toArray());

            // Проверим базовые данные до загрузки отношений
            \Log::info('Movie ID from session: ' . $session->movie_id);
            \Log::info('Hall ID from session: ' . $session->cinema_hall_id);

            // Проверим существование фильма напрямую
            $movieExists = \App\Models\Movie::where('id', $session->movie_id)->exists();
            \Log::info('Movie exists in DB: ' . ($movieExists ? 'Yes' : 'No'));

            // Проверим существование зала напрямую
            $hallExists = \App\Models\CinemaHall::where('id', $session->cinema_hall_id)->exists();
            \Log::info('Hall exists in DB: ' . ($hallExists ? 'Yes' : 'No'));

            // Явно загружаем отношения с отдельными запросами
            $movie = \App\Models\Movie::find($session->movie_id);
            $cinemaHall = \App\Models\CinemaHall::find($session->cinema_hall_id);

            \Log::info('Direct movie fetch: ' . ($movie ? $movie->title : 'NULL'));
            \Log::info('Direct hall fetch: ' . ($cinemaHall ? $cinemaHall->hall_name : 'NULL'));

            if (!$movie) {
                \Log::error('CRITICAL: Movie not found by direct query! Session movie_id: ' . $session->movie_id);
                abort(404, 'Фильм для этого сеанса не найден в базе данных.');
            }

            if (!$cinemaHall) {
                \Log::error('CRITICAL: Hall not found by direct query! Session hall_id: ' . $session->cinema_hall_id);
                abort(404, 'Зал для этого сеанса не найден в базе данных.');
            }

            // Вручную устанавливаем отношения
            $session->setRelation('movie', $movie);
            $session->setRelation('cinemaHall', $cinemaHall);

            // Загружаем места для зала
            $cinemaHall->load(['seats' => function($query) {
                $query->orderBy('row_number')->orderBy('row_seat_number');
            }]);

            // Загружаем билеты
            $session->load(['tickets' => function($query) {
                $query->whereIn('status', ['reserved', 'paid']);
            }]);

            // Проверяем доступность сеанса
            if (!$session->isAvailable()) {
                \Log::warning('Session not available: ' . $session->id);
                return redirect()->back()->with('error', 'Этот сеанс недоступен для бронирования.');
            }

            // Группируем места по рядам
            $seatsByRow = $cinemaHall->seats->groupBy('row_number');
            
            // Получаем занятые места
            $occupiedSeats = $session->tickets->pluck('seat_id')->toArray();

            \Log::info('=== SHOW BOOKING PAGE SUCCESS ===');
            \Log::info('Seats count: ' . $cinemaHall->seats->count());
            \Log::info('Occupied seats: ' . count($occupiedSeats));
            
            return view('client.booking', compact('session', 'seatsByRow', 'occupiedSeats'));
            
        } catch (\Exception $e) {
            \Log::error('=== SHOW BOOKING PAGE ERROR ===');
            \Log::error('Error: ' . $e->getMessage());
            \Log::error('File: ' . $e->getFile());
            \Log::error('Line: ' . $e->getLine());
            \Log::error('Session data on error: ', $session ? $session->toArray() : ['session' => 'null']);
            
            return redirect()->route('home')->with('error', 'Произошла ошибка при загрузке страницы бронирования.');
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
                'expires_at' => now()->addMinutes(30)
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
            ->whereIn('status', ['reserved', 'paid'])
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
            'movie_session' => $movieSession,
            'seat' => $seat,
            'final_price' => $finalPrice
        ];
    }

    // Метод для оплаты билета
    public function payTicket(Ticket $ticket)
    {
        $ticket->load(['movieSession.movie', 'seat', 'user']);
        
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
            'ticket' => $ticket
        ]);
    }

    // Метод для отмены билета
    public function cancelTicket(Ticket $ticket)
    {
        $ticket->load(['movieSession.movie', 'seat', 'user']);
        
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
