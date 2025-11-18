<div class="popup" id="editScheduleModal">
  <div class="popup__container">
    <div class="popup__content">
      <div class="popup__header">
        <h2 class="popup__title">
          Редактирование расписания работы зала
          <a class="popup__dismiss" href="#" data-close-modal="editScheduleModal">
            <img src="{{ asset('images/admin/close.png') }}" alt="Закрыть">
          </a>
        </h2>
      </div>
      
      <div class="popup__wrapper">
        <form id="editScheduleForm" method="POST">
          @csrf
          @method('PUT')
          <input type="hidden" id="edit_hall_schedule_id" name="hall_schedule_id">
          <input type="hidden" id="edit_hall_id" name="cinema_hall_id">
          <input type="hidden" id="edit_schedule_date" name="date">

          <!-- Информация о зале и дате -->
          <div class="conf-step__info-box">
            <div class="conf-step__info-item">
              <strong>Зал:</strong> <span id="edit_modal_hall_name">-</span>
            </div>
            <div class="conf-step__info-item">
              <strong>Дата:</strong> <span id="edit_modal_schedule_date">-</span>
            </div>
          </div>

          <!-- Поля времени -->
          <label class="conf-step__label conf-step__label-fullsize" for="edit_start_time">
            Начало работы
            <input class="conf-step__input time-input" 
                  type="text" 
                  name="start_time" 
                  id="edit_start_time" 
                  placeholder="08:00" 
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  required>
          </label>

          <label class="conf-step__label conf-step__label-fullsize" for="edit_end_time">
            Окончание работы
            <input class="conf-step__input time-input" 
                  type="text" 
                  name="end_time" 
                  id="edit_end_time" 
                  placeholder="02:00" 
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  required>
            <small class="conf-step__hint">
              💡 Для работы после полуночи укажите время меньше начала (например: начало 08:00, окончание 02:00)
            </small>
          </label>

          <!-- Автоматическое определение ночного режима -->
          <div class="conf-step__overnight-info" id="edit_overnightInfo" style="display: none;">
            <div class="conf-step__alert conf-step__alert--info">
              ⏰ <strong>Ночной режим:</strong> Зал будет работать до <span id="edit_overnight_end_date"></span>
            </div>
          </div>
          
          <div class="conf-step__buttons text-center">
            <button type="submit" class="conf-step__button conf-step__button-accent" id="editScheduleSubmitBtn">
              Сохранить изменения
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
