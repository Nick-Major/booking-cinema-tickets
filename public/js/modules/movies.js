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

let isAddingMovie = false;

// Функция добавления фильма
async function addMovie(form) {
    console.log('=== НАЧАЛО addMovie ===');
    console.log('Форма:', form.id);
    console.log('URL запроса:', "/admin/movies");
    console.log('Защита от повторного вызова работает?', isAddingMovie);

    if (isAddingMovie) {
        console.log('Добавление фильма уже выполняется');
        return;
    }

    isAddingMovie = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        console.log('Начинаем добавление фильма');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Добавление...';

        const formData = new FormData(form);

        const response = await fetch("/admin/movies", {
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
        console.log('Ответ сервера:', result);

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

            // Добавляем фильм в список без дополнительного запроса
            addMovieToList(result.movie);

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
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        isAddingMovie = false;
    }
}

// Функция для добавления фильма в список без перезагрузки страницы
function addMovieToList(movie) {
    const moviesList = document.getElementById('moviesList');
    if (!moviesList) return;

    // Проверяем, нет ли уже такого фильма
    if (document.querySelector(`[data-movie-id="${movie.id}"]`)) {
        return;
    }

    // Если список пустой и есть сообщение об отсутствии фильмов, удаляем его
    const emptyMessage = moviesList.querySelector('.conf-step__empty-movies');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    // Создаем элемент фильма
    const movieElement = document.createElement('div');
    movieElement.className = `conf-step__movie ${!movie.is_active ? 'conf-step__movie-inactive' : ''}`;
    movieElement.dataset.movieId = movie.id;
    movieElement.dataset.movieDuration = movie.movie_duration;
    movieElement.style.position = 'relative';

    // Заполняем HTML
    movieElement.innerHTML = `
        <img class="conf-step__movie-poster" alt="${movie.title}"
            src="${movie.poster_url || ''}">
        <h3 class="conf-step__movie-title">${movie.title}</h3>
        <p class="conf-step__movie-duration">${movie.movie_duration} минут</p>

        ${!movie.is_active ? '<div class="conf-step__movie-status">Неактивен</div>' : ''}

        <div class="conf-step__movie-controls">
            <button class="conf-step__button conf-step__button-small conf-step__button-regular"
                    onclick="openEditMovieModal(${movie.id})"
                    title="Редактировать фильм">
            </button>
            <button class="conf-step__button conf-step__button-small conf-step__button-trash"
                    data-delete-movie="${movie.id}"
                    data-movie-name="${movie.title}"
                    title="Удалить фильм"></button>
        </div>
    `;

    // Добавляем в начало списка
    moviesList.prepend(movieElement);
}

// Функция для обновления списка фильмов без перезагрузки
function updateMoviesList(movies) {
    const moviesList = document.getElementById('moviesList');
    if (!moviesList) return;
    
    let html = '';
    movies.forEach(movie => {
        const isActive = movie.is_active;
        html += `
            <div class="conf-step__movie ${!isActive ? 'conf-step__movie-inactive' : ''}" 
                data-movie-id="${movie.id}" 
                data-movie-duration="${movie.movie_duration}" 
                style="position: relative;">
                <img class="conf-step__movie-poster" alt="${movie.title}"
                    src="${movie.poster_url || ''}">
                <h3 class="conf-step__movie-title">${movie.title}</h3>
                <p class="conf-step__movie-duration">${movie.movie_duration} минут</p>

                ${!isActive ? '<div class="conf-step__movie-status">Неактивен</div>' : ''}

                <div class="conf-step__movie-controls">
                    <button class="conf-step__button conf-step__button-small conf-step__button-regular"
                            onclick="openEditMovieModal(${movie.id})"
                            title="Редактировать фильм">
                    </button>
                    <button class="conf-step__button conf-step__button-small conf-step__button-trash"
                            data-delete-movie="${movie.id}"
                            data-movie-name="${movie.title}"
                            title="Удалить фильм"></button>
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<div class="conf-step__empty-movies">Нет добавленных фильмов</div>';
    }
    
    moviesList.innerHTML = html;
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
let moviesInitialized = false;

export function initMovies() {
    // Обработчик формы добавления фильма
    const addMovieForm = document.getElementById('addMovieForm');
    if (addMovieForm) {
        console.log('Найдена форма добавления фильма');
        
        // Удаляем все старые обработчики
        const newForm = addMovieForm.cloneNode(true);
        addMovieForm.parentNode.replaceChild(newForm, addMovieForm);
        
        // Вешаем новый обработчик с максимальной защитой
        document.getElementById('addMovieForm').addEventListener('submit', async function(e) {
            console.log('Обработчик формы сработал');
            
            // Полная отмена события
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Защита от повторного вызова
            if (this.dataset.processing === 'true') {
                console.log('Форма уже обрабатывается');
                return;
            }
            
            this.dataset.processing = 'true';
            await addMovie(this);
            this.dataset.processing = 'false';
            
            return false;
        }, {capture: true, once: false});
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
        
        formData.append('_method', 'PUT');

        const response = await fetch(`/admin/movies/${movieId}`, {
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
            if (window.notifications) {
                window.notifications.show('Фильм успешно обновлен!', 'success');
            }
            closeModal('editMovieModal');
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
