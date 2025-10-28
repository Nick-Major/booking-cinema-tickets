// Управление модальными окнами

// Закрытие модалок
window.closeAddHallModal = () => document.getElementById('addHallModal').classList.remove('active');
window.closeAddMovieModal = () => document.getElementById('addMovieModal').classList.remove('active');
window.closeAddSessionModal = () => document.getElementById('addSessionModal').classList.remove('active');

// Универсальное закрытие модалок по клику вне контента
document.addEventListener('click', function(event) {
    const modals = ['addHallModal', 'addMovieModal', 'addSessionModal', 'editMovieModal', 'editSessionModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Универсальное закрытие модалок по ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.popup.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Дебаг для форм
document.addEventListener('DOMContentLoaded', function() {
    console.log('Модальные окна загружены');
    
    // Обработчик для формы создания зала
    const hallForm = document.querySelector('#addHallModal form');
    if (hallForm) {
        console.log('Форма зала найдена');
        hallForm.addEventListener('submit', function(e) {
            console.log('Форма зала отправляется');
            
            // Добавляем индикатор загрузки
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Создание...';
            submitBtn.disabled = true;
            
            // Восстанавливаем кнопку через 3 секунды на всякий случай
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
    }
});
