// Модуль управления продажами билетов
class SalesManager {
    constructor(notificationSystem) {
        this.notifications = notificationSystem;
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('✅ SalesManager initialized');
    }

    bindEvents() {
        // Обработчик для кнопок управления продажами
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-toggle-sales')) {
                e.preventDefault();
                this.handleToggleSales(e.target);
            }
        });
    }

    async handleToggleSales(button) {
        const hallId = button.getAttribute('data-toggle-sales');
        const isActive = button.getAttribute('data-is-active') === 'true';
        
        try {
            await this.toggleHallSales(hallId, isActive, button);
        } catch (error) {
            console.error('Error toggling sales:', error);
            this.showNotification('Ошибка при изменении статуса продаж', 'error');
        }
    }

    async toggleHallSales(hallId, currentStatus, button) {
        const response = await fetch('/admin/toggle-sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                hall_id: hallId,
                action: currentStatus ? 'deactivate' : 'activate'
            })
        });

        const data = await response.json();

        if (data.success) {
            this.updateUI(button, data.is_active);
            this.showNotification(data.message, 'success');
        } else {
            this.showNotification(data.message, 'error');
        }
    }

    updateUI(button, isActive) {
        // Обновляем данные кнопки
        button.setAttribute('data-is-active', isActive);
        
        // Обновляем текст кнопки согласно ТЗ
        button.textContent = isActive 
            ? 'Приостановить продажу билетов' 
            : 'Открыть продажу билетов';
        
        // Обновляем классы кнопки
        button.classList.toggle('conf-step__button-warning', isActive);
        button.classList.toggle('conf-step__button-accent', !isActive);
        
        // Обновляем текстовый статус
        const listItem = button.closest('li');
        const statusSpan = listItem.querySelector('.sales-status');
        if (statusSpan) {
            statusSpan.textContent = isActive ? 'Продажи открыты' : 'Продажи приостановлены';
            statusSpan.className = 'sales-status ' + (isActive ? 'active' : 'inactive');
        }
    }

    showNotification(message, type = 'info') {
        if (this.notifications && typeof this.notifications.show === 'function') {
            this.notifications.show(message, type);
        } else {
            // Fallback для случаев, когда система уведомлений не доступна
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Метод для принудительного обновления статуса (может пригодиться)
    updateSalesStatus(hallId, isActive) {
        const button = document.querySelector(`[data-toggle-sales="${hallId}"]`);
        if (button) {
            this.updateUI(button, isActive);
        }
    }

    // Метод для массового управления (может пригодиться в будущем)
    bulkToggleSales(action) {
        const buttons = document.querySelectorAll('[data-toggle-sales]');
        buttons.forEach(button => {
            const isActive = button.getAttribute('data-is-active') === 'true';
            if ((action === 'activate' && !isActive) || (action === 'deactivate' && isActive)) {
                this.handleToggleSales(button);
            }
        });
    }
}

// Экспорт класса
export default SalesManager;
