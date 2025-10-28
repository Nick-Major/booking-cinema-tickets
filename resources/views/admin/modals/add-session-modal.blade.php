<div class="popup" id="addSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Добавление сеанса
          <a class="popup__dismiss" href="#" onclick="closeAddSessionModal()">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="sessionForm">
          @csrf
          <label class="conf-step__label conf-step__label-fullsize" for="movie_id">
            Фильм
            <select class="conf-step__input" name="movie_id" required>
              <option value="">Выберите фильм</option>
              @foreach($movies as $movie)
                <option value="{{ $movie->id }}">{{ $movie->title }}</option>
              @endforeach
            </select>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="cinema_hall_id">
            Зал
            <select class="conf-step__input" name="cinema_hall_id" required>
              <option value="">Выберите зал</option>
              @foreach($halls as $hall)
                <option value="{{ $hall->id }}">{{ $hall->hall_name }}</option>
              @endforeach
            </select>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="session_start">
            Время начала
            <input class="conf-step__input" type="datetime-local" name="session_start" required>
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="button" class="conf-step__button conf-step__button-accent" 
                    onclick="saveSession()">
              Добавить сеанс
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeAddSessionModal()">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
