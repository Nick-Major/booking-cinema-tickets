// Конфигурация залов

// Загрузка конфигурации зала
window.loadHallConfiguration = function(hallId) {
    fetch(`/admin/halls/${hallId}/configuration`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('hallConfiguration').innerHTML = html;
        })
        .catch(error => console.error('Error:', error));
}

// Удаление зала
window.deleteHall = function(hallId) {
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

// Генерация схемы зала
window.generateHallLayout = function(hallId) {
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
window.changeSeatType = function(element) {
    const types = ['regular', 'vip', 'blocked'];
    const currentType = element.dataset.type;
    const currentIndex = types.indexOf(currentType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    element.dataset.type = nextType;
    element.className = `conf-step__chair conf-step__chair_${nextType === 'regular' ? 'standart' : nextType}`;
}

// Сохранение конфигурации зала
window.saveHallConfiguration = function(hallId) {
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
}

// Сброс схемы зала
window.resetHallLayout = function(hallId) {
    if (confirm('Сбросить текущую схему?')) {
        document.querySelector(`#hallLayout-${hallId}`).innerHTML = '<p class="conf-step__paragraph">Схема сброшена</p>';
    }
}
