// @ts-nocheck

import { initModalHandlers, openModal, closeModal } from '../../core/modals.js';

// Минимальный набор функций для тестирования
function openCreateScheduleModal(hallId, date) {
    console.log('Opening schedule modal for hall:', hallId, 'date:', date);
    openModal('hallScheduleModal');
}

function openEditMovieModal(movieId) {
    console.log('Edit movie modal called for:', movieId);
    // Временная заглушка
    alert('Редактирование фильма временно отключено');
}

function loadHallConfiguration(hallId) {
    console.log('Load hall config:', hallId);
    // Временная заглушка
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
    } catch (error) {
        console.error('💥 Error:', error);
    }

    // Экспортируем функции
    window.openCreateScheduleModal = openCreateScheduleModal;
    window.openEditMovieModal = openEditMovieModal;
    window.loadHallConfiguration = loadHallConfiguration;
    window.loadPriceConfiguration = loadPriceConfiguration;
    window.toggleInactiveMovies = toggleInactiveMovies;
    window.openAddSessionModal = openAddSessionModal;
    window.changeTimelineDate = changeTimelineDate;
    window.resetSessions = resetSessions;
    window.updateSession = updateSession;
    window.openModal = openModal;
    window.closeModal = closeModal;
});
