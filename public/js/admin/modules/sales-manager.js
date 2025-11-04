import { getCsrfToken, showSuccessMessage } from './utils.js';

// УПРАВЛЕНИЕ ПРОДАЖАМИ
export function initSalesManager() {
    console.log('Sales manager initialized');

    // ПЕРЕКЛЮЧЕНИЕ ПРОДАЖ ДЛЯ КОНКРЕТНОГО ЗАЛА
    window.toggleSales = function(hallId, hallName, isCurrentlyActive) {
        const action = isCurrentlyActive ? 'deactivate' : 'activate';

        fetch('/admin/toggle-sales', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                hall_id: hallId,
                action: action 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем кнопку для этого зала
                const button = document.querySelector(`[data-hall-id="${hallId}"]`);
                if (button) {
                    button.textContent = data.is_active 
                        ? 'Приостановить продажу билетов' 
                        : 'Открыть продажу билетов';
                    button.setAttribute('data-is-active', data.is_active);
                    // Меняем класс кнопки
                    button.className = data.is_active 
                        ? 'conf-step__button conf-step__button-small conf-step__button-warning'
                        : 'conf-step__button conf-step__button-small conf-step__button-accent';
                    
                    // Обновляем статус текста
                    const statusSpan = button.parentElement.querySelector('span');
                    if (statusSpan) {
                        statusSpan.textContent = data.is_active ? 'Продажи открыты' : 'Продажи приостановлены';
                        statusSpan.style.color = data.is_active ? 'green' : 'red';
                    }
                }
                showSuccessMessage(data.message);
            } else {
                alert('Ошибка: ' + data.message);
            }
        })
        .catch(error => {
            alert('Ошибка при переключении продаж');
        });
    }
}
