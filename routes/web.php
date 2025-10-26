<?php

use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

// Будущие маршруты для админки
Route::get('/admin', function () {
    return inertia('Admin/Dashboard', [
        'message' => 'Добро пожаловать в админку!'
    ]);
})->name('admin.dashboard');
