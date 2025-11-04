// =============================================
// PUBLIC/JS/ADMIN.JS - АДМИНСКАЯ ЧАСТЬ
// =============================================

// 1. УТИЛИТЫ И ОБЩИЕ ФУНКЦИИ
// =============================================

// Получение CSRF токена
function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.content : null;
}

// Показать сообщение об успехе
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Найти секцию по заголовку
function findSectionByTitle(title) {
    const headers = document.querySelectorAll('.conf-step__title');
    for (let header of headers) {
        if (header.textContent.trim() === title) {
            return header.closest('.conf-step');
        }
    }
    return null;
}

// Проверить пустой список залов
function checkEmptyHallList() {
    console.log('checkEmptyHallList called');
    const hallList = document.querySelector('.conf-step__list');
    console.log('Hall list children:', hallList?.children.length);
    
    if (hallList && hallList.children.length === 0) {
        console.log('Hall list is empty, adding message');
        hallList.innerHTML = '<li class="conf-step__empty">Нет созданных залов</li>';
        hideConfigurationSections();
    } else {
        console.log('Hall list has items, showing sections');
        showConfigurationSections();
    }
}

// Скрыть секции конфигураций
function hideConfigurationSections() {
    const sectionsToHide = [
        'Конфигурация залов',
        'Конфигурация цен', 
        'Сетка сеансов',
        'Открыть продажи'
    ];
    
    sectionsToHide.forEach(sectionTitle => {
        const section = findSectionByTitle(sectionTitle);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    document.getElementById('hallConfiguration').innerHTML = 
        '<p class="conf-step__paragraph">Сначала создайте зал</p>';
    document.getElementById('priceConfiguration').innerHTML = 
        '<p class="conf-step__paragraph">Сначала создайте зал</p>';
}

// Показать секции конфигураций
function showConfigurationSections() {
    const sectionsToShow = [
        'Конфигурация залов',
        'Конфигурация цен',
        'Сетка сеансов',
        'Открыть продажи'
    ];
    
    sectionsToShow.forEach(sectionTitle => {
        const section = findSectionByTitle(sectionTitle);
        if (section) {
            section.style.display = 'block';
        }
    });
}

// 2. УПРАВЛЕНИЕ АККОРДЕОНОМ
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    const headers = Array.from(document.querySelectorAll('.conf-step__header'));
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
});

// 3. УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// =============================================

// Открытие модалок
function openAddHallModal() {
    document.getElementById('addHallModal').classList.add('active');
}

function openAddMovieModal() {
    document.getElementById('addMovieModal').classList.add('active');
}

function openAddSessionModal() {
    document.getElementById('addSessionModal').classList.add('active');
}

// Закрытие модалок
function closeAddHallModal() {
    document.getElementById('addHallModal').classList.remove('active');
}

function closeAddMovieModal() {
    document.getElementById('addMovieModal').classList.remove('active');
}

function closeAddSessionModal() {
    document.getElementById('addSessionModal').classList.remove('active');
}

