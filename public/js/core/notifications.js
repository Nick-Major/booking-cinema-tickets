// Система уведомлений
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.init();
    }

    createContainer() {
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    init() {
        // Автоматически конвертируем существующие Blade уведомления
        this.convertBladeNotifications();
    }

    convertBladeNotifications() {
        const existingNotifications = document.querySelectorAll('.conf-step__wrapper[style*="background"]');
        
        existingNotifications.forEach(bladeNotification => {
            // Определяем тип уведомления по цвету
            let type = 'info';
            if (bladeNotification.style.background.includes('#d4edda')) type = 'success';
            if (bladeNotification.style.background.includes('#f8d7da')) type = 'error';
            
            const message = bladeNotification.textContent.trim();
            
            // Создаем новое уведомление
            this.show(message, type);
            
            // Удаляем старое уведомление
            bladeNotification.remove();
        });
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            border: 1px solid ${this.getBorderColor(type)};
            color: ${this.getTextColor(type)};
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            cursor: pointer;
            animation: slideInRight 0.3s ease;
            position: relative;
            max-width: 350px;
        `;

        notification.innerHTML = `
            ${message}
            <span style="
                position: absolute;
                top: 5px;
                right: 10px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                opacity: 0.7;
            ">×</span>
        `;

        // Добавляем в контейнер
        this.container.appendChild(notification);

        // Обработчики закрытия
        const closeBtn = notification.querySelector('span');
        const closeHandler = () => this.remove(notification);
        
        closeBtn.addEventListener('click', closeHandler);
        notification.addEventListener('click', closeHandler);

        // Автоматическое закрытие
        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }

        return notification;
    }

    remove(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#d4edda',
            error: '#f8d7da',
            info: '#d1ecf1',
            warning: '#fff3cd'
        };
        return colors[type] || colors.info;
    }

    getBorderColor(type) {
        const colors = {
            success: '#c3e6cb',
            error: '#f5c6cb',
            info: '#bee5eb',
            warning: '#ffeaa7'
        };
        return colors[type] || colors.info;
    }

    getTextColor(type) {
        const colors = {
            success: '#155724',
            error: '#721c24',
            info: '#0c5460',
            warning: '#856404'
        };
        return colors[type] || colors.info;
    }
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

export default NotificationSystem;