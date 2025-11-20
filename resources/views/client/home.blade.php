@extends('layouts.base')

@section('title', 'Главная страница')

@section('content')
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
    
    <!-- Кнопка входа для администратора -->
    <a href="{{ route('login') }}" class="admin-login-btn">
      Вход для администратора
    </a>
  </header>
  
  <nav class="page-nav">
    @foreach($dates as $date)
      <a class="page-nav__day 
                {{ $date['isToday'] ? 'page-nav__day_today' : '' }} 
                {{ $date['isSelected'] ? 'page-nav__day_chosen' : '' }}
                {{ $date['isWeekend'] ? 'page-nav__day_weekend' : '' }}"
        href="{{ route('home', ['date' => $date['date']]) }}">
        
        @if($date['isToday'])
          <!-- Для сегодняшнего дня показываем только "Сегодня" -->
          <span class="page-nav__day-week">Сегодня</span>
        @else
          <!-- Для остальных дней показываем день недели и число -->
          <span class="page-nav__day-week">{{ $date['dayOfWeek'] }}</span>
          <span class="page-nav__day-number">{{ $date['dayNumber'] }}</span>
        @endif
      </a>
    @endforeach
    <a class="page-nav__day page-nav__day_next" href="{{ route('home', ['date' => $currentDate->copy()->addDays(7)->format('Y-m-d')]) }}"></a>
  </nav>
  
  <main>
    @if($movies->count() > 0)
      @foreach($movies as $movie)
        <section class="movie">
          <div class="movie__info">
            <div class="movie__poster">
              @if($movie->movie_poster)
                <img class="movie__poster-image" alt="{{ $movie->title }} постер" src="{{ Storage::url($movie->movie_poster) }}">
              @else
                <img class="movie__poster-image" alt="Постер отсутствует" src="{{ asset('images/client/poster-placeholder.png') }}">
              @endif
            </div>
            <div class="movie__description">
              <h2 class="movie__title">{{ $movie->title }}</h2>
              <p class="movie__synopsis">{{ $movie->movie_description ?: 'Описание отсутствует' }}</p>
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
            
            @if($hall && $hall->is_active)
              <div class="movie-seances__hall">
                <h3 class="movie-seances__hall-title">{{ $hall->hall_name }}</h3>
                <ul class="movie-seances__list">
                  @foreach($sessions as $session)
                    @if($session->isAvailable())
                      <li class="movie-seances__time-block">
                        <a class="movie-seances__time" href="{{ route('sessions.booking', $session) }}">
                          {{ $session->session_start->format('H:i') }}
                        </a>
                      </li>
                    @endif
                  @endforeach
                </ul>
              </div>
            @endif
          @endforeach
        </section>
      @endforeach
    @else
      <section class="movie">
        <div class="movie__info">
          <div class="movie__description" style="text-align: center; width: 100%;">
            <h2 class="movie__title">На {{ $currentDate->translatedFormat('j F') }} сеансов нет</h2>
            <p class="movie__synopsis">Выберите другую дату или проверьте позже</p>
          </div>
        </div>
      </section>
    @endif
  </main>
@endsection
