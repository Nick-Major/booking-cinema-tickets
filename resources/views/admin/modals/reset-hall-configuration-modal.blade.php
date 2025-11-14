<div class="popup" id="resetHallConfigurationModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Сброс конфигурации зала
          <a class="popup__dismiss" href="#" data-close-modal="resetHallConfigurationModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="resetHallConfigurationForm">
            @csrf
            @method('POST')
            <input type="hidden" name="hall_id" id="hallIdToReset">
            <p class="conf-step__paragraph">Вы действительно хотите сбросить конфигурацию зала <span id="hallNameToReset">"Название зала"</span>?</p>
            <p class="conf-step__paragraph warning-text">Все места будут удалены, и схема будет сброшена к начальному состоянию.</p>
            <div class="conf-step__buttons text-center">
                <button type="submit" class="conf-step__button conf-step__button-accent">Сбросить</button>
                <button type="button" class="conf-step__button conf-step__button-regular" data-close-modal="resetHallConfigurationModal">Отменить</button>
            </div>
        </form>
      </div>
    </div>
  </div>
</div>

<style>
.warning-text {
    color: #dc3545;
    font-weight: bold;
}
</style>
