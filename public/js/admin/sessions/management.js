// Управление сеансами

// Сохранение сеанса
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
            closeAddSessionModal();
            location.reload();
        } else {
            alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка при сохранении сеанса');
    });
}

// Управление модалкой редактирования сеанса
window.openEditSessionModal = function(sessionId) {
    fetch(`/admin/sessions/${sessionId}/edit`)
        .then(response => response.text())
        .then(html => {
            // Удаляем существующую модалку если есть
            const existingModal = document.getElementById('editSessionModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Добавляем новую модалку
            document.body.insertAdjacentHTML('beforeend', html);
            document.getElementById('editSessionModal').classList.add('active');
        })
        .catch(error => console.error('Error:', error));
}

window.closeEditSessionModal = function() {
    const modal = document.getElementById('editSessionModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Удаление сеанса
window.deleteSession = function(sessionId) {
    if (confirm('Вы уверены, что хотите удалить этот сеанс?')) {
        fetch(`/admin/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => {
            if (response.ok) {
                closeEditSessionModal();
                location.reload();
            } else {
                alert('Ошибка при удалении сеанса');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

// Переключение активности сеанса
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
            alert(data.message);
            location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
}

// Очистка устаревших сеансов
window.cleanupOldSessions = function() {
    if (confirm('Удалить все устаревшие сеансы?')) {
        fetch('/admin/sessions/cleanup', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload();
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

// Переключение продаж
window.toggleSales = function() {
    const button = document.getElementById('salesButton');
    const action = button.textContent.includes('Открыть') ? 'activate' : 'deactivate';
    
    fetch('/admin/toggle-sales', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            button.textContent = action === 'activate' 
                ? 'Приостановить продажу билетов' 
                : 'Открыть продажу билетов';
            alert(data.message);
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка при переключении продаж');
    });
}
