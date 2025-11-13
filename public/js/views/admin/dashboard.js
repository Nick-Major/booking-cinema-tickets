import HallsManager from '../../modules/halls.js';
import ApiClient from '../../core/api-client.js';
import NotificationSystem from '../../core/notifications.js';

// ============================================================================
// АККОРДЕОН
// ============================================================================
function initAccordeon() {
    const headers = document.querySelectorAll('.conf-step__header');
    console.log(`Found ${headers.length} accordeon headers`);
    
    headers.forEach((header, index) => {
        console.log(`Header ${index}:`, header.className);
        
        // Убедимся, что обработчик не дублируется
        if (header.hasAttribute('data-accordeon-initialized')) {
            return;
        }
        
        header.setAttribute('data-accordeon-initialized', 'true');
        
        header.addEventListener('click', () => {
            console.log(`Accordeon header ${index} clicked`);
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
}

// ============================================================================
// ОБРАБОТЧИКИ КОНФИГУРАЦИИ
// ============================================================================
function initConfigurationHandlers() {
    // Инициализируем обработчики для уже загруженных конфигураций
    initHallConfigurationHandlers();
    initPriceConfigurationHandlers();
    initRadioHandlers();
}

function initHallConfigurationHandlers() {
    console.log('Hall configuration handlers initialized');
    // Здесь будет логика для обработчиков конфигурации залов
}

function initPriceConfigurationHandlers() {
    console.log('Price configuration handlers initialized');
    // Здесь будет логика для обработчиков конфигурации цен
}

function initRadioHandlers() {
    console.log('Radio handlers initialized');
    // Здесь будет логика для обработчиков радио-кнопок
}

// ============================================================================
// ФУНКЦИИ ДЛЯ ШАБЛОНА
// ============================================================================
function resetSessions() {
    console.log('Reset sessions called');
    // Логика сброса сеансов
    alert('Функция resetSessions вызвана');
}

function updateSession() {
    console.log('Update session called');
    // Логика обновления сеанса
    alert('Функция updateSession вызвана');
}

function openEditMovieModal(movieId) {
    console.log('Open edit movie modal for:', movieId);
    // Логика открытия модального окна редактирования фильма
    alert(`Открытие модалки редактирования фильма ID: ${movieId}`);
}

// ============================================================================
// ОСНОВНОЙ КОД
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    
    try {
        // Инициализируем систему уведомлений
        const notifications = new NotificationSystem();
        
        // Инициализируем менеджер залов
        const hallsManager = new HallsManager();
        
        // Инициализируем аккордеон
        initAccordeon();
        
        // Инициализируем модальные окна
        initModalHandlers();
        
        // Инициализируем обработчики конфигурации
        initConfigurationHandlers();
        
        console.log('Admin panel initialized successfully!');
    } catch (error) {
        console.error('Error during admin panel initialization:', error);
    }

    // ============================================================================
    // СУЩЕСТВУЮЩИЙ ФУНКЦИОНАЛ
    // ============================================================================
    
    async function updateSession(sessionId, data) {
        try {
            const result = await ApiClient.put(`/admin/sessions/${sessionId}`, data);
            if (result.success) {
                alert('Сеанс обновлен успешно!');
                location.reload();
            }
        } catch (error) {
            console.error('Error updating session:', error);
            alert('Ошибка при обновлении сеанса');
        }
    }

    function loadHallConfiguration(hallId) {
        window.location.href = `/admin/halls/${hallId}/configuration`;
    }

    function loadPriceConfiguration(hallId) {
        window.location.href = `/admin/halls/${hallId}/prices`;
    }

    // Универсальные функции управления модальными окнами
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Инициализация модальных окон
    function initModalHandlers() {
        // Обработчик для кнопок открытия модальных окон
        document.querySelectorAll('[data-open-modal]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-open-modal');
                openModal(modalId);
            });
        });

        // Обработчик для кнопок закрытия модальных окон
        document.querySelectorAll('[data-close-modal]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-close-modal');
                closeModal(modalId);
            });
        });

        // Закрытие модальных окон при клике вне контента
        document.querySelectorAll('.popup').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
        });

        // Закрытие модальных окон по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.popup.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    // Функции закрытия модальных окон
    function closeAddHallModal() {
        closeModal('addHallModal');
    }

    function closeAddMovieModal() {
        closeModal('addMovieModal');
    }

    function closeEditMovieModal() {
        closeModal('editMovieModal');
    }

    function closeAddSessionModal() {
        closeModal('addSessionModal');
    }

    function closeEditSessionModal() {
        closeModal('editSessionModal');
    }

    function closeDeleteHallModal() {
        closeModal('deleteHallModal');
    }

    function closeDeleteMovieModal() {
        closeModal('deleteMovieModal');
    }

    function closeDeleteSessionModal() {
        closeModal('deleteSessionModal');
    }

    // Универсальная функция закрытия всех модальных окон
    function closeAllModals() {
        document.querySelectorAll('.popup.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Глобальный обработчик ошибок
    window.addEventListener('error', function(e) {
        console.error('Global error caught:', e.error);
        console.error('Error message:', e.message);
        console.error('Error stack:', e.error?.stack);
        
        // Сохраняем ошибку для дальнейшего анализа
        window.lastError = e.error;
    });

    // Обработчик необработанных promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        window.lastError = e.reason;
    });

    // Добавим замедление для отладки (можно убрать потом)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('Fetch called:', args[0], args[1]);
        return originalFetch.apply(this, args).then(response => {
            console.log('Fetch response:', response.status, response.url);
            return response;
        }).catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
    };

    // Инициализируем обработчики модальных окон
    initModalHandlers();

    // Экспортируем функции в глобальную область видимости
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
});