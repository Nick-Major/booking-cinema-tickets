<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevelLow;
use Endroid\QrCode\RoundBlockSizeMode\RoundBlockSizeModeMargin;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'movie_session_id',
        'seat_id',
        'status',
        'final_price',
        'unique_code',
        'expires_at'
    ];

    protected $casts = [
        'final_price' => 'decimal:2',
        'expires_at' => 'datetime'
    ];

    // Связь: билет принадлежит бронированию
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    // Связь: билет принадлежит сеансу
    public function movieSession(): BelongsTo
    {
        return $this->belongsTo(MovieSession::class);
    }

    // Связь: билет принадлежит месту
    public function seat(): BelongsTo
    {
        return $this->belongsTo(Seat::class);
    }

    // Scope: активные билеты (забронированные)
    public function scopeActive($query)
    {
        return $query->where('status', 'reserved');
    }

    // Генерация уникального кода билета
    public static function generateUniqueCode(): string
    {
        do {
            $code = 'TKT' . strtoupper(\Str::random(8)) . time();
        } while (self::where('unique_code', $code)->exists());

        return $code;
    }

    // Проверка, активен ли билет
    public function isActive(): bool
    {
        return $this->status === 'reserved';
    }

    // Метод для отмены билета
    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    // Генерация данных для QR-кода отдельного билета
    public function getQrCodeData(): array
    {
        return [
            'ticket_code' => $this->unique_code,
            'booking_code' => $this->booking ? $this->booking->booking_code : null,
            'movie' => $this->movieSession->movie->title,
            'hall' => $this->movieSession->cinemaHall->hall_name,
            'seat' => "Ряд {$this->seat->row_number}, Место {$this->seat->row_seat_number}",
            'date' => $this->movieSession->session_start->format('d.m.Y'),
            'time' => $this->movieSession->session_start->format('H:i'),
            'price' => $this->final_price,
            'status' => $this->status
        ];
    }

    // Генерация QR-кода как PNG изображения
    public function generateQrCode(): string
    {
        $qrData = $this->getQrCodeData();
        $qrContent = json_encode($qrData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $result = Builder::create()
            ->writer(new PngWriter())
            ->writerOptions([])
            ->data($qrContent)
            ->encoding(new Encoding('UTF-8'))
            ->errorCorrectionLevel(new ErrorCorrectionLevelLow())
            ->size(200)
            ->margin(10)
            ->roundBlockSizeMode(new RoundBlockSizeModeMargin())
            ->build();

        return $result->getString();
    }

    // Получить QR-код в base64 для отображения в HTML
    public function getQrCodeBase64(): string
    {
        try {
            $qrPng = $this->generateQrCode();
            return 'data:image/png;base64,' . base64_encode($qrPng);
        } catch (\Exception $e) {
            \Log::error('QR code generation failed: ' . $e->getMessage());
            return 'data:image/svg+xml;base64,' . base64_encode('
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f0f0f0"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14">QR Error</text>
                </svg>
            ');
        }
    }
}
