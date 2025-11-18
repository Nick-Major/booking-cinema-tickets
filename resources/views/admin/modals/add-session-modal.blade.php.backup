<div class="popup" id="addSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Добавление сеанса
          <a class="popup__dismiss" href="#" onclick="closeAllModals(event)">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="addSessionForm" method="POST" action="{{ route('sessions.store') }}">
          @csrf
          <input type="hidden" name="_token" value="{{ csrf_token() }}">
    
          <!-- Временно добавим вывод для отладки -->
          <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px;">
              <strong>Debug Info:</strong><br>
              Halls count: {{ $halls->count() }}<br>
              Movies count: {{ $movies->count() }}
          </div>

          <label class="conf-step__label conf-step__label-fullsize" for="movie_id">
            Фильм
            <select class="conf-step__input" name="movie_id" id="movie_id" required>
              <option value="">Выберите фильм</option>
              @foreach($movies as $movie)
                @if($movie)
                <option value="{{ $movie->id }}">{{ $movie->title }}</option>
                @endif
              @endforeach
            </select>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="cinema_hall_id">
            Зал
            <select class="conf-step__input" name="cinema_hall_id" id="cinema_hall_id" required>
              <option value="">Выберите зал</option>
              @foreach($halls as $hall)
                <option value="{{ $hall->id }}">{{ $hall->hall_name }}</option>
              @endforeach
            </select>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="session_date">
              Дата
              <input class="conf-step__input" type="date" name="session_date" id="session_date" 
                     value="{{ date('Y-m-d') }}" required>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="session_time">
              Время (ЧЧ:ММ)
              <input class="conf-step__input" type="text" name="session_time" id="session_time" 
                    placeholder="14:30" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" required>
              <small>Формат: ЧЧ:ММ (например, 14:30)</small>
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Добавить сеанс
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeAllModals(event)">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
