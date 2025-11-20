// @ts-nocheck

// Модуль для управления сеансами
import { openModal, closeModal } from '../core/modals.js';

// Переменные для отслеживания состояния
let timelineHandlersInitialized = false;

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

    if (!hallSelect || !dateInput || !scheduleHint || !allowedTimeRange) {
        return;
    }

    const hallId = hallSelect.value;
    const date = dateInput.value;

    if (!hallId || !date) {
        scheduleHint.style.display = 'none';
        return;
    }

    loadScheduleInfo(hallId, date).then(data => {
        if (data && data.schedule) {
            const formatTime = (timeString) => timeString.substring(0, 5);
            const startTime = formatTime(data.schedule.start_time);
            const endTime = formatTime(data.schedule.end_time);
            
            let timeRange = `${startTime} - ${endTime}`;
            if (data.schedule.overnight) {
                timeRange += ' (ночной режим)';
            }
            allowedTimeRange.textContent = timeRange;
            scheduleHint.style.display = 'block';
        } else {
            scheduleHint.style.display = 'none';
        }
    });
}

// Функция для открытия модального окна удаления сеанса
export function openDeleteSessionModal(sessionId, movieTitle, hallName, sessionTime) {
    closeModal('editSessionModal');
    
    document.getElementById('sessionIdToDelete').value = sessionId;
    document.getElementById('sessionMovieNameToDelete').textContent = movieTitle;
    document.getElementById('sessionHallNameToDelete').textContent = hallName;
    document.getElementById('sessionTimeToDelete').textContent = sessionTime;
    
    openModal('deleteSessionModal');
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

// Основная функция инициализации
export function initSessionFormHandlers() {
    console.log('🎯 Инициализация обработчиков формы сеанса...');

    document.querySelectorAll('[data-open-modal="addSessionModal"]').forEach(button => {
        button.addEventListener('click', function(e) {
            openModal('addSessionModal');
            setTimeout(updateScheduleHint, 100);
        });
    });

    // Обработчик для кнопки удаления сеанса в форме редактирования
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-action="delete-session"]')) {
            e.preventDefault();
            const sessionId = document.getElementById('edit_session_id').value;
            const movieTitle = document.getElementById('edit_current_movie').textContent;
            const hallName = document.getElementById('edit_current_hall').textContent;
            const sessionTime = document.getElementById('edit_current_time').textContent;
            
            if (sessionId) {
                openDeleteSessionModal(sessionId, movieTitle, hallName, sessionTime);
            } else {
                console.error('❌ ID сеанса не найден для удаления');
                if (window.notifications) {
                    window.notifications.show('Ошибка: ID сеанса не найден', 'error');
                }
            }
        }
    });

    const hallSelect = document.getElementById('cinema_hall_id');
    const dateInput = document.getElementById('session_date');

    if (hallSelect) {
        hallSelect.addEventListener('change', updateScheduleHint);
    }
    if (dateInput) {
        dateInput.addEventListener('change', updateScheduleHint);
    }

    const addSessionForm = document.getElementById('addSessionForm');
    if (addSessionForm) {
        addSessionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Добавление...';

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
                    closeModal('addSessionModal');
                    
                    if (window.notifications) {
                        window.notifications.show(result.message, 'success');
                    }
                    
                    this.reset();
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    
                } else {
                    if (window.notifications) {
                        window.notifications.show(result.message, 'error');
                    }
                }
            } catch (error) {
                console.error('💥 Ошибка сети:', error);
                if (window.notifications) {
                    window.notifications.show('Ошибка сети при создании сеанса', 'error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    const editSessionForm = document.getElementById('editSessionForm');
    if (editSessionForm) {
        editSessionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateSession(this);
        });
    }

    const deleteSessionForm = document.getElementById('deleteSessionForm');
    if (deleteSessionForm) {
        deleteSessionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const sessionId = document.getElementById('sessionIdToDelete').value;
            await deleteMovieSession(sessionId);
        });
    }
}

// Функция открытия модального окна добавления сеанса
export function openAddSessionModal(hallId, date) {
    const hallSelect = document.getElementById('cinema_hall_id');
    if (hallSelect && hallId) {
        hallSelect.value = hallId;
    }
    
    const dateInput = document.getElementById('session_date');
    if (dateInput && date) {
        dateInput.value = date;
    }
    
    openModal('addSessionModal');
    
    setTimeout(() => {
        updateScheduleHint();
    }, 100);
}

