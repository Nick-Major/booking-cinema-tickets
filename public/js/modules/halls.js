// @ts-nocheck

import { openModal, closeModal } from '../core/modals.js';

// Кэширование и управление запросами
let hallConfigCache = {}; // Кэш для конфигураций залов
let priceConfigCache = {}; // Кэш для конфигураций цен
let hallConfigAbortController = null;
let priceConfigAbortController = null;
let isHallLoading = false; // Флаг загрузки конфигурации зала
let isPriceLoading = false; // Флаг загрузки конфигурации цен

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
            console.error('Кнопка удаления не найдена!');
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
        const hasHalls = hallsList && hallsList.querySelectorAll('li[data-hall-id]').length > 0;

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

        // Показываем/скрываем сообщение "Нет созданных залов"
        const emptyMessage = document.querySelector('.conf-step__empty');
        if (emptyMessage) {
            emptyMessage.style.display = hasHalls ? 'none' : 'block';
        }
    }

    showNoHallsMessage() {
        console.log('No halls remaining');
    }

    showNotification(message, type = 'info') {
        if (this.notificationSystem) {
            this.notificationSystem.show(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

// Метод для обновления списка залов
HallsManager.prototype.updateHallList = async function() {
    try {
        console.log('Обновление списка залов...');
        
        const response = await fetch('/admin/halls');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const halls = await response.json();
        console.log('Получены залы:', halls);
        
        // Обновляем список залов
        this.updateHallsList(halls);
        
        // Обновляем все селекторы залов в других секциях
        this.updateAllHallSelectors(halls);
        
        this.showNotification('Список залов обновлен', 'success');
        
    } catch (error) {
        console.error('Error updating hall list:', error);
        this.showNotification('Ошибка при обновлении списка залов', 'error');
    }
};

// Обновляем список залов (ul.conf-step__list)
HallsManager.prototype.updateHallsList = function(halls) {
    const listContainer = document.querySelector('.conf-step__list');
    const emptyMessage = document.querySelector('.conf-step__empty');
    
    if (!listContainer) {
        console.warn('Контейнер списка залов не найден');
        return;
    }
    
    if (halls.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        } else {
            // Создаем сообщение если его нет
            const emptyLi = document.createElement('li');
            emptyLi.className = 'conf-step__empty';
            emptyLi.textContent = 'Нет созданных залов';
            listContainer.innerHTML = '';
            listContainer.appendChild(emptyLi);
        }
        return;
    }
    
    // Скрываем сообщение "пусто"
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    // Генерируем новое содержимое списка
    let html = '';
    halls.forEach(hall => {
        html += `
            <li data-hall-id="${hall.id}">
                ${hall.hall_name}
                <button class="conf-step__button conf-step__button-trash" 
                        data-delete-hall="${hall.id}"
                        data-hall-name="${hall.hall_name}"></button>
            </li>
        `;
    });
    
    listContainer.innerHTML = html;
    
    // Переинициализируем обработчики кнопок
    this.bindEvents();
    
    // Проверяем и обновляем видимость секций
    this.checkAndHideSections();
};

// Обновление всех селекторов залов
HallsManager.prototype.updateAllHallSelectors = function(halls) {
    // 1. Обновляем селектор в конфигурации залов
    this.updateHallConfigurationSelector(halls);
    
    // 2. Обновляем селектор в конфигурации цен
    this.updatePriceConfigurationSelector(halls);
    
    // 3. Обновляем список в управлении продажами
    this.updateSalesManagementSelector(halls);
};

// Обновление селектора конфигурации залов
HallsManager.prototype.updateHallConfigurationSelector = function(halls) {
    const hallSelector = document.querySelector('#hallSelector');
    if (!hallSelector) return;
    
    let html = '';
    halls.forEach(hall => {
        // Проверяем, какой зал был выбран ранее
        const wasSelected = hallSelector.querySelector(`input[value="${hall.id}"]`)?.checked || false;
        
        html += `
            <li>
                <input type="radio" class="conf-step__radio" name="chairs-hall"
                       value="${hall.id}" ${wasSelected || halls[0].id === hall.id ? 'checked' : ''}
                       onchange="loadHallConfiguration(${hall.id})">
                <span class="conf-step__selector">${hall.hall_name}</span>
            </li>
        `;
    });
    
    hallSelector.innerHTML = html;
    
    // Загружаем конфигурацию для выбранного зала
    const selectedRadio = hallSelector.querySelector('input[type="radio"]:checked');
    if (selectedRadio && typeof loadHallConfiguration === 'function') {
        loadHallConfiguration(selectedRadio.value);
    }
};

// Обновление селектора конфигурации цен
HallsManager.prototype.updatePriceConfigurationSelector = function(halls) {
    const priceSelector = document.querySelector('#priceConfigurationSection .conf-step__selectors-box');
    if (!priceSelector) return;
    
    let html = '';
    halls.forEach(hall => {
        // Проверяем, какой зал был выбран ранее
        const wasSelected = priceSelector.querySelector(`input[value="${hall.id}"]`)?.checked || false;
        
        html += `
            <li>
                <input type="radio" class="conf-step__radio" name="prices-hall"
                       value="${hall.id}" ${wasSelected || halls[0].id === hall.id ? 'checked' : ''}
                       onchange="loadPriceConfiguration(${hall.id})">
                <span class="conf-step__selector">${hall.hall_name}</span>
            </li>
        `;
    });
    
    priceSelector.innerHTML = html;
    
    // Загружаем конфигурацию цен для выбранного зала
    const selectedRadio = priceSelector.querySelector('input[type="radio"]:checked');
    if (selectedRadio && typeof loadPriceConfiguration === 'function') {
        loadPriceConfiguration(selectedRadio.value);
    }
};

// Обновление списка в управлении продажами
HallsManager.prototype.updateSalesManagementSelector = function(halls) {
    const salesList = document.querySelector('.conf-step__sales-list');
    if (!salesList) return;
    
    let html = '';
    halls.forEach(hall => {
        html += `
            <li>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="hall-name">${hall.hall_name}</span>
                    <span class="sales-status ${hall.is_active ? 'active' : 'inactive'}">
                        ${hall.is_active ? 'Продажи открыты' : 'Продажи приостановлены'}
                    </span>
                </div>
                <button class="conf-step__button conf-step__button-small ${hall.is_active ? 'conf-step__button-warning' : 'conf-step__button-accent'}"
                        data-toggle-sales="${hall.id}"
                        data-is-active="${hall.is_active ? 'true' : 'false'}">
                    ${hall.is_active ? 'Приостановить продажу билетов' : 'Открыть продажу билетов'}
                </button>
            </li>
        `;
    });
    
    salesList.innerHTML = html;
    
    // Добавляем обработчики для кнопок управления продажами
    this.bindSalesEvents();
};

// Привязка событий для кнопок управления продажами
HallsManager.prototype.bindSalesEvents = function() {
    document.querySelectorAll('[data-toggle-sales]').forEach(button => {
        button.addEventListener('click', (e) => {
            const hallId = e.currentTarget.getAttribute('data-toggle-sales');
            const isActive = e.currentTarget.getAttribute('data-is-active') === 'true';
            
            // Отправляем запрос на сервер
            fetch('/admin/toggle-sales', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ hall_id: hallId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.showNotification(data.message, 'success');
                    // Обновляем список залов
                    this.updateHallList();
                } else {
                    this.showNotification(data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error toggling sales:', error);
                this.showNotification('Ошибка при изменении статуса продаж', 'error');
            });
        });
    });
};

// Экспортируемые функции для загрузки конфигураций
export async function loadHallConfiguration(hallId) {
    console.time(`loadHallConfiguration-${hallId}`);
    
    // Если уже идет загрузка для этого зала, прерываем
    if (isHallLoading && hallConfigAbortController) {
        console.log('Отменяем предыдущую загрузку конфигурации зала');
        hallConfigAbortController.abort();
    }
    
    // Проверяем кэш
    if (hallConfigCache[hallId]) {
        console.log('Используем кэшированную конфигурацию зала для:', hallId);
        const container = document.getElementById('hallConfiguration');
        if (container) {
            container.innerHTML = hallConfigCache[hallId];
            console.timeEnd(`loadHallConfiguration-${hallId}`);
            return;
        }
    }
    
    hallConfigAbortController = new AbortController();
    isHallLoading = true;
    
    try {
        // Показываем индикатор загрузки
        const container = document.getElementById('hallConfiguration');
        if (container) {
            container.innerHTML = '<div class="loading-indicator">Загрузка конфигурации...</div>';
        }
        
        const response = await fetch(`/admin/halls/${hallId}/configuration`, {
            signal: hallConfigAbortController.signal,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache' // Для свежих данных
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Кэшируем результат
        hallConfigCache[hallId] = html;
        console.log('Конфигурация зала закэширована:', hallId);
        
        // Обновляем контейнер с использованием requestAnimationFrame для плавности
        if (container) {
            requestAnimationFrame(() => {
                container.innerHTML = html;
                // Вызываем инициализацию скриптов для загруженного контента
                setTimeout(() => initializeHallConfigurationScripts(hallId), 0);
            });
        }
        
        if (window.notifications) {
            window.notifications.show('Конфигурация зала загружена', 'success');
        }
        
    } catch (error) {
        // Игнорируем ошибку отмены запроса
        if (error.name === 'AbortError') {
            console.log('Запрос конфигурации зала отменен');
        } else {
            console.error('Error loading hall configuration:', error);
            if (window.notifications) {
                window.notifications.show('Ошибка при загрузке конфигурации зала', 'error');
            }
        }
    } finally {
        isHallLoading = false;
        console.timeEnd(`loadHallConfiguration-${hallId}`);
    }
}

// Функция для инициализации скриптов в загруженной конфигурации
function initializeHallConfigurationScripts(hallId) {
    const container = document.getElementById('hallConfiguration');
    if (!container) return;
    
    // Проверяем, не инициализирован ли уже этот контейнер
    if (container.dataset.initialized === 'true') {
        return;
    }
    container.dataset.initialized = 'true';
    
    // 1. Кнопка генерации схемы
    const generateBtn = container.querySelector('button.conf-step__button-regular');
    if (generateBtn && generateBtn.textContent.includes('Сгенерировать') && window.generateHallLayout) {
        generateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const rowsInput = container.querySelector('.rows-input');
            const seatsInput = container.querySelector('.seats-input');
            
            if (rowsInput && seatsInput) {
                const rows = Math.max(1, Math.min(20, parseInt(rowsInput.value) || 0));
                const seats = Math.max(1, Math.min(20, parseInt(seatsInput.value) || 0));
                
                if (rows > 0 && seats > 0) {
                    // Обновляем значения в инпутах
                    rowsInput.value = rows;
                    seatsInput.value = seats;
                    
                    window.generateHallLayout(hallId, rows, seats);
                }
            }
        });
    }
    
    // 2. Кнопка сброса схемы
    const resetBtns = container.querySelectorAll('button.conf-step__button-regular');
    resetBtns.forEach(btn => {
        if (btn.textContent.includes('Сбросить') && window.openResetHallConfigurationModal) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Находим название зала
                let hallName = '';
                const hallRadio = document.querySelector(`#hallSelector input[value="${hallId}"]`);
                if (hallRadio) {
                    const selector = hallRadio.nextElementSibling;
                    if (selector && selector.classList.contains('conf-step__selector')) {
                        hallName = selector.textContent.trim();
                    }
                }
                
                window.openResetHallConfigurationModal(hallId, hallName);
            });
        }
    });
    
    // 3. Кнопка сохранения схемы
    const saveBtn = container.querySelector('button.conf-step__button-accent');
    if (saveBtn && saveBtn.textContent.includes('Сохранить') && window.saveHallConfiguration) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Собираем данные мест
            const seats = [];
            const hallLayout = container.querySelector('#hallLayout-' + hallId);
            
            if (hallLayout) {
                const seatElements = hallLayout.querySelectorAll('.conf-step__chair');
                seatElements.forEach(seatElement => {
                    const row = parseInt(seatElement.getAttribute('data-row')) || 0;
                    const seat = parseInt(seatElement.getAttribute('data-seat')) || 0;
                    const type = seatElement.getAttribute('data-type') || 'regular';
                    
                    if (row > 0 && seat > 0) {
                        seats.push({
                            row: row,
                            seat: seat,
                            type: type
                        });
                    }
                });
            }
            
            if (seats.length > 0) {
                window.saveHallConfiguration(hallId, seats);
            } else {
                if (window.notifications) {
                    window.notifications.show('Нет данных для сохранения. Сгенерируйте схему зала.', 'error');
                }
            }
        });
    }
    
    // 4. Обработчики для кликов по местам
    const seatElements = container.querySelectorAll('.conf-step__chair');
    seatElements.forEach(seatElement => {
        if (!seatElement.hasAttribute('data-click-handler')) {
            seatElement.setAttribute('data-click-handler', 'true');
            seatElement.addEventListener('click', function() {
                if (window.changeSeatType) {
                    window.changeSeatType(this);
                }
            });
        }
    });
}

