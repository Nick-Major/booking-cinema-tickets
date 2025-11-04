import { getCsrfToken, showSuccessMessage } from './utils.js';

// УПРАВЛЕНИЕ СЕАНСАМИ
export function initSessionManager() {
    console.log('Session manager initialized');

    // УДАЛЕНИЕ СЕАНСА
    window.performSessionDeletion = function(sessionId) {
        console.log('performSessionDeletion called with id:', sessionId);
        
        fetch(`/admin/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('Delete session response status:', response.status);
            if (response.ok || response.status === 204) {
                window.closeDeleteSessionModal();
                showSuccessMessage('Сеанс успешно удален!');
                location.reload(); // Перезагружаем страницу для обновления списка
            } else {
                return response.json().then(data => {
                    alert('Ошибка при удалении сеанса: ' + (data.message || 'Неизвестная ошибка'));
                });
            }
        })
        .catch(error => {
            alert('Ошибка сети при удалении сеанса');
        });
    }

    // СОХРАНЕНИЕ СЕАНСА
    window.saveSession = function() {
        const form = document.getElementById('sessionForm');
        const formData = new FormData(form);
        
        fetch('/admin/sessions', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                window.closeAddSessionModal();
                location.reload();
            } else {
                alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            alert('Ошибка при сохранении сеанса');
        });
    }

    // УДАЛЕНИЕ СЕАНСА
    window.deleteSession = function(sessionId, movieTitle) {
        if (confirm(`Вы уверены, что хотите удалить сеанс фильма "${movieTitle}"?`)) {
            fetch(`/admin/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    showSuccessMessage('Сеанс успешно удален!');
                    location.reload();
                } else {
                    alert('Ошибка при удалении сеанса');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ошибка сети при удалении сеанса');
            });
        }
    }

    // СОХРАНЕНИЕ СЕАНСОВ (НЕДОСТАЮЩАЯ ФУНКЦИЯ)
    window.saveSessions = function() {
        const form = document.getElementById('sessionForm');
        const formData = new FormData(form);
        
        fetch('/admin/sessions', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok');
        })
        .then(data => {
            if (data.id) {
                window.closeAddSessionModal();
                location.reload();
            } else {
                alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            alert('Ошибка при сохранении сеанса: ' + error.message);
        });
    }

    // ПЕРЕКЛЮЧЕНИЕ АКТУАЛЬНОСТИ СЕАНСА
    window.toggleSessionActual = function(sessionId) {
        fetch(`/admin/sessions/${sessionId}/toggle-actual`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessMessage(data.message);
                // Можно обновить интерфейс без перезагрузки
                const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
                if (sessionElement) {
                    sessionElement.style.opacity = data.is_actual ? '1' : '0.5';
                }
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // ПОЛУЧЕНИЕ СЕАНСОВ ДЛЯ ЗАЛА
    window.getHallSessions = function(hallId, date = null) {
        let url = `/admin/sessions/hall/${hallId}`;
        if (date) {
            url += `?date=${date}`;
        }
        
        return fetch(url)
            .then(response => response.json())
            .then(sessions => {
                console.log('Sessions for hall:', sessions);
                return sessions;
            })
            .catch(error => {
                console.error('Error fetching hall sessions:', error);
                return [];
            });
    }

    // ОЧИСТКА УСТАРЕВШИХ СЕАНСОВ
    window.cleanupOldSessions = function() {
        if (confirm('Вы уверены, что хотите удалить все устаревшие сеансы?')) {
            fetch('/admin/sessions/cleanup', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccessMessage(data.message);
                    location.reload();
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }

    // ОБНОВЛЕНИЕ СЕАНСА
    window.updateSession = function(sessionId) {
        const form = document.getElementById('editSessionForm');
        const formData = new FormData(form);
        
        fetch(`/admin/sessions/${sessionId}`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                window.closeEditSessionModal();
                location.reload();
            } else {
                alert('Ошибка при обновлении сеанса');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    console.log('✓ Session manager fully initialized');
}
