<div class="popup" id="hallScheduleModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title" id="hallScheduleModalTitle">
          Создание расписания
          <a class="popup__dismiss" href="#" onclick="closeModal('hallScheduleModal')">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      
      <div class="popup__wrapper">
        <form id="hallScheduleForm" method="POST">
          @csrf
          <input type="hidden" id="hall_schedule_id" name="hall_schedule_id">
          <input type="hidden" id="hall_id" name="cinema_hall_id">
          <input type="hidden" id="schedule_date" name="date">

          <div class="conf-step__label conf-step__label-fullsize">
            <strong>Зал:</strong> <span id="modal_hall_name"></span>
          </div>
          
          <div class="conf-step__label conf-step__label-fullsize">
            <strong>Дата:</strong> <span id="modal_schedule_date"></span>
          </div>

          <label class="conf-step__label conf-step__label-fullsize" for="start_time">
            Начало работы
            <input class="conf-step__input" type="time" name="start_time" id="start_time" 
                   value="09:00" required>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="end_time">
            Окончание работы
            <input class="conf-step__input" type="time" name="end_time" id="end_time" 
                   value="23:00" required>
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent" id="hallScheduleSubmitBtn">
              Создать расписание
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    onclick="closeModal('hallScheduleModal')">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
