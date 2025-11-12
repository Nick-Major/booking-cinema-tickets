document.addEventListener('DOMContentLoaded', function() {
    function changeTimelineDate(date) {
        window.location.href = `/admin/dashboard?date=${date}`;
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Добавляем обработчики для таймлайна
    function initTimelineHandlers() {
        // Обработчики для кнопок в таймлайне
        document.querySelectorAll('[data-open-modal]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-open-modal');
                openModal(modalId);
            });
        });
    }

    initTimelineHandlers();

    window.changeTimelineDate = changeTimelineDate;
    window.openModal = openModal;
});