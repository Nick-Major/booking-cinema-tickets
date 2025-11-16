<div class="popup" id="editMovieModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование фильма
          <a class="popup__dismiss" href="#" onclick="closeEditMovieModal(event)">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="editMovieForm" method="POST" enctype="multipart/form-data">
          @csrf
          @method('PUT')
          
          <input type="hidden" name="movie_id" id="edit_movie_id">
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_title">
            Название фильма
            <input class="conf-step__input" type="text" name="title" id="edit_title" required>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_movie_description">
            Описание фильма
            <textarea class="conf-step__input" name="movie_description" id="edit_movie_description"></textarea>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_movie_poster">
            Постер фильма
            <input class="conf-step__input" type="file" name="movie_poster" id="edit_movie_poster" accept="image/*">
            <small id="edit_current_poster"></small>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_movie_duration">
            Длительность (минуты)
            <input class="conf-step__input" type="number" name="movie_duration" id="edit_movie_duration" min="1" required>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="edit_country">
            Страна
            <input class="conf-step__input" type="text" name="country" id="edit_country">
          </label>
          
          <label class="conf-step__label">
            <input type="checkbox" name="is_active" id="edit_is_active" value="1">
            Активный
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Сохранить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeEditMovieModal(event)">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
function closeEditMovieModal(event) {
    event.preventDefault();
    document.getElementById('editMovieModal').style.display = 'none';
}
</script>
