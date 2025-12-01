<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_code',
        'user_id',
        'guest_email',
        'guest_phone', 
        'guest_name',
        'movie_session_id',
        'total_price',
        'status',
        'expires_at'
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'expires_at' => 'datetime'
    ];

    // Связь: бронирование принадлежит пользователю (может быть null для гостей)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Связь: бронирование принадлежит сеансу
    public function movieSession(): BelongsTo
    {
        return $this->belongsTo(MovieSession::class);
    }

    // Связь: бронирование имеет много билетов
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    // Получить имя для отображения (пользователь или гость)
    public function getDisplayNameAttribute(): string
    {
        if ($this->user) {
            return $this->user->name;
        }
        
        return $this->guest_name ?: 'Гость';
    }

    // Получить email для отображения
    public function getDisplayEmailAttribute(): string
    {
        if ($this->user) {
            return $this->user->email;
        }
        
        return $this->guest_email ?: 'Не указан';
    }

    // Генерация уникального кода бронирования
    public static function generateBookingCode(): string
    {
        do {
            $code = 'BOOK' . strtoupper(\Str::random(6)) . time();
        } while (self::where('booking_code', $code)->exists());

        return $code;
    }

    // Проверка, активно ли бронирование
    public function isActive(): bool
    {
        return $this->status === 'reserved' && (!$this->expires_at || $this->expires_at > now());
    }
}
