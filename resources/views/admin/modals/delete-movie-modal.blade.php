<div class="popup" id="deleteMovieModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Удаление фильма
          <a class="popup__dismiss" href="#" data-close-modal="deleteMovieModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="deleteMovieForm">
          @csrf
          @method('DELETE')
          <input type="hidden" name="movie_id" id="movieIdToDelete">
          <p class="conf-step__paragraph">Вы действительно хотите удалить фильм <span id="movieNameToDelete">"Название фильма"</span>?</p>
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">Удалить</button>
            <button type="button" class="conf-step__button conf-step__button-regular" data-close-modal="deleteMovieModal">Отменить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
