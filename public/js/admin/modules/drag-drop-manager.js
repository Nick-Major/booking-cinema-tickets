// DRAG & DROP МЕНЕДЖЕР ДЛЯ СЕАНСОВ
import { getCsrfToken, showSuccessMessage, showErrorMessage } from './utils.js';

export function initDragDrop() {
    console.log('Initializing Drag & Drop...');

    let draggedSession = null;

    // ВКЛЮЧЕНИЕ ПЕРЕТАСКИВАНИЯ ДЛЯ СЕАНСОВ
    window.enableSessionDragging = function() {
        const sessions = document.querySelectorAll('.conf-step__seances-movie');
        
        sessions.forEach(session => {
            session.setAttribute('draggable', true);
            
            session.addEventListener('dragstart', function(e) {
                draggedSession = {
                    element: this,
                    id: this.dataset.sessionId,
                    originalHall: this.closest('.conf-step__seances-hall').dataset.hallId
                };
                this.style.opacity = '0.4';
                e.dataTransfer.effectAllowed = 'move';
            });

            session.addEventListener('dragend', function() {
                this.style.opacity = '1';
                draggedSession = null;
            });

            session.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            session.addEventListener('drop', function(e) {
                e.preventDefault();
                if (!draggedSession) return;

                const targetSession = this;
                const targetHall = targetSession.closest('.conf-step__seances-hall');
                const targetHallId = targetHall.dataset.hallId;

                // Если перетаскиваем в другой зал - обновляем зал
                if (draggedSession.originalHall !== targetHallId) {
                    moveSessionToHall(draggedSession.id, targetHallId);
                } else {
                    // Если в том же зале - меняем порядок
                    reorderSessions(draggedSession.element, targetSession);
                }
            });
        });
    }

    // ПЕРЕМЕЩЕНИЕ СЕАНСА МЕЖДУ ЗАЛАМИ
    async function moveSessionToHall(sessionId, newHallId) {
        try {
            const response = await fetch(`/admin/sessions/${sessionId}/move-hall`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    cinema_hall_id: newHallId
                })
            });

            const data = await response.json();

            if (data.success) {
                showSuccessMessage('Сеанс успешно перемещен!');
                location.reload();
            } else {
                showErrorMessage(data.message || 'Ошибка при перемещении сеанса');
            }
        } catch (error) {
            showErrorMessage('Ошибка сети при перемещении сеанса');
        }
    }

    // ИЗМЕНЕНИЕ ПОРЯДКА СЕАНСОВ
    async function reorderSessions(draggedElement, targetElement) {
        const timeline = targetElement.parentNode;
        const sessions = Array.from(timeline.querySelectorAll('.conf-step__seances-movie'));
        
        // Находим индексы
        const draggedIndex = sessions.indexOf(draggedElement);
        const targetIndex = sessions.indexOf(targetElement);

        if (draggedIndex === targetIndex) return;

        // Перемещаем DOM элемент
        if (draggedIndex < targetIndex) {
            timeline.insertBefore(draggedElement, targetElement.nextSibling);
        } else {
            timeline.insertBefore(draggedElement, targetElement);
        }

        // Обновляем порядок на сервере
        await updateSessionOrder(timeline);
    }

    // ОБНОВЛЕНИЕ ПОРЯДКА НА СЕРВЕРЕ
    async function updateSessionOrder(timeline) {
        const sessions = Array.from(timeline.querySelectorAll('.conf-step__seances-movie'));
        const orderData = sessions.map((session, index) => ({
            id: session.dataset.sessionId,
            order: index + 1
        }));

        try {
            const response = await fetch('/admin/sessions/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({ sessions: orderData })
            });

            const data = await response.json();

            if (!data.success) {
                showErrorMessage('Ошибка при сохранении порядка сеансов');
                location.reload(); // Перезагружаем чтобы вернуть исходный порядок
            }
        } catch (error) {
            showErrorMessage('Ошибка сети при сохранении порядка');
            location.reload();
        }
    }

    // DRAG & DROP ДЛЯ СОЗДАНИЯ НОВЫХ СЕАНСОВ ИЗ ФИЛЬМОВ
    window.enableMovieToTimelineDragging = function() {
        const movies = document.querySelectorAll('.conf-step__movie');
        const timelines = document.querySelectorAll('.conf-step__seances-timeline');

        // Настройка фильмов как перетаскиваемых
        movies.forEach(movie => {
            movie.setAttribute('draggable', true);
            
            movie.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'movie',
                    id: this.dataset.movieId,
                    title: this.querySelector('.conf-step__movie-title').textContent,
                    duration: parseInt(this.querySelector('.conf-step__movie-duration').textContent)
                }));
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Настройка таймлайнов как зон сброса
        timelines.forEach(timeline => {
            timeline.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                this.style.backgroundColor = 'rgba(188, 149, 214, 0.1)';
            });

            timeline.addEventListener('dragleave', function() {
                this.style.backgroundColor = '';
            });

            timeline.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.backgroundColor = '';
                
                try {
                    const movieData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    
                    if (movieData.type === 'movie') {
                        const rect = this.getBoundingClientRect();
                        const offsetX = e.clientX - rect.left;
                        const hallId = this.closest('.conf-step__seances-hall').dataset.hallId;
                        
                        // Открываем модальное окно создания сеанса
                        openSessionCreationModal(movieData, offsetX, hallId, this);
                    }
                } catch (error) {
                    console.error('Error parsing drag data:', error);
                }
            });
        });
    }

    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА СОЗДАНИЯ СЕАНСА
    function openSessionCreationModal(movieData, positionX, hallId, timeline) {
        // Расчет времени на основе позиции (0.5px = 1 минута)
        const startMinutes = Math.max(0, Math.round(positionX / 0.5));
        const startTime = calculateTimeFromMinutes(startMinutes);
        
        // Заполняем форму создания сеанса
        if (window.openAddSessionModal) {
            window.openAddSessionModal();
            
            // Ждем пока модальное окно откроется
            setTimeout(() => {
                const form = document.getElementById('sessionForm');
                if (form) {
                    form.querySelector('[name="movie_id"]').value = movieData.id;
                    form.querySelector('[name="cinema_hall_id"]').value = hallId;
                    
                    // Устанавливаем время (нужно адаптировать под вашу форму)
                    const timeInput = form.querySelector('[name="session_start"]');
                    if (timeInput) {
                        timeInput.value = startTime;
                    }
                }
            }, 100);
        } else {
            showErrorMessage('Функция создания сеанса недоступна');
        }
    }

    // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ РАСЧЕТА ВРЕМЕНИ
    function calculateTimeFromMinutes(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // ИНИЦИАЛИЗАЦИЯ ВСЕХ DRAG & DROP ФУНКЦИЙ
    function initializeAllDragDrop() {
        enableSessionDragging();
        enableMovieToTimelineDragging();
    }

    // Запускаем инициализацию
    initializeAllDragDrop();
    console.log('✓ Drag & Drop manager initialized');
}
