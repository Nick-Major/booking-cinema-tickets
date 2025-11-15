// @ts-nocheck

// Модуль для управления фильмами
import { openModal } from '../core/modals.js';

// export async function openEditMovieModal(movieId) {
//     try {
//         console.log('Opening edit movie modal for:', movieId);
        
//         const response = await fetch(`/admin/movies/${movieId}/edit`);
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         const html = await response.text();
//         const tempDiv = document.createElement('div');
//         tempDiv.innerHTML = html;
        
//         const modalContent = tempDiv.querySelector('.popup');
//         if (!modalContent) {
//             throw new Error('Модальное окно не найдено в ответе');
//         }
        
//         const existingModal = document.getElementById('editMovieModal');
//         if (existingModal) {
//             existingModal.remove();
//         }
        
//         document.body.appendChild(modalContent);
//         openModal('editMovieModal');
        
//     } catch (error) {
//         console.error('Error opening edit movie modal:', error);
//         if (window.notifications) {
//             window.notifications.show('Ошибка при открытии редактирования фильма', 'error');
//         }
//     }
// }

export function toggleInactiveMovies(show) {
    const inactiveMovies = document.querySelectorAll('.conf-step__movie-inactive');
    inactiveMovies.forEach(movie => {
        movie.style.display = show ? 'block' : 'none';
    });
}

export function initMovieFilter() {
    const filterCheckbox = document.getElementById('showInactiveMovies');
    if (filterCheckbox) {
        // Инициализируем состояние при загрузке
        toggleInactiveMovies(filterCheckbox.checked);
        
        filterCheckbox.addEventListener('change', function() {
            toggleInactiveMovies(this.checked);
        });
    }
}

// Функции для работы с API фильмов
export async function toggleMovieActive(movieId) {
    try {
        const response = await fetch(`/admin/movies/${movieId}/toggle-active`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error toggling movie active:', error);
        throw error;
    }
}

export async function fetchMovies() {
    try {
        const response = await fetch('/admin/movies');
        if (!response.ok) throw new Error('Ошибка загрузки фильмов');
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
}
