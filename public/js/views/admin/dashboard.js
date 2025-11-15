// @ts-nocheck

import HallsManager from '../../modules/halls.js';
import NotificationSystem from '../../core/notifications.js';
import './hall-configuration.js';
import '../../modules/pricing.js';
import './modals/add-movie-modal.js';

// ============================================================================
// АККОРДЕОН
// ============================================================================
function initAccordeon() {
    const headers = document.querySelectorAll('.conf-step__header');
    
    headers.forEach((header) => {
        if (header.hasAttribute('data-accordeon-initialized')) {
            return;
        }
        
        header.setAttribute('data-accordeon-initialized', 'true');
        
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
}

// ============================================================================
// ФУНКЦИИ ДЛЯ ШАБЛОНА
// ============================================================================
function resetSessions() {
    if (window.notifications) {
        window.notifications.show('Функция resetSessions вызвана', 'info');
    }
}

function updateSession() {
    if (window.notifications) {
        window.notifications.show('Функция updateSession вызвана', 'info');
    }
}

async function openEditMovieModal(movieId) {
    try {
        console.log('Opening edit movie modal for:', movieId);
        
        const response = await fetch(`/admin/movies/${movieId}/edit`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const modalContent = tempDiv.querySelector('.popup');
        if (!modalContent) {
            throw new Error('Модальное окно не найдено в ответе');
        }
        
        const existingModal = document.getElementById('editMovieModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.appendChild(modalContent);
        openModal('editMovieModal');
        
    } catch (error) {
        console.error('Error opening edit movie modal:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при открытии редактирования фильма', 'error');
        }
    }
}

// ============================================================================
// ФУНКЦИИ ЗАГРУЗКИ КОНФИГУРАЦИЙ
// ============================================================================
async function loadHallConfiguration(hallId) {
    try {
        const response = await fetch(`/admin/halls/${hallId}/configuration`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById('hallConfiguration');
        
        if (container) {
            container.innerHTML = html;
            if (window.notifications) {
                window.notifications.show('Конфигурация зала загружена', 'success');
            }
        }
    } catch (error) {
        console.error('Error loading hall configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при загрузке конфигурации зала', 'error');
        }
    }
}

async function loadPriceConfiguration(hallId) {
    try {
        const response = await fetch(`/admin/halls/${hallId}/prices`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById('priceConfiguration');
        
        if (container) {
            container.innerHTML = html;
            if (window.notifications) {
                window.notifications.show('Конфигурация цен загружена', 'success');
            }
        }
    } catch (error) {
        console.error('Error loading price configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при загрузке конфигурации цен', 'error');
        }
    }
}

// ============================================================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// ============================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function initModalHandlers() {
    document.querySelectorAll('[data-open-modal]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-open-modal');
            openModal(modalId);
        });
    });

    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    document.querySelectorAll('.popup').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                e.preventDefault();
                this.classList.remove('active');
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            document.querySelectorAll('.popup.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// Функции закрытия модальных окон
function closeAddHallModal(event) { 
    if (event) event.preventDefault();
    closeModal('addHallModal'); 
}

function closeAddMovieModal(event) { 
    if (event) event.preventDefault();
    closeModal('addMovieModal'); 
}

function closeEditMovieModal(event) { 
    if (event) event.preventDefault();
    closeModal('editMovieModal'); 
}

function closeAddSessionModal(event) { 
    if (event) event.preventDefault();
    closeModal('addSessionModal'); 
}

function closeEditSessionModal(event) { 
    if (event) event.preventDefault();
    closeModal('editSessionModal'); 
}

function closeDeleteHallModal(event) { 
    if (event) event.preventDefault();
    closeModal('deleteHallModal'); 
}

function closeDeleteMovieModal(event) { 
    if (event) event.preventDefault();
    closeModal('deleteMovieModal'); 
}

function closeDeleteSessionModal(event) { 
    if (event) event.preventDefault();
    closeModal('deleteSessionModal'); 
}

function closeAllModals(event) {
    if (event) event.preventDefault();
    document.querySelectorAll('.popup.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ============================================================================
// ВАЛИДАЦИЯ ВРЕМЕНИ
// ============================================================================
function initTimeValidation() {
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

// ============================================================================
// ОБРАБОТЧИКИ ФОРМ СЕАНСОВ
// ============================================================================
function initSessionFormHandlers() {
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
    }
}

// ============================================================================
// ФИЛЬТРАЦИЯ ФИЛЬМОВ
// ============================================================================
function toggleInactiveMovies(show) {
    const inactiveMovies = document.querySelectorAll('.conf-step__movie-inactive');
    inactiveMovies.forEach(movie => {
        movie.style.display = show ? 'block' : 'none';
    });
}

function initMovieFilter() {
    const filterCheckbox = document.getElementById('showInactiveMovies');
    if (filterCheckbox) {
        toggleInactiveMovies(filterCheckbox.checked);
        
        filterCheckbox.addEventListener('change', function() {
            toggleInactiveMovies(this.checked);
        });
    }
}

// ============================================================================
// ОСНОВНОЙ КОД
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    
    try {
        const notifications = new NotificationSystem();
        const hallsManager = new HallsManager(notifications);
        
        window.notifications = notifications;
        
        initAccordeon();
        initModalHandlers();
        initSessionFormHandlers();
        initTimeValidation();
        initMovieFilter();
        
        console.log('Admin panel initialized successfully!');
    } catch (error) {
        console.error('Error during admin panel initialization:', error);
    }

    // Экспортируем функции
    window.closeAddHallModal = closeAddHallModal;
    window.closeAddMovieModal = closeAddMovieModal;
    window.closeEditMovieModal = closeEditMovieModal;
    window.closeAddSessionModal = closeAddSessionModal;
    window.closeEditSessionModal = closeEditSessionModal;
    window.closeDeleteHallModal = closeDeleteHallModal;
    window.closeDeleteMovieModal = closeDeleteMovieModal;
    window.closeDeleteSessionModal = closeDeleteSessionModal;
    window.closeAllModals = closeAllModals;

    window.updateSession = updateSession;
    window.loadHallConfiguration = loadHallConfiguration;
    window.loadPriceConfiguration = loadPriceConfiguration;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.resetSessions = resetSessions;
    window.openEditMovieModal = openEditMovieModal;
    window.toggleInactiveMovies = toggleInactiveMovies;
});
