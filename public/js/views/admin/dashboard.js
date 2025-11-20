// @ts-nocheck

import { 
    initModalHandlers, 
    openModal, 
    closeModal,
    closeAddHallModal,
    closeAddMovieModal,
    closeAddSessionModal,
    closeEditSessionModal,
    closeEditMovieModal,
    closeDeleteHallModal,
    closeDeleteMovieModal,
    closeDeleteSessionModal,
    closeAllModals
} from '../../core/modals.js';

import HallsManager from '../../modules/halls.js';
import NotificationSystem from '../../core/notifications.js';

// Импортируем функции аккордеона
import {
    initAccordeon,
    toggleAccordeonSection,
    openAccordeonSection,
    closeAccordeonSection,
    closeAllAccordeonSections,
    openAllAccordeonSections
} from '../../modules/accordeon.js';

// Импортируем функции конфигурации залов
import {
    generateHallLayout,
    changeSeatType,
    openResetHallConfigurationModal,
    closeResetHallConfigurationModal,
    resetHallConfiguration,
    saveHallConfiguration
} from './hall-configuration.js';

// Импортируем функции управления ценами
import {
    savePrices,
    resetPrices
} from '../../modules/pricing.js';

// Импортируем функции управления фильмами
import {
    toggleInactiveMovies,
    initMovieFilter,
    toggleMovieActive,
    fetchMovies,
    previewMoviePoster,
    initMovies,
    confirmMovieDeletion
} from '../../modules/movies.js';

// Импортируем функции управления расписаниями
import {
    openCreateScheduleModal,
    openEditScheduleModal,
    openDeleteScheduleModal,
    initSchedules
} from '../../modules/schedules.js';

// Импортируем функции управления сеансами
import { 
    initSessionFormHandlers, 
    openEditSessionModal,
    openDeleteSessionModal,
    initTimelineHandlers, // ← ДОБАВИЛ ИМПОРТ
    changeTimelineDate    // ← ДОБАВИЛ ИМПОРТ
} from '../../modules/sessions.js';


// Импортируем модуль продаж
import SalesManager from '../../modules/sales.js';

// Реальная функция загрузки конфигурации зала
async function loadHallConfiguration(hallId) {
    try {
        console.log('Loading hall configuration for:', hallId);
        
        const response = await fetch(`/admin/halls/${hallId}/configuration`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById('hallConfiguration');
        
        if (container) {
            container.innerHTML = html;
            console.log('Hall configuration loaded successfully');
        }
    } catch (error) {
        console.error('Error loading hall configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при загрузке конфигурации зала', 'error');
        }
    }
}

// Реальная функция загрузки конфигурации цен
async function loadPriceConfiguration(hallId) {
    try {
        console.log('Loading price configuration for:', hallId);
        
        const response = await fetch(`/admin/halls/${hallId}/prices`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById('priceConfiguration');
        
        if (container) {
            container.innerHTML = html;
            console.log('Price configuration loaded successfully');
        }
    } catch (error) {
        console.error('Error loading price configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при загрузке конфигурации цен', 'error');
        }
    }
}

async function openEditMovieModal(movieId) {
    try {
        console.log('Opening edit movie modal for:', movieId);
        
        // Загружаем данные фильма
        const response = await fetch(`/admin/movies/${movieId}/edit`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const movie = await response.json();
        console.log('Loaded movie data:', movie);
        
        // Заполняем форму данными
        document.getElementById('edit_movie_id').value = movie.id;
        document.getElementById('edit_title').value = movie.title;
        document.getElementById('edit_movie_description').value = movie.movie_description || '';
        document.getElementById('edit_movie_duration').value = movie.movie_duration;
        document.getElementById('edit_country').value = movie.country || '';
        document.getElementById('edit_is_active').checked = movie.is_active;
        
        // Показываем текущий постер если есть
        const currentPosterElement = document.getElementById('edit_current_poster');
        if (movie.movie_poster) {
            currentPosterElement.textContent = `Текущий постер: ${movie.movie_poster}`;
            currentPosterElement.style.display = 'block';
        } else {
            currentPosterElement.textContent = '';
            currentPosterElement.style.display = 'none';
        }
        
        // Очищаем превью
        document.getElementById('edit_poster_preview').innerHTML = '';
        
        // Открываем модальное окно
        console.log('Opening edit movie modal...');
        openModal('editMovieModal');
        
    } catch (error) {
        console.error('Error opening edit movie modal:', error);
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при загрузке данных фильма', 'error');
        } else {
            alert('Ошибка при загрузке данных фильма: ' + error.message);
        }
    }
}

