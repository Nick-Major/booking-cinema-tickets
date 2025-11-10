<div class="popup" id="editSessionModal">
    <div class="popup__container">
        <div class="popup__content">
            <div class="popup__header">
                <h2 class="popup__title">
                    Редактирование сеанса
                    <a class="popup__dismiss" onclick="closeAllModals()">
                        <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
                    </a>
                </h2>
            </div>

            <div class="popup__wrapper">
                <form action="" method="POST" id="editSessionForm">
                    @csrf
                    @method('PUT')
                    
                    <div class="conf-step__paragraph">
                        <label for="edit_movie_id">Фильм:</label>
                        <select name="movie_id" id="edit_movie_id" class="conf-step__input" required>
                            @foreach($movies as $movie)
                                <option value="{{ $movie->id }}">{{ $movie->title }}</option>
                            @endforeach
                        </select>
                    </div>
                    
                    <div class="conf-step__paragraph">
                        <label for="edit_cinema_hall_id">Зал:</label>
                        <select name="cinema_hall_id" id="edit_cinema_hall_id" class="conf-step__input" required>
                            @foreach($halls as $hall)
                                <option value="{{ $hall->id }}">{{ $hall->hall_name }}</option>
                            @endforeach
                        </select>
                    </div>
                    
                    <div class="conf-step__paragraph">
                        <label for="edit_session_date">Дата:</label>
                        <input type="date" name="session_date" id="edit_session_date" class="conf-step__input" required>
                    </div>
                    
                    <div class="conf-step__paragraph">
                        <label for="edit_session_time">Время начала:</label>
                        <input type="time" name="session_time" id="edit_session_time" class="conf-step__input" required>
                    </div>
                    
                    <div class="conf-step__paragraph">
                        <p><strong>Длительность фильма:</strong> <span id="edit_movie_duration">0</span> минут</p>
                        <p><strong>Общее время сеанса:</strong> <span id="edit_total_duration">0</span> минут (фильм + 25 мин)</p>
                    </div>

                    <div class="conf-step__buttons text-center">
                        <button type="button" class="conf-step__button conf-step__button-warning" 
                                onclick="deleteSession()" style="margin-right: 10px;">
                            Удалить сеанс
                        </button>
                        <button type="submit" class="conf-step__button conf-step__button-accent">
                            Сохранить изменения
                        </button>
                        <button type="button" class="conf-step__button conf-step__button-regular" 
                                onclick="closeAllModals()">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>