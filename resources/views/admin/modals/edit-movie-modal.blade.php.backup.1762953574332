<div class="popup" id="editMovieModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование фильма
          <a class="popup__dismiss" href="#" onclick="closeEditMovieModal()">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form action="{{ route('movies.update', $movie->id) }}" method="POST" enctype="multipart/form-data">
          @csrf
          @method('PUT')
          
          <label class="conf-step__label conf-step__label-fullsize" for="title">
            Название фильма
            <input class="conf-step__input" type="text" name="title" value="{{ $movie->title }}" required>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_description">
            Описание фильма
            <textarea class="conf-step__input" name="movie_description">{{ $movie->movie_description }}</textarea>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_poster">
            Постер фильма
            <input class="conf-step__input" type="file" name="movie_poster" accept="image/*">
            @if($movie->movie_poster)
              <small>Текущий постер: {{ basename($movie->movie_poster) }}</small>
            @endif
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="movie_duration">
            Длительность (минуты)
            <input class="conf-step__input" type="number" name="movie_duration" value="{{ $movie->movie_duration }}" min="1" required>
          </label>
          
          <label class="conf-step__label conf-step__label-fullsize" for="country">
            Страна
            <input class="conf-step__input" type="text" name="country" value="{{ $movie->country }}">
          </label>
          
          <label class="conf-step__label">
            <input type="checkbox" name="is_active" value="1" {{ $movie->is_active ? 'checked' : '' }}>
            Активный
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Сохранить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeEditMovieModal()">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
