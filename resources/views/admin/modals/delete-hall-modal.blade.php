<div class="popup" id="deleteHallModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Удаление зала
          <a class="popup__dismiss" href="#" data-close-modal="deleteHallModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="deleteHallForm">
            @csrf
            @method('DELETE')
            <input type="hidden" name="hall_id" id="hallIdToDelete">
            <p class="conf-step__paragraph">Вы действительно хотите удалить зал <span id="hallNameToDelete">"Название зала"</span>?</p>
            <div class="conf-step__buttons text-center">
                <button type="submit" class="conf-step__button conf-step__button-accent">Удалить</button>
                <button type="button" class="conf-step__button conf-step__button-regular" data-close-modal="deleteHallModal">Отменить</button>
            </div>
        </form>
      </div>
    </div>
  </div>
</div>
