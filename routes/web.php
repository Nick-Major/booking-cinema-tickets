<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CinemaHallController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\MovieSessionController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

// Главная страница
Route::get('/', function () {
    return 'Главная страница кинотеатра';
});

// Аутентификация
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Админка (требует авторизации)
Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    
    // Ресурсы админки
    Route::resource('halls', CinemaHallController::class);
    Route::resource('movies', MovieController::class);
    Route::resource('sessions', MovieSessionController::class);
});

// Публичные API для клиентов
Route::get('/movies/active', [MovieController::class, 'withActiveSessions']);
Route::get('/sessions/available', [MovieSessionController::class, 'index']);
Route::get('/sessions/{session}/seats', [MovieSessionController::class, 'availableSeats']);
Route::post('/tickets/book', [TicketController::class, 'bookTicket']);
