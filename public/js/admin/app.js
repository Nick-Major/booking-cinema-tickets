// ГЛАВНЫЙ ФАЙЛ АДМИНКИ
import { initModalManager } from './modules/modal-manager.js';
import { initHallManager } from './modules/hall-manager.js';
import { initPriceManager } from './modules/price-manager.js';
import { initMovieManager } from './modules/movie-manager.js';
import { initSessionManager } from './modules/session-manager.js';
import { initSalesManager } from './modules/sales-manager.js';

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing admin application...');

    // 1. Инициализация аккордеона
    const headers = Array.from(document.querySelectorAll('.conf-step__header'));
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });

    // 2. Инициализация менеджеров
    try {
        initModalManager();
        console.log('✓ Modal manager initialized');
        
        initHallManager();
        console.log('✓ Hall manager initialized');
        
        initPriceManager();
        console.log('✓ Price manager initialized');
        
        // Временно закомментируем пока не созданы
        initMovieManager();
        initSessionManager(); 
        initSalesManager();
        
        console.log('🎉 Admin app initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing admin app:', error);
    }
});
