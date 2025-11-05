// УТИЛИТЫ
export function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

export function showSuccessMessage(message) {
    // Создаем или находим контейнер для сообщений
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`🔔 showSuccessMessage [${callId}] called:`, message);
    
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(messageContainer);
    }

    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

export function showErrorMessage(message) {
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(messageContainer);
    }

    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Вспомогательные функции
export function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}
