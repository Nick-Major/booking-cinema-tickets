import { getCsrfToken, showSuccessMessage } from './utils.js';

// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
export function initModalManager() {
    console.log('Modal manager initialized');

    // ОТКРЫТИЕ МОДАЛОК
    window.openAddHallModal = function() {
        document.getElementById('addHallModal').classList.add('active');
    }

    window.openAddMovieModal = function() {
        document.getElementById('addMovieModal').classList.add('active');
    }

    window.openAddSessionModal = function() {
        document.getElementById('addSessionModal').classList.add('active');
    }

    window.openEditMovieModal = function(movieId) {
        fetch(`/admin/movies/${movieId}/edit`)
            .then(response => response.text())
            .then(html => {
                const existingModal = document.getElementById('editMovieModal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                document.body.insertAdjacentHTML('beforeend', html);
                document.getElementById('editMovieModal').classList.add('active');
            })
            .catch(error => console.error('Error:', error));
    }

    window.openEditSessionModal = function(sessionId) {
        fetch(`/admin/sessions/${sessionId}/edit`)
            .then(response => response.text())
            .then(html => {
                const existingModal = document.getElementById('editSessionModal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                document.body.insertAdjacentHTML('beforeend', html);
                document.getElementById('editSessionModal').classList.add('active');
            })
            .catch(error => console.error('Error:', error));
    }

    // ЗАКРЫТИЕ МОДАЛОК
    window.closeAddHallModal = function() {
        document.getElementById('addHallModal').classList.remove('active');
    }

    window.closeAddMovieModal = function() {
        document.getElementById('addMovieModal').classList.remove('active');
    }

    window.closeAddSessionModal = function() {
        document.getElementById('addSessionModal').classList.remove('active');
    }

    window.closeEditMovieModal = function() {
        const modal = document.getElementById('editMovieModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    window.closeEditSessionModal = function() {
        const modal = document.getElementById('editSessionModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    window.closeDeleteHallModal = function() {
        document.getElementById('deleteHallModal').classList.remove('active');
        window.currentHallToDelete = null;
    }

    window.closeDeleteMovieModal = function() {
        document.getElementById('deleteMovieModal').classList.remove('active');
        window.currentMovieToDelete = null;
    }

    window.closeDeleteSessionModal = function() {
        document.getElementById('deleteSessionModal').classList.remove('active');
        window.currentSessionToDelete = null;
    }

    // УНИВЕРСАЛЬНОЕ ЗАКРЫТИЕ
    document.addEventListener('click', function(event) {
        const modals = [
            'addHallModal', 'addMovieModal', 'addSessionModal', 
            'editMovieModal', 'editSessionModal',
            'deleteHallModal', 'deleteMovieModal', 'deleteSessionModal'
        ];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                modal.classList.remove('active');
                
                // Сброс переменных при закрытии
                if (modalId === 'deleteHallModal') window.currentHallToDelete = null;
                if (modalId === 'deleteMovieModal') window.currentMovieToDelete = null;
                if (modalId === 'deleteSessionModal') window.currentSessionToDelete = null;
            }
        });
    });

    // ЗАКРЫТИЕ ПО ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.popup.active').forEach(modal => {
                modal.classList.remove('active');
                
                // Сброс переменных при закрытии
                if (modal.id === 'deleteHallModal') window.currentHallToDelete = null;
                if (modal.id === 'deleteMovieModal') window.currentMovieToDelete = null;
                if (modal.id === 'deleteSessionModal') window.currentSessionToDelete = null;
            });
        }
    });

    // УПРАВЛЕНИЕ УДАЛЕНИЕМ ФИЛЬМОВ И СЕАНСОВ
    window.currentMovieToDelete = null;
    window.currentSessionToDelete = null;

    window.deleteMovie = function(id, name) {
        console.log('deleteMovie called with id:', id, 'name:', name);
        window.openDeleteMovieModal(id, name);
    }

    window.openDeleteMovieModal = function(movieId, movieName) {
        window.currentMovieToDelete = movieId;
        document.getElementById('movieIdToDelete').value = movieId;
        document.getElementById('movieNameToDelete').textContent = '"' + movieName + '"';
        document.getElementById('deleteMovieModal').classList.add('active');
    }

    window.deleteSession = function(id, movieName) {
        console.log('deleteSession called with id:', id, 'movie:', movieName);
        window.openDeleteSessionModal(id, movieName);
    }

    window.openDeleteSessionModal = function(sessionId, movieName) {
        window.currentSessionToDelete = sessionId;
        document.getElementById('sessionIdToDelete').value = sessionId;
        document.getElementById('sessionMovieNameToDelete').textContent = '"' + movieName + '"';
        document.getElementById('deleteSessionModal').classList.add('active');
    }

    // ОБРАБОТКА ФОРМ УДАЛЕНИЯ
    const deleteMovieForm = document.getElementById('deleteMovieForm');
    if (deleteMovieForm) {
        deleteMovieForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (window.currentMovieToDelete) {
                window.performMovieDeletion(window.currentMovieToDelete);
            }
        });
    }

    // Обработчик формы удаления сеанса
    const deleteSessionForm = document.getElementById('deleteSessionForm');
    if (deleteSessionForm) {
        deleteSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const sessionId = document.getElementById('sessionIdToDelete').value;
            if (!sessionId) {
                alert('Ошибка: ID сеанса не указан');
                return;
            }

            fetch(`/admin/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Закрываем модалку
                    closeDeleteSessionModal();
                    // Показываем сообщение
                    showSuccessMessage(data.message);
                    // Удаляем сеанс из DOM без перезагрузки
                    removeSessionFromDOM(sessionId);
                } else {
                    alert('Ошибка: ' + data.message);
                }
            })
            .catch(error => {
                alert('Ошибка при удалении сеанса: ' + error.message);
            });
        });
    }

    // Функция для удаления сеанса из DOM
    function removeSessionFromDOM(sessionId) {
        const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (sessionElement) {
            sessionElement.remove();
        }
        // Если в timeline не осталось сеансов, показываем сообщение
        const timeline = document.querySelector('.conf-step__seances-timeline');
        if (timeline && timeline.children.length === 0) {
            timeline.innerHTML = '<div class="conf-step__empty-seances"><p>Нет созданных сеансов</p></div>';
        }
    }
}
