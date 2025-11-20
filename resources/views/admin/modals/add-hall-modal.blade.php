<div class="popup" id="addHallModal" style="display: none;">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Добавление зала
          <a class="popup__dismiss" href="#" data-dismiss="modal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="addHallForm" method="POST">
          @csrf
          <label class="conf-step__label conf-step__label-fullsize" for="hall_name">
            Название зала
            <input class="conf-step__input" type="text" 
                   placeholder="Например, &laquo;Зал 1&raquo;" 
                   name="hall_name" id="hall_name" required>
          </label>
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
                Добавить зал
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    data-dismiss="modal">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
