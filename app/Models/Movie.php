<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Movie extends Model
{
    use HasFactory;

    protected $appends = ['poster_url'];

    protected $fillable = [
        'title',
        'movie_description',
        'movie_poster',
        'movie_duration',
        'country',
        'is_active'
    ];

    protected $casts = [
        'movie_duration' => 'integer',
        'is_active' => 'boolean'
    ];

    // Аксессор для получения URL постера
    public function getPosterUrlAttribute()
    {
        // Если есть путь к постеру
        if ($this->movie_poster) {
            return Storage::disk('public')->url($this->movie_poster);
        }
        
        // Заглушка
        return asset('images/client/poster-placeholder.png');
    }

    // Мутатор для сохранения постера
    public function setMoviePosterAttribute($value)
    {
        if ($value && $value !== $this->movie_poster) {
            // Если это файл (загружен через форму)
            if ($value instanceof \Illuminate\Http\UploadedFile) {
                $path = $value->store('posters', 'public');
                $this->attributes['movie_poster'] = $path;
            } else {
                $this->attributes['movie_poster'] = $value;
            }
        } elseif (empty($value)) {
            $this->attributes['movie_poster'] = null;
        }
    }

    public function movieSessions(): HasMany
    {
        return $this->hasMany(MovieSession::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Метод для проверки, есть ли активные сеансы у фильма
    public function hasActiveSessions(): bool
    {
        return $this->movieSessions()
            ->where('session_start', '>', now())
            ->where('is_actual', true)
            ->exists();
    }

    // Метод для получения ближайшего сеанса
    public function getNearestSession()
    {
        return $this->movieSessions()
            ->where('session_start', '>', now())
            ->where('is_actual', true)
            ->orderBy('session_start')
            ->first();
    }

    public static function listAllActiveMovies()
    {
        return self::active()
            ->with(['movieSessions' => function($query) {
                $query->where('session_start', '>', now())
                      ->where('is_actual', true)
                      ->orderBy('session_start');
            }])
            ->get();
    }

    public function scopeWithSessionsForDate($query, $date)
    {
        return $query->whereHas('movieSessions', function($query) use ($date) {
                $query->whereDate('session_start', $date)
                    ->where('is_actual', true)
                    ->where('session_start', '>', now());
            })
            ->with(['movieSessions' => function($query) use ($date) {
                $query->whereDate('session_start', $date)
                    ->where('is_actual', true)
                    ->where('session_start', '>', now())
                    ->orderBy('session_start')
                    ->with('cinemaHall');
            }]);
    }
}
