<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HallSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'cinema_hall_id',
        'date',
        'start_time',
        'end_time'
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    // Отношение с залом
    public function cinemaHall()
    {
        return $this->belongsTo(CinemaHall::class);
    }
}