function openAddSessionModal() {
    console.log('Open add session modal');
    openModal('addSessionModal');
}

// УДАЛИЛ ДУБЛИРУЮЩУЮ ФУНКЦИЮ - теперь используем импортированную
// function changeTimelineDate(date) {
//     console.log('Change timeline date:', date);
//     window.location.href = `/admin/dashboard?date=${date}`;
// }

function resetSessions() {
    console.log('Reset sessions');
    // Временная заглушка
}

function updateSession() {
    console.log('Update sessions');
    // Временная заглушка
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin panel initializing (minimal version)...');
    
    try {
        initModalHandlers();
        console.log('✅ Modal handlers initialized');
        
        // Инициализируем систему уведомлений
        window.notifications = new NotificationSystem();
        console.log('✅ NotificationSystem initialized');
        
        // Инициализируем менеджер залов с настоящей системой уведомлений
        window.hallsManager = new HallsManager(window.notifications);
        console.log('✅ HallsManager initialized');

        // Инициализируем менеджер продаж
        window.salesManager = new SalesManager(window.notifications);
        console.log('✅ SalesManager initialized');

        // ИНИЦИАЛИЗИРУЕМ ОБРАБОТЧИКИ ТАЙМЛАЙНА
        initTimelineHandlers();
        console.log('✅ Timeline handlers initialized');

        // Инициализируем функциональность фильмов
        initMovies();
        initMovieFilter();
        console.log('✅ Movies module initialized');

        // Инициализируем функциональность расписаний
        initSchedules();
        console.log('✅ Schedules module initialized');

        initSessionFormHandlers();
        console.log('✅ Session form handlers initialized');
        
        // Инициализируем аккордеон
        initAccordeon();
        console.log('✅ Accordeon initialized');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }

    // Экспортируем функции
    window.openEditMovieModal = openEditMovieModal;
    window.loadHallConfiguration = loadHallConfiguration;
    window.loadPriceConfiguration = loadPriceConfiguration;
    window.openAddSessionModal = openAddSessionModal;
    window.changeTimelineDate = changeTimelineDate; // ← Теперь использует импортированную функцию
    window.resetSessions = resetSessions;
    window.updateSession = updateSession;
    window.openModal = openModal;
    window.closeModal = closeModal;
    
    // Экспортируем функции аккордеона
    window.initAccordeon = initAccordeon;
    window.toggleAccordeonSection = toggleAccordeonSection;
    window.openAccordeonSection = openAccordeonSection;
    window.closeAccordeonSection = closeAccordeonSection;
    window.closeAllAccordeonSections = closeAllAccordeonSections;
    window.openAllAccordeonSections = openAllAccordeonSections;
    
    // Экспортируем функции закрытия модалок из modals.js
    window.closeAddHallModal = closeAddHallModal;
    window.closeAddMovieModal = closeAddMovieModal;
    window.closeAddSessionModal = closeAddSessionModal;
    window.closeEditSessionModal = closeEditSessionModal;
    window.closeEditMovieModal = closeEditMovieModal;
    window.closeDeleteHallModal = closeDeleteHallModal;
    window.closeDeleteMovieModal = closeDeleteMovieModal;
    window.closeDeleteSessionModal = closeDeleteSessionModal;
    window.closeAllModals = closeAllModals;
    
    // Экспортируем функции конфигурации залов
    window.generateHallLayout = generateHallLayout;
    window.changeSeatType = changeSeatType;
    window.openResetHallConfigurationModal = openResetHallConfigurationModal;
    window.closeResetHallConfigurationModal = closeResetHallConfigurationModal;
    window.resetHallConfiguration = resetHallConfiguration;
    window.saveHallConfiguration = saveHallConfiguration;

    // Экспортируем функции управления ценами
    window.savePrices = savePrices;
    window.resetPrices = resetPrices;

    // Экспортируем функции управления фильмами
    window.toggleInactiveMovies = toggleInactiveMovies;
    window.initMovieFilter = initMovieFilter;
    window.toggleMovieActive = toggleMovieActive;
    window.fetchMovies = fetchMovies;
    window.previewMoviePoster = previewMoviePoster;

    // Экспортируем функции управления расписанием
    window.openCreateScheduleModal = openCreateScheduleModal;
    window.openEditScheduleModal = openEditScheduleModal;
    window.openDeleteScheduleModal = openDeleteScheduleModal;

    // Экспортируем функции управления сеансами
    window.openEditSessionModal = openEditSessionModal;
    window.openDeleteSessionModal = openDeleteSessionModal;
});
