// Основная инициализация админки
import './accordeon.js';
import './modals.js';
import './halls/configuration.js';
import './halls/prices.js';
import './movies/management.js';
import './sessions/management.js';

// Глобальные функции доступные из HTML
window.openAddHallModal = () => document.getElementById('addHallModal').classList.add('active');
window.openAddMovieModal = () => document.getElementById('addMovieModal').classList.add('active');
window.openAddSessionModal = () => document.getElementById('addSessionModal').classList.add('active');

// Глобальная функция для получения CSRF токена
window.getCsrfToken = function() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.content : null;
}

window.testButton = function() {
    alert('Кнопка работает!');
    return false; // Предотвращаем отправку
}
