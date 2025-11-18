<div class="popup" id="deleteSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Удаление сеанса
          <a class="popup__dismiss" href="#" data-close-modal="deleteSessionModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="deleteSessionForm" method="POST">
          @csrf
          @method('DELETE')
          <input type="hidden" name="session_id" id="sessionIdToDelete">
          
          <div class="conf-step__info-box">
            <div class="conf-step__info-item">
              <strong>Фильм:</strong> <span id="sessionMovieNameToDelete">-</span>
            </div>
            <div class="conf-step__info-item">
              <strong>Зал:</strong> <span id="sessionHallNameToDelete">-</span>
            </div>
            <div class="conf-step__info-item">
              <strong>Время:</strong> <span id="sessionTimeToDelete">-</span>
            </div>
          </div>

          <p class="conf-step__paragraph" style="text-align: center; font-weight: bold; margin: 20px 0;">
            Вы действительно хотите удалить этот сеанс?
          </p>
          
          <div class="conf-step__buttons text-center" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button type="submit" class="conf-step__button conf-step__button-danger">
              Удалить сеанс
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    data-close-modal="deleteSessionModal">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