// Универсальное закрытие
document.addEventListener('click', function(event) {
    const modals = ['addHallModal', 'addMovieModal', 'addSessionModal', 'editMovieModal', 'editSessionModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Закрытие по ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.popup.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// 4. УПРАВЛЕНИЕ ЗАЛАМИ
// =============================================

// Загрузка конфигурации зала
function loadHallConfiguration(hallId) {
    fetch(`/admin/halls/${hallId}/configuration`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                throw new Error('Invalid response format');
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('hallConfiguration').innerHTML = html;
        })
        .catch(error => {
            document.getElementById('hallConfiguration').innerHTML = 
                '<p class="conf-step__paragraph">Сначала создайте зал</p>';
        });
}

// Удаление зала
// Удаление зала
function deleteHall(id) {
    console.log('deleteHall called with id:', id);
    
    const hallIdToDelete = id;
    
    if (confirm('Вы уверены, что хотите удалить этот зал?')) {
        console.log('Confirm approved, deleting hall:', hallIdToDelete);
        fetch(`/admin/halls/${hallIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('Delete response status:', response.status);
            if (response.ok || response.status === 204) {
                // Удаляем из списка залов
                const hallListItems = document.querySelectorAll('.conf-step__list li');
                hallListItems.forEach(li => {
                    // Ищем кнопку с нужным onclick - ИСПРАВЛЕННЫЕ КАВЫЧКИ
                    const deleteButton = li.querySelector(`button[onclick="deleteHall(${hallIdToDelete})"]`);
                    if (deleteButton) {
                        console.log('Found hall list item to remove:', li);
                        li.remove();
                    }
                });

                updateHallSelectors(hallIdToDelete);
                showSuccessMessage('Зал успешно удален!');
                checkEmptyHallList();

            } else {
                return response.json().then(data => {
                    alert('Ошибка при удалении зала: ' + (data.message || 'Неизвестная ошибка'));
                });
            }
        })
        .catch(error => {
            alert('Ошибка сети при удалении зала');
        });
    } else {
        console.log('Confirm cancelled');
    }
}

// Обновление интерфейса при удалении зала
function updateHallSelectors(deletedHallId) {
    console.log('updateHallSelectors called with:', deletedHallId);
    
    const hallRadio = document.querySelector(`input[value="${deletedHallId}"]`);
    console.log('Found hall radio:', hallRadio);
    if (hallRadio) {
        hallRadio.closest('li').remove();
        console.log('Hall radio removed');
    }

    const priceRadio = document.querySelector(`input[name="prices-hall"][value="${deletedHallId}"]`);
    console.log('Found price radio:', priceRadio);
    if (priceRadio) {
        priceRadio.closest('li').remove();
        console.log('Price radio removed');
    }

    const remainingHalls = document.querySelectorAll('input[name="chairs-hall"]');
    console.log('Remaining halls:', remainingHalls.length);

    if (remainingHalls.length === 0) {
        console.log('No halls left, hiding sections');
        hideConfigurationSections();
    } else {
        console.log('Halls remain, updating configurations');
        const firstHallRadio = document.querySelector('input[name="chairs-hall"]');
        if (firstHallRadio) {
            loadHallConfiguration(firstHallRadio.value);
        }

        const firstPriceRadio = document.querySelector('input[name="prices-hall"]');
        if (firstPriceRadio) {
            loadPriceConfiguration(firstPriceRadio.value);
        }
    }
}

// Сброс конфигурации зала
function resetHallLayout(hallId) {
    if (confirm('Вы уверены, что хотите сбросить конфигурацию зала? Все изменения будут потеряны.')) {
        loadHallConfiguration(hallId);
    }
}

// Генерация схемы зала
function generateHallLayout(hallId) {
    const rowsInput = document.querySelector('.hall-configuration .rows-input');
    const seatsInput = document.querySelector('.hall-configuration .seats-input');
    
    if (!rowsInput || !seatsInput) {
        alert('Элементы формы не найдены');
        return;
    }
    
    const rows = rowsInput.value;
    const seatsPerRow = seatsInput.value;
    
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
        alert('Ошибка при сохранении конфигурации');
    });
}

// 5. УПРАВЛЕНИЕ ЦЕНАМИ
// =============================================

// Загрузка конфигурации цен
function loadPriceConfiguration(hallId) {
    fetch(`/admin/halls/${hallId}/prices`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                throw new Error('Invalid response format');
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('priceConfiguration').innerHTML = html;
        })
        .catch(error => {
            document.getElementById('priceConfiguration').innerHTML = 
                '<p class="conf-step__paragraph">Сначала создайте зал</p>';
        });
}

// Сохранение цен
function savePrices(hallId) {
    const regularPriceInput = document.querySelector('.regular-price-input');
    const vipPriceInput = document.querySelector('.vip-price-input');
    
    if (!regularPriceInput || !vipPriceInput) {
        alert('Элементы формы не найдены');
        return;
    }
    
    const regularPrice = regularPriceInput.value;
    const vipPrice = vipPriceInput.value;
    
    fetch(`/admin/halls/${hallId}/update-prices`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
        },
        body: JSON.stringify({
            regular_price: regularPrice,
            vip_price: vipPrice
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Цены сохранены!');
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        alert('Ошибка при сохранении цен');
    });
}

// 6. УПРАВЛЕНИЕ ФИЛЬМАМИ
// =============================================

// Открытие модалки редактирования фильма
function openEditMovieModal(movieId) {
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

// 7. УПРАВЛЕНИЕ СЕАНСАМИ
// =============================================

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
        alert('Ошибка при сохранении сеанса');
    });
}

// Открытие модалки редактирования сеанса
function openEditSessionModal(sessionId) {
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

// 8. ОБЩИЕ АДМИНСКИЕ ФУНКЦИИ
// =============================================

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
        alert('Ошибка при переключении продаж');
    });
}
