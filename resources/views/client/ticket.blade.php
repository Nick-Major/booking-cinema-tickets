<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ИдёмВКино - Электронный билет</title>
  <link rel="stylesheet" href="{{ asset('css/client/normalize.css') }}">
  <link rel="stylesheet" href="{{ asset('css/client/styles.css') }}">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
</head>

<body>
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
  </header>
  
  <main>
    <section class="ticket">
      <header class="tichet__check">
        <h2 class="ticket__check-title">Электронный билет</h2>
      </header>
      
      <div class="ticket__info-wrapper">
        <p class="ticket__info">На фильм: <span class="ticket__details ticket__title">{{ $ticket->movieSession->movie->title }}</span></p>
        <p class="ticket__info">Места: <span class="ticket__details ticket__chairs">Ряд {{ $ticket->seat->row_number }}, Место {{ $ticket->seat->row_seat_number }}</span></p>
        <p class="ticket__info">В зале: <span class="ticket__details ticket__hall">{{ $ticket->movieSession->cinemaHall->hall_name }}</span></p>
        <p class="ticket__info">Начало сеанса: <span class="ticket__details ticket__start">{{ $ticket->movieSession->session_start->format('H:i') }}</span></p>

        <!-- QR-код с уникальным кодом бронирования -->
        <img class="ticket__info-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={{ urlencode($ticket->unique_code) }}">

        <p class="ticket__hint">Покажите QR-код нашему контроллеру для подтверждения бронирования.</p>
        <p class="ticket__hint">Приятного просмотра!</p>
        
        <div class="ticket__code">
          <p>Код бронирования: <strong>{{ $ticket->unique_code }}</strong></p>
        </div>
      </div>
    </section>     
  </main>
</body>
</html>
