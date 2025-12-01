// Простая система уведомлений для клиентской части
class SimpleNotification {
    static show(message, type = 'info', duration = 3000) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `simple-notification simple-notification-${type}`;
        notification.innerHTML = message;
        
        // Стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
            font-family: 'Roboto', sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        // Цвета по типам
        const colors = {
            success: '#28a745',
            error: '#dc3545', 
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Добавляем на страницу
        document.body.appendChild(notification);
        
        // Автоудаление
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Закрытие по клику
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        return notification;
    }
}

// Основная логика бронирования
class BookingSystem {
    constructor() {
        this.selectedSeats = new Map(); // Используем Map для хранения выбранных мест
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormSubmission();
        this.addNotificationStyles();
    }

    addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
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
                
                .simple-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    color: white;
                    z-index: 10000;
                    max-width: 300px;
                    animation: slideInRight 0.3s ease;
                    font-family: 'Roboto', sans-serif;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                }
                
                .simple-notification-success {
                    background-color: #28a745;
                }
                
                .simple-notification-error {
                    background-color: #dc3545;
                }
                
                .simple-notification-warning {
                    background-color: #ffc107;
                    color: #212529;
                }
                
                .simple-notification-info {
                    background-color: #17a2b8;
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Обработчик выбора мест - делегирование событий для клика на места
        document.addEventListener('click', (e) => {
            const seatElement = e.target.closest('.buying-scheme__chair');
            
            if (seatElement) {
                // Проверяем, не занято ли место и не заблокировано
                if (seatElement.classList.contains('buying-scheme__chair_taken') || 
                    seatElement.classList.contains('buying-scheme__chair_disabled')) {
                    return;
                }
                
                this.handleSeatSelection(seatElement);
            }
        });
    }

    handleSeatSelection(seatElement) {
        const seatId = seatElement.dataset.seatId;
        const row = seatElement.dataset.row;
        const seatNumber = seatElement.dataset.seat;
        const price = parseFloat(seatElement.dataset.price) || 400;
        
        if (this.selectedSeats.has(seatId)) {
            // Отмена выбора
            this.selectedSeats.delete(seatId);
            seatElement.classList.remove('buying-scheme__chair_selected');
            this.showNotification(`Место отменено: Ряд ${row}, Место ${seatNumber}`, 'info', 2000);
        } else {
            // Добавляем в выбранные
            this.selectedSeats.set(seatId, { id: seatId, row, seat: seatNumber, price });
            seatElement.classList.add('buying-scheme__chair_selected');
            this.showNotification(`Выбрано: Ряд ${row}, Место ${seatNumber}`, 'success', 2000);
        }
        
        this.updateSelectionSummary();
    }

    updateSelectionSummary() {
        const selectedCount = document.getElementById('selectedCount');
        const totalPrice = document.getElementById('totalPrice');
        const bookButton = document.getElementById('bookButton');
        const seatIdsInput = document.getElementById('seatIdsInput');
        const guestInfo = document.getElementById('guestInfo');
        
        const total = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
        
        if (selectedCount) selectedCount.textContent = this.selectedSeats.size;
        if (totalPrice) totalPrice.textContent = total.toFixed(2);
        
        // Показываем поля для гостей если выбран хотя бы один билет и пользователь не авторизован
        if (guestInfo) {
            const isLoggedIn = document.querySelector('input[name="user_id"]') !== null;
            if (!isLoggedIn && this.selectedSeats.size > 0) {
                guestInfo.classList.add('visible');
            } else {
                guestInfo.classList.remove('visible');
            }
        }
        
        if (bookButton) {
            bookButton.disabled = this.selectedSeats.size === 0;
            bookButton.textContent = this.selectedSeats.size > 0 
                ? `Забронировать ${this.selectedSeats.size} мест` 
                : 'Забронировать';
        }
        
        if (seatIdsInput) {
            seatIdsInput.value = JSON.stringify(Array.from(this.selectedSeats.keys()));
        }
    }

    setupFormSubmission() {
        const form = document.getElementById('bookingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                this.handleFormSubmission(e);
            });
        }
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        if (this.selectedSeats.size === 0) {
            this.showNotification('Выберите хотя бы одно место', 'warning', 3000);
            return;
        }
        
        const form = e.target;
        const bookButton = document.getElementById('bookButton');
        
        // Создаем FormData
        const formData = new FormData();
        formData.append('movie_session_id', document.querySelector('input[name="movie_session_id"]').value);
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        formData.append('_token', csrfToken);
        
        // Добавляем seat_ids как массив
        const seatIds = Array.from(this.selectedSeats.keys());
        
        // Добавляем каждый seat_id как отдельный элемент массива
        seatIds.forEach(seatId => {
            formData.append('seat_ids[]', seatId);
        });
        
        // Добавляем user_id если есть
        const userIdInput = document.querySelector('input[name="user_id"]');
        if (userIdInput && userIdInput.value) {
            formData.append('user_id', userIdInput.value);
        }
        
        // Добавляем данные гостей если они есть
        const guestNameInput = document.getElementById('guest_name');
        const guestEmailInput = document.getElementById('guest_email');
        const guestPhoneInput = document.getElementById('guest_phone');
        
        if (guestNameInput && guestNameInput.value) {
            formData.append('guest_name', guestNameInput.value);
        }
        if (guestEmailInput && guestEmailInput.value) {
            formData.append('guest_email', guestEmailInput.value);
        }
        if (guestPhoneInput && guestPhoneInput.value) {
            formData.append('guest_phone', guestPhoneInput.value);
        }
        
        // Показываем индикатор загрузки
        const originalText = bookButton.textContent;
        bookButton.textContent = 'Бронируем...';
        bookButton.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(result.message, 'success', 3000);
                
                // Редирект на страницу подтверждения
                setTimeout(() => {
                    window.location.href = result.redirect_url;
                }, 1500);
                
            } else {
                this.showNotification(result.message, 'error', 5000);
                bookButton.textContent = originalText;
                bookButton.disabled = false;
                
                // Сбрасываем выбор недоступных мест
                if (result.unavailable_seats) {
                    this.resetUnavailableSeats(result.unavailable_seats);
                }
            }

        } catch (error) {
            console.error('Booking error:', error);
            this.showNotification('Произошла ошибка при бронировании', 'error', 5000);
            bookButton.textContent = originalText;
            bookButton.disabled = false;
        }
    }
    
    resetUnavailableSeats(unavailableSeats) {
        unavailableSeats.forEach(seatInfo => {
            const seatElement = document.querySelector(`[data-seat-id="${seatInfo.seat_id}"]`);
            if (seatElement) {
                this.selectedSeats.delete(seatInfo.seat_id);
                seatElement.classList.remove('buying-scheme__chair_selected');
            }
        });
        this.updateSelectionSummary();
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `simple-notification simple-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Автоудаление
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Закрытие по клику
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        return notification;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.bookingSystem = new BookingSystem();
});