export async function loadPriceConfiguration(hallId) {
    console.time(`loadPriceConfiguration-${hallId}`);
    
    // Если уже идет загрузка для этого зала, прерываем
    if (isPriceLoading && priceConfigAbortController) {
        console.log('Отменяем предыдущую загрузку конфигурации цен');
        priceConfigAbortController.abort();
    }
    
    // Проверяем кэш
    if (priceConfigCache[hallId]) {
        console.log('Используем кэшированную конфигурацию цен для:', hallId);
        const container = document.getElementById('priceConfiguration');
        if (container) {
            container.innerHTML = priceConfigCache[hallId];
            console.timeEnd(`loadPriceConfiguration-${hallId}`);
            return;
        }
    }
    
    priceConfigAbortController = new AbortController();
    isPriceLoading = true;
    
    try {
        // Показываем индикатор загрузки
        const container = document.getElementById('priceConfiguration');
        if (container) {
            container.innerHTML = '<div class="loading-indicator">Загрузка цен...</div>';
        }
        
        const response = await fetch(`/admin/halls/${hallId}/prices`, {
            signal: priceConfigAbortController.signal,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Кэшируем результат
        priceConfigCache[hallId] = html;
        console.log('Конфигурация цен закэширована:', hallId);
        
        // Обновляем контейнер
        if (container) {
            requestAnimationFrame(() => {
                container.innerHTML = html;
                // Инициализация скриптов для цен
                setTimeout(() => initializePriceConfigurationScripts(hallId), 0);
            });
        }
        
        if (window.notifications) {
            window.notifications.show('Конфигурация цен загружена', 'success');
        }
        
    } catch (error) {
        // Игнорируем ошибку отмены запроса
        if (error.name === 'AbortError') {
            console.log('Запрос конфигурации цен отменен');
        } else {
            console.error('Error loading price configuration:', error);
            if (window.notifications) {
                window.notifications.show('Ошибка при загрузке конфигурации цен', 'error');
            }
        }
    } finally {
        isPriceLoading = false;
        console.timeEnd(`loadPriceConfiguration-${hallId}`);
    }
}

// Функция для инициализации скриптов в загруженной конфигурации цен
function initializePriceConfigurationScripts(hallId) {
    const container = document.getElementById('priceConfiguration');
    if (!container) return;
    
    // Обработчики для формы цен
    const priceForm = container.querySelector('form');
    if (priceForm) {
        priceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePriceConfiguration(hallId);
        });
    }
}

