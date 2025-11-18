// @ts-nocheck

import { openModal, closeModal } from '../core/modals.js';

// Вспомогательные функции
function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function validateTime(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

function formatTime(input) {
    let value = input.value.replace(/[^\d:]/g, '');
    
    if (value.length === 2 && !value.includes(':')) {
        value = value + ':';
    }
    
    if (value.length > 5) {
        value = value.substring(0, 5);
    }
    
    input.value = value;
}

// Функции для ночного режима (создание)
function checkOvernightMode() {
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const overnightInfo = document.getElementById('overnightInfo');
    const overnightEndDate = document.getElementById('overnight_end_date');

    if (startTimeInput && endTimeInput) {
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const scheduleDate = document.getElementById('schedule_date').value;

        if (startTime && endTime) {
            const start = parseTime(startTime);
            const end = parseTime(endTime);
            
            if (end < start) {
                if (overnightInfo) overnightInfo.style.display = 'block';
                const nextDay = new Date(scheduleDate);
                nextDay.setDate(nextDay.getDate() + 1);
                if (overnightEndDate) overnightEndDate.textContent = nextDay.toLocaleDateString('ru-RU');
            } else {
                if (overnightInfo) overnightInfo.style.display = 'none';
            }
        }
    }
}

// Функции для ночного режима (редактирование)
function checkEditOvernightMode() {
    const startTimeInput = document.getElementById('edit_start_time');
    const endTimeInput = document.getElementById('edit_end_time');
    const overnightInfo = document.getElementById('edit_overnightInfo');
    const overnightEndDate = document.getElementById('edit_overnight_end_date');

    if (startTimeInput && endTimeInput) {
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const scheduleDate = document.getElementById('edit_schedule_date').value;

        if (startTime && endTime) {
            const start = parseTime(startTime);
            const end = parseTime(endTime);
            
            if (end < start) {
                if (overnightInfo) overnightInfo.style.display = 'block';
                const nextDay = new Date(scheduleDate);
                nextDay.setDate(nextDay.getDate() + 1);
                if (overnightEndDate) overnightEndDate.textContent = nextDay.toLocaleDateString('ru-RU');
            } else {
                if (overnightInfo) overnightInfo.style.display = 'none';
            }
        }
    }
}

// Настройка валидации времени
function setupScheduleTimeValidation() {
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');

    if (startTimeInput && endTimeInput) {
        startTimeInput.addEventListener('input', checkOvernightMode);
        endTimeInput.addEventListener('input', checkOvernightMode);
    }
}

function setupEditScheduleTimeValidation() {
    const startTimeInput = document.getElementById('edit_start_time');
    const endTimeInput = document.getElementById('edit_end_time');

    if (startTimeInput && endTimeInput) {
        startTimeInput.addEventListener('input', checkEditOvernightMode);
        endTimeInput.addEventListener('input', checkEditOvernightMode);
    }
}

// Функции работы с расписаниями
async function createSchedule(form) {
    try {
        const formData = new FormData(form);
        
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
            if (window.notifications) {
                window.notifications.show('Расписание успешно создано!', 'success');
            }
            closeModal('hallScheduleModal');
            form.reset();
            setTimeout(() => location.reload(), 1000);
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

async function updateSchedule(form) {
    try {
        const formData = new FormData(form);
        
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
            if (window.notifications) {
                window.notifications.show('Расписание успешно обновлено!', 'success');
            }
            closeModal('editScheduleModal');
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error(result.message || 'Ошибка при обновлении расписания');
        }
    } catch (error) {
        console.error('Error updating schedule:', error);
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при обновлении расписания: ' + error.message, 'error');
        } else {
            alert('Ошибка при обновлении расписания: ' + error.message);
        }
    }
}

// Функция открытия модального окна удаления расписания
export function openDeleteScheduleModal(scheduleId, hallId, hallName, currentDate) {
    const scheduleIdInput = document.getElementById('scheduleIdToDelete');
    const currentDateInput = document.getElementById('currentScheduleDate');
    const hallNameSpan = document.getElementById('scheduleHallName');
    const scheduleDateSpan = document.getElementById('scheduleDate');

    if (scheduleIdInput && currentDateInput && hallNameSpan && scheduleDateSpan) {
        scheduleIdInput.value = scheduleId;
        currentDateInput.value = currentDate;
        hallNameSpan.textContent = hallName;
        scheduleDateSpan.textContent = formatDateForDisplay(currentDate);
        
        openModal('deleteScheduleModal');
    }
}

// Функция удаления расписания через модальное окно
async function deleteScheduleHandler(form) {
    try {
        const scheduleId = document.getElementById('scheduleIdToDelete').value;
        const currentDate = document.getElementById('currentScheduleDate').value;

        const response = await fetch(`/admin/hall-schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_date: currentDate,
                _method: 'DELETE'
            })
        });

        const result = await response.json();

        if (result.success) {
            if (window.notifications) {
                window.notifications.show(result.message, 'success');
            }
            closeModal('deleteScheduleModal');
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error(result.message || 'Ошибка при удалении расписания');
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при удалении расписания: ' + error.message, 'error');
        }
    }
}

// Функция проверки возможности редактирования расписания
async function checkScheduleEditPossibility(scheduleId) {
    try {
        const response = await fetch(`/admin/hall-schedules/${scheduleId}/check-edit`);
        const result = await response.json();
        
        return result;
    } catch (error) {
        console.error('Error checking schedule edit possibility:', error);
        return { success: false, min_end_time: '00:00' };
    }
}

// Экспортируемые функции
export function openCreateScheduleModal(hallId, date, hallName = '') {
    const hallIdInput = document.getElementById('hall_id');
    const scheduleDateInput = document.getElementById('schedule_date');
    const hallNameSpan = document.getElementById('modal_hall_name');
    const scheduleDateSpan = document.getElementById('modal_schedule_date');

    if (hallIdInput && scheduleDateInput && hallNameSpan && scheduleDateSpan) {
        hallIdInput.value = hallId;
        scheduleDateInput.value = date;
        hallNameSpan.textContent = hallName || `Зал #${hallId}`;
        scheduleDateSpan.textContent = formatDateForDisplay(date);
        
        document.getElementById('hallScheduleModalTitle').textContent = 'Создание расписания работы зала';
        document.getElementById('hallScheduleForm').action = '/admin/hall-schedules';
        document.getElementById('hallScheduleSubmitBtn').textContent = 'Создать расписание';
        
        const methodInput = document.querySelector('input[name="_method"]');
        if (methodInput) methodInput.remove();
        
        document.getElementById('hallScheduleForm').reset();
        openModal('hallScheduleModal');
        setTimeout(checkOvernightMode, 100);
    }
}

export function openEditScheduleModal(scheduleId) {
    // Сначала проверяем возможность редактирования
    checkScheduleEditPossibility(scheduleId)
        .then(editCheck => {
            if (!editCheck.success) {
                if (window.notifications) {
                    window.notifications.show('Ошибка при проверке возможности редактирования', 'error');
                }
                return;
            }

            // Затем загружаем данные расписания
            return fetch(`/admin/hall-schedules/${scheduleId}/edit`)
                .then(response => response.json())
                .then(schedule => {
                    const scheduleIdInput = document.getElementById('edit_hall_schedule_id');
                    const hallIdInput = document.getElementById('edit_hall_id');
                    const scheduleDateInput = document.getElementById('edit_schedule_date');
                    const hallNameSpan = document.getElementById('edit_modal_hall_name');
                    const scheduleDateSpan = document.getElementById('edit_modal_schedule_date');
                    const startTimeInput = document.getElementById('edit_start_time');
                    const endTimeInput = document.getElementById('edit_end_time');

                    if (scheduleIdInput && hallIdInput && scheduleDateInput && hallNameSpan && scheduleDateSpan && startTimeInput && endTimeInput) {
                        scheduleIdInput.value = schedule.id;
                        hallIdInput.value = schedule.cinema_hall_id;
                        scheduleDateInput.value = schedule.date;
                        hallNameSpan.textContent = schedule.hall_name || `Зал #${schedule.cinema_hall_id}`;
                        scheduleDateSpan.textContent = formatDateForDisplay(schedule.date);
                        startTimeInput.value = schedule.start_time;
                        endTimeInput.value = schedule.end_time;
                        
                        // Устанавливаем минимальное время окончания
                        if (editCheck.has_sessions) {
                            endTimeInput.min = editCheck.min_end_time;
                            endTimeInput.title = `Минимальное время окончания: ${editCheck.min_end_time} (из-за существующих сеансов)`;
                            
                            // Показываем подсказку
                            if (window.notifications) {
                                window.notifications.show(`Внимание: минимальное время окончания установлено ${editCheck.min_end_time} из-за существующих сеансов`, 'info');
                            }
                        } else {
                            endTimeInput.removeAttribute('min');
                            endTimeInput.removeAttribute('title');
                        }
                        
                        document.getElementById('editScheduleForm').action = `/admin/hall-schedules/${scheduleId}`;
                        openModal('editScheduleModal');
                        setTimeout(checkEditOvernightMode, 100);
                    }
                });
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            if (window.notifications) {
                window.notifications.show('Ошибка при загрузке расписания', 'error');
            }
        });
}

// Удаляем старую функцию deleteSchedule и заменяем на новую
export { openDeleteScheduleModal as deleteSchedule };

// Инициализация модуля
export function initSchedules() {
    // Настройка валидации
    setupScheduleTimeValidation();
    setupEditScheduleTimeValidation();
    
    // Обработчики для формы создания
    const hallScheduleForm = document.getElementById('hallScheduleForm');
    if (hallScheduleForm) {
        // Обработчики полей ввода
        hallScheduleForm.querySelectorAll('.time-input').forEach(input => {
            input.addEventListener('input', function() { formatTime(this); });
            input.addEventListener('blur', function() {
                if (this.value && !validateTime(this.value)) {
                    this.setCustomValidity('Введите время в формате ЧЧ:ММ');
                    this.reportValidity();
                } else {
                    this.setCustomValidity('');
                }
            });
        });
        
        // Обработчик отправки формы
        hallScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createSchedule(this);
        });
    }

    // Обработчики для формы редактирования
    const editScheduleForm = document.getElementById('editScheduleForm');
    if (editScheduleForm) {
        // Обработчики полей ввода
        editScheduleForm.querySelectorAll('.time-input').forEach(input => {
            input.addEventListener('input', function() { 
                formatTime(this);
                checkEditOvernightMode();
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
        
        // Обработчик отправки формы
        editScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateSchedule(this);
        });
    }

    // Обработчик формы удаления расписания
    const deleteScheduleForm = document.getElementById('deleteScheduleForm');
    if (deleteScheduleForm) {
        deleteScheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await deleteScheduleHandler(this);
        });
    }
}
