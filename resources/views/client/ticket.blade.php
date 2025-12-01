@extends('layouts.base')

@section('title', 'Электронный билет')

@section('content')
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
  </header>
  
  <main>
    <section class="ticket">
      
      <header class="tichet__check">
        <h2 class="ticket__check-title">Электронный билет</h2>
      </header>
      
      <div class="ticket__info-wrapper">
        <div class="ticket__main-info">
          <p class="ticket__info">Код билета: <span class="ticket__details">{{ $ticket->unique_code }}</span></p>
          @if($ticket->booking)
            <p class="ticket__info">Код бронирования: <span class="ticket__details">{{ $ticket->booking->booking_code }}</span></p>
          @endif
          <p class="ticket__info">На фильм: <span class="ticket__details">{{ $ticket->movieSession->movie->title }}</span></p>
          <p class="ticket__info">Место: <span class="ticket__details">Ряд {{ $ticket->seat->row_number }}, Место {{ $ticket->seat->row_seat_number }}</span></p>
          <p class="ticket__info">Тип места: <span class="ticket__details">{{ $ticket->seat->seat_status === 'vip' ? 'VIP' : 'Обычное' }}</span></p>
          <p class="ticket__info">В зале: <span class="ticket__details">{{ $ticket->movieSession->cinemaHall->hall_name }}</span></p>
          <p class="ticket__info">Начало сеанса: <span class="ticket__details">{{ $ticket->movieSession->session_start->format('d.m.Y H:i') }}</span></p>
          <p class="ticket__info">Стоимость: <span class="ticket__details">{{ $ticket->final_price }} руб.</span></p>
        </div>

        <div class="ticket__qr-section">
          <img class="ticket__info-qr" src="{{ $ticket->getQrCodeBase64() }}" alt="QR код билета">
          <p class="ticket__hint">Покажите этот QR-код нашему контроллеру для подтверждения.</p>
        </div>

        @if($ticket->booking && $ticket->booking->tickets->count() > 1)
          <div class="ticket__booking-info">
            <p class="ticket__hint">
              <strong>Этот билет является частью бронирования</strong><br>
              Всего забронировано мест: {{ $ticket->booking->tickets->count() }}<br>
              Общая стоимость бронирования: {{ $ticket->booking->total_price }} руб.
            </p>
            <a href="{{ route('tickets.booking-confirmation', $ticket->booking->booking_code) }}" class="ticket__booking-link">
              Посмотреть все билеты в бронировании
            </a>
          </div>
        @endif

        <div class="ticket__actions">
          <a href="{{ route('home') }}" class="acceptin-button">На главную</a>
          <button onclick="window.print()" class="acceptin-button">Распечатать</button>
        </div>
      </div>
    </section>     
  </main>
@endsection
