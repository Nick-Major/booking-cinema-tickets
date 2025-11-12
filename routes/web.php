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

// Аутентификация
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Фильмы
Route::get('/movies', [MovieController::class, 'withActiveSessions'])->name('movies.index');
Route::get('/movies/{movie}', [MovieController::class, 'show'])->name('movies.show');

// Сеансы
Route::get('/sessions', [MovieSessionController::class, 'listSessions'])->name('sessions.index');
Route::get('/sessions/{movieSession}', [MovieSessionController::class, 'show'])->name('sessions.show');
Route::get('/sessions/{movieSession}/seats', [MovieSessionController::class, 'availableSeats'])->name('sessions.seats');

// Билеты и бронирование
Route::get('/sessions/{movieSession}/booking', [TicketController::class, 'showBookingPage'])->name('sessions.booking');
Route::post('/tickets/book', [TicketController::class, 'bookTicket'])->name('tickets.book');
Route::get('/tickets/{ticket}/confirmation', [TicketController::class, 'showConfirmation'])->name('tickets.confirmation');
Route::get('/tickets/{code}', [TicketController::class, 'showTicket'])->name('tickets.show');
Route::post('/tickets/check-availability', [TicketController::class, 'checkSeatAvailability'])->name('tickets.check-availability');

// Админка
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    // Редирект с /admin на /admin/dashboard
    Route::get('/', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.index');

    // Дашборд
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    
    // Основные CRUD ресурсы
    Route::resource('halls', CinemaHallController::class);
    Route::resource('movies', MovieController::class);
    
    // ЯВНЫЕ МАРШРУТЫ ДЛЯ СЕАНСОВ (вместо Route::resource)
    Route::get('/sessions', [MovieSessionController::class, 'index'])->name('sessions.index');
    Route::post('/sessions', [MovieSessionController::class, 'store'])->name('sessions.store');
    Route::get('/sessions/{movieSession}', [MovieSessionController::class, 'show'])->name('sessions.show');
    Route::put('/sessions/{movieSession}', [MovieSessionController::class, 'update'])->name('sessions.update');
    Route::delete('/sessions/{movieSession}', [MovieSessionController::class, 'destroy'])->name('sessions.destroy');
    Route::get('/sessions/{movieSession}/edit', [MovieSessionController::class, 'edit'])->name('sessions.edit');

    // Управление залами
    Route::get('/halls/{hall}/configuration', [CinemaHallController::class, 'configuration'])->name('halls.configuration');
    Route::get('/halls/{hall}/prices', [CinemaHallController::class, 'prices'])->name('halls.prices');
    Route::post('/halls/{hall}/generate-layout', [CinemaHallController::class, 'generateLayout'])->name('halls.generate-layout');
    Route::post('/halls/{hall}/save-configuration', [CinemaHallController::class, 'saveConfiguration'])->name('halls.save-configuration');
    Route::post('/halls/{hall}/update-prices', [CinemaHallController::class, 'updatePrices'])->name('halls.update-prices');

    // Управление фильмами
    Route::get('/movies/{movie}/edit', [MovieController::class, 'edit'])->name('movies.edit');
    Route::post('/movies/{movie}/toggle-active', [MovieController::class, 'toggleActive'])->name('movies.toggle-active');

    // Управление сеансами
    Route::post('/sessions/{movieSession}/toggle-actual', [MovieSessionController::class, 'toggleActual'])->name('sessions.toggle-actual');
    Route::post('/sessions/cleanup', [MovieSessionController::class, 'cleanupOldSessions'])->name('sessions.cleanup');
    Route::get('/sessions/hall/{hallId}', [MovieSessionController::class, 'getHallSessions'])->name('sessions.by-hall');

    // Переключение продаж
    Route::post('/toggle-sales', [AdminController::class, 'toggleSales'])->name('toggle-sales');
});
