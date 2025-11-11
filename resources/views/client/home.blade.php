<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ИдёмВКино</title>
  <link rel="stylesheet" href="{{ asset('css/common/normalize.css') }}">
  <link rel="stylesheet" href="{{ asset('css/client/styles.css') }}">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
</head>

<body>
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
  </header>
  
  <nav class="page-nav">
    <!-- Навигация по дням будет добавлена позже -->
    <div style="text-align: center; padding: 20px;">
      <a href="{{ route('login') }}" style="color: #fff; text-decoration: none; background: #4481c3; padding: 10px 20px; border-radius: 4px;">
        Вход для администратора
      </a>
    </div>
  </nav>
  
  <main>
    @if($movies->count() > 0)
      @foreach($movies as $movie)
        <section class="movie">
          <div class="movie__info">
            <div class="movie__poster">
              @if($movie->movie_poster)
                <img class="movie__poster-image" alt="{{ $movie->title }} постер" src="{{ asset('storage/' . $movie->movie_poster) }}">
              @else
                <img class="movie__poster-image" alt="Постер отсутствует" src="{{ asset('images/placeholder-poster.jpg') }}">
              @endif
            </div>
            <div class="movie__description">
              <h2 class="movie__title">{{ $movie->title }}</h2>
              <p class="movie__synopsis">{{ $movie->movie_description }}</p>
              <p class="movie__data">
                <span class="movie__data-duration">{{ $movie->movie_duration }} минут</span>
                @if($movie->country)
                  <span class="movie__data-origin">{{ $movie->country }}</span>
                @endif
              </p>
            </div>
          </div>  
          
          <!-- Группируем сеансы по залам -->
          @php
            $sessionsByHall = $movie->movieSessions->groupBy('cinema_hall_id');
          @endphp
          
          @foreach($sessionsByHall as $hallId => $sessions)
            @php
              $hall = $sessions->first()->cinemaHall;
            @endphp
            <div class="movie-seances__hall">
              <h3 class="movie-seances__hall-title">{{ $hall->hall_name }}</h3>
              <ul class="movie-seances__list">
                @foreach($sessions as $session)
                  <li class="movie-seances__time-block">
                    <a class="movie-seances__time" href="{{ route('sessions.booking', $session) }}">
                      {{ $session->session_start->format('H:i') }}
                    </a>
                  </li>
                @endforeach
              </ul>
            </div>
          @endforeach
        </section>
      @endforeach
    @else
      <section class="movie">
        <div class="movie__info">
          <div class="movie__description" style="text-align: center; width: 100%;">
            <h2 class="movie__title">Фильмов пока нет</h2>
            <p class="movie__synopsis">Администратор может добавить фильмы и сеансы в панели управления</p>
          </div>
        </div>
      </section>
    @endif
  </main>
</body>
</html>
