// @ts-nocheck

// Модуль для управления сеансами
import { openModal, closeModal } from '../core/modals.js';

// Функция для загрузки информации о расписании
async function loadScheduleInfo(hallId, date) {
    try {
        const response = await fetch(`/admin/halls/${hallId}/schedule-info?date=${date}`);
        if (!response.ok) throw new Error('Ошибка загрузки расписания');
        const data = await response.json();
        return data.success ? data : null;
    } catch (error) {
        console.error('Error loading schedule info:', error);
        return null;
    }
}

// Функция обновления подсказки о расписании
function updateScheduleHint() {
    const hallSelect = document.getElementById('cinema_hall_id');
    const dateInput = document.getElementById('session_date');
    const scheduleHint = document.getElementById('scheduleHint');
    const allowedTimeRange = document.getElementById('allowedTimeRange');

    if (!hallSelect || !dateInput || !scheduleHint || !allowedTimeRange) return;

    const hallId = hallSelect.value;
    const date = dateInput.value;

    if (hallId && date) {
        loadScheduleInfo(hallId, date).then(data => {
            if (data && data.schedule) {
                let timeRange = `${data.schedule.start_time} - ${data.schedule.end_time}`;
                if (data.schedule.overnight) {
                    timeRange += ' 🌙 (ночной режим)';
                }
                allowedTimeRange.textContent = timeRange;
                scheduleHint.style.display = 'block';
            } else {
                scheduleHint.style.display = 'none';
            }
        });
    } else {
        scheduleHint.style.display = 'none';
    }
}

// Функция для открытия модального окна удаления сеанса
export function openDeleteSessionModal(sessionId, movieTitle, hallName, sessionTime) {
    console.log('🎯 openDeleteSessionModal вызвана с параметрами:', {
        sessionId, 
        movieTitle, 
        hallName, 
        sessionTime
    });
    
    // ЗАКРЫВАЕМ модальное окно редактирования перед открытием удаления
    closeModal('editSessionModal');
    console.log('✅ Модальное окно редактирования закрыто');
    
    // Заполняем данные в модальном окне
    document.getElementById('sessionIdToDelete').value = sessionId;
    document.getElementById('sessionMovieNameToDelete').textContent = movieTitle;
    document.getElementById('sessionHallNameToDelete').textContent = hallName;
    document.getElementById('sessionTimeToDelete').textContent = sessionTime;
    
    // Открываем модальное окно удаления
    openModal('deleteSessionModal');
    console.log('✅ Модальное окно удаления открыто');
    
    // Диагностика после открытия
    setTimeout(() => {
        const modal = document.getElementById('deleteSessionModal');
        if (modal) {
            const computedStyle = window.getComputedStyle(modal);
            console.log('🔍 Финальные стили модального окна удаления:', {
                display: computedStyle.display,
                zIndex: computedStyle.zIndex,
                opacity: computedStyle.opacity,
                visibility: computedStyle.visibility
            });
        }
    }, 100);
}

