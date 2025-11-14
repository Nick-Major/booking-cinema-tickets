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
        
        // Загружаем данные фильма через AJAX
        const response = await fetch(`/admin/movies/${movieId}/edit`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Создаем временный контейнер для извлечения модального окна
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Находим модальное окно в загруженном HTML
        const modalContent = tempDiv.querySelector('.popup');
        if (!modalContent) {
            throw new Error('Модальное окно не найдено в ответе');
        }
        
        // Удаляем существующее модальное окно (если есть)
        const existingModal = document.getElementById('editMovieModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Добавляем новое модальное окно в DOM
        document.body.appendChild(modalContent);
        
        // Открываем модальное окно
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

// Функции закрытия модальных окон - ДОБАВЛЯЕМ event.preventDefault()
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
// ОБРАБОТЧИКИ ФОРМ СЕАНСОВ
// ============================================================================
function initSessionFormHandlers() {
    // Обработчик формы добавления сеанса
    console.log('=== INIT SESSION FORM HANDLERS ===');

    const addSessionForm = document.getElementById('addSessionForm');
    console.log('Form found:', !!addSessionForm);
    
    if (addSessionForm) {
        console.log('Form action attribute:', addSessionForm.getAttribute('action'));
        console.log('Form method:', addSessionForm.getAttribute('method'));

        addSessionForm.addEventListener('submit', async function(e) {
            console.log('=== FORM SUBMIT INTERCEPTED ===');
            e.preventDefault();
            console.log('Default prevented');
            
            try {
                const formData = new FormData(this);
                
                const response = await fetch("/admin/sessions", {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                const result = await response.json();

                if (result.success) {
                    closeModal('addSessionModal');
                    if (window.notifications) {
                        window.notifications.show(result.message, 'success');
                    }
                    // Очищаем форму
                    this.reset();
                    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
                } else {
                    if (window.notifications) {
                        window.notifications.show(result.message, 'error');
                    }
                    if (result.errors) {
                        console.error('Validation errors:', result.errors);
                    }
                }
            } catch (error) {
                console.error('Error submitting session form:', error);
                if (window.notifications) {
                    window.notifications.show('Ошибка при создании сеанса', 'error');
                }
            }
        });
    }
}

// Валидация времени в реальном времени
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
        // Инициализируем состояние при загрузке
        toggleInactiveMovies(filterCheckbox.checked);
        
        filterCheckbox.addEventListener('change', function() {
            toggleInactiveMovies(this.checked);
        });
    }
}

// ============================================================================
// ДЕЛЕГИРОВАНИЕ СОБЫТИЙ ДЛЯ ФОРМ
// ============================================================================
function initEventDelegation() {
    // Обработчик для ВСЕХ форм с id="addSessionForm" (даже динамически добавленных)
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'addSessionForm') {
            e.preventDefault();
            handleSessionFormSubmit(e);
        }
    });
}

// Обработчик отправки формы сеанса
async function handleSessionFormSubmit(e) {
    const form = e.target;
    
    try {
        const formData = new FormData(form);
        
        console.log('Submitting session form to:', '/admin/sessions');
        
        const response = await fetch('/admin/sessions', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Response result:', result);

        if (result.success) {
            closeModal('addSessionModal');
            if (window.notifications) {
                window.notifications.show(result.message, 'success');
            }
            // Очищаем форму
            form.reset();
            // Устанавливаем текущую дату по умолчанию
            const dateInput = document.getElementById('session_date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        } else {
            if (window.notifications) {
                window.notifications.show(result.message, 'error');
            }
            if (result.errors) {
                console.error('Validation errors:', result.errors);
            }
        }
    } catch (error) {
        console.error('Error submitting session form:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при создании сеанса', 'error');
        }
    }
}

// Надежный обработчик формы
function initSessionForm() {
    console.log('Инициализация обработчика формы сеанса...');
    
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'addSessionForm') {
            console.log('Форма перехвачена!');
            e.preventDefault();
            e.stopPropagation();
            
            handleSessionSubmit(e.target);
            return false;
        }
    });
}

async function handleSessionSubmit(form) {
    console.log('Обработка отправки формы...');
    
    const formData = new FormData(form);
    
    try {
        console.log('Отправка на /admin/sessions...');
        
        const response = await fetch('/admin/sessions', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        
        console.log('Статус ответа:', response.status);
        console.log('URL ответа:', response.url);
        
        const result = await response.json();
        console.log('Результат:', result);
        
        if (result.success) {
            closeModal('addSessionModal');
            if (window.notifications) {
                window.notifications.show(result.message, 'success');
            }
            form.reset();
        } else {
            if (window.notifications) {
                window.notifications.show(result.message, 'error');
            }
        }
    } catch (error) {
        console.error('Ошибка:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при создании сеанса', 'error');
        }
    }
}

// В DOMContentLoaded добавьте:
// initSessionForm();

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
        initSessionForm();
        initEventDelegation();
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
    window.handleSessionFormSubmit = handleSessionFormSubmit;
});
