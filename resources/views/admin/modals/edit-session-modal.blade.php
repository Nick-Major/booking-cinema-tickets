<div class="popup" id="editSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование сеанса
          <a class="popup__dismiss" href="#" data-close-modal="editSessionModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="editSessionForm" method="POST" action="">
          @csrf
          @method('PUT')
          <input type="hidden" name="session_id" id="edit_session_id">

          <label class="conf-step__label conf-step__label-fullsize" for="edit_movie_id">
            Фильм
            <select class="conf-step__input" name="movie_id" id="edit_movie_id" required>
              <option value="">Выберите фильм</option>
              @foreach($movies as $movie)
                @if($movie)
                <option value="{{ $movie->id }}">{{ $movie->title }}</option>
                @endif
              @endforeach
            </select>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_cinema_hall_id">
            Зал
            <select class="conf-step__input" name="cinema_hall_id" id="edit_cinema_hall_id" required>
              <option value="">Выберите зал</option>
              @foreach($halls as $hall)
                <option value="{{ $hall->id }}">{{ $hall->hall_name }}</option>
              @endforeach
            </select>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="edit_session_date">
              Дата
              <input class="conf-step__input" type="date" name="session_date" id="edit_session_date" required>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="edit_session_time">
              Время начала
              <input class="conf-step__input" 
                    type="time" 
                    name="session_time" 
                    id="edit_session_time" 
                    required>
              <small>Формат: ЧЧ:ММ (например, 14:30)</small>
          </label>

          <!-- Подсказка о расписании -->
          <div class="conf-step__schedule-hint" id="edit_scheduleHint" style="display: none;">
            <div class="conf-step__alert conf-step__alert--info">
              <strong>Расписание зала:</strong> 
              <span id="edit_allowedTimeRange"></span>
            </div>
          </div>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Сохранить изменения
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    data-close-modal="editSessionModal">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
