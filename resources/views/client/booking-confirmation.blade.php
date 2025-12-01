@extends('layouts.base')

@section('title', 'Подтверждение бронирования')

@section('content')
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
  </header>
  
  <main>
    <section class="ticket">
      
      <header class="tichet__check">
        <h2 class="ticket__check-title">Подтверждение бронирования</h2>
      </header>
      
      <div class="ticket__info-wrapper">
        <div class="ticket__summary">
          <p class="ticket__info">Код бронирования: <span class="ticket__details">{{ $booking->booking_code }}</span></p>
          <p class="ticket__info">На фильм: <span class="ticket__details">{{ $booking->movieSession->movie->title }}</span></p>
          <p class="ticket__info">В зале: <span class="ticket__details">{{ $booking->movieSession->cinemaHall->hall_name }}</span></p>
          <p class="ticket__info">Начало сеанса: <span class="ticket__details">{{ $booking->movieSession->session_start->format('d.m.Y H:i') }}</span></p>
          <p class="ticket__info">Количество билетов: <span class="ticket__details">{{ $booking->tickets->count() }}</span></p>
          <p class="ticket__info">Общая стоимость: <span class="ticket__details">{{ $booking->total_price }} руб.</span></p>
        </div>

        <div class="ticket__section">
          <h3 class="ticket__section-title">Забронированные места</h3>
          <div class="ticket__seats">
            @foreach($booking->tickets as $ticket)
              <div class="ticket__seat-item">
                <span class="ticket__seat-info">
                  <span class="ticket__seat-location">Ряд {{ $ticket->seat->row_number }}, Место {{ $ticket->seat->row_seat_number }}</span>
                  <span class="ticket__seat-type">({{ $ticket->seat->seat_status === 'vip' ? 'VIP' : 'Обычное' }})</span>
                </span>
                <span class="ticket__seat-price">{{ $ticket->final_price }} руб.</span>
              </div>
            @endforeach
          </div>
        </div>

        <div class="ticket__section">
          <h3 class="ticket__section-title">QR-коды билетов</h3>
          <p class="ticket__hint">Каждый билет имеет свой уникальный QR-код:</p>
          <div class="ticket__qr-codes">
            @foreach($booking->tickets as $ticket)
              <div class="ticket__qr-ticket">
                <div class="ticket__qr-info">
                  <p class="ticket__qr-location">Ряд {{ $ticket->seat->row_number }}, Место {{ $ticket->seat->row_seat_number }}</p>
                  <p class="ticket__qr-price">{{ $ticket->final_price }} руб.</p>
                </div>
                <img class="ticket__qr-image" src="{{ $ticket->getQrCodeBase64() }}" alt="QR код билета">
                <p class="ticket__qr-code">Код: {{ $ticket->unique_code }}</p>
              </div>
            @endforeach
          </div>
        </div>

        <div class="ticket__actions">
          <a href="{{ route('home') }}" class="acceptin-button">На главную</a>
          <button onclick="window.print()" class="acceptin-button">Распечатать</button>
        </div>
      </div>
    </section>     
  </main>
@endsection
