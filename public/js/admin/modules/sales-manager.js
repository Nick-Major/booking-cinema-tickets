import { getCsrfToken, showSuccessMessage } from './utils.js';

// УПРАВЛЕНИЕ ПРОДАЖАМИ
export function initSalesManager() {
    console.log('Sales manager initialized');
    
    // ПЕРЕКЛЮЧЕНИЕ ПРОДАЖ
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
