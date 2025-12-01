@extends('layouts.base')

@section('title', 'Бронирование билетов')

@section('content')
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
  </header>
  
  <main>
    <section class="buying">
      <div class="buying__info">
        <div class="buying__info-description">
          <h2 class="buying__info-title">{{ $session->movie->title }}</h2>
          <p class="buying__info-start">Начало сеанса: {{ $session->session_start->format('H:i') }}</p>
          <p class="buying__info-hall">{{ $session->cinemaHall->hall_name }}</p>
        </div>
      </div>
      
      <div class="buying-scheme">
        <div class="buying-scheme__wrapper">
          <div class="buying-scheme__screen">ЭКРАН</div>
          
          <div class="buying-scheme__hall">
            <div class="buying-scheme__hall-wrapper">
              @foreach($seatsByRow as $rowNumber => $seats)
              <div class="buying-scheme__row">
                @foreach($seats as $seat)
                  @php
                    $isOccupied = in_array($seat->id, $occupiedSeats);
                    $seatClass = 'buying-scheme__chair';
                    
                    if ($seat->seat_status === 'vip') {
                        $seatClass .= ' buying-scheme__chair_vip';
                    } elseif ($seat->seat_status === 'blocked') {
                        $seatClass .= ' buying-scheme__chair_disabled';
                    } else {
                        $seatClass .= ' buying-scheme__chair_standart';
                    }
                    
                    if ($isOccupied) {
                        $seatClass .= ' buying-scheme__chair_taken';
                    }
                    
                    $price = $seat->seat_status === 'vip' 
                        ? $session->cinemaHall->vip_price 
                        : $session->cinemaHall->regular_price;
                  @endphp
                  
                  <span class="{{ $seatClass }}"
                        data-seat-id="{{ $seat->id }}"
                        data-row="{{ $seat->row_number }}"
                        data-seat="{{ $seat->row_seat_number }}"
                        data-price="{{ $price }}"
                        title="Ряд {{ $seat->row_number }}, Место {{ $seat->row_seat_number }} ({{ $seat->seat_status === 'vip' ? 'VIP' : 'Обычное' }}) - {{ $price }} руб."
                        @if(!$isOccupied && $seat->seat_status !== 'blocked')
                          style="cursor: pointer;"
                        @endif>
                  </span>
                @endforeach
              </div>
              @endforeach
            </div>
          </div>
          
          <div class="buying-scheme__legend">
            <div class="col">
              <p class="buying-scheme__legend-price"><span class="buying-scheme__chair buying-scheme__chair_standart"></span> Свободно (<span class="buying-scheme__legend-value">{{ $session->cinemaHall->regular_price }}</span> руб)</p>
              <p class="buying-scheme__legend-price"><span class="buying-scheme__chair buying-scheme__chair_vip"></span> Свободно VIP (<span class="buying-scheme__legend-value">{{ $session->cinemaHall->vip_price }}</span> руб)</p>
            </div>
            <div class="col">
              <p class="buying-scheme__legend-price"><span class="buying-scheme__chair buying-scheme__chair_taken"></span> Занято</p>
              <p class="buying-scheme__legend-price"><span class="buying-scheme__chair buying-scheme__chair_selected"></span> Выбрано</p>
            </div>
          </div>
        </div>
        
        <form id="bookingForm" action="{{ route('tickets.book') }}" method="POST" class="booking-form">
          @csrf
          <input type="hidden" name="movie_session_id" value="{{ $session->id }}">
          <input type="hidden" id="seatIdsInput" name="seat_ids" value="[]">
          
          @if(auth()->check())
            <input type="hidden" name="user_id" value="{{ auth()->id() }}">
          @else
            <div class="guest-info" id="guestInfo">
              <div class="guest-fields">
                <h3 class="guest-fields__title">Информация для связи</h3>
                <p class="guest-fields__hint">Укажите данные для получения подтверждения (необязательно)</p>
                
                <div class="guest-fields__group">
                  <label for="guest_name" class="guest-fields__label">Ваше имя:</label>
                  <input type="text" id="guest_name" name="guest_name" 
                         placeholder="Иван Иванов" class="guest-fields__input">
                </div>
                
                <div class="guest-fields__group">
                  <label for="guest_email" class="guest-fields__label">Email:</label>
                  <input type="email" id="guest_email" name="guest_email" 
                         placeholder="example@mail.com" class="guest-fields__input">
                </div>
                
                <div class="guest-fields__group">
                  <label for="guest_phone" class="guest-fields__label">Телефон:</label>
                  <input type="tel" id="guest_phone" name="guest_phone" 
                         placeholder="+7 (XXX) XXX-XX-XX" class="guest-fields__input">
                </div>
              </div>
            </div>
          @endif
          
          <div class="buying-scheme__selected">
            <div class="selected-summary">
                <p>Выбрано мест: <span id="selectedCount">0</span></p>
                <p>Общая стоимость: <span id="totalPrice">0</span> руб</p>
            </div>
            <button type="submit" class="acceptin-button" id="bookButton" disabled>
                Забронировать
            </button>
          </div>
        </form>
      </div>
    </section>
  </main>

  @push('scripts')
    <script src="{{ asset('js/client/booking.bundle.js') }}"></script>
  @endpush
@endsection
