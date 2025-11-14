@extends('layouts.base')

@section('title', 'ИдёмВКино - Админка')

@section('content')
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>ИдёмВКино</title>
</head>

<body>
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
    <span class="page-header__subtitle">Администраторррская</span>
  </header>
  
  <main class="conf-steps">
    <!-- Уведомления -->
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
    
    <!-- Управление залами - обновленная секция -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Управление залами</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">Доступные залы:</p>
        <ul class="conf-step__list">
          @forelse($halls as $hall)
            <li data-hall-id="{{ $hall->id }}">
              {{ $hall->hall_name }}
              <button class="conf-step__button conf-step__button-trash" 
                      data-delete-hall="{{ $hall->id }}"
                      data-hall-name="{{ $hall->hall_name }}"></button>
            </li>
          @empty
            <li class="conf-step__empty">Нет созданных залов</li>
          @endforelse
        </ul>
        <button class="conf-step__button conf-step__button-accent" 
                data-open-modal="addHallModal">
          Создать зал
        </button>
      </div>
    </section>
    
    <!-- Конфигурация залов -->
    @if($halls->count() > 0)
    <section class="conf-step" id="hallConfigurationSection">
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
          @include('admin.components.hall-configuration', ['hall' => $halls->first()])
        </div>                 
      </div>
    </section>
    @endif
    
    <!-- Конфигурация цен -->
    @if($halls->count() > 0)
    <section class="conf-step" id="priceConfigurationSection">
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
          @include('admin.components.price-configuration', ['hall' => $halls->first()])
        </div>
      </div>
    </section>
    @endif
    
    <!-- Сетка сеансов -->
    @if($halls->count() > 0)
    <section class="conf-step" id="sessionsSection">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Сетка сеансов</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">
          <button class="conf-step__button conf-step__button-accent" 
                  data-open-modal="addMovieModal">
            Добавить фильм
          </button>
          <button class="conf-step__button conf-step__button-accent" 
                  data-open-modal="addSessionModal">
            Добавить сеанс
          </button>
        </p>
        
        <div class="conf-step__filter">
          <label class="conf-step__label">
            <input type="checkbox" id="showInactiveMovies" checked onchange="toggleInactiveMovies(this.checked)">
            Показывать неактивные фильмы
          </label>
        </div>
        
        <div class="conf-step__movies" id="moviesList">
          @forelse($movies as $movie)
              <div class="conf-step__movie @if(!$movie->is_active) conf-step__movie-inactive @endif" 
                  data-movie-id="{{ $movie->id }}" 
                  data-movie-duration="{{ $movie->movie_duration }}" 
                  style="position: relative;">
                  @if($movie->movie_poster)
                      <img class="conf-step__movie-poster" alt="{{ $movie->title }}"
                          src="{{ asset('storage/' . $movie->movie_poster) }}">
                  @else
                      <img class="conf-step__movie-poster" alt="Постер отсутствует"
                          src="{{ asset('images/admin/poster-placeholder.png') }}">
                  @endif
                  <h3 class="conf-step__movie-title">{{ $movie->title }}</h3>
                  <p class="conf-step__movie-duration">{{ $movie->movie_duration }} минут</p>

                  <!-- ИНДИКАТОР АКТИВНОСТИ -->
                  @if(!$movie->is_active)
                    <div class="conf-step__movie-status">Неактивен</div>
                  @endif

                  <!-- Кнопки управления фильмом -->
                  <div class="conf-step__movie-controls">
                      <button class="conf-step__button conf-step__button-small conf-step__button-regular"
                              onclick="openEditMovieModal({{ $movie->id }})"
                              title="Редактировать фильм">
                      </button>
                      <button class="conf-step__button conf-step__button-small conf-step__button-trash"
                              data-delete-movie="{{ $movie->id }}"
                              data-movie-name="{{ $movie->title }}"
                              title="Удалить фильм"></button>
                  </div>
              </div>
          @empty
              <div class="conf-step__empty-movies">Нет добавленных фильмов</div>
          @endforelse
        </div>
        
        <div class="conf-step__seances" id="sessionsTimeline">
          @include('admin.components.sessions-timeline', ['sessions' => $sessions])
        </div>
        
        <fieldset class="conf-step__buttons text-center">
          <button class="conf-step__button conf-step__button-regular" onclick="resetSessions()">Отмена</button>
          <button class="conf-step__button conf-step__button-accent" onclick="updateSession()">Сохранить</button>
        </fieldset>  
      </div>
    </section>
    @endif
    
    <!-- Управление продажами по залам -->
    @if($halls->count() > 0)
    <section class="conf-step" id="salesManagementSection">
        <header class="conf-step__header conf-step__header_opened">
            <h2 class="conf-step__title">Управление продажами</h2>
        </header>
        <div class="conf-step__wrapper">
            <p class="conf-step__paragraph">Статус продаж по залам:</p>
            <ul class="conf-step__sales-list">
                @foreach($halls as $hall)
                <li>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="hall-name">{{ $hall->hall_name }}</span>
                        <span class="sales-status {{ $hall->is_active ? 'active' : 'inactive' }}">
                            {{ $hall->is_active ? 'Продажи открыты' : 'Продажи приостановлены' }}
                        </span>
                    </div>
                    <button class="conf-step__button conf-step__button-small {{ $hall->is_active ? 'conf-step__button-warning' : 'conf-step__button-accent' }}"
                            data-toggle-sales="{{ $hall->id }}"
                            data-is-active="{{ $hall->is_active }}">
                        {{ $hall->is_active ? 'Приостановить продажи' : 'Открыть продажи' }}
                    </button>
                </li>
                @endforeach
            </ul>
        </div>
    </section>
    @endif
  </main>

  <!-- Модальные окна -->
  @include('admin.modals.add-hall-modal')
  @include('admin.modals.add-movie-modal')
  @include('admin.modals.add-session-modal')
  @include('admin.modals.delete-hall-modal')
  @include('admin.modals.delete-movie-modal')
  @include('admin.modals.delete-session-modal')
  @include('admin.modals.edit-session-modal')
  @include('admin.modals.reset-hall-configuration-modal')
  @include('admin.modals.edit-movie-modal')
  
  <!-- Выход -->
  <form action="{{ route('logout') }}" method="POST" style="text-align: center; margin-top: 20px;">
    @csrf
    <button type="submit" class="conf-step__button conf-step__button-regular">Выйти</button>
  </form>

  <script type="module" src="{{ asset('js/views/admin/dashboard.bundle.js') }}"></script>

  <!-- ВРЕМЕННЫЙ ТЕСТ ДЛЯ ДИАГНОСТИКИ -->
  <script>
  function testSessionCreation() {
      console.log('=== ТЕСТ НАЧАТ ===');
      
      const formData = new FormData();
      formData.append('movie_id', '1');
      formData.append('cinema_hall_id', '1');
      formData.append('session_date', '2025-11-15');
      formData.append('session_time', '14:30');
      formData.append('_token', document.querySelector('meta[name="csrf-token"]').getAttribute('content'));
      
      fetch('/admin/sessions', {
          method: 'POST',
          body: formData,
          headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json'
          }
      })
      .then(response => {
          console.log('Статус ответа:', response.status);
          console.log('URL запроса:', response.url);
          return response.json();
      })
      .then(data => {
          console.log('Данные ответа:', data);
      })
      .catch(error => {
          console.error('Ошибка:', error);
      });
  }
  </script>

  <button onclick="testSessionCreation()" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px;">
      ТЕСТ: Создать сеанс
  </button>
</body>
</html>
@endsection
