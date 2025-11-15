// @ts-nocheck

// Централизованный модуль для управления модальными окнами
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Восстанавливаем скролл
    }
}

export function initModalHandlers() {
    // Обработчики для кнопок открытия модальных окон
    document.querySelectorAll('[data-open-modal]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-open-modal');
            openModal(modalId);
        });
    });

    // Обработчики для кнопок закрытия модальных окон
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    // Закрытие по клику на фон
    document.querySelectorAll('.popup').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                e.preventDefault();
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            document.querySelectorAll('.popup.active').forEach(modal => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });
}

// Специфичные функции закрытия для каждого модального окна
export function closeAddHallModal(event) { 
    if (event) event.preventDefault();
    closeModal('addHallModal'); 
}

export function closeAddMovieModal(event) { 
    if (event) event.preventDefault();
    closeModal('addMovieModal'); 
}

export function closeEditMovieModal(event) { 
    if (event) event.preventDefault();
    closeModal('editMovieModal'); 
}

export function closeAddSessionModal(event) { 
    if (event) event.preventDefault();
    closeModal('addSessionModal'); 
}

export function closeEditSessionModal(event) { 
    if (event) event.preventDefault();
    closeModal('editSessionModal'); 
}

export function closeDeleteHallModal(event) { 
    if (event) event.preventDefault();
    closeModal('deleteHallModal'); 
}

export function closeDeleteMovieModal(event) { 
    if (event) event.preventDefault();
    closeModal('deleteMovieModal'); 
}

export function closeDeleteSessionModal(event) { 
    if (event) event.preventDefault();
    closeModal('deleteSessionModal'); 
}

export function closeAllModals(event) {
    if (event) event.preventDefault();
    document.querySelectorAll('.popup.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Вспомогательные функции для работы с модальными окнами
export function showLoadingModal(message = 'Загрузка...') {
    // Можно добавить универсальное модальное окно загрузки
    console.log('Loading:', message);
}

export function hideLoadingModal() {
    console.log('Loading complete');
}

export function showErrorModal(message) {
    // Можно добавить универсальное модальное окно ошибки
    console.error('Error:', message);
    if (window.notifications) {
        window.notifications.show(message, 'error');
    }
}
