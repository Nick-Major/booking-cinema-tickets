<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CinemaHallController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\MovieSessionController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

// Главная страница
Route::get('/', [HomeController::class, 'index'])->name('home');

// Аутентификация (только для администраторов)
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Публичные маршруты для гостей
Route::get('/movies', [MovieController::class, 'withActiveSessions'])->name('movies.index');
Route::get('/movies/{movie}', [MovieController::class, 'show'])->name('movies.show');
Route::get('/sessions', [MovieSessionController::class, 'listSessions'])->name('sessions.index');
Route::get('/sessions/{session}', [MovieSessionController::class, 'show'])->name('sessions.show');
Route::get('/sessions/{session}/seats', [MovieSessionController::class, 'availableSeats'])->name('sessions.seats');

// Бронирование билетов (доступно гостям без авторизации)
Route::post('/tickets/book', [TicketController::class, 'bookTicket'])->name('tickets.book');
Route::get('/sessions/{session}/booking', [TicketController::class, 'showBookingPage'])->name('sessions.booking');
Route::get('/tickets/{ticket}/confirmation', [TicketController::class, 'showConfirmation'])->name('tickets.confirmation');
Route::get('/tickets/{code}', [TicketController::class, 'showTicket'])->name('tickets.show');

// API маршруты
Route::post('/tickets/check-availability', [TicketController::class, 'checkSeatAvailability'])->name('tickets.check-availability');

// Админка (требует авторизации и проверки прав администратора)
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    
    // Ресурсы админки
    Route::resource('halls', CinemaHallController::class);
    Route::resource('movies', MovieController::class);
    Route::resource('sessions', MovieSessionController::class);

    Route::get('/halls/{hall}/configuration', [CinemaHallController::class, 'configuration'])->name('halls.configuration');
    Route::get('/halls/{hall}/prices', [CinemaHallController::class, 'prices'])->name('halls.prices');
    Route::post('/halls/{hall}/generate-layout', [CinemaHallController::class, 'generateLayout'])->name('halls.generate-layout');
    Route::post('/halls/{hall}/save-configuration', [CinemaHallController::class, 'saveConfiguration'])->name('halls.save-configuration');
    Route::post('/halls/{hall}/update-prices', [CinemaHallController::class, 'updatePrices'])->name('halls.update-prices');
    Route::post('/movies/{movie}/toggle-active', [MovieController::class, 'toggleActive'])->name('movies.toggle-active');
    Route::get('/movies/{movie}/edit', [MovieController::class, 'edit'])->name('movies.edit');
    Route::get('/sessions/{movieSession}/edit', [MovieSessionController::class, 'edit'])->name('sessions.edit');
    Route::post('/sessions/{movieSession}/toggle-actual', [MovieSessionController::class, 'toggleActual'])->name('sessions.toggle-actual');
    Route::post('/sessions/cleanup', [MovieSessionController::class, 'cleanupOldSessions'])->name('sessions.cleanup');
    Route::get('/sessions/hall/{hallId}', [MovieSessionController::class, 'getHallSessions'])->name('sessions.by-hall');
});
