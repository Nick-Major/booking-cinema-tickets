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

// Функция обновления подсказки о расписании - УЛУЧШЕННАЯ ВЕРСИЯ
function updateScheduleHint() {
    const hallSelect = document.getElementById('cinema_hall_id');
    const dateInput = document.getElementById('session_date');
    const scheduleHint = document.getElementById('scheduleHint');
    const allowedTimeRange = document.getElementById('allowedTimeRange');

    if (!hallSelect || !dateInput || !scheduleHint || !allowedTimeRange) {
        console.log('❌ Элементы для подсказки расписания не найдены');
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
            // ФОРМАТИРУЕМ ВРЕМЯ БЕЗ СЕКУНД
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

// ОСНОВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ - УЛУЧШЕННАЯ
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
        console.log('✅ Обработчик изменения зала установлен');
    }
    if (dateInput) {
        dateInput.addEventListener('change', updateScheduleHint);
        console.log('✅ Обработчик изменения даты установлен');
    }

    // Обработчик для формы добавления сеанса
    const addSessionForm = document.getElementById('addSessionForm');
    if (addSessionForm) {
        console.log('✅ Форма addSessionForm найдена');
        
        addSessionForm.addEventListener('submit', async function(e) {
            console.log('🎯 Отправка формы перехвачена');
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
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
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

// Функция открытия модального окна добавления сеанса - УЛУЧШЕННАЯ
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
    
    // Обновляем подсказку о расписании - ВАЖНО: после открытия модального окна
    setTimeout(() => {
        updateScheduleHint();
        console.log('✅ Подсказка расписания обновлена');
    }, 100);
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
    
    fetch(`/admin/sessions/${sessionId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(session => {
            console.log('✅ Данные сеанса получены:', session);
            
            // ЗАЩИТА: Проверяем существование элементов перед работой с ними
            const sessionIdInput = document.getElementById('edit_session_id');
            const hallSelect = document.getElementById('edit_cinema_hall_id');
            const movieSelect = document.getElementById('edit_movie_id');
            const dateInput = document.getElementById('edit_session_date');
            const timeInput = document.getElementById('edit_session_time');
            const form = document.getElementById('editSessionForm');
            
            if (!sessionIdInput || !hallSelect || !movieSelect || !dateInput || !timeInput || !form) {
                console.error('❌ Не найдены элементы формы редактирования:', {
                    sessionIdInput: !!sessionIdInput,
                    hallSelect: !!hallSelect,
                    movieSelect: !!movieSelect,
                    dateInput: !!dateInput,
                    timeInput: !!timeInput,
                    form: !!form
                });
                throw new Error('Форма редактирования не найдена в DOM');
            }
            
            // Заполняем скрытые поля
            sessionIdInput.value = session.id;
            
            // Заполняем выпадающий список залов
            hallSelect.value = session.cinema_hall_id;
            console.log('✅ Установлен зал:', session.cinema_hall_id);
            
            // Заполняем выпадающий список фильмов
            movieSelect.value = session.movie_id;
            console.log('✅ Установлен фильм:', session.movie_id);
            
            // ДИАГНОСТИКА: Проверим доступные опции (только если movieSelect существует)
            if (movieSelect && movieSelect.options) {
                console.log('🎬 Доступные опции фильмов:', 
                    Array.from(movieSelect.options).map(opt => ({
                        value: opt.value, 
                        text: opt.text,
                        selected: opt.selected
                    }))
                );
            }
            
            // Разбираем дату и время из session_start
            const sessionStart = new Date(session.session_start);
            const sessionDate = sessionStart.toISOString().split('T')[0];
            const sessionTime = sessionStart.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            
            console.log('📅 Разобранные время:', {
                original: session.session_start,
                date: sessionDate,
                time: sessionTime,
                localeTime: sessionStart.toLocaleTimeString()
            });
            
            dateInput.value = sessionDate;
            timeInput.value = sessionTime;
            
            // Устанавливаем action формы
            form.action = `/admin/sessions/${sessionId}`;
            
            // Открываем модальное окно
            openModal('editSessionModal');
            
            console.log('✅ Форма редактирования заполнена и открыта');
            
        })
        .catch(error => {
            console.error('❌ Ошибка при загрузке данных сеанса:', error);
            if (window.notifications) {
                window.notifications.show('Ошибка при загрузке данных сеанса: ' + error.message, 'error');
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
        formData.append('_method', 'PUT');
        
        // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ДАННЫХ
        console.log('🔍 Данные формы перед отправкой:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value);
        }

        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        // ЛОГИРУЕМ ОТВЕТ СЕРВЕРА
        console.log('📨 Статус ответа:', response.status);
        const result = await response.json();
        console.log('📨 Тело ответа:', result);

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (result.success) {
            console.log('✅ Сеанс успешно обновлен');
            
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
        } else {
            alert('Ошибка при обновлении сеанса: ' + error.message);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
