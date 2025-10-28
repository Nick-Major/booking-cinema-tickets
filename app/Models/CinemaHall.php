<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CinemaHall extends Model
{
    use HasFactory;

    protected $fillable = [
        'hall_name',
        'row_count', 
        'max_seats_number_in_row',
        'regular_price',
        'vip_price',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Связь: один зал имеет много мест
    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    // Связь: один зал имеет много сеансов
    public function movieSessions(): HasMany
    {
        return $this->hasMany(MovieSession::class);
    }

    // Scope: активные залы
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
