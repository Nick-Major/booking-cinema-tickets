<div class="popup" id="deleteSessionModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Снятие с сеанса
          <a class="popup__dismiss" href="#" onclick="closeDeleteSessionModal(event)"><img src="{{ asset('images/admin/close.png') }}" alt="Закрыть"></a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="deleteSessionForm" method="POST">
          @csrf
          @method('DELETE')
          <input type="hidden" name="session_id" id="sessionIdToDelete">
          <p class="conf-step__paragraph">Вы действительно хотите снять с сеанса фильм <span id="sessionMovieNameToDelete">"Название фильма"</span>?</p>
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">Удалить</button>
            <button class="conf-step__button conf-step__button-regular" type="button" onclick="closeDeleteSessionModal(event)">Отменить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
