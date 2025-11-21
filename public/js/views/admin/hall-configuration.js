// @ts-nocheck

// Безопасная функция уведомлений
function showSafeNotification(message, type = 'info') {
    if (window.notifications && typeof window.notifications.show === 'function') {
        try {
            window.notifications.show(message, type);
        } catch (notificationError) {
            console.error('Notification system error:', notificationError);
            alert(message);
        }
    } else {
        console.log(`[${type}] ${message}`);
        alert(message);
    }
}

export async function generateHallLayout(hallId) {
    try {
        // Получаем значения из полей ввода
        const rowsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .rows-input`);
        const seatsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .seats-input`);

        if (!rowsInput || !seatsInput) {
            throw new Error('Поля ввода не найдены');
        }

        const rows = parseInt(rowsInput.value);
        const seatsPerRow = parseInt(seatsInput.value);

        if (!rows || !seatsPerRow || rows < 1 || seatsPerRow < 1) {
            throw new Error('Введите корректные значения для рядов и мест');
        }

        const response = await fetch(`/admin/halls/${hallId}/generate-layout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                rows: rows,
                seats_per_row: seatsPerRow
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();

        const container = document.getElementById('hallLayout-' + hallId);
        if (container) {
            container.innerHTML = html;
            showSafeNotification('Схема зала сгенерирована', 'success');
        } else {
            throw new Error('Контейнер для схемы не найден');
        }

    } catch (error) {
        console.error('Error generating layout:', error);
        showSafeNotification('Ошибка при генерации схемы: ' + error.message, 'error');
    }
}

export function changeSeatType(element) {
    const currentType = element.getAttribute('data-type');
    const types = ['regular', 'vip', 'blocked'];
    const currentIndex = types.indexOf(currentType);
    const nextType = types[(currentIndex + 1) % types.length];

    element.setAttribute('data-type', nextType);
    element.className = `conf-step__chair ${getSeatClass(nextType)}`;
}

function getSeatClass(type) {
    switch(type) {
        case 'regular': return 'conf-step__chair_standart';
        case 'vip': return 'conf-step__chair_vip';
        case 'blocked': return 'conf-step__chair_disabled';
        default: return 'conf-step__chair_standart';
    }
}

// Функции для сброса конфигурации зала
export function openResetHallConfigurationModal(hallId, hallName) {
    const modal = document.getElementById('resetHallConfigurationModal');
    if (!modal) {
        console.error('Reset hall configuration modal not found');
        showSafeNotification('Модальное окно сброса не найдено', 'error');
        return;
    }

    // Заполняем модальное окно данными
    modal.querySelector('input[name="hall_id"]').value = hallId;
    modal.querySelector('#hallNameToReset').textContent = hallName;

    // Показываем модальное окно
    modal.classList.add('active');
}

export function closeResetHallConfigurationModal() {
    const modal = document.getElementById('resetHallConfigurationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

export async function resetHallConfiguration(hallId) {
    try {
        console.log('Resetting configuration for hall:', hallId);

        const response = await fetch(`/admin/halls/${hallId}/reset-configuration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showSafeNotification(result.message, 'success');

            // Очищаем схему зала
            const container = document.getElementById('hallLayout-' + hallId);
            if (container) {
                container.innerHTML = '<div class="conf-step__empty-track"><p>Схема зала сброшена. Сгенерируйте новую схему.</p></div>';
            }

            // Сбрасываем поля ввода
            const rowsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .rows-input`);
            const seatsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .seats-input`);
            if (rowsInput) rowsInput.value = '';
            if (seatsInput) seatsInput.value = '';

            // Закрываем модальное окно
            closeResetHallConfigurationModal();

        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error resetting hall configuration:', error);
        showSafeNotification('Ошибка при сбросе конфигурации: ' + error.message, 'error');
    }
}

export async function saveHallConfiguration(hallId) {
    try {
        const seats = [];

        // Собираем только места из схемы зала, исключая легенду
        const hallContainer = document.getElementById('hallLayout-' + hallId);
        if (!hallContainer) {
            throw new Error('Контейнер схемы зала не найден');
        }

        hallContainer.querySelectorAll('.conf-step__chair').forEach(seat => {
            const row = seat.getAttribute('data-row');
            const seatNum = seat.getAttribute('data-seat');
            const type = seat.getAttribute('data-type');

            // Проверяем, что это действительное место (имеет числовые row и seat)
            if (row && seatNum && !isNaN(row) && !isNaN(seatNum)) {
                seats.push({
                    row: parseInt(row),
                    seat: parseInt(seatNum),
                    type: type
                });
            }
        });

        console.log('Saving configuration for hall:', hallId, 'Valid seats:', seats);

        if (seats.length === 0) {
            throw new Error('Не найдено действительных мест для сохранения');
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

        const response = await fetch(`/admin/halls/${hallId}/save-configuration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ seats })
        });

        const responseText = await response.text();
        console.log('Response status:', response.status, 'Response:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error(`Сервер вернул некорректный ответ: ${responseText.substring(0, 100)}...`);
        }

        if (result.success) {
            showSafeNotification('Конфигурация сохранена успешно!', 'success');
        } else {
            throw new Error(result.message || 'Ошибка при сохранении');
        }
    } catch (error) {
        console.error('Error saving configuration:', error);
        showSafeNotification('Ошибка при сохранении конфигурации: ' + error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('resetHallConfigurationForm');
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const hallId = this.querySelector('input[name="hall_id"]').value;
            resetHallConfiguration(hallId);
        });
    }
});
