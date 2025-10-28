<div class="popup" id="addMovieModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Добавление фильма
          <a class="popup__dismiss" href="#" onclick="closeAddMovieModal()">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form action="{{ route('movies.store') }}" method="POST" enctype="multipart/form-data">
          @csrf
          <label class="conf-step__label conf-step__label-fullsize" for="title">
            Название фильма
            <input class="conf-step__input" type="text" name="title" required>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_description">
            Описание фильма
            <textarea class="conf-step__input" name="movie_description"></textarea>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_poster">
            Постер фильма
            <input class="conf-step__input" type="file" name="movie_poster" accept="image/*">
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_duration">
            Длительность (минуты)
            <input class="conf-step__input" type="number" name="movie_duration" min="1" required>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="country">
            Страна
            <input class="conf-step__input" type="text" name="country">
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Добавить фильм
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeAddMovieModal()">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>