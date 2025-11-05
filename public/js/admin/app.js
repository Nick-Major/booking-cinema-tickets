// app.js - весь JavaScript для админ-панели

document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    initAccordeon();
    initModals();
    initHalls(csrfToken);
    initMovies(csrfToken);
    initSessions(csrfToken);
    initSales(csrfToken);
    
    console.log('Admin panel initialized');
});

// ============================================================================
// АККОРДЕОН
// ============================================================================
function initAccordeon() {
    const headers = document.querySelectorAll('.conf-step__header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
}

// ============================================================================
// МОДАЛЬНЫЕ ОКНА
// ============================================================================
function initModals() {
    // Закрытие по клику на фон или крестик
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('popup') || e.target.closest('.popup__dismiss')) {
            closeAllModals();
        }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllModals();
    });
}

function closeAllModals() {
    document.querySelectorAll('.popup.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

function openModal(modalId) {
    closeAllModals();
    document.getElementById(modalId).classList.add('active');
}

// ============================================================================
// УПРАВЛЕНИЕ ЗАЛАМИ
// ============================================================================
function initHalls(csrfToken) {
    // Открытие модалки добавления зала
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-open-modal')) {
            openModal(e.target.getAttribute('data-open-modal'));
        }
    });

    // Удаление зала
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-hall')) {
            const hallId = e.target.getAttribute('data-delete-hall');
            const hallName = e.target.getAttribute('data-hall-name');
            deleteHall(hallId, hallName, csrfToken);
        }
    });

    // Обработка формы добавления зала
    const addHallForm = document.querySelector('#addHallModal form');
    if (addHallForm) {
        addHallForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createHall(this, csrfToken);
        });
    }
}

async function deleteHall(hallId, hallName, csrfToken) {
    if (!confirm(`Удалить зал "${hallName}"?`)) return;

    try {
        const response = await fetch(`/admin/halls/${hallId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Зал удален', 'success');
            const hallElement = document.querySelector(`[data-hall-id="${hallId}"]`);
            if (hallElement) hallElement.closest('li').remove();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при удалении', 'error');
    }
}

async function createHall(form, csrfToken) {
    const formData = new FormData(form);
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        if (response.ok) {
            showNotification('Зал создан', 'success');
            closeAllModals();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Ошибка при создании', 'error');
        }
    } catch (error) {
        showNotification('Ошибка при создании', 'error');
    }
}

// ============================================================================
// УПРАВЛЕНИЕ ФИЛЬМАМИ
// ============================================================================
function initMovies(csrfToken) {
    // Удаление фильма
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-movie')) {
            const movieId = e.target.getAttribute('data-delete-movie');
            const movieName = e.target.getAttribute('data-movie-name');
            deleteMovie(movieId, movieName, csrfToken);
        }
    });

    // Обработка формы добавления фильма
    const addMovieForm = document.querySelector('#addMovieModal form');
    if (addMovieForm) {
        addMovieForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createMovie(this, csrfToken);
        });
    }

    // Превью постера
    const posterInput = document.querySelector('input[name="movie_poster"]');
    if (posterInput) {
        posterInput.addEventListener('change', function(e) {
            previewMoviePoster(this);
        });
    }
}

async function deleteMovie(movieId, movieName, csrfToken) {
    if (!confirm(`Удалить фильм "${movieName}"?`)) return;

    try {
        const response = await fetch(`/admin/movies/${movieId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Фильм удален', 'success');
            const movieElement = document.querySelector(`[data-movie-id="${movieId}"]`);
            if (movieElement) movieElement.remove();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при удалении фильма', 'error');
    }
}

async function createMovie(form, csrfToken) {
    const formData = new FormData(form);
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        if (response.ok) {
            showNotification('Фильм добавлен', 'success');
            closeAllModals();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Ошибка при добавлении фильма', 'error');
        }
    } catch (error) {
        showNotification('Ошибка при добавлении фильма', 'error');
    }
}

function previewMoviePoster(input) {
    const preview = document.getElementById('posterPreview');
    if (!preview) return;

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%; object-fit:cover;">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================================================
// УПРАВЛЕНИЕ СЕАНСАМИ
// ============================================================================
function initSessions(csrfToken) {
    // Удаление сеанса
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-session')) {
            const sessionId = e.target.getAttribute('data-delete-session');
            const movieName = e.target.getAttribute('data-movie-name');
            deleteSession(sessionId, movieName, csrfToken);
        }
    });

    // Обработка формы добавления сеанса
    const addSessionForm = document.querySelector('#addSessionModal form');
    if (addSessionForm) {
        addSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createSession(this, csrfToken);
        });
    }
}

async function deleteSession(sessionId, movieName, csrfToken) {
    if (!confirm(`Удалить сеанс фильма "${movieName}"?`)) return;

    try {
        const response = await fetch(`/admin/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Сеанс удален', 'success');
            const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (sessionElement) sessionElement.remove();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при удалении сеанса', 'error');
    }
}

async function createSession(form, csrfToken) {
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/admin/sessions', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Сеанс создан', 'success');
            closeAllModals();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при создании сеанса', 'error');
    }
}

// ============================================================================
// УПРАВЛЕНИЕ ПРОДАЖАМИ
// ============================================================================
function initSales(csrfToken) {
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-toggle-sales')) {
            const hallId = e.target.getAttribute('data-toggle-sales');
            const isActive = e.target.getAttribute('data-is-active') === 'true';
            toggleSales(hallId, isActive, csrfToken);
        }
    });
}

async function toggleSales(hallId, isActive, csrfToken) {
    const action = isActive ? 'deactivate' : 'activate';
    
    try {
        const response = await fetch('/admin/toggle-sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({
                hall_id: hallId,
                action: action
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            // Обновляем кнопку
            const button = document.querySelector(`[data-toggle-sales="${hallId}"]`);
            if (button) {
                const newIsActive = !isActive;
                button.setAttribute('data-is-active', newIsActive);
                button.textContent = newIsActive ? 'Приостановить продажи' : 'Открыть продажи';
                button.classList.toggle('conf-step__button-warning', newIsActive);
                button.classList.toggle('conf-step__button-accent', !newIsActive);
                
                // Обновляем статус
                const statusElement = button.closest('li').querySelector('.sales-status');
                if (statusElement) {
                    statusElement.textContent = newIsActive ? 'Продажи открыты' : 'Продажи приостановлены';
                    statusElement.className = `sales-status ${newIsActive ? 'active' : 'inactive'}`;
                }
            }
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при изменении статуса продаж', 'error');
    }
}

// ============================================================================
// УВЕДОМЛЕНИЯ
// ============================================================================
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#16a6af' : '#dc3545'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        font-size: 1.4rem;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
