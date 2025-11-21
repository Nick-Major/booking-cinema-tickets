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
        this.selectedSeats = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormSubmission();
        this.addNotificationStyles();
    }

    addNotificationStyles() {
        // Добавляем CSS анимации если их еще нет
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
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Обработчик выбора мест
        document.querySelectorAll('.buying-scheme__chair').forEach(seat => {
            seat.addEventListener('click', () => {
                this.handleSeatSelection(seat);
            });
        });
    }

    handleSeatSelection(seatElement) {
        const seatId = seatElement.dataset.seatId;
        const row = seatElement.dataset.row;
        const seatNumber = seatElement.dataset.seat;
        const price = parseFloat(seatElement.dataset.price);
        
        // Нельзя выбрать заблокированные или занятые места
        if (seatElement.classList.contains('buying-scheme__chair_disabled') || 
            seatElement.classList.contains('buying-scheme__chair_taken')) {
            return;
        }
        
        if (seatElement.classList.contains('buying-scheme__chair_selected')) {
            // Отмена выбора
            seatElement.classList.remove('buying-scheme__chair_selected');
            this.selectedSeats = this.selectedSeats.filter(s => s.id !== seatId);
            SimpleNotification.show('Место отменено', 'info', 2000);
        } else {
            // Проверяем, не выбрано ли уже максимальное количество мест
            if (this.selectedSeats.length >= 1) {
                SimpleNotification.show('Можно выбрать только одно место за раз', 'warning', 3000);
                return;
            }
            
            seatElement.classList.add('buying-scheme__chair_selected');
            this.selectedSeats.push({ id: seatId, row, seat: seatNumber, price });
            SimpleNotification.show(`Выбрано: Ряд ${row}, Место ${seatNumber}`, 'success', 2000);
        }
        
        this.updateSelectionSummary();
    }

    updateSelectionSummary() {
        const selectedCount = document.getElementById('selectedCount');
        const totalPrice = document.getElementById('totalPrice');
        const bookButton = document.getElementById('bookButton');
        const seatIdInput = document.getElementById('selectedSeatId');
        
        selectedCount.textContent = this.selectedSeats.length;
        totalPrice.textContent = this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
        
        if (this.selectedSeats.length > 0) {
            bookButton.disabled = false;
            seatIdInput.value = this.selectedSeats[0].id;
        } else {
            bookButton.disabled = true;
            seatIdInput.value = '';
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
        
        const form = e.target;
        const formData = new FormData(form);
        const bookButton = document.getElementById('bookButton');
        
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
                    'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
                }
            });

            const result = await response.json();

            if (result.success) {
                SimpleNotification.show(result.message, 'success', 3000);
                
                // Редирект на страницу подтверждения
                setTimeout(() => {
                    window.location.href = result.redirect_url;
                }, 1500);
                
            } else {
                SimpleNotification.show(result.message, 'error', 5000);
                bookButton.textContent = originalText;
                bookButton.disabled = false;
            }

        } catch (error) {
            console.error('Booking error:', error);
            SimpleNotification.show('Произошла ошибка при бронировании', 'error', 5000);
            bookButton.textContent = originalText;
            bookButton.disabled = false;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new BookingSystem();
});