// Функция для удаления сеанса
async function deleteMovieSession(sessionId) {
    try {
        const response = await fetch(`/admin/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            if (window.notifications) {
                window.notifications.show('Сеанс успешно удален', 'success');
            }
            closeModal('deleteSessionModal');
            closeModal('editSessionModal');
            // Перезагружаем страницу для обновления данных
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            throw new Error(data.message || 'Ошибка при удалении сеанса');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при удалении сеанса: ' + error.message, 'error');
        }
    }
}

export function initSessionFormHandlers() {
    console.log('🎯 Инициализация обработчиков формы сеанса...');

    // Обработчик открытия модального окна
    document.querySelectorAll('[data-open-modal="addSessionModal"]').forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('🎯 Кнопка "Добавить сеанс" нажата');
            openModal('addSessionModal');
            // Обновляем подсказку при открытии модального окна
            setTimeout(updateScheduleHint, 100);
        });
    });

    // Добавляем обработчики для обновления подсказки о расписании
    const hallSelect = document.getElementById('cinema_hall_id');
    const dateInput = document.getElementById('session_date');

    if (hallSelect) {
        hallSelect.addEventListener('change', updateScheduleHint);
    }
    if (dateInput) {
        dateInput.addEventListener('change', updateScheduleHint);
    }

    // Обработчик для формы добавления сеанса
    const addSessionForm = document.getElementById('addSessionForm');
    if (addSessionForm) {
        console.log('✅ Форма addSessionForm найдена');
        
        addSessionForm.addEventListener('submit', async function(e) {
            console.log('🎯 Отправка формы перехвачена');
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch("/admin/sessions", {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    }
                });
                
                const result = await response.json();

                if (result.success) {
                    console.log('✅ Сеанс успешно создан');
                    
                    // Закрываем модальное окно
                    closeModal('addSessionModal');
                    
                    // Показываем уведомление
                    if (window.notifications) {
                        window.notifications.show(result.message, 'success');
                    }
                    
                    // Сбрасываем форму
                    this.reset();
                    
                    // ОБНОВЛЯЕМ СТРАНИЦУ для отображения нового сеанса
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    
                } else {
                    console.log('❌ Ошибка при создании сеанса:', result.message);
                    if (window.notifications) {
                        window.notifications.show(result.message, 'error');
                    }
                }
            } catch (error) {
                console.error('💥 Ошибка сети:', error);
                if (window.notifications) {
                    window.notifications.show('Ошибка сети при создании сеанса', 'error');
                }
            }
        });
    } else {
        console.log('❌ Форма addSessionForm не найдена');
    }

    // Обработчик для формы редактирования сеанса
    const editSessionForm = document.getElementById('editSessionForm');
    if (editSessionForm) {
        console.log('✅ Форма editSessionForm найдена');
        editSessionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateSession(this);
        });
    } else {
        console.log('❌ Форма editSessionForm не найдена');
    }

    // Обработчик для формы удаления сеанса
    // Обработчик для формы удаления сеанса
    const deleteSessionForm = document.getElementById('deleteSessionForm');
    if (deleteSessionForm) {
        console.log('✅ Форма deleteSessionForm найдена');
        deleteSessionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('🎯 Форма удаления сеанса отправлена');
            const sessionId = document.getElementById('sessionIdToDelete').value;
            console.log('🎯 ID сеанса для удаления:', sessionId);
            await deleteMovieSession(sessionId);
        });
    } else {
        console.log('❌ Форма deleteSessionForm не найдена');
    }
}

export function openAddSessionModal(hallId, date) {
    console.log('🎯 Открытие модального окна сеанса для зала:', { hallId, date });
    
    // Заполняем форму данными из таймлайна
    const hallSelect = document.getElementById('cinema_hall_id');
    if (hallSelect && hallId) {
        hallSelect.value = hallId;
        console.log('✅ Установлен зал:', hallId);
    }
    
    const dateInput = document.getElementById('session_date');
    if (dateInput && date) {
        dateInput.value = date;
        console.log('✅ Установлена дата:', date);
    }
    
    // Открываем модальное окно
    openModal('addSessionModal');
    
    // Обновляем подсказку о расписании
    setTimeout(updateScheduleHint, 100);
}

export function changeTimelineDate(date) {
    console.log('📅 Смена даты таймлайна:', date);
    window.location.href = `/admin/dashboard?date=${date}`;
}

// Функции для работы с API сеансов
export async function fetchSessionsByHall(hallId, date = null) {
    try {
        let url = `/admin/sessions/hall/${hallId}`;
        if (date) {
            url += `?date=${date}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки сеансов');
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching sessions:', error);
        throw error;
    }
}

export async function toggleSessionActual(sessionId) {
    try {
        const response = await fetch(`/admin/sessions/${sessionId}/toggle-actual`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error toggling session:', error);
        throw error;
    }
}

// Функция для открытия модального окна редактирования сеанса
export function openEditSessionModal(sessionId) {
    console.log('🎯 Открытие модального окна редактирования сеанса:', sessionId);
    
    fetch(`/admin/sessions/${sessionId}/edit`)
        .then(response => response.json())
        .then(session => {
            console.log('Данные сеанса для редактирования:', session);
            
            // Заполняем скрытые поля и информацию
            document.getElementById('edit_session_id').value = session.id;
            
            // Заполняем информацию о текущем сеансе
            document.getElementById('edit_current_movie').textContent = session.movie.title;
            document.getElementById('edit_current_hall').textContent = session.cinema_hall.hall_name;
            document.getElementById('edit_current_time').textContent = 
                new Date(session.session_start).toLocaleString('ru-RU');
            
            // Заполняем форму данными
            document.getElementById('edit_movie_id').value = session.movie_id;
            document.getElementById('edit_cinema_hall_id').value = session.cinema_hall_id;
            
            // Разбираем дату и время
            const sessionStart = new Date(session.session_start);
            document.getElementById('edit_session_date').value = sessionStart.toISOString().split('T')[0];
            document.getElementById('edit_session_time').value = 
                sessionStart.toTimeString().slice(0, 5);
            
            document.getElementById('edit_is_actual').checked = session.is_actual;
            
            // Устанавливаем action формы
            document.getElementById('editSessionForm').action = `/admin/sessions/${sessionId}`;
            
            // Открываем модальное окно
            openModal('editSessionModal');
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных сеанса:', error);
            if (window.notifications) {
                window.notifications.show('Ошибка при загрузке данных сеанса', 'error');
            }
        });
}

// Функция для обновления сеанса
async function updateSession(form) {
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
                movie_id: formData.get('movie_id'),
                cinema_hall_id: formData.get('cinema_hall_id'),
                session_date: formData.get('session_date'),
                session_time: formData.get('session_time'),
                is_actual: formData.get('is_actual') === '1',
                _method: 'PUT'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            window.notifications.show('Сеанс успешно обновлен!', 'success');
            closeModal('editSessionModal');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error(result.message || 'Ошибка при обновлении сеанса');
        }

    } catch (error) {
        console.error('Error updating session:', error);
        window.notifications.show('Ошибка: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