// Функции для очистки кэша (вызывать после сохранения изменений)
export function clearHallConfigCache(hallId) {
    if (hallConfigCache[hallId]) {
        delete hallConfigCache[hallId];
        console.log('Кэш конфигурации зала очищен:', hallId);
    }
}

export function clearPriceConfigCache(hallId) {
    if (priceConfigCache[hallId]) {
        delete priceConfigCache[hallId];
        console.log('Кэш конфигурации цен очищен:', hallId);
    }
}

// Функция сохранения конфигурации цен
async function savePriceConfiguration(hallId) {
    try {
        const form = document.querySelector('#priceConfiguration form');
        if (!form) return;
        
        const formData = new FormData(form);
        
        const response = await fetch(`/admin/halls/${hallId}/update-prices`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (window.notifications) {
                window.notifications.show(result.message || 'Цены обновлены', 'success');
            }
            // Очищаем кэш после успешного сохранения
            clearPriceConfigCache(hallId);
        } else {
            if (window.notifications) {
                window.notifications.show(result.message || 'Ошибка при обновлении цен', 'error');
            }
        }
    } catch (error) {
        console.error('Error saving price configuration:', error);
        if (window.notifications) {
            window.notifications.show('Ошибка при сохранении цен', 'error');
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

// Предзагрузка конфигураций при загрузке страницы
export function preloadConfigurations() {
    document.addEventListener('DOMContentLoaded', () => {
        // Находим выбранные радио-кнопки
        const selectedHallConfig = document.querySelector('input[name="chairs-hall"]:checked');
        const selectedPriceConfig = document.querySelector('input[name="prices-hall"]:checked');
        
        if (selectedHallConfig) {
            // Предзагружаем с небольшой задержкой, чтобы не блокировать основной поток
            setTimeout(() => {
                loadHallConfiguration(selectedHallConfig.value);
            }, 300);
        }
        
        if (selectedPriceConfig) {
            setTimeout(() => {
                loadPriceConfiguration(selectedPriceConfig.value);
            }, 500);
        }
    });
}

// Инициализация предзагрузки
preloadConfigurations();

// Экспорт класса HallsManager по умолчанию
export default HallsManager;

// Функция для инициализации обработчиков форм залов
export function initHallFormHandlers() {
    console.log('Инициализация обработчиков форм залов...');

    // Обработчик формы добавления зала
    const addHallForm = document.getElementById('addHallForm');
    if (addHallForm) {
        console.log('Форма addHallForm найдена');
        
        addHallForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Отправка формы создания зала');
            
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
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    }
                });
                
                const result = await response.json();
                console.log('Response:', result);

                if (result.success) {
                    console.log('Зал успешно создан');
                    
                    // Закрываем модальное окно
                    closeModal('addHallModal');
                    
                    // Показываем уведомление
                    if (window.notifications) {
                        window.notifications.show(result.message, 'success');
                    }
                    
                    // Сбрасываем форму
                    this.reset();
                    
                    // Очищаем кэши при создании нового зала
                    hallConfigCache = {};
                    priceConfigCache = {};
                    
                    // Обновляем список залов через HallsManager
                    if (window.hallsManager && typeof window.hallsManager.updateHallList === 'function') {
                        await window.hallsManager.updateHallList();
                    } else {
                        console.warn('HallsManager не найден, пробуем обновить вручную');
                        // Альтернатива: вызываем fetch для обновления
                        const hallsResponse = await fetch('/admin/halls');
                        const halls = await hallsResponse.json();
                        
                        // Обновляем список залов
                        const listContainer = document.querySelector('.conf-step__list');
                        if (listContainer) {
                            let html = '';
                            halls.forEach(hall => {
                                html += `
                                    <li data-hall-id="${hall.id}">
                                        ${hall.hall_name}
                                        <button class="conf-step__button conf-step__button-trash" 
                                                data-delete-hall="${hall.id}"
                                                data-hall-name="${hall.hall_name}"></button>
                                    </li>
                                `;
                            });
                            listContainer.innerHTML = html;
                        }
                    }
                    
                } else {
                    console.log('Ошибка при создании зала:', result.message);
                    if (window.notifications) {
                        window.notifications.show(result.message, 'error');
                    }
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                if (window.notifications) {
                    window.notifications.show('Ошибка сети при создании зала', 'error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    } else {
        console.log('Форма addHallForm не найдена');
    }

    // Обработчик для кнопок открытия модального окна добавления зала
    document.querySelectorAll('[data-open-modal="addHallModal"]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Кнопка "Создать зал" нажата');
            openModal('addHallModal');
        });
    });
}
