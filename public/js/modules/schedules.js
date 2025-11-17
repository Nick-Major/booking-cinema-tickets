// @ts-nocheck

import { openModal, closeModal } from '../core/modals.js';

// Функция открытия модального окна создания расписания
export function openCreateScheduleModal(hallId, date, hallName = '') {
    // Заполняем данные в модальном окне
    document.getElementById('hall_id').value = hallId;
    document.getElementById('schedule_date').value = date;
    document.getElementById('modal_hall_name').textContent = hallName || `Зал #${hallId}`;
    document.getElementById('modal_schedule_date').textContent = formatDateForDisplay(date);
    
    // Открываем модальное окно
    openModal('hallScheduleModal');
}

// Форматирование даты для отображения
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Валидация времени
function validateTime(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

// Форматирование времени (добавляет ведущий ноль)
function formatTime(input) {
    let value = input.value.replace(/[^\d:]/g, '');
    
    // Автоматически добавляем двоеточие после двух цифр
    if (value.length === 2 && !value.includes(':')) {
        value = value + ':';
    }
    
    // Ограничиваем длину
    if (value.length > 5) {
        value = value.substring(0, 5);
    }
    
    input.value = value;
}

// Инициализация модуля расписаний
export function initSchedules() {
    setupScheduleTimeValidation();
    // Обработчики для полей ввода времени
    document.querySelectorAll('.time-input').forEach(input => {
        input.addEventListener('input', function() {
            formatTime(this);
        });
        
        input.addEventListener('blur', function() {
            if (this.value && !validateTime(this.value)) {
                this.setCustomValidity('Введите время в формате ЧЧ:ММ');
                this.reportValidity();
            } else {
                this.setCustomValidity('');
            }
        });
    });

    // Обработчик формы создания расписания
    const hallScheduleForm = document.getElementById('hallScheduleForm');
    if (hallScheduleForm) {
        hallScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createSchedule(this);
        });
    }
}

// Функция создания расписания
async function createSchedule(form) {
    try {
        const formData = new FormData(form);
        
        // Валидация времени перед отправкой
        const startTime = formData.get('start_time');
        const endTime = formData.get('end_time');
        
        if (!validateTime(startTime) || !validateTime(endTime)) {
            throw new Error('Пожалуйста, проверьте формат времени');
        }

        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Показываем уведомление
            if (window.notifications) {
                window.notifications.show('Расписание успешно создано!', 'success');
            }

            // Закрываем модальное окно
            closeModal('hallScheduleModal');

            // Очищаем форму
            form.reset();

            // Перезагружаем страницу для обновления расписания
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } else {
            throw new Error(result.message || 'Ошибка при создании расписания');
        }
    } catch (error) {
        console.error('Error creating schedule:', error);
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при создании расписания: ' + error.message, 'error');
        } else {
            alert('Ошибка при создании расписания: ' + error.message);
        }
    }
}

function setupScheduleTimeValidation() {
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const overnightInfo = document.getElementById('overnightInfo');
    const overnightEndDate = document.getElementById('overnight_end_date');

    function checkOvernightMode() {
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const scheduleDate = document.getElementById('schedule_date').value;

        if (startTime && endTime) {
            const start = parseTime(startTime);
            const end = parseTime(endTime);
            
            // Если время окончания меньше времени начала - это ночной режим
            if (end < start) {
                overnightInfo.style.display = 'block';
                // Показываем дату окончания (следующий день)
                const nextDay = new Date(scheduleDate);
                nextDay.setDate(nextDay.getDate() + 1);
                overnightEndDate.textContent = nextDay.toLocaleDateString('ru-RU');
            } else {
                overnightInfo.style.display = 'none';
            }
        }
    }

    function parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    if (startTimeInput && endTimeInput) {
        startTimeInput.addEventListener('input', checkOvernightMode);
        endTimeInput.addEventListener('input', checkOvernightMode);
    }
}

// Функция открытия модального окна редактирования расписания
export function openEditScheduleModal(scheduleId) {
    // Загружаем данные расписания
    fetch(`/admin/hall-schedules/${scheduleId}/edit`)
        .then(response => response.json())
        .then(schedule => {
            // Заполняем форму данными
            document.getElementById('hall_schedule_id').value = schedule.id;
            document.getElementById('hall_id').value = schedule.cinema_hall_id;
            document.getElementById('schedule_date').value = schedule.date;
            document.getElementById('modal_hall_name').textContent = schedule.hall_name || `Зал #${schedule.cinema_hall_id}`;
            document.getElementById('modal_schedule_date').textContent = formatDateForDisplay(schedule.date);
            document.getElementById('start_time').value = schedule.start_time;
            document.getElementById('end_time').value = schedule.end_time;
            
            // Меняем заголовок и action формы
            document.getElementById('hallScheduleModalTitle').textContent = 'Редактирование расписания работы зала';
            document.getElementById('hallScheduleForm').action = `/admin/hall-schedules/${scheduleId}`;
            document.getElementById('hallScheduleSubmitBtn').textContent = 'Сохранить изменения';
            
            // Добавляем метод PUT
            const methodInput = document.createElement('input');
            methodInput.type = 'hidden';
            methodInput.name = '_method';
            methodInput.value = 'PUT';
            document.getElementById('hallScheduleForm').appendChild(methodInput);
            
            // Открываем модальное окно
            openModal('hallScheduleModal');
            
            // Проверяем ночной режим
            checkOvernightMode();
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            if (window.notifications) {
                window.notifications.show('Ошибка при загрузке расписания', 'error');
            }
        });
}

// Функция удаления расписания
export async function deleteSchedule(scheduleId, hallId) {
    if (!confirm('Вы уверены, что хотите удалить расписание?')) {
        return;
    }

    try {
        const response = await fetch(`/admin/hall-schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            if (window.notifications) {
                window.notifications.show(result.message, 'success');
            }
            // Перезагружаем страницу для обновления данных
            window.location.reload();
        } else {
            if (window.notifications) {
                window.notifications.show(result.message, 'error');
            }
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при удалении расписания', 'error');
        }
    }
}
