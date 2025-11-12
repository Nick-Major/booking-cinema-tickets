document.addEventListener('DOMContentLoaded', function() {
    async function updateSession(sessionId, data) {
        try {
            const response = await fetch(`/admin/sessions/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Network error');
            
            const result = await response.json();
            if (result.success) {
                alert('Сеанс обновлен успешно!');
                location.reload();
            }
        } catch (error) {
            console.error('Error updating session:', error);
            alert('Ошибка при обновлении сеанса');
        }
    }

    function loadHallConfiguration(hallId) {
        window.location.href = `/admin/halls/${hallId}/configuration`;
    }

    function loadPriceConfiguration(hallId) {
        window.location.href = `/admin/halls/${hallId}/prices`;
    }

    // Добавляем обработчик для кнопок с data-open-modal
    function initModalHandlers() {
        // Обработчик для кнопок открытия модальных окон
        document.querySelectorAll('[data-open-modal]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-open-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.style.display = 'flex';
                } else {
                    console.error('Modal not found:', modalId);
                }
            });
        });

        // Обработчик для кнопок закрытия модальных окон
        document.querySelectorAll('[data-close-modal]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-close-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Закрытие модальных окон при клике вне контента
        document.querySelectorAll('.popup').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        });
    }

    // Инициализируем обработчики модальных окон
    initModalHandlers();

    window.updateSession = updateSession;
    window.loadHallConfiguration = loadHallConfiguration;
    window.loadPriceConfiguration = loadPriceConfiguration;
});