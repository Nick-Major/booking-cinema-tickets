<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>ИдёмВКино</title>
  <link rel="stylesheet" href="{{ asset('css/admin/normalize.css') }}">
  <link rel="stylesheet" href="{{ asset('css/admin/styles.css') }}">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
</head>

<body>
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
    <span class="page-header__subtitle">Администраторррская</span>
  </header>
  
  <main class="conf-steps">
    @if(session('success'))
        <div class="conf-step__wrapper" style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; margin: 10px 0;">
            {{ session('success') }}
        </div>
    @endif

    @if(session('error'))  
        <div class="conf-step__wrapper" style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; margin: 10px 0;">
            {{ session('error') }}
        </div>
    @endif
    
    <!-- Управление залами -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Управление залами</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">Доступные залы:</p>
        <ul class="conf-step__list">
          @forelse($halls as $hall)
            <li>{{ $hall->hall_name }}
              <button class="conf-step__button conf-step__button-trash" 
                      onclick="deleteHall({{ $hall->id }})"></button>
            </li>
          @empty
            <li class="conf-step__empty">Нет созданных залов</li>
          @endforelse
        </ul>
        <button class="conf-step__button conf-step__button-accent" 
                onclick="openAddHallModal()">
          Создать зал
        </button>
      </div>
    </section>
    
    <!-- Конфигурация залов -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Конфигурация залов</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">Выберите зал для конфигурации:</p>
        <ul class="conf-step__selectors-box" id="hallSelector">
          @foreach($halls as $hall)
            <li>
              <input type="radio" class="conf-step__radio" name="chairs-hall" 
                     value="{{ $hall->id }}" {{ $loop->first ? 'checked' : '' }}
                     onchange="loadHallConfiguration({{ $hall->id }})">
              <span class="conf-step__selector">{{ $hall->hall_name }}</span>
            </li>
          @endforeach
        </ul>
        
        <div id="hallConfiguration">
          <!-- Динамически загружаемая конфигурация -->
          @if($halls->count() > 0)
            @include('admin.modals.hall-configuration', ['hall' => $halls->first()])
          @else
            <p class="conf-step__paragraph">Сначала создайте зал</p>
          @endif
        </div>                 
      </div>
    </section>
    
    <!-- Конфигурация цен -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Конфигурация цен</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">Выберите зал для конфигурации:</p>
        <ul class="conf-step__selectors-box">
          @foreach($halls as $hall)
            <li>
              <input type="radio" class="conf-step__radio" name="prices-hall" 
                     value="{{ $hall->id }}" {{ $loop->first ? 'checked' : '' }}
                     onchange="loadPriceConfiguration({{ $hall->id }})">
              <span class="conf-step__selector">{{ $hall->hall_name }}</span>
            </li>
          @endforeach
        </ul>
          
        <div id="priceConfiguration">
          <!-- Динамически загружаемая конфигурация цен -->
          @if($halls->count() > 0)
            @include('admin.modals.price-configuration', ['hall' => $halls->first()])
          @else
            <p class="conf-step__paragraph">Сначала создайте зал</p>
          @endif
        </div>
      </div>
    </section>
    
    <!-- Сетка сеансов -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Сетка сеансов</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">
          <button class="conf-step__button conf-step__button-accent" 
                  onclick="openAddMovieModal()">
            Добавить фильм
          </button>
          <button class="conf-step__button conf-step__button-accent" 
                 onclick="openAddSessionModal()">
            Добавить сеанс
          </button>
        </p>
        
        <div class="conf-step__movies" id="moviesList">
          @forelse($movies as $movie)
            <div class="conf-step__movie" data-movie-id="{{ $movie->id }}">
              @if($movie->movie_poster)
                <img class="conf-step__movie-poster" alt="{{ $movie->title }}" 
                     src="{{ asset('storage/' . $movie->movie_poster) }}">
              @else
                <img class="conf-step__movie-poster" alt="Постер отсутствует" 
                     src="{{ asset('images/admin/poster-placeholder.png') }}">
              @endif
              <h3 class="conf-step__movie-title">{{ $movie->title }}</h3>
              <p class="conf-step__movie-duration">{{ $movie->movie_duration }} минут</p>
            </div>
          @empty
            <div class="conf-step__empty-movies">Нет добавленных фильмов</div>
          @endforelse
        </div>
        
        <div class="conf-step__seances" id="sessionsTimeline">
          <!-- Динамически загружаемая сетка сеансов -->
          @include('admin.modals.sessions-timeline', ['sessions' => $sessions])
        </div>
        
        <fieldset class="conf-step__buttons text-center">
          <button class="conf-step__button conf-step__button-regular" onclick="resetSessions()">Отмена</button>
          <button class="conf-step__button conf-step__button-accent" onclick="saveSessions()">Сохранить</button>
        </fieldset>  
      </div>
    </section>
    
    <!-- Открыть продажи -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Открыть продажи</h2>
      </header>
      <div class="conf-step__wrapper text-center">
        <p class="conf-step__paragraph">Всё готово, теперь можно:</p>
        <button class="conf-step__button conf-step__button-accent" 
                onclick="toggleSales()" id="salesButton">
          @if($halls->where('is_active', true)->count() > 0)
            Приостановить продажу билетов
          @else
            Открыть продажу билетов
          @endif
        </button>
      </div>
    </section>    
  </main>

  <!-- Модальные окна -->
  @include('admin.modals.add-hall-modal')
  @include('admin.modals.add-movie-modal')
  @include('admin.modals.add-session-modal')
  
  <!-- Выход -->
  <form action="{{ route('logout') }}" method="POST" style="text-align: center; margin-top: 20px;">
    @csrf
    <button type="submit" class="conf-step__button conf-step__button-regular">Выйти</button>
  </form>

  <script type="module" src="{{ asset('js/admin/main.js') }}"></script>
</body>
</html>