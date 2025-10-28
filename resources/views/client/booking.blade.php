<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ИдёмВКино - Бронирование</title>
  <link rel="stylesheet" href="{{ asset('css/client/normalize.css') }}">
  <link rel="stylesheet" href="{{ asset('css/client/styles.css') }}">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
</head>

<body>
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
          <div class="buying-scheme__hall">
            <div class="buying-scheme__hall-wrapper">
              <!-- Схема зала -->
              @foreach($seatsByRow as $rowNumber => $seats)
              <div class="buying-scheme__row">
                @foreach($seats as $seat)
                <span class="buying-scheme__chair 
                            buying-scheme__chair_{{ $seat->seat_status === 'vip' ? 'vip' : 'standart' }}
                            {{ in_array($seat->id, $occupiedSeats) ? 'buying-scheme__chair_taken' : '' }}"
                      data-seat-id="{{ $seat->id }}"
                      data-row="{{ $seat->row_number }}"
                      data-seat="{{ $seat->row_seat_number }}"
                      data-price="{{ $seat->seat_status === 'vip' ? $session->cinemaHall->vip_price : $session->cinemaHall->regular_price }}"
                      onclick="selectSeat(this)">
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
        
        <form id="bookingForm" action="{{ route('tickets.book') }}" method="POST">
          @csrf
          <input type="hidden" name="movie_session_id" value="{{ $session->id }}">
          <input type="hidden" name="seat_id" id="selectedSeatId">
          
          <div class="buying-scheme__selected">
            <p>Выбрано мест: <span id="selectedCount">0</span></p>
            <p>Общая стоимость: <span id="totalPrice">0</span> руб</p>
            <button type="submit" class="acceptin-button" id="bookButton" disabled>Забронировать</button>
          </div>
        </form>
      </div>
    </section>
  </main>

  <script>
    let selectedSeats = [];
    
    function selectSeat(element) {
      const seatId = element.dataset.seatId;
      const row = element.dataset.row;
      const seat = element.dataset.seat;
      const price = parseFloat(element.dataset.price);
      
      if (element.classList.contains('buying-scheme__chair_taken')) {
        return; // Нельзя выбрать занятое место
      }
      
      if (element.classList.contains('buying-scheme__chair_selected')) {
        // Отмена выбора
        element.classList.remove('buying-scheme__chair_selected');
        selectedSeats = selectedSeats.filter(s => s.id !== seatId);
      } else {
        // Выбор места (пока только одно место за раз)
        if (selectedSeats.length >= 1) {
          alert('Можно выбрать только одно место за раз');
          return;
        }
        element.classList.add('buying-scheme__chair_selected');
        selectedSeats.push({ id: seatId, row, seat, price });
      }
      
      updateSelectionSummary();
    }
    
    function updateSelectionSummary() {
      const selectedCount = document.getElementById('selectedCount');
      const totalPrice = document.getElementById('totalPrice');
      const bookButton = document.getElementById('bookButton');
      const seatIdInput = document.getElementById('selectedSeatId');
      
      selectedCount.textContent = selectedSeats.length;
      totalPrice.textContent = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
      
      if (selectedSeats.length > 0) {
        bookButton.disabled = false;
        seatIdInput.value = selectedSeats[0].id;
      } else {
        bookButton.disabled = true;
        seatIdInput.value = '';
      }
    }
  </script>
</body>
</html>