// Функция смены даты таймлайна
export async function changeTimelineDate(date) {
    try {
        showTimelineLoading();
        
        const response = await fetch(`/admin/sessions-timeline/load?date=${date}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        
        const container = document.getElementById('sessionsTimelineWrapper');
        if (container) {
            container.innerHTML = html;
            hideTimelineLoading();
            
            reinitializeTimelineHandlers();
            
            if (window.notifications) {
                window.notifications.show('Расписание обновлено', 'success');
            }
        }
    } catch (error) {
        console.error('❌ Ошибка при загрузке таймлайна:', error);
        hideTimelineLoading();
        
        window.location.href = `/admin/dashboard?date=${date}`;
    }
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
    openModal('editSessionModal');
    
    setTimeout(() => {
        fetch(`/admin/sessions/${sessionId}/edit`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(session => {
                fillEditSessionForm(session);
            })
            .catch(error => {
                console.error('❌ Ошибка при загрузке данных сеанса:', error);
                if (window.notifications) {
                    window.notifications.show('Ошибка при загрузке данных сеанса: ' + error.message, 'error');
                }
                closeModal('editSessionModal');
            });
    }, 100);
}

// Функция для заполнения формы редактирования сеанса
function fillEditSessionForm(session) {
    const getElement = (id) => document.getElementById(id);

    const sessionIdInput = getElement('edit_session_id');
    if (sessionIdInput) {
        sessionIdInput.value = session.id;
    }
    
    const currentMovieSpan = getElement('edit_current_movie');
    const currentHallSpan = getElement('edit_current_hall');
    const currentTimeSpan = getElement('edit_current_time');
    
    if (currentMovieSpan) {
        currentMovieSpan.textContent = session.movie?.title || 'Неизвестный фильм';
    }
    if (currentHallSpan) {
        currentHallSpan.textContent = session.cinema_hall?.hall_name || 'Неизвестный зал';
    }
    if (currentTimeSpan) {
        const sessionStart = new Date(session.session_start);
        const displayTime = sessionStart.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        const displayDate = sessionStart.toLocaleDateString('ru-RU');
        currentTimeSpan.textContent = `${displayDate} ${displayTime}`;
    }
    
    // Устанавливаем фильм
    const movieSelect = getElement('edit_movie_id');
    if (movieSelect) {
        movieSelect.value = session.movie_id.toString();
        
        if (movieSelect.options) {
            for (let i = 0; i < movieSelect.options.length; i++) {
                if (movieSelect.options[i].value === session.movie_id.toString()) {
                    movieSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }
    
    // Устанавливаем зал
    const hallSelect = getElement('edit_cinema_hall_id');
    if (hallSelect) {
        hallSelect.value = session.cinema_hall_id.toString();
    }
    
    // Устанавливаем дату и время
    const dateInput = getElement('edit_session_date');
    const timeInput = getElement('edit_session_time');
    if (dateInput && timeInput) {
        const sessionDate = new Date(session.session_start);
        
        const year = sessionDate.getFullYear();
        const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const day = String(sessionDate.getDate()).padStart(2, '0');
        const hours = String(sessionDate.getHours()).padStart(2, '0');
        const minutes = String(sessionDate.getMinutes()).padStart(2, '0');
        
        dateInput.value = `${year}-${month}-${day}`;
        timeInput.value = `${hours}:${minutes}`;
    }
    
    // Устанавливаем статус активности
    const isActualCheckbox = getElement('edit_is_actual');
    if (isActualCheckbox) {
        isActualCheckbox.checked = Boolean(session.is_actual);
    }
    
    // Обновляем action формы
    const form = getElement('editSessionForm');
    if (form) {
        form.action = `/admin/sessions/${session.id}`;
    }
}

// Функция для обновления сеанса
async function updateSession(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        const formData = new FormData(form);
        formData.append('_method', 'PUT');

        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            if (window.notifications) {
                window.notifications.show('Сеанс успешно обновлен!', 'success');
            }
            
            closeModal('editSessionModal');
            
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } else {
            throw new Error(result.message || 'Ошибка при обновлении сеанса');
        }

    } catch (error) {
        console.error('❌ Ошибка при обновлении сеанса:', error);
        
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при обновлении сеанса: ' + error.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Инициализация обработчиков таймлайна
export function initTimelineHandlers() {
    if (timelineHandlersInitialized) {
        return;
    }
    
    document.removeEventListener('click', handleTimelineClick);
    document.removeEventListener('change', handleTimelineChange);
    
    document.addEventListener('click', handleTimelineClick, true);
    document.addEventListener('change', handleTimelineChange, true);
    
    timelineHandlersInitialized = true;
}

// Обработчик кликов для таймлайна
function handleTimelineClick(e) {
    const prevBtn = e.target.closest('.timeline-nav-btn[data-action="prev"]');
    const nextBtn = e.target.closest('.timeline-nav-btn[data-action="next"]');
    
    if (prevBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const prevDate = prevBtn.getAttribute('data-prev-date');
        setTimeout(() => changeTimelineDate(prevDate), 0);
        return false;
    }
    
    if (nextBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const nextDate = nextBtn.getAttribute('data-next-date');
        setTimeout(() => changeTimelineDate(nextDate), 0);
        return false;
    }
}

// Обработчик изменений для таймлайна
function handleTimelineChange(e) {
    if (e.target.classList.contains('timeline-date-input')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        setTimeout(() => changeTimelineDate(e.target.value), 0);
        return false;
    }
}

// Вспомогательные функции для индикации загрузки
function showTimelineLoading() {
    const container = document.getElementById('sessionsTimelineWrapper');
    if (container) {
        container.style.opacity = '0.6';
        container.style.pointerEvents = 'none';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'timeline-loading';
        loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px;">Загрузка расписания...</div>';
        loadingDiv.style.position = 'absolute';
        loadingDiv.style.top = '50%';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translate(-50%, -50%)';
        loadingDiv.style.background = 'rgba(255,255,255,0.9)';
        loadingDiv.style.padding = '10px 20px';
        loadingDiv.style.borderRadius = '5px';
        loadingDiv.style.zIndex = '1000';
        
        container.style.position = 'relative';
        container.appendChild(loadingDiv);
    }
}

function hideTimelineLoading() {
    const container = document.getElementById('sessionsTimelineWrapper');
    if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
        
        const loadingElement = container.querySelector('.timeline-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// Функция для переинициализации обработчиков после AJAX-обновления
function reinitializeTimelineHandlers() {
    timelineHandlersInitialized = false;
    initTimelineHandlers();
    
    if (typeof initSchedules === 'function') {
        initSchedules();
    }
    
    if (typeof initSessionFormHandlers === 'function') {
        initSessionFormHandlers();
    }
}