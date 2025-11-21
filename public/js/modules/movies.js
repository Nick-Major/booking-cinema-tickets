// @ts-nocheck

// Модуль для управления фильмами
import { openModal, closeModal } from '../core/modals.js';

// Функция открытия модального окна удаления фильма
function openDeleteMovieModal(movieId, movieName) {
    // Заполняем модальное окно данными
    document.getElementById('movieIdToDelete').value = movieId;
    document.getElementById('movieNameToDelete').textContent = `"${movieName}"`;
    
    // Открываем модальное окно
    openModal('deleteMovieModal');
}

// Функция добавления фильма
async function addMovie(form) {
    try {
        const formData = new FormData(form);

        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Показываем уведомление
            if (window.notifications) {
                window.notifications.show('Фильм успешно добавлен!', 'success');
            }

            // Закрываем модальное окно
            closeModal('addMovieModal');

            // Очищаем форму
            form.reset();
            
            // Очищаем превью постера
            const posterPreview = document.getElementById('posterPreview');
            if (posterPreview) {
                posterPreview.innerHTML = '<span style="color: #63536C;">Постер</span>';
            }

            // Перезагружаем список фильмов
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } else {
            throw new Error(result.message || 'Ошибка при добавлении фильма');
        }
    } catch (error) {
        console.error('Error adding movie:', error);
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при добавлении фильма: ' + error.message, 'error');
        } else {
            alert('Ошибка при добавлении фильма: ' + error.message);
        }
    }
}

// Функция подтверждения удаления фильма (вызывается из модального окна)
async function confirmMovieDeletion(event) {
    if (event) event.preventDefault();
    
    const movieId = document.getElementById('movieIdToDelete').value;
    
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

        const response = await fetch(`/admin/movies/${movieId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            // Закрываем модальное окно
            closeModal('deleteMovieModal');
            
            // Удаляем элемент из DOM
            const movieElement = document.querySelector(`[data-movie-id="${movieId}"]`);
            if (movieElement) {
                movieElement.remove();
            }

            // Показываем уведомление
            if (window.notifications && typeof window.notifications.show === 'function') {
                window.notifications.show(result.message, 'success');
            }

            // Проверяем, остались ли фильмы
            const moviesList = document.getElementById('moviesList');
            const remainingMovies = moviesList.querySelectorAll('.conf-step__movie');
            if (remainingMovies.length === 0) {
                moviesList.innerHTML = '<div class="conf-step__empty-movies">Нет добавленных фильмов</div>';
            }
        } else {
            throw new Error(result.message || 'Ошибка при удалении фильма');
        }
    } catch (error) {
        console.error('Error deleting movie:', error);
        closeModal('deleteMovieModal');
        
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при удалении фильма: ' + error.message, 'error');
        } else {
            alert('Ошибка при удалении фильма: ' + error.message);
        }
    }
}

// Функция предпросмотра постера
export function previewMoviePoster(input) {
    let previewId = 'posterPreview';
    
    // Определяем контекст: добавление или редактирование
    if (input.closest('#editMovieModal')) {
        previewId = 'edit_poster_preview';
    }
    
    const preview = document.getElementById(previewId);
    if (!preview) {
        console.error('Preview container not found:', previewId);
        return;
    }

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width:200px; max-height:300px; object-fit:cover; border-radius:5px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

// Функция инициализации фильмов
export function initMovies() {
    // Обработчик формы добавления фильма
    const addMovieForm = document.getElementById('addMovieForm');
    if (addMovieForm) {
        addMovieForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await addMovie(this);
        });
    }

    // Превью постера для добавления фильма
    const posterInput = document.querySelector('#addMovieModal input[name="movie_poster"]');
    if (posterInput) {
        posterInput.addEventListener('change', function(e) {
            previewMoviePoster(this);
        });
    }

    // Превью постера для редактирования фильма
    const editPosterInput = document.querySelector('#editMovieModal input[name="movie_poster"]');
    if (editPosterInput) {
        editPosterInput.addEventListener('change', function(e) {
            previewMoviePoster(this);
        });
    }

    // Обработчик формы редактирования фильма
    const editMovieForm = document.getElementById('editMovieForm');
    if (editMovieForm) {
        editMovieForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateMovie(this);
        });
    }

    // Обработчик для кнопок удаления фильма (делегирование событий)
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-movie')) {
            e.preventDefault();
            const movieId = e.target.getAttribute('data-delete-movie');
            const movieName = e.target.getAttribute('data-movie-name');
            openDeleteMovieModal(movieId, movieName);
        }
    });

    // Обработчик формы удаления фильма в модальном окне
    const deleteMovieForm = document.getElementById('deleteMovieForm');
    if (deleteMovieForm) {
        deleteMovieForm.addEventListener('submit', function(e) {
            confirmMovieDeletion(e);
        });
    }
}

// Функция обновления фильма
async function updateMovie(form) {
    try {
        const formData = new FormData(form);
        const movieId = formData.get('movie_id');

        const response = await fetch(`/admin/movies/${movieId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            if (window.notifications) {
                window.notifications.show('Фильм успешно обновлен!', 'success');
            }
            closeModal('editMovieModal');
            // Перезагружаем страницу чтобы обновить список фильмов
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error(result.message || 'Ошибка при обновлении фильма');
        }
    } catch (error) {
        console.error('Error updating movie:', error);
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при обновлении фильма: ' + error.message, 'error');
        } else {
            console.error('Ошибка при обновлении фильма:', error.message);
            alert('Ошибка при обновлении фильма: ' + error.message);
        }
    }
}

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

// Экспортируем функции для модального окна
export { confirmMovieDeletion };
