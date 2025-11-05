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
          <div class="popup__container" style="display: flex; gap: 20px;">
            <div class="popup__poster" style="flex: 0 0 200px;">
              <!-- Контейнер для превью постера -->
              <div id="posterPreview" style="width: 200px; height: 300px; border: 2px dashed #63536C; display: flex; align-items: center; justify-content: center; background: #f5f5f5; margin-bottom: 10px;">
                <span style="color: #63536C;">Постер</span>
              </div>
              <!-- Поле загрузки постера -->
              <label class="conf-step__label conf-step__label-fullsize" for="movie_poster">
                <input class="conf-step__input" type="file" name="movie_poster" accept="image/*" 
                       onchange="previewMoviePoster(this)" style="width: 100%;">
              </label>
            </div>
            
            <div class="popup__form" style="flex: 1;">
              <label class="conf-step__label conf-step__label-fullsize" for="title">
                Название фильма
                <input class="conf-step__input" type="text" name="title" 
                       data-validation="required|max:255"
                       placeholder="Например, «Гражданин Кейн»" required>
              </label>

              <label class="conf-step__label conf-step__label-fullsize" for="movie_duration">
                Продолжительность фильма (мин.)
                <input class="conf-step__input" type="number" name="movie_duration"
                       data-validation="required|integer|min:1|max:480"
                       placeholder="90" required>
              </label>

              <label class="conf-step__label conf-step__label-fullsize" for="movie_description">
                Описание фильма
                <textarea class="conf-step__input" name="movie_description" 
                         placeholder="Описание сюжета фильма..." 
                         style="height: 100px; resize: vertical;"></textarea>
              </label>

              <label class="conf-step__label conf-step__label-fullsize" for="country">
                Страна
                <input class="conf-step__input" type="text" name="country" 
                       placeholder="Страна производства">
              </label>
            </div>
          </div>

          <div class="conf-step__buttons text-center" style="margin-top: 20px;">
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