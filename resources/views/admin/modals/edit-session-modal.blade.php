<div class="popup" id="editSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование сеанса
          <a class="popup__dismiss" href="#" onclick="closeEditSessionModal(event)">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="editSessionForm" method="POST">
          @csrf
          @method('PUT')
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_movie_id">
            Фильм
            <select class="conf-step__input" name="movie_id" id="edit_movie_id" required>
              <option value="">Выберите фильм</option>
              @foreach($movies as $movie)
                <option value="{{ $movie->id }}">{{ $movie->title }} ({{ $movie->movie_duration }} мин)</option>
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
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_session_start">
            Время начала
            <input class="conf-step__input" type="datetime-local" name="session_start" id="edit_session_start" required>
          </label>
          
          <label class="conf-step__label">
            <input type="checkbox" name="is_actual" id="edit_is_actual" value="1">
            Активный сеанс
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Сохранить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeEditSessionModal(event)">
              Отменить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    id="edit_delete_button" 
                    style="background-color: #ff4444; color: white;">
              Удалить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
