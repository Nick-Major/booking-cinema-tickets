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
    
    <!-- Управление залами -->
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
    
    <!-- Сетка сеансов - УПРОЩЕННАЯ ВЕРСИЯ -->
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
              @if($movie)
              <div class="conf-step__movie @if(!$movie->is_active) conf-step__movie-inactive @endif" 
                  data-movie-id="{{ $movie->id }}" 
                  data-movie-duration="{{ $movie->movie_duration }}" 
                  style="position: relative;">
                  @if($movie->movie_poster)
                      <img class="conf-step__movie-poster" alt="{{ $movie->title }}"
                          src="{{ Storage::url($movie->movie_poster) }}">
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
              @endif
          @empty
              <div class="conf-step__empty-movies">Нет добавленных фильмов</div>
          @endforelse
        </div>
        
        <!-- УПРОЩЕННАЯ СЕКЦИЯ ТАЙМЛАЙНА -->
        <div class="conf-step__seances-timeline-wrapper">
            <!-- Навигация по датам -->
            <div class="conf-step__timeline-nav">
                <button class="conf-step__button conf-step__button-regular" 
                        onclick="changeTimelineDate('{{ $prevDate }}')"
                        style="width: 100px;">
                    ← Назад
                </button>
                
                <input type="date" 
                      value="{{ $currentDate }}" 
                      onchange="changeTimelineDate(this.value)"
                      class="conf-step__input"
                      style="width: 150px;">
                
                <button class="conf-step__button conf-step__button-regular"
                        onclick="changeTimelineDate('{{ $nextDate }}')"
                        style="width: 100px;">
                    Вперед →
                </button>
            </div>

            <!-- Простой список залов с кнопками расписания -->
            <div class="conf-step__timeline-vertical">
                @foreach($halls as $hall)
                    @php
                        $schedule = $hallSchedules[$hall->id] ?? null;
                        $hallSessions = $sessions[$hall->id] ?? collect();
                    @endphp

                    <div class="conf-step__timeline-hall" data-hall-id="{{ $hall->id }}">
                        <div class="conf-step__hall-header">
                            <div class="conf-step__hall-title-section">
                                <h3 class="conf-step__seances-title">{{ $hall->hall_name }}</h3>

                                @if($schedule)
                                    <!-- Кнопки управления расписанием - ПРАВЫЙ ВЕРХНИЙ УГОЛ -->
                                    <div class="conf-step__schedule-controls">
                                        <button class="conf-step__button conf-step__button-small conf-step__button-regular"
                                                onclick="openEditScheduleModal({{ $schedule->id }})"
                                                title="Редактировать расписание">
                                        </button>
                                        <button class="conf-step__button conf-step__button-small conf-step__button-trash"
                                                onclick="openDeleteScheduleModal({{ $schedule->id }}, {{ $hall->id }}, '{{ $hall->hall_name }}', '{{ $currentDate }}')"
                                                title="Удалить расписание">
                                        </button>
                                    </div>
                                @endif

                            </div>

                            @if(!$schedule)
                                <button class="conf-step__button conf-step__button-schedule"
                                        onclick="openCreateScheduleModal({{ $hall->id }}, '{{ $selectedDate->format('Y-m-d') }}', '{{ $hall->hall_name }}')">
                                    Создать расписание
                                </button>
                            @endif
                        </div>

                        @if($schedule)
                            <!-- Блок когда расписание создано -->
                            <div class="conf-step__schedule-created">
                                <div class="conf-step__schedule-info">
                                    <span class="schedule-label">Расписание:</span>
                                    <span class="schedule-time">{{ $schedule->start_time }} - {{ $schedule->end_time }}</span>
                                    @if($schedule->overnight)
                                        <span class="schedule-overnight">(ночной режим)</span>
                                    @endif
                                </div>

                                <!-- Таймлайн с сеансами -->
                                <div class="conf-step__timeline-scroll-container">
                                    <div class="conf-step__timeline-content">
                                        @include('admin.components.dynamic-timeline', [
                                            'hallSessions' => $hallSessions,
                                            'selectedDate' => $selectedDate,
                                            'hall' => $hall
                                        ])
                                    </div>
                                </div>
                            </div>
                        @else
                            <!-- Блок когда расписание не создано -->
                            <div class="conf-step__no-schedule">
                                <p>Расписание еще не создано</p>
                            </div>
                        @endif
                    </div>
                @endforeach
            </div>
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
  @include('admin.modals.edit-movie-modal')
  @include('admin.modals.edit-session-modal')
  @include('admin.modals.reset-hall-configuration-modal')
  @include('admin.modals.hall-schedule-modal')
  @include('admin.modals.edit-schedule-modal')
  @include('admin.modals.delete-schedule-modal')
  
  <!-- Выход -->
  <form action="{{ route('logout') }}" method="POST" style="text-align: center; margin-top: 20px;">
    @csrf
    <button type="submit" class="conf-step__button conf-step__button-regular">Выйти</button>
  </form>

  <script type="module" src="{{ asset('js/views/admin/dashboard.bundle.js') }}"></script>
</body>
</html>
@endsection

