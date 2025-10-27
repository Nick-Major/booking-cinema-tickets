<?php

use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CinemaHallController;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

// Будущие маршруты для админки
Route::get('/admin', function () {
    return inertia('Admin/Dashboard', [
        'message' => 'Добро пожаловать в админку!'
    ]);
})->name('admin.dashboard');

// API маршруты для кинозалов (для React компонентов через Inertia)
Route::resource('cinema-halls', CinemaHallController::class);

// Маршруты для мест
Route::resource('seats', SeatController::class);
Route::post('/cinema-halls/{cinemaHall}/seats/bulk-create', [SeatController::class, 'bulkCreateForHall']);
Route::patch('/seats/{seat}/set-regular', [SeatController::class, 'setRegular']);
Route::patch('/seats/{seat}/set-vip', [SeatController::class, 'setVip']);
Route::patch('/seats/{seat}/set-blocked', [SeatController::class, 'setBlocked']);

// Маршруты для фильмов
Route::resource('movies', MovieController::class);
Route::get('/movies/active/list', [MovieController::class, 'listAllActiveMovies']);
Route::get('/movies/with-sessions/active', [MovieController::class, 'withActiveSessions']);
Route::get('/movies/search', [MovieController::class, 'search']);

// Маршруты для сеансов
Route::resource('movie-sessions', MovieSessionController::class);
Route::get('/movie-sessions/list/all', [MovieSessionController::class, 'listSessions']);
Route::get('/movie-sessions/{movieSession}/available-seats', [MovieSessionController::class, 'availableSeats']);
Route::get('/movie-sessions/{movieSession}/occupied-seats', [MovieSessionController::class, 'occupiedSeats']);

// Маршруты для билетов
Route::resource('tickets', TicketController::class);
Route::post('/tickets/choose-seat', [TicketController::class, 'chooseSeat']);
Route::post('/tickets/book-ticket', [TicketController::class, 'bookTicket']);
Route::patch('/tickets/{ticket}/pay', [TicketController::class, 'payTicket']);
Route::patch('/tickets/{ticket}/cancel', [TicketController::class, 'cancelTicket']);
Route::get('/tickets/user/my-tickets', [TicketController::class, 'userTickets']);
Route::get('/tickets/code/{code}', [TicketController::class, 'findByCode']);

// Health check маршрут (если нужен)
Route::get('/up', function () {
    return response()->json(['status' => 'OK']);
});
