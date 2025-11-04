<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevelLow;
use Endroid\QrCode\RoundBlockSizeMode\RoundBlockSizeModeMargin;
use Endroid\QrCode\Writer\PngWriter;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'movie_session_id',
        'seat_id',
        'user_id',
        'status',
        'final_price',
        'unique_code',
        'expires_at'
    ];

    protected $casts = [
        'final_price' => 'decimal:2',
        'booking_date' => 'datetime',
        'expires_at' => 'datetime'
    ];

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

    // Связь: билет принадлежит пользователю
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scope: активные билеты (не отмененные)
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['reserved', 'paid']);
    }

    // Scope: оплаченные билеты
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    // Scope: забронированные билеты
    public function scopeReserved($query)
    {
        return $query->where('status', 'reserved');
    }

    // Scope: просроченные бронирования
    public function scopeExpired($query)
    {
        return $query->where('status', 'reserved')
                    ->where('expires_at', '<', now());
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
        return in_array($this->status, ['reserved', 'paid']);
    }

    // Проверка, оплачен ли билет
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    // Проверка, истекло ли время бронирования
    public function isExpired(): bool
    {
        return $this->status === 'reserved' && 
               $this->expires_at && 
               $this->expires_at < now();
    }

    // Метод для оплаты билета
    public function markAsPaid(): void
    {
        $this->update([
            'status' => 'paid',
            'expires_at' => null
        ]);
    }

    // Метод для отмены билета
    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    // Генерация данных для QR-кода
    public function getQrCodeData(): array
    {
        return [
            'code' => $this->unique_code,
            'movie' => $this->movieSession->movie->title,
            'hall' => $this->movieSession->cinemaHall->hall_name,
            'seat' => $this->seat->getSeatLabelAttribute(),
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
        $qrPng = $this->generateQrCode();
        return 'data:image/png;base64,' . base64_encode($qrPng);
    }

    // Сохранить QR-код в файл
    public function saveQrCodeToFile(string $path): bool
    {
        $qrPng = $this->generateQrCode();
        return file_put_contents($path, $qrPng) !== false;
    }
}
