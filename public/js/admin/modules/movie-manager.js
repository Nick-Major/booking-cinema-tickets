import { getCsrfToken, showSuccessMessage } from './utils.js';

// УПРАВЛЕНИЕ ФИЛЬМАМИ
export function initMovieManager() {
    console.log('Movie manager initialized');

    // УДАЛЕНИЕ ФИЛЬМА
    window.performMovieDeletion = function(movieId) {
        console.log('performMovieDeletion called with id:', movieId);
        
        fetch(`/admin/movies/${movieId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('Delete movie response status:', response.status);
            if (response.ok || response.status === 204) {
                window.closeDeleteMovieModal();
                showSuccessMessage('Фильм успешно удален!');
                location.reload(); // Перезагружаем страницу для обновления списка
            } else {
                return response.json().then(data => {
                    alert('Ошибка при удалении фильма: ' + (data.message || 'Неизвестная ошибка'));
                });
            }
        })
        .catch(error => {
            alert('Ошибка сети при удалении фильма');
        });
    }

    // ОТКРЫТИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ ФИЛЬМА
    window.openEditMovieModal = function(movieId) {
        fetch(`/admin/movies/${movieId}/edit`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                // Создаем временный контейнер для модалки
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Добавляем модалку в DOM
                document.body.appendChild(tempDiv.firstElementChild);
                
                // Показываем модалку
                const modal = document.getElementById('editMovieModal');
                if (modal) {
                    modal.classList.add('active');
                }
            })
            .catch(error => {
                console.error('Error loading edit movie modal:', error);
                alert('Ошибка при загрузке формы редактирования');
            });
    }

    // ЗАКРЫТИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ ФИЛЬМА  
    window.closeEditMovieModal = function() {
        const modal = document.getElementById('editMovieModal');
        if (modal) {
            modal.classList.remove('active');
            // Удаляем модалку из DOM после анимации
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    // ОБНОВЛЕНИЕ ФИЛЬМА
    window.updateMovie = function(movieId) {
        const form = document.getElementById('editMovieForm');
        const formData = new FormData(form);
        
        fetch(`/admin/movies/${movieId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'X-HTTP-Method-Override': 'PUT'
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                window.closeEditMovieModal();
                location.reload();
            } else {
                alert('Ошибка при обновлении фильма');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка сети при обновлении фильма');
        });
    }

    // ОТКРЫТИЕ МОДАЛКИ УДАЛЕНИЯ ФИЛЬМА
    window.openDeleteMovieModal = function(movieId, movieTitle) {
        const modal = document.getElementById('deleteMovieModal');
        if (modal) {
            // Заполняем данные в модалке
            const titleElement = modal.querySelector('#movieNameToDelete');
            if (titleElement) {
                titleElement.textContent = `"${movieTitle}"`;
            }
            
            // Заполняем скрытое поле с ID
            const idInput = modal.querySelector('#movieIdToDelete');
            if (idInput) {
                idInput.value = movieId;
            }
            
            // Устанавливаем ID фильма в dataset модалки
            modal.dataset.movieId = movieId;
            modal.classList.add('active');
        } else {
            // Если модалки нет, используем прямое подтверждение
            window.deleteMovie(movieId, movieTitle);
        }
    }

    // ЗАКРЫТИЕ МОДАЛКИ УДАЛЕНИЯ ФИЛЬМА
    window.closeDeleteMovieModal = function() {
        const modal = document.getElementById('deleteMovieModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ФИЛЬМА ИЗ МОДАЛКИ (через форму)
    window.confirmMovieDeletion = function(event) {
        if (event) {
            event.preventDefault(); // Предотвращаем отправку формы по умолчанию
        }
        
        const modal = document.getElementById('deleteMovieModal');
        if (modal) {
            const movieId = modal.dataset.movieId;
            const movieTitle = modal.querySelector('#movieNameToDelete').textContent;
            
            window.deleteMovie(movieId, movieTitle.replace(/"/g, ''));
            window.closeDeleteMovieModal();
        }
    }

    // УДАЛЕНИЕ ФИЛЬМА (для использования в HTML onclick)
    window.deleteMovie = function(movieId, movieTitle) {
        if (confirm(`Вы уверены, что хотите удалить фильм "${movieTitle}"?`)) {
            fetch(`/admin/movies/${movieId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccessMessage(data.message);
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    alert('Ошибка: ' + data.message);
                }
            })
            .catch(error => {
                alert('Ошибка сети при удалении фильма');
            });
        }
    }

    // СОХРАНЕНИЕ ФИЛЬМА
    window.saveMovie = function() {
        const form = document.getElementById('movieForm');
        const formData = new FormData(form);
        
        fetch('/admin/movies', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                window.closeAddMovieModal();
                location.reload();
            } else {
                alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            alert('Ошибка при сохранении фильма');
        });
    }

    // ОБНОВЛЕНИЕ ФИЛЬМА
    window.updateMovie = function(movieId) {
        const form = document.getElementById('editMovieForm');
        const formData = new FormData(form);
        
        fetch(`/admin/movies/${movieId}`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                window.closeEditMovieModal();
                location.reload();
            } else {
                alert('Ошибка при обновлении фильма');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // ПЕРЕКЛЮЧЕНИЕ АКТИВНОСТИ ФИЛЬМА
    window.toggleMovieActive = function(movieId) {
        fetch(`/admin/movies/${movieId}/toggle-active`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessMessage(data.message);
                // Можно обновить интерфейс без перезагрузки
                const movieElement = document.querySelector(`[data-movie-id="${movieId}"]`);
                if (movieElement) {
                    movieElement.style.opacity = data.is_active ? '1' : '0.5';
                }
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // ПРЕДПРОСМОТР ПОСТЕРА
    window.previewMoviePoster = function(input) {
        const preview = document.getElementById('posterPreview');
        const file = input.files[0];
        
        if (file) {
            // Проверяем размер файла (максимум 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Размер файла не должен превышать 2MB');
                input.value = '';
                return;
            }
            
            // Проверяем тип файла
            if (!file.type.match('image.*')) {
                alert('Пожалуйста, выберите изображение');
                input.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: cover;">`;
                preview.style.border = '2px solid #16A6AF';
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '<span style="color: #63536C;">Постер</span>';
            preview.style.border = '2px dashed #63536C';
        }
    }

    // ВАЛИДАЦИЯ ДЛИТЕЛЬНОСТИ ФИЛЬМА
    window.validateMovieDuration = function(input) {
        const duration = parseInt(input.value);
        if (isNaN(duration) || duration < 1) {
            input.setCustomValidity('Длительность должна быть положительным числом');
        } else if (duration > 480) { // 8 часов максимум
            input.setCustomValidity('Длительность не может превышать 480 минут (8 часов)');
        } else {
            input.setCustomValidity('');
        }
    }

    // ВАЛИДАЦИЯ НАЗВАНИЯ ФИЛЬМА
    window.validateMovieTitle = function(input) {
        const title = input.value.trim();
        if (title.length < 1) {
            input.setCustomValidity('Название фильма обязательно');
        } else if (title.length > 255) {
            input.setCustomValidity('Название не может превышать 255 символов');
        } else {
            input.setCustomValidity('');
        }
    }

    // ПОЛУЧЕНИЕ ФИЛЬМОВ С АКТИВНЫМИ СЕАНСАМИ
    window.getMoviesWithActiveSessions = function() {
        return fetch('/admin/movies?with_sessions=true')
            .then(response => response.json())
            .then(movies => {
                console.log('Movies with active sessions:', movies);
                return movies;
            })
            .catch(error => {
                console.error('Error fetching movies with sessions:', error);
                return [];
            });
    }

    // ФИЛЬТРАЦИЯ ФИЛЬМОВ ПО СТАТУСУ
    window.filterMoviesByStatus = function(status) {
        const movies = document.querySelectorAll('.conf-step__movie');
        movies.forEach(movie => {
            const isActive = movie.dataset.active === 'true';
            
            if (status === 'all') {
                movie.style.display = 'block';
            } else if (status === 'active' && isActive) {
                movie.style.display = 'block';
            } else if (status === 'inactive' && !isActive) {
                movie.style.display = 'block';
            } else {
                movie.style.display = 'none';
            }
        });
    }

    // ПОИСК ФИЛЬМОВ
    window.searchMovies = function(query) {
        const movies = document.querySelectorAll('.conf-step__movie');
        const searchTerm = query.toLowerCase().trim();
        
        movies.forEach(movie => {
            const title = movie.querySelector('.conf-step__movie-title').textContent.toLowerCase();
            if (title.includes(searchTerm) || searchTerm === '') {
                movie.style.display = 'block';
            } else {
                movie.style.display = 'none';
            }
        });
    }

    // ИНИЦИАЛИЗАЦИЯ ПОИСКА И ФИЛЬТРОВ
    function initMovieFilters() {
        const searchInput = document.getElementById('movieSearch');
        const statusFilter = document.getElementById('movieStatusFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                window.searchMovies(this.value);
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                window.filterMoviesByStatus(this.value);
            });
        }
    }

    // АВТОМАТИЧЕСКАЯ ЗАГРУЗКА ФИЛЬМОВ ПРИ ИЗМЕНЕНИИ
    window.loadMovies = function() {
        fetch('/admin/movies')
            .then(response => response.json())
            .then(movies => {
                const moviesContainer = document.getElementById('moviesList');
                if (moviesContainer) {
                    // Обновляем список фильмов
                    moviesContainer.innerHTML = movies.map(movie => `
                        <div class="conf-step__movie" data-movie-id="${movie.id}" data-movie-duration="${movie.movie_duration}" data-active="${movie.is_active}" style="position: relative;">
                            ${movie.movie_poster ? 
                                `<img class="conf-step__movie-poster" alt="${movie.title}" src="/storage/${movie.movie_poster}">` :
                                `<img class="conf-step__movie-poster" alt="Постер отсутствует" src="/images/admin/poster-placeholder.png">`
                            }
                            <h3 class="conf-step__movie-title">${movie.title}</h3>
                            <p class="conf-step__movie-duration">${movie.movie_duration} минут</p>
                            <div class="conf-step__movie-controls" style="position: absolute; top: 5px; right: 5px;">
                                <button class="conf-step__button conf-step__button-small conf-step__button-regular" 
                                        onclick="openEditMovieModal(${movie.id})"
                                        title="Редактировать фильм"
                                        style="background-image: url('/images/admin/pencil.png'); background-size: 12px 12px; background-repeat: no-repeat; background-position: center;"></button>
                                <button class="conf-step__button conf-step__button-small conf-step__button-trash" 
                                        onclick="openDeleteMovieModal(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')"
                                        title="Удалить фильм"></button>
                            </div>
                        </div>
                    `).join('');
                }
            })
            .catch(error => console.error('Error loading movies:', error));
    }

    // ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
    initMovieFilters();

    console.log('✓ Movie manager fully initialized');

    // ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ДЛЯ МОДАЛКИ УДАЛЕНИЯ
    document.addEventListener('DOMContentLoaded', function() {
        const deleteModal = document.getElementById('deleteMovieModal');
        if (deleteModal) {
            // Обработчик для кнопки удаления в модалке
            const deleteButton = deleteModal.querySelector('.conf-step__button-accent');
            if (deleteButton) {
                deleteButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    confirmMovieDeletion();
                });
            }
        }
    });
}
