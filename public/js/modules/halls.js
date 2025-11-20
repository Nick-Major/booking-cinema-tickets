import { openModal, closeModal } from '../core/modals.js';

// Модуль для управления залами
class HallsManager {
    constructor(notificationSystem) {
        this.notificationSystem = notificationSystem;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Делегирование событий для кнопок удаления зала
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-delete-hall')) {
                e.preventDefault();
                const hallId = e.target.getAttribute('data-delete-hall');
                const hallName = e.target.getAttribute('data-hall-name');
                this.openDeleteModal(hallId, hallName);
            }
        });

        // Обработчик формы удаления зала
        const deleteHallForm = document.querySelector('#deleteHallModal form');
        if (deleteHallForm) {
            deleteHallForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const hallId = deleteHallForm.querySelector('input[name="hall_id"]').value;
                const hallName = deleteHallForm.querySelector('#hallNameToDelete').textContent;
                const csrfToken = deleteHallForm.querySelector('input[name="_token"]').value;
                this.confirmDelete(hallId, hallName, csrfToken);
            });
        }
    }

    openDeleteModal(hallId, hallName) {
        const modal = document.getElementById('deleteHallModal');
        if (!modal) {
            console.error('Delete hall modal not found');
            return;
        }

        // Заполняем модальное окно данными
        modal.querySelector('input[name="hall_id"]').value = hallId;
        modal.querySelector('#hallNameToDelete').textContent = hallName;
        
        // Показываем модальное окно
        modal.classList.add('active');
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteHallModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async confirmDelete(hallId, hallName, csrfToken) {
        try {
            console.log('Starting hall deletion:', { hallId, hallName });
            
            const response = await fetch(`/admin/halls/${hallId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                // Закрываем модальное окно
                this.closeDeleteModal();
                
                // Удаляем элемент из списка
                this.removeHallFromList(hallId);
                
                // ОБНОВЛЯЕМ ВСЕ СЕКЦИИ
                this.updateAllSections(hallId);
                
                // Показываем сообщение об успехе
                this.showNotification('Зал успешно удален', 'success');
                
            } else {
                this.showNotification('Ошибка: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting hall:', error);
            this.showNotification('Ошибка при удалении зала', 'error');
        }
    }

    removeHallFromList(hallId) {
        const hallElement = document.querySelector(`[data-hall-id="${hallId}"]`);
        if (hallElement) {
            hallElement.remove();
        }
    }

    // Обновление всех секций
    updateAllSections(deletedHallId) {
        // 1. Обновляем секцию "Конфигурация залов"
        this.updateHallConfigurationSection(deletedHallId);
        
        // 2. Обновляем секцию "Конфигурация цен"
        this.updatePriceConfigurationSection(deletedHallId);
        
        // 3. Обновляем секцию "Управление продажами"
        this.updateSalesManagementSection(deletedHallId);
        
        // 4. Обновляем секцию "Сетка сеансов"
        this.updateSessionsSection(deletedHallId);
        
        // 5. Проверяем, нужно ли скрыть секции если залов не осталось
        this.checkAndHideSections();
    }

    updateHallConfigurationSection(deletedHallId) {
        const hallSelector = document.querySelector('#hallSelector');
        if (!hallSelector) return;

        // Удаляем радио-кнопку удаленного зала
        const hallRadio = hallSelector.querySelector(`input[value="${deletedHallId}"]`);
        if (hallRadio) {
            hallRadio.closest('li').remove();
        }

        // Если есть другие залы, выбираем первый
        const firstRadio = hallSelector.querySelector('input[type="radio"]');
        if (firstRadio) {
            firstRadio.checked = true;
            // Загружаем конфигурацию для первого зала
            const hallId = firstRadio.value;
            if (typeof loadHallConfiguration === 'function') {
                loadHallConfiguration(hallId);
            }
        }
    }

    updatePriceConfigurationSection(deletedHallId) {
        const priceSelector = document.querySelector('ul.conf-step__selectors-box input[name="prices-hall"]');
        if (!priceSelector) return;

        const priceContainer = priceSelector.closest('ul.conf-step__selectors-box');
        const priceRadio = priceContainer.querySelector(`input[value="${deletedHallId}"]`);
        if (priceRadio) {
            priceRadio.closest('li').remove();
        }

        // Выбираем первый доступный зал
        const firstRadio = priceContainer.querySelector('input[type="radio"]');
        if (firstRadio) {
            firstRadio.checked = true;
            const hallId = firstRadio.value;
            if (typeof loadPriceConfiguration === 'function') {
                loadPriceConfiguration(hallId);
            }
        }
    }

    updateSalesManagementSection(deletedHallId) {
        const salesList = document.querySelector('.conf-step__sales-list');
        if (!salesList) return;

        const salesItem = salesList.querySelector(`[data-toggle-sales="${deletedHallId}"]`);
        if (salesItem) {
            salesItem.closest('li').remove();
        }
    }

    // Обновление секции сеансов
    updateSessionsSection(deletedHallId) {
        const sessionsSection = document.getElementById('sessionsSection');
        if (!sessionsSection) {
            console.log('Sessions section not found');
            return;
        }

        console.log('Looking for hall timeline with hall-id:', deletedHallId);
        
        // Удаляем весь блок зала (включая все его сеансы)
        const hallTimeline = sessionsSection.querySelector(`.conf-step__timeline-hall[data-hall-id="${deletedHallId}"]`);
        if (hallTimeline) {
            console.log('Removing hall timeline:', hallTimeline);
            hallTimeline.remove();
        } else {
            console.log('Hall timeline not found for hall:', deletedHallId);
        }

        // Обновляем список фильмов (удаляем те, что были только в удаленном зале)
        this.updateMoviesList(deletedHallId);
    }

    // Обновление списка фильмов
    updateMoviesList(deletedHallId) {
        const moviesList = document.getElementById('moviesList');
        if (!moviesList) return;

        // Находим фильмы, которые были привязаны только к удаленному залу
        const movies = moviesList.querySelectorAll('.conf-step__movie');
        movies.forEach(movie => {
            const movieId = movie.getAttribute('data-movie-id');
            
            // Проверяем, есть ли еще сеансы этого фильма в других залах
            const remainingSessions = document.querySelectorAll(`.session-block[data-movie-id="${movieId}"]`);
            if (remainingSessions.length === 0) {
                // Если сеансов не осталось, удаляем фильм
                movie.remove();
            }
        });

        // Если фильмов не осталось, показываем сообщение
        const remainingMovies = moviesList.querySelectorAll('.conf-step__movie');
        if (remainingMovies.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'conf-step__empty-movies';
            emptyMessage.textContent = 'Нет добавленных фильмов';
            moviesList.appendChild(emptyMessage);
        }
    }

    checkAndHideSections() {
        const hallsList = document.querySelector('.conf-step__list');
        const hasHalls = hallsList && hallsList.children.length > 0;

        // Секции, которые зависят от наличия залов
        const dependentSections = [
            '#hallConfigurationSection', 
            '#priceConfigurationSection',
            '#sessionsSection',
            '#salesManagementSection'
        ];

        dependentSections.forEach(selector => {
            const section = document.querySelector(selector);
            if (section) {
                section.style.display = hasHalls ? 'block' : 'none';
            }
        });

        // Если залов не осталось, показываем сообщение
        if (!hasHalls) {
            this.showNoHallsMessage();
        }
    }

    showNoHallsMessage() {
        // Можно добавить сообщение, что залов нет
        console.log('No halls remaining');
    }

    showNotification(message, type = 'info') {
        if (this.notificationSystem) {
            this.notificationSystem.show(message, type);
        } else {
            // Fallback только для разработки
            console.log(`[${type}] ${message}`);
        }
    }
}

// ============================================================================
// НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С API И КОНФИГУРАЦИЯМИ
// ============================================================================

export async function loadHallConfiguration(hallId) {
    try {
        const response = await fetch(`/admin/halls/${hallId}/configuration`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById('hallConfiguration');
        
        if (container) {
            container.innerHTML = html;
            if (window.notifications) {
                window.notifications.show('Конфигурация зала загружена', 'success');
            }
        }
    } catch (error) {
        console.error('Error loading hall configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при загрузке конфигурации зала', 'error');
        }
    }
}

export async function loadPriceConfiguration(hallId) {
    try {
        const response = await fetch(`/admin/halls/${hallId}/prices`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById('priceConfiguration');
        
        if (container) {
            container.innerHTML = html;
            if (window.notifications) {
                window.notifications.show('Конфигурация цен загружена', 'success');
            }
        }
    } catch (error) {
        console.error('Error loading price configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при загрузке конфигурации цен', 'error');
        }
    }
}

// Функции для работы с API залов
export async function toggleHallSales(hallId) {
    try {
        const response = await fetch('/admin/toggle-sales', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({ hall_id: hallId })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error toggling hall sales:', error);
        throw error;
    }
}

export async function fetchHalls() {
    try {
        const response = await fetch('/admin/halls');
        if (!response.ok) throw new Error('Ошибка загрузки залов');
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching halls:', error);
        throw error;
    }
}

// Экспорт класса HallsManager по умолчанию
export default HallsManager;

// Функция для инициализации обработчиков форм залов
export function initHallFormHandlers() {
    console.log('🎯 Инициализация обработчиков форм залов...');

    // Обработчик формы добавления зала
    const addHallForm = document.getElementById('addHallForm');
    if (addHallForm) {
        console.log('✅ Форма addHallForm найдена');
        
        addHallForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('🎯 Отправка формы создания зала');
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Добавление...';

                const response = await fetch("/admin/halls", {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    }
                });
                
                const result = await response.json();

                if (result.success) {
                    console.log('✅ Зал успешно создан');
                    
                    // Закрываем модальное окно
                    closeModal('addHallModal');
                    
                    // Показываем уведомление
                    if (window.notifications) {
                        window.notifications.show(result.message, 'success');
                    }
                    
                    // Сбрасываем форму
                    this.reset();
                    
                    // ОБНОВЛЯЕМ СТРАНИЦУ для отображения нового зала
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    
                } else {
                    console.log('❌ Ошибка при создании зала:', result.message);
                    if (window.notifications) {
                        window.notifications.show(result.message, 'error');
                    }
                }
            } catch (error) {
                console.error('💥 Ошибка сети:', error);
                if (window.notifications) {
                    window.notifications.show('Ошибка сети при создании зала', 'error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    } else {
        console.log('❌ Форма addHallForm не найдена');
    }

    // Обработчик для кнопок открытия модального окна добавления зала
    document.querySelectorAll('[data-open-modal="addHallModal"]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🎯 Кнопка "Создать зал" нажата');
            openModal('addHallModal');
        });
    });
}