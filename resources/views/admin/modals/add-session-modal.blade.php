<div class="popup" id="addSessionModal" style="display: none;">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Добавление сеанса
          <a class="popup__dismiss" href="#" data-dismiss="modal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="addSessionForm" method="POST">
          @csrf
          <input type="hidden" name="_token" value="{{ csrf_token() }}">

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
              Время начала
              <input class="conf-step__input" 
                    type="time" 
                    name="session_time" 
                    id="session_time" 
                    value="14:30"
                    required>
              <small>Формат: ЧЧ:ММ (например, 14:30)</small>
          </label>

          <!-- Подсказка о расписании -->
          <div class="conf-step__schedule-hint" id="scheduleHint" style="display: none;">
            <div class="conf-step__alert conf-step__alert--info">
              <strong>Расписание зала:</strong> 
              <span id="allowedTimeRange"></span>
            </div>
          </div>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Добавить сеанс
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    data-dismiss="modal">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
