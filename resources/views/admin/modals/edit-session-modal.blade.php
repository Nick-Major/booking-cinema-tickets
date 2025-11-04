<div class="popup" id="editSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование сеанса
          <a class="popup__dismiss" href="#" onclick="closeEditSessionModal()">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form action="{{ route('sessions.update', $movieSession) }}" method="POST">
          @csrf
          @method('PUT')
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_id">
            Фильм
            <select class="conf-step__input" name="movie_id" required>
              <option value="">Выберите фильм</option>
              @foreach($movies as $movie)
                <option value="{{ $movie->id }}" {{ $movieSession->movie_id == $movie->id ? 'selected' : '' }}>
                  {{ $movie->title }} ({{ $movie->movie_duration }} мин)
                </option>
              @endforeach
            </select>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="cinema_hall_id">
            Зал
            <select class="conf-step__input" name="cinema_hall_id" required>
              <option value="">Выберите зал</option>
              @foreach($halls as $hall)
                <option value="{{ $hall->id }}" {{ $movieSession->cinema_hall_id == $hall->id ? 'selected' : '' }}>
                  {{ $hall->hall_name }}
                </option>
              @endforeach
            </select>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="session_start">
            Время начала
            <input class="conf-step__input" type="datetime-local" name="session_start" 
                   value="{{ $movieSession->session_start->format('Y-m-d\TH:i') }}" required>
          </label>
          
          <label class="conf-step__label">
            <input type="checkbox" name="is_actual" value="1" {{ $movieSession->is_actual ? 'checked' : '' }}>
            Активный сеанс
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Сохранить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeEditSessionModal()">
              Отменить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="deleteSession({{ $movieSession->id }})" 
                    style="background-color: #ff4444; color: white;">
              Удалить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
