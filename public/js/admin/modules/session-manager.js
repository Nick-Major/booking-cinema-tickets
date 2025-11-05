import { getCsrfToken, showSuccessMessage } from './utils.js';
import { validateForm } from './validation.js';

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

        // Валидация формы
        if (!validateForm('sessionForm')) {
            return;
        }

        const formData = new FormData(form);

        // ДЕБАГ: посмотрим что в formData
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key + ': ' + value);
        }

        console.log('Saving session with data:');
        for (let [key, value] of formData.entries()) {
            console.log(key + ': ' + value);
        }

        fetch('/admin/sessions', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json', // ← Важно: говорим серверу что хотим JSON
                'X-Requested-With': 'XMLHttpRequest' // ← Важно: указываем что это AJAX
            },
            body: formData
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                // Если статус не 200-299, пробуем прочитать как текст для диагностики
                return response.text().then(text => {
                    console.log('Error response text:', text);
                    throw new Error(`HTTP error! status: ${response.status}`);
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            
            if (data.success) {
                console.log('Session created successfully!');
                window.closeAddSessionModal();
                location.reload();
            } else {
                alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert('Ошибка при сохранении сеанса: ' + error.message);
        });
    }

    // // УДАЛЕНИЕ СЕАНСА
    // window.deleteSession = function(sessionId, movieTitle) {
    //     if (confirm(`Вы уверены, что хотите удалить сеанс фильма "${movieTitle}"?`)) {
    //         fetch(`/admin/sessions/${sessionId}`, {
    //             method: 'DELETE',
    //             headers: {
    //                 'X-CSRF-TOKEN': getCsrfToken(),
    //                 'Content-Type': 'application/json',
    //                 'Accept': 'application/json',
    //                 'X-Requested-With': 'XMLHttpRequest' // Явно указываем что это AJAX
    //             }
    //         })
    //         .then(response => {
    //             if (!response.ok) {
    //                 return response.json().then(data => {
    //                     throw new Error(data.message || 'Ошибка сервера');
    //                 });
    //             }
    //             return response.json();
    //         })
    //         .then(data => {
    //             if (data.success) {
    //                 showSuccessMessage(data.message);
    //                 setTimeout(() => {
    //                     location.reload();
    //                 }, 1000);
    //             } else {
    //                 alert('Ошибка: ' + data.message);
    //             }
    //         })
    //         .catch(error => {
    //             alert('Ошибка при удалении сеанса: ' + error.message);
    //         });
    //     }
    // }

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

// УПРАВЛЕНИЕ ОТОБРАЖЕНИЕМ КНОПОК СЕАНСОВ
window.showSessionControls = function(element) {
    const controls = element.querySelector('.conf-step__seances-controls');
    if (controls) {
        controls.style.display = 'flex';
    }
}

window.hideSessionControls = function(element) {
    const controls = element.querySelector('.conf-step__seances-controls');
    if (controls) {
        controls.style.display = 'none';
    }
}
