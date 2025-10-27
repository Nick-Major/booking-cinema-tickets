<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Seat extends Model
{
    use HasFactory;

    protected $fillable = [
        'cinema_hall_id',
        'row_number',
        'row_seat_number',
        'seat_status'
    ];

    protected $casts = [
        'row_number' => 'integer',
        'row_seat_number' => 'integer'
    ];

    // Связь: место принадлежит залу
    public function cinemaHall(): BelongsTo
    {
        return $this->belongsTo(CinemaHall::class);
    }

    // Связь: место может быть в нескольких билетах (история бронирований)
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    // Scope: активные места (не заблокированные)
    public function scopeActive($query)
    {
        return $query->where('seat_status', '!=', 'blocked');
    }

    // Scope: VIP места
    public function scopeVip($query)
    {
        return $query->where('seat_status', 'vip');
    }

    // Scope: обычные места
    public function scopeRegular($query)
    {
        return $query->where('seat_status', 'regular');
    }

    // Метод для установки статуса места
    public function setSeatStatus(string $status): void
    {
        $allowedStatuses = ['regular', 'vip', 'blocked'];
        
        if (!in_array($status, $allowedStatuses)) {
            throw new \InvalidArgumentException("Недопустимый статус места: {$status}");
        }
        
        $this->update(['seat_status' => $status]);
    }

    // Метод для получения цены места (будет доработан после создания PriceRule)
    public function getPriceAttribute(): float
    {
        return match($this->seat_status) {
            'vip' => 500.00,
            'regular' => 300.00,
            'blocked' => 0.00,
            default => 300.00,
        };
    }

    // Проверка, доступно ли место для бронирования
    public function isAvailable(): bool
    {
        return $this->seat_status !== 'blocked';
    }

    // Получить строку представления места (например: "Ряд 3 Место 5")
    public function getSeatLabelAttribute(): string
    {
        return "Ряд {$this->row_number} Место {$this->row_seat_number}";
    }
}
