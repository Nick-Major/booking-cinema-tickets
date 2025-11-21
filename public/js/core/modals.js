// @ts-nocheck

// Централизованный модуль для управления модальными окнами
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
        console.log(`Модальное окно открыто: ${modalId}`);
    } else {
        console.error(`Модальное окно не найдено: ${modalId}`);
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Восстанавливаем скролл
        console.log(`Модальное окно закрыто: ${modalId}`);
    }
}

export function initModalHandlers() {
    console.log('Инициализация обработчиков модальных окон...');

    // Обработчики для кнопок открытия модальных окон
    document.querySelectorAll('[data-open-modal]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-open-modal');
            console.log(`Открытие модального окна: ${modalId}`);
            openModal(modalId);
        });
    });

    // Обработчики для кнопок закрытия модальных окон через data-dismiss
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-dismiss="modal"]')) {
            e.preventDefault();
            e.stopPropagation();
            const modal = e.target.closest('.popup');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });

    // Обработчики для кнопок закрытия модальных окон через data-close-modal
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-close-modal');
            console.log(`Закрытие модального окна: ${modalId}`);
            closeModal(modalId);
        });
    });

    // Закрытие по клику на фон
    document.querySelectorAll('.popup').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                e.preventDefault();
                console.log(`Закрытие по клику на фон: ${this.id}`);
                closeModal(this.id);
            }
        });
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            console.log('Закрытие по Escape');
            document.querySelectorAll('.popup').forEach(modal => {
                if (modal.style.display === 'flex') {
                    closeModal(modal.id);
                }
            });
        }
    });

    console.log('Обработчики модальных окон инициализированы');
}

// Специфичные функции закрытия для каждого модального окна
export function closeAddHallModal() { 
    closeModal('addHallModal'); 
}

export function closeAddMovieModal() { 
    closeModal('addMovieModal'); 
}

export function closeEditMovieModal() { 
    closeModal('editMovieModal'); 
}

export function closeAddSessionModal() { 
    closeModal('addSessionModal'); 
}

export function closeEditSessionModal() { 
    closeModal('editSessionModal'); 
}

export function closeDeleteHallModal() { 
    closeModal('deleteHallModal'); 
}

export function closeDeleteMovieModal() { 
    closeModal('deleteMovieModal'); 
}

export function closeDeleteSessionModal() { 
    closeModal('deleteSessionModal'); 
}

export function closeAllModals() {
    document.querySelectorAll('.popup').forEach(modal => {
        if (modal.style.display === 'flex') {
            closeModal(modal.id);
        }
    });
}

// Вспомогательные функции для работы с модальными окнами
export function showLoadingModal(message = 'Загрузка...') {
    console.log('Loading:', message);
}

export function hideLoadingModal() {
    console.log('Loading complete');
}

export function showErrorModal(message) {
    console.error('Error:', message);
    if (window.notifications) {
        window.notifications.show(message, 'error');
    }
}