<div class="popup" id="deleteScheduleModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Удаление расписания
          <a class="popup__dismiss" href="#" onclick="closeModal('deleteScheduleModal')">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      <div class="popup__wrapper">
        <form id="deleteScheduleForm">
          @csrf
          @method('DELETE')
          <input type="hidden" name="schedule_id" id="scheduleIdToDelete">
          <input type="hidden" name="current_date" id="currentScheduleDate">
          
          <p class="conf-step__paragraph">
            Вы действительно хотите удалить расписание для зала 
            <strong><span id="scheduleHallName">"Название зала"</span></strong> 
            на <strong><span id="scheduleDate">"дату"</span></strong>?
          </p>
          
          <p class="conf-step__paragraph conf-step__paragraph--warning">
              Вместе с расписанием будут удалены все сеансы на эту дату.
          </p>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent">
              Удалить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeModal('deleteScheduleModal')">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
