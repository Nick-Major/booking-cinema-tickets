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

// Импортируем функции конфигурации залов
import {
    generateHallLayout,
    changeSeatType,
    openResetHallConfigurationModal,
    closeResetHallConfigurationModal,
    resetHallConfiguration,
    saveHallConfiguration
} from './hall-configuration.js';

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

// Минимальный набор функций для тестирования
function openCreateScheduleModal(hallId, date) {
    console.log('Opening schedule modal for hall:', hallId, 'date:', date);
    openModal('hallScheduleModal');
}

function openEditMovieModal(movieId) {
    console.log('Edit movie modal called for:', movieId);
    window.notifications.show('Редактирование фильма временно отключено', 'info');
}

function loadPriceConfiguration(hallId) {
    console.log('Load price config:', hallId);
    // Временная заглушка
}

function toggleInactiveMovies(show) {
    console.log('Toggle inactive movies:', show);
    // Временная заглушка
}

function openAddSessionModal() {
    console.log('Open add session modal');
    openModal('addSessionModal');
}

function changeTimelineDate(date) {
    console.log('Change timeline date:', date);
    window.location.href = `/admin/dashboard?date=${date}`;
}

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
        
    } catch (error) {
        console.error('💥 Error:', error);
    }

    // Экспортируем функции
    window.openCreateScheduleModal = openCreateScheduleModal;
    window.openEditMovieModal = openEditMovieModal;
    window.loadHallConfiguration = loadHallConfiguration; // ← ЭКСПОРТИРУЕМ
    window.loadPriceConfiguration = loadPriceConfiguration;
    window.toggleInactiveMovies = toggleInactiveMovies;
    window.openAddSessionModal = openAddSessionModal;
    window.changeTimelineDate = changeTimelineDate;
    window.resetSessions = resetSessions;
    window.updateSession = updateSession;
    window.openModal = openModal;
    window.closeModal = closeModal;
    
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
});
