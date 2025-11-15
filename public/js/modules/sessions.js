// @ts-nocheck

// Модуль для управления сеансами
import { openModal, closeModal } from '../core/modals.js';

export function initSessionFormHandlers() {
    console.log('🎯 Инициализация обработчиков формы сеанса...');

    // Обработчик открытия модального окна
    document.querySelectorAll('[data-open-modal="addSessionModal"]').forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('🎯 Кнопка "Добавить сеанс" нажата');
            openModal('addSessionModal');
        });
    });

    // Обработчик для формы
    const addSessionForm = document.getElementById('addSessionForm');
    if (addSessionForm) {
        console.log('✅ Форма addSessionForm найдена');
        
        addSessionForm.addEventListener('submit', async function(e) {
            console.log('🎯 Отправка формы перехвачена');
            e.preventDefault();
            
            const formData = new FormData(this);
            
            // Проверяем обязательные поля
            const movieId = document.getElementById('movie_id').value;
            const hallId = document.getElementById('cinema_hall_id').value;
            
            if (!movieId || !hallId) {
                console.log('❌ Ошибка: не все поля заполнены');
                if (window.notifications) {
                    window.notifications.show('Пожалуйста, заполните все поля', 'error');
                }
                return;
            }
            
            try {
                const response = await fetch("/admin/sessions", {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });
                
                const result = await response.json();

                if (result.success) {
                    console.log('✅ Сеанс успешно создан');
                    closeModal('addSessionModal');
                    if (window.notifications) {
                        window.notifications.show(result.message, 'success');
                    }
                    this.reset();
                    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
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
}

export function initTimeValidation() {
    const timeInput = document.getElementById('session_time');
    if (timeInput) {
        timeInput.addEventListener('input', function(e) {
            const value = e.target.value;
            const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            
            if (value && !timePattern.test(value)) {
                this.style.borderColor = 'red';
            } else {
                this.style.borderColor = '';
            }
        });
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
