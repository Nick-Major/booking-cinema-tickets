<div class="popup" id="editScheduleModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование расписания
          <a class="popup__dismiss" href="#" data-close-modal="editScheduleModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      
      <div class="popup__wrapper">
        <form id="editScheduleForm" method="POST">
          @csrf
          <input type="hidden" name="_method" value="PUT">
          <input type="hidden" id="edit_hall_schedule_id" name="hall_schedule_id">
          <input type="hidden" id="edit_hall_id" name="cinema_hall_id">
          <input type="hidden" id="edit_schedule_date" name="date">

          <div class="conf-step__info-box">
            <div class="conf-step__info-item">
              <strong>Зал:</strong> <span id="edit_modal_hall_name">-</span>
            </div>
            <div class="conf-step__info-item">
              <strong>Дата:</strong> <span id="edit_modal_schedule_date">-</span>
            </div>
          </div>

          <!-- ИСПОЛЬЗУЕМ HTML5 TIME INPUT -->
          <label class="conf-step__label conf-step__label-fullsize" for="edit_start_time">
            Начало работы
            <input class="conf-step__input" 
                  type="time" 
                  name="start_time" 
                  id="edit_start_time" 
                  value="08:00"
                  required>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="edit_end_time">
            Окончание работы
            <input class="conf-step__input" 
                  type="time" 
                  name="end_time" 
                  id="edit_end_time" 
                  value="23:00"
                  required>
            <small class="conf-step__hint">
              💡 Для ночного режима укажите время окончания меньше времени начала (например: начало 20:00, окончание 02:00)
            </small>
          </label>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent" id="editScheduleSubmitBtn">
              Сохранить
            </button>
            <button type="button" class="conf-step__button conf-step__button-regular" 
                    data-close-modal="editScheduleModal">
              Отменить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
