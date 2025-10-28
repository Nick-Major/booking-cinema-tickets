// Аккордеон для секций админки
document.addEventListener('DOMContentLoaded', function() {
    const headers = Array.from(document.querySelectorAll('.conf-step__header'));
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
});

// Функции для управления модальными окнами
function openAddHallModal() {
    document.getElementById('addHallModal').classList.add('active');
}

function closeAddHallModal() {
    document.getElementById('addHallModal').classList.remove('active');
}

function openAddMovieModal() {
    document.getElementById('addMovieModal').classList.add('active');
}

function closeAddMovieModal() {
    document.getElementById('addMovieModal').classList.remove('active');
}

function openAddSessionModal() {
    document.getElementById('addSessionModal').classList.add('active');
}

function closeAddSessionModal() {
    document.getElementById('addSessionModal').classList.remove('active');
}

// Универсальное закрытие модалок по клику вне контента
document.addEventListener('click', function(event) {
    const modals = ['addHallModal', 'addMovieModal', 'addSessionModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Универсальное закрытие модалок по ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.popup.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Загрузка конфигурации зала
function loadHallConfiguration(hallId) {
    fetch(`/admin/halls/${hallId}/configuration`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('hallConfiguration').innerHTML = html;
        })
        .catch(error => console.error('Error:', error));
}

// Загрузка конфигурации цен
function loadPriceConfiguration(hallId) {
    fetch(`/admin/halls/${hallId}/prices`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('priceConfiguration').innerHTML = html;
        })
        .catch(error => console.error('Error:', error));
}

// Удаление зала
function deleteHall(hallId) {
    if (confirm('Вы уверены, что хотите удалить этот зал?')) {
        fetch(`/admin/halls/${hallId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                location.reload();
            } else {
                alert('Ошибка при удалении зала');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

// Сохранение сеанса
function saveSession() {
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

// Переключение продаж
function toggleSales() {
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

// Генерация схемы зала
function generateHallLayout(hallId) {
    const rows = document.querySelector('.rows-input').value;
    const seatsPerRow = document.querySelector('.seats-input').value;
    
    if (!rows || !seatsPerRow) {
        alert('Укажите количество рядов и мест');
        return;
    }
    
    fetch(`/admin/halls/${hallId}/generate-layout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
        },
        body: JSON.stringify({ rows, seats_per_row: seatsPerRow })
    })
    .then(response => response.text())
    .then(html => {
        document.getElementById(`hallLayout-${hallId}`).innerHTML = html;
    })
    .catch(error => console.error('Error:', error));
}

// Изменение типа места
function changeSeatType(element) {
    const types = ['regular', 'vip', 'blocked'];
    const currentType = element.dataset.type;
    const currentIndex = types.indexOf(currentType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    element.dataset.type = nextType;
    element.className = `conf-step__chair conf-step__chair_${nextType === 'regular' ? 'standart' : nextType}`;
}

// Сохранение конфигурации зала
function saveHallConfiguration(hallId) {
    const seats = [];
    
    document.querySelectorAll('.conf-step__chair[data-row]').forEach(seat => {
        seats.push({
            row: seat.dataset.row,
            seat: seat.dataset.seat,
            type: seat.dataset.type
        });
    });
    
    fetch(`/admin/halls/${hallId}/save-configuration`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
        },
        body: JSON.stringify({ seats })
    })
    .then(response => response.json())
    .then(data => {
        alert('Конфигурация сохранена!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка при сохранении конфигурации');
    });

    // Управление модалкой редактирования фильма
    function openEditMovieModal(movieId) {
        // Загружаем форму редактирования
        fetch(`/admin/movies/${movieId}/edit`)
            .then(response => response.text())
            .then(html => {
                // Добавляем модалку в DOM если её нет
                if (!document.getElementById('editMovieModal')) {
                    document.body.insertAdjacentHTML('beforeend', html);
                }
                document.getElementById('editMovieModal').classList.add('active');
            })
            .catch(error => console.error('Error:', error));
    }

    function closeEditMovieModal() {
        const modal = document.getElementById('editMovieModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Переключение активности фильма
    function toggleMovieActive(movieId) {
        fetch(`/admin/movies/${movieId}/toggle-active`, {
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

    // Управление модалкой редактирования сеанса
    function openEditSessionModal(sessionId) {
        fetch(`/admin/sessions/${sessionId}/edit`)
            .then(response => response.text())
            .then(html => {
                if (!document.getElementById('editSessionModal')) {
                    document.body.insertAdjacentHTML('beforeend', html);
                }
                document.getElementById('editSessionModal').classList.add('active');
            })
            .catch(error => console.error('Error:', error));
    }

    function closeEditSessionModal() {
        const modal = document.getElementById('editSessionModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Удаление сеанса
    function deleteSession(sessionId) {
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
    function toggleSessionActual(sessionId) {
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
    function cleanupOldSessions() {
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
}