// @ts-nocheck

import { openModal, closeModal } from '../core/modals.js';

// Вспомогательные функции
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Функция для создания расписания
async function createSchedule(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Создание...';

        const formData = new FormData(form);

        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            if (window.notifications) {
                window.notifications.show(result.message, 'success');
            }
            closeModal('hallScheduleModal');
            // Перезагружаем страницу через 1.5 секунды
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(result.message || 'Ошибка при создании расписания');
        }

    } catch (error) {
        console.error('Error creating schedule:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка: ' + error.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Функция для удаления расписания
async function deleteSchedule(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Удаление...';

        const scheduleId = document.getElementById('scheduleIdToDelete').value;
        const currentDate = document.getElementById('currentScheduleDate').value;

        console.log('🗑️ Удаление расписания:', { scheduleId, currentDate });

        const response = await fetch(`/admin/hall-schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                current_date: currentDate
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            console.log('✅ Расписание успешно удалено');
            if (window.notifications) {
                window.notifications.show(result.message, 'success');
            }
            closeModal('deleteScheduleModal');
            // Перезагружаем страницу через 1 секунду
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(result.message || 'Ошибка при удалении расписания');
        }

    } catch (error) {
        console.error('❌ Ошибка удаления расписания:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка: ' + error.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Основные функции работы с расписаниями
async function updateSchedule(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        const formData = new FormData(form);

        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                start_time: formData.get('start_time'),
                end_time: formData.get('end_time'),
                _method: 'PUT'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            window.notifications.show('Расписание успешно обновлено!', 'success');
            closeModal('editScheduleModal');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error(result.message || 'Ошибка при обновлении расписания');
        }

    } catch (error) {
        console.error('Error updating schedule:', error);
        window.notifications.show('Ошибка: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Функции для модальных окон
export function openEditScheduleModal(scheduleId) {
    fetch(`/admin/hall-schedules/${scheduleId}/edit`)
        .then(response => response.json())
        .then(schedule => {
            console.log('Loading schedule data:', schedule);

            // Устанавливаем значения
            document.getElementById('edit_hall_schedule_id').value = schedule.id;
            document.getElementById('edit_hall_id').value = schedule.cinema_hall_id;
            document.getElementById('edit_schedule_date').value = schedule.date;
            document.getElementById('edit_modal_hall_name').textContent = schedule.hall_name;
            document.getElementById('edit_modal_schedule_date').textContent = formatDateForDisplay(schedule.date);

            // Устанавливаем время (обрезаем секунды если есть)
            document.getElementById('edit_start_time').value = schedule.start_time.substring(0, 5);
            document.getElementById('edit_end_time').value = schedule.end_time.substring(0, 5);

            document.getElementById('editScheduleForm').action = `/admin/hall-schedules/${scheduleId}`;
            openModal('editScheduleModal');
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            window.notifications.show('Ошибка при загрузке расписания: ' + error.message, 'error');
        });
}

export function openDeleteScheduleModal(scheduleId, hallId, hallName, currentDate) {
    console.log('🗑️ Открытие модального окна удаления расписания:', {
        scheduleId, hallId, hallName, currentDate
    });

    document.getElementById('scheduleIdToDelete').value = scheduleId;
    document.getElementById('currentScheduleDate').value = currentDate;
    document.getElementById('scheduleHallName').textContent = hallName;
    document.getElementById('scheduleDate').textContent = new Date(currentDate).toLocaleDateString('ru-RU');

    openModal('deleteScheduleModal');
}

export function openCreateScheduleModal(hallId, date, hallName = '') {
    document.getElementById('hall_id').value = hallId;
    document.getElementById('schedule_date').value = date;
    document.getElementById('modal_hall_name').textContent = hallName;
    document.getElementById('modal_schedule_date').textContent = new Date(date).toLocaleDateString('ru-RU');

    openModal('hallScheduleModal');
}

// Инициализация
export function initSchedules() {
    console.log('🎯 Инициализация модуля расписаний...');

    // Обработчики для формы редактирования
    const editScheduleForm = document.getElementById('editScheduleForm');
    if (editScheduleForm) {
        editScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateSchedule(this);
        });
        console.log('✅ Обработчик формы редактирования установлен');
    }

    // Обработчики для формы создания расписания
    const hallScheduleForm = document.getElementById('hallScheduleForm');
    if (hallScheduleForm) {
        hallScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createSchedule(this);
        });
        console.log('✅ Обработчик формы создания установлен');
    }

    // Обработчики для формы удаления расписания - ИСПРАВЛЕНО
    const deleteScheduleForm = document.getElementById('deleteScheduleForm');
    if (deleteScheduleForm) {
        console.log('✅ Форма удаления расписания найдена');
        deleteScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('🗑️ Отправка формы удаления расписания');
            await deleteSchedule(this);
        });
    } else {
        console.log('❌ Форма deleteScheduleForm не найдена');
    }
}
