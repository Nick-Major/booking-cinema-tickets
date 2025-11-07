// ============================================================================
// ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    console.log('Admin panel initializing...');
    
    initAccordeon();
    initModals();
    initHalls(csrfToken);
    initMovies(csrfToken);
    initSessions(csrfToken);
    initSales(csrfToken);
    initConfigurationHandlers(); // ДОБАВЛЕНО: инициализация конфигураций
    
    console.log('Admin panel initialized successfully!');
});

function initConfigurationHandlers() {
    // Инициализируем обработчики для уже загруженных конфигураций
    initHallConfigurationHandlers();
    initPriceConfigurationHandlers();
}

// ============================================================================
// АККОРДЕОН
// ============================================================================
function initAccordeon() {
    const headers = document.querySelectorAll('.conf-step__header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
}

// ============================================================================
// МОДАЛЬНЫЕ ОКНА
// ============================================================================
function initModals() {
    // Закрытие по клику на фон или крестик
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('popup') || e.target.closest('.popup__dismiss')) {
            closeAllModals();
        }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllModals();
    });
}

function closeAllModals() {
    document.querySelectorAll('.popup.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

function openModal(modalId) {
    closeAllModals();
    document.getElementById(modalId).classList.add('active');
}

// ============================================================================
// УПРАВЛЕНИЕ ЗАЛАМИ
// ============================================================================
function initHalls(csrfToken) {
    // Открытие модалки добавления зала
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-open-modal')) {
            openModal(e.target.getAttribute('data-open-modal'));
        }
    });

    // Открытие модалки удаления зала
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-hall')) {
            const hallId = e.target.getAttribute('data-delete-hall');
            const hallName = e.target.getAttribute('data-hall-name');
            openDeleteHallModal(hallId, hallName);
        }
    });

    // Обработка формы добавления зала
    const addHallForm = document.querySelector('#addHallModal form');
    if (addHallForm) {
        addHallForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createHall(this, csrfToken);
        });
    }

    // Обработка формы удаления зала
    const deleteHallForm = document.querySelector('#deleteHallModal form');
    if (deleteHallForm) {
        deleteHallForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const hallId = document.getElementById('hallIdToDelete').value;
            const hallName = document.getElementById('hallNameToDelete').textContent;
            confirmDeleteHall(hallId, hallName, csrfToken);
        });
    }
}

function openDeleteHallModal(hallId, hallName) {
    // Заполняем данные в модалке удаления
    const hallNameElement = document.getElementById('hallNameToDelete');
    const hallIdInput = document.getElementById('hallIdToDelete');
    
    if (hallNameElement) hallNameElement.textContent = `"${hallName}"`;
    if (hallIdInput) hallIdInput.value = hallId;
    
    openModal('deleteHallModal');
}

async function confirmDeleteHall(hallId, hallName, csrfToken) {
    try {
        const response = await fetch(`/admin/halls/${hallId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Зал удален', 'success');
            closeAllModals();
            
            // Удаляем зал из ВСЕХ секций
            removeHallFromAllSections(hallId, hallName);
            
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при удалении', 'error');
    }
}

function removeHallFromAllSections(hallId, hallName) {
    // 1. Удаляем из списка в "Управление залами" - улучшенная версия
    const listItem = document.querySelector(`.conf-step__list li[data-hall-id="${hallId}"]`);
    if (listItem) {
        listItem.remove();
    } else {
        // Fallback: удаляем по тексту (старый метод)
        const listItems = document.querySelectorAll('.conf-step__list li');
        listItems.forEach(item => {
            if (item.textContent.includes(hallName.replace(/"/g, '')) && !item.classList.contains('conf-step__empty')) {
                item.remove();
            }
        });
    }

    // 2. Удаляем радио-кнопку из "Конфигурация залов"
    removeHallFromRadioGroup('#hallSelector', hallId);
    
    // 3. Удаляем радио-кнопку из "Конфигурация цен" 
    removeHallFromRadioGroup('input[name="prices-hall"]', hallId);

    // 4. Обновляем счетчики и скрываем секции если нужно
    updateHallsCount();
    updateConfigurationSections();
}

function removeHallFromRadioGroup(selector, hallId) {
    const radioGroup = document.querySelector(selector);
    if (!radioGroup) {
        console.warn(`Radio group not found: ${selector}`);
        return;
    }

    const radioItem = radioGroup.querySelector(`input[value="${hallId}"]`)?.closest('li');
    if (radioItem) {
        radioItem.remove();
        console.log(`Removed hall ${hallId} from ${selector}`);
    }
}

function updateConfigurationSections() {
    const hallCount = document.querySelectorAll('.conf-step__list li:not(.conf-step__empty)').length;
    
    // Скрываем секции конфигурации если залов нет
    const configSections = document.querySelectorAll('.conf-step__wrapper .conf-step__selectors-box');
    configSections.forEach(section => {
        if (section.querySelectorAll('li').length === 0) {
            section.innerHTML = '<p class="conf-step__paragraph">Нет доступных залов для конфигурации</p>';
        }
    });

    // Если удалили выбранный зал - выбираем первый из оставшихся
    const hallConfig = document.querySelector('#hallConfiguration');
    const priceConfig = document.querySelector('#priceConfiguration');
    
    if (hallConfig) {
        const currentHallId = hallConfig.querySelector('.hall-configuration')?.dataset.hallId;
        const hallStillExists = document.querySelector(`input[value="${currentHallId}"]`);
        
        if (currentHallId && !hallStillExists) {
            // Перезагружаем конфигурацию для первого доступного зала
            const firstRadio = document.querySelector('input[name="chairs-hall"]');
            if (firstRadio) {
                firstRadio.checked = true;
                loadHallConfiguration(firstRadio.value);
            } else {
                hallConfig.innerHTML = '<p class="conf-step__paragraph">Нет доступных залов для конфигурации</p>';
            }
        }
    }

    if (priceConfig) {
        const currentHallId = priceConfig.querySelector('.price-configuration')?.dataset.hallId;
        const hallStillExists = document.querySelector(`input[value="${currentHallId}"]`);
        
        if (currentHallId && !hallStillExists) {
            // Перезагружаем конфигурацию цен для первого доступного зала
            const firstRadio = document.querySelector('input[name="prices-hall"]');
            if (firstRadio) {
                firstRadio.checked = true;
                loadPriceConfiguration(firstRadio.value);
            } else {
                priceConfig.innerHTML = '<p class="conf-step__paragraph">Нет доступных залов для конфигурации цен</p>';
            }
        }
    }
}

function updateHallsCount() {
    const hallCount = document.querySelectorAll('.conf-step__list li:not(.conf-step__empty)').length;
    const list = document.querySelector('.conf-step__list');
    
    if (hallCount === 0) {
        if (!list.querySelector('.conf-step__empty')) {
            list.innerHTML = '<li class="conf-step__empty">Нет созданных залов</li>';
        }
    } else {
        // Удаляем сообщение "нет залов" если оно есть и залы появились
        const emptyItem = list.querySelector('.conf-step__empty');
        if (emptyItem) {
            emptyItem.remove();
        }
    }
}

async function createHall(form, csrfToken) {
    const formData = new FormData(form);
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        if (response.ok) {
            showNotification('Зал создан', 'success');
            closeAllModals();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Ошибка при создании', 'error');
        }
    } catch (error) {
        showNotification('Ошибка при создании', 'error');
    }
}


// ============================================================================
// КОНФИГУРАЦИЯ ЗАЛОВ И ЦЕН
// ============================================================================

async function loadHallConfiguration(hallId) {
    console.log(`Loading hall configuration for hall ${hallId}`);
    
    try {
        const response = await fetch(`/admin/halls/${hallId}/configuration`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const html = await response.text();
        document.getElementById('hallConfiguration').innerHTML = html;
        
        // Инициализируем обработчики для новой конфигурации
        initHallConfigurationHandlers();
        
        showNotification('Конфигурация зала загружена', 'success');
    } catch (error) {
        console.error('Error loading hall configuration:', error);
        showNotification('Ошибка загрузки конфигурации зала', 'error');
    }
}

function loadPriceConfiguration(hallId) {
    console.log(`Loading price configuration for hall ${hallId}`);
    
    fetch(`/admin/halls/${hallId}/prices`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            document.getElementById('priceConfiguration').innerHTML = html;
            initPriceConfigurationHandlers();
            showNotification('Конфигурация цен загружена', 'success');
        })
        .catch(error => {
            console.error('Error loading price configuration:', error);
            showNotification('Ошибка загрузки конфигурации цен', 'error');
        });
}

function initHallConfigurationHandlers() {
    console.log('Initializing hall configuration handlers');
    
    // Обработчики для кнопок конфигурации зала
    const generateBtns = document.querySelectorAll('[onclick*="generateHallLayout"]');
    const saveBtns = document.querySelectorAll('[onclick*="saveHallConfiguration"]');
    const resetBtns = document.querySelectorAll('[onclick*="resetHallLayout"]');
    
    // Обработчики для кнопок генерации
    generateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const hallId = this.closest('.hall-configuration')?.dataset.hallId;
            if (hallId) generateHallLayout(hallId);
        });
    });
    
    // Обработчики для кнопок сохранения
    saveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const hallId = this.closest('.hall-configuration')?.dataset.hallId;
            if (hallId) saveHallConfiguration(hallId);
        });
    });
    
    // Обработчики для кнопок отмены
    resetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const hallId = this.closest('.hall-configuration')?.dataset.hallId;
            if (hallId) resetHallLayout(hallId);
        });
    });
    
    // Инициализируем обработчики для уже существующих мест
    const hallConfigs = document.querySelectorAll('.hall-configuration');
    hallConfigs.forEach(config => {
        const hallId = config.dataset.hallId;
        initSeatHandlers(hallId);
    });
}

function initPriceConfigurationHandlers() {
    // Здесь будут обработчики для конфигурации цен
    console.log('Initializing price configuration handlers');
    
    const saveBtn = document.querySelector('[onclick*="savePrices"]');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const hallId = this.closest('.price-configuration')?.dataset.hallId;
            if (hallId) savePrices(hallId);
        });
    }
}

// Генерация схемы зала
function generateHallLayout(hallId) {
    console.log(`Generating layout for hall ${hallId}`);
    
    // Получаем значения из полей ввода
    const rowsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .rows-input`);
    const seatsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .seats-input`);
    
    if (!rowsInput || !seatsInput) {
        showNotification('Не найдены поля для ввода рядов и мест', 'error');
        return;
    }
    
    const rows = parseInt(rowsInput.value);
    const seatsPerRow = parseInt(seatsInput.value);
    
    // Валидация
    if (!rows || rows < 1 || rows > 20) {
        showNotification('Введите корректное количество рядов (1-20)', 'error');
        rowsInput.focus();
        return;
    }
    
    if (!seatsPerRow || seatsPerRow < 1 || seatsPerRow > 20) {
        showNotification('Введите корректное количество мест в ряду (1-20)', 'error');
        seatsInput.focus();
        return;
    }
    
    // Показываем индикатор загрузки
    const generateBtn = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] [onclick*="generateHallLayout"]`);
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Генерация...';
    generateBtn.disabled = true;
    
    // Отправляем запрос на сервер
    const formData = new FormData();
    formData.append('rows', rows);
    formData.append('seats_per_row', seatsPerRow);
    
    fetch(`/admin/halls/${hallId}/generate-layout`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .then(html => {
        // Обновляем блок с схемой зала
        const hallLayout = document.querySelector(`#hallLayout-${hallId}`);
        if (hallLayout) {
            hallLayout.innerHTML = html;
            // Инициализируем обработчики для новых мест
            initSeatHandlers(hallId);
        }
        
        showNotification('Схема зала сгенерирована', 'success');
    })
    .catch(error => {
        console.error('Error generating hall layout:', error);
        showNotification('Ошибка при генерации схемы зала', 'error');
    })
    .finally(() => {
        // Восстанавливаем кнопку
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    });
}

// ============================================================================
// ОБРАБОТКА КЛИКОВ ПО МЕСТАМ
// ============================================================================
function initSeatHandlers(hallId) {
    const seats = document.querySelectorAll(`#hallLayout-${hallId} .conf-step__chair`);
    
    seats.forEach(seat => {
        seat.addEventListener('click', function() {
            changeSeatType(this);
        });
    });
}

function changeSeatType(seatElement) {
    const currentType = seatElement.dataset.type;
    const newType = getNextSeatType(currentType);
    
    // Меняем тип места
    seatElement.dataset.type = newType;
    
    // Обновляем классы
    seatElement.className = 'conf-step__chair ' + getSeatClass(newType);
    
    console.log(`Changed seat type to: ${newType}`);
}

function getNextSeatType(currentType) {
    const types = ['regular', 'vip', 'blocked'];
    const currentIndex = types.indexOf(currentType);
    return types[(currentIndex + 1) % types.length];
}

function getSeatClass(seatType) {
    const classes = {
        'regular': 'conf-step__chair_standart',
        'vip': 'conf-step__chair_vip', 
        'blocked': 'conf-step__chair_disabled'
    };
    return classes[seatType] || classes.regular;
}

// Сохранение конфигурации зала
async function saveHallConfiguration(hallId) {
    console.log(`Saving configuration for hall ${hallId}`);
    
    // Собираем данные о всех местах
    const seats = [];
    const seatElements = document.querySelectorAll(`#hallLayout-${hallId} .conf-step__chair`);
    
    seatElements.forEach(seat => {
        seats.push({
            row: parseInt(seat.dataset.row),
            seat: parseInt(seat.dataset.seat),
            type: seat.dataset.type
        });
    });
    
    console.log('Seats to save:', seats);
    
    // Показываем индикатор загрузки
    const saveBtn = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] [onclick*="saveHallConfiguration"]`);
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Сохранение...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(`/admin/halls/${hallId}/save-configuration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ seats })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Конфигурация зала сохранена', 'success');
            console.log('Configuration saved successfully');
        } else {
            showNotification(result.message || 'Ошибка при сохранении конфигурации', 'error');
            console.error('Save configuration error:', result.message);
        }
    } catch (error) {
        console.error('Error saving hall configuration:', error);
        showNotification('Ошибка при сохранении конфигурации', 'error');
    } finally {
        // Восстанавливаем кнопку
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Сброс конфигурации зала
async function resetHallLayout(hallId) {
    console.log(`Resetting layout for hall ${hallId}`);
    
    if (!confirm('Вы действительно хотите сбросить все изменения? Несохраненные данные будут потеряны.')) {
        return;
    }
    
    // Показываем индикатор загрузки
    const resetBtn = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] [onclick*="resetHallLayout"]`);
    const originalText = resetBtn.textContent;
    resetBtn.textContent = 'Сброс...';
    resetBtn.disabled = true;
    
    try {
        // Получаем свежие данные с сервера
        const response = await fetch(`/admin/halls/${hallId}/configuration`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const html = await response.text();
        
        // Заменяем всю конфигурацию зала
        const hallConfig = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"]`);
        if (hallConfig) {
            hallConfig.outerHTML = html;
            
            // Инициализируем обработчики для обновленной конфигурации
            initHallConfigurationHandlers();
            
            showNotification('Конфигурация сброшена', 'success');
        }
    } catch (error) {
        console.error('Error resetting hall layout:', error);
        showNotification('Ошибка при сбросе конфигурации', 'error');
    } finally {
        // Восстанавливаем кнопку (если она еще существует)
        const newResetBtn = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] [onclick*="resetHallLayout"]`);
        if (newResetBtn) {
            newResetBtn.textContent = originalText;
            newResetBtn.disabled = false;
        }
    }
}

function savePrices(hallId) {
    console.log(`Save prices for hall ${hallId}`);
    
    // Получаем значения цен
    const regularPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .regular-price-input`);
    const vipPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .vip-price-input`);
    
    const regularPrice = parseFloat(regularPriceInput?.value);
    const vipPrice = parseFloat(vipPriceInput?.value);
    
    // Валидация
    if (!regularPrice || regularPrice < 0) {
        showNotification('Введите корректную цену для обычных мест', 'error');
        regularPriceInput?.focus();
        return;
    }
    
    if (!vipPrice || vipPrice < 0) {
        showNotification('Введите корректную цену для VIP мест', 'error');
        vipPriceInput?.focus();
        return;
    }
    
    console.log('Prices to save:', { regularPrice, vipPrice });
    showNotification('Сохранение цен (функция в разработке)', 'info');
}

// ============================================================================
// УПРАВЛЕНИЕ ФИЛЬМАМИ
// ============================================================================
function initMovies(csrfToken) {
    // Удаление фильма
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-movie')) {
            const movieId = e.target.getAttribute('data-delete-movie');
            const movieName = e.target.getAttribute('data-movie-name');
            deleteMovie(movieId, movieName, csrfToken);
        }
    });

    // Обработка формы добавления фильма
    const addMovieForm = document.querySelector('#addMovieModal form');
    if (addMovieForm) {
        addMovieForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createMovie(this, csrfToken);
        });
    }

    // Превью постера
    const posterInput = document.querySelector('input[name="movie_poster"]');
    if (posterInput) {
        posterInput.addEventListener('change', function(e) {
            previewMoviePoster(this);
        });
    }
}

async function deleteMovie(movieId, movieName, csrfToken) {
    if (!confirm(`Удалить фильм "${movieName}"?`)) return;

    try {
        const response = await fetch(`/admin/movies/${movieId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Фильм удален', 'success');
            const movieElement = document.querySelector(`[data-movie-id="${movieId}"]`);
            if (movieElement) movieElement.remove();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при удалении фильма', 'error');
    }
}

async function createMovie(form, csrfToken) {
    const formData = new FormData(form);
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        if (response.ok) {
            showNotification('Фильм добавлен', 'success');
            closeAllModals();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Ошибка при добавлении фильма', 'error');
        }
    } catch (error) {
        showNotification('Ошибка при добавлении фильма', 'error');
    }
}

function previewMoviePoster(input) {
    const preview = document.getElementById('posterPreview');
    if (!preview) return;

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%; object-fit:cover;">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================================================
// УПРАВЛЕНИЕ СЕАНСАМИ
// ============================================================================
function initSessions(csrfToken) {
    // Удаление сеанса
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-delete-session')) {
            const sessionId = e.target.getAttribute('data-delete-session');
            const movieName = e.target.getAttribute('data-movie-name');
            deleteSession(sessionId, movieName, csrfToken);
        }
    });

    // Обработка формы добавления сеанса
    const addSessionForm = document.querySelector('#addSessionModal form');
    if (addSessionForm) {
        addSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createSession(this, csrfToken);
        });
    }

    // Инициализация Drag & Drop
    initSessionDragHandlers();
    
    // Загрузка начальных данных timeline
    loadSessionsTimeline();
}

// Функция для загрузки timeline
async function loadSessionsTimeline() {
    const currentDate = document.querySelector('input[type="date"]')?.value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`/admin/sessions?date=${currentDate}`);
        const sessions = await response.json();
        updateSessionsTimeline(sessions);
    } catch (error) {
        console.error('Error loading sessions timeline:', error);
    }
}

async function deleteSession(sessionId, movieName, csrfToken) {
    if (!confirm(`Удалить сеанс фильма "${movieName}"?`)) return;

    try {
        const response = await fetch(`/admin/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Сеанс удален', 'success');
            const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (sessionElement) sessionElement.remove();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при удалении сеанса', 'error');
    }
}

async function createSession(form, csrfToken) {
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/admin/sessions', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRF-TOKEN': csrfToken },
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Сеанс создан', 'success');
            closeAllModals();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при создании сеанса', 'error');
    }
}

// ============================================================================
// DRAG & DROP ДЛЯ СЕАНСОВ
// ============================================================================

function allowDrop(event) {
    event.preventDefault();
}

function dragSession(event, sessionId) {
    console.log('=== DRAG START ===');
    console.log('Event target:', event.target);
    console.log('Session ID from parameter:', sessionId);
    console.log('Dataset:', event.target.dataset);
    
    // Принудительно получаем sessionId из data-атрибута
    const actualSessionId = event.target.getAttribute('data-session-id');
    console.log('Session ID from data attribute:', actualSessionId);
    
    if (!actualSessionId) {
        console.error('No sessionId found in data attributes!');
        return;
    }
    
    event.dataTransfer.setData('sessionId', actualSessionId);
    
    const hallElement = event.target.closest('.conf-step__timeline-hall');
    console.log('Hall element:', hallElement);
    
    if (hallElement && hallElement.dataset.hallId) {
        event.dataTransfer.setData('sourceHallId', hallElement.dataset.hallId);
        console.log('Source hall set to:', hallElement.dataset.hallId);
    }
    
    console.log('=== DRAG END ===');
}

async function dropSession(event, targetHallId) {
    event.preventDefault();
    
    const sessionId = event.dataTransfer.getData('sessionId');
    const sourceHallId = event.dataTransfer.getData('sourceHallId');
    
    console.log('Drop data:', { sessionId, sourceHallId, targetHallId });
    
    if (!sessionId) {
        showNotification('Ошибка: не удалось определить сеанс', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/admin/sessions/${sessionId}/move-hall`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({
                cinema_hall_id: parseInt(targetHallId)
            })
        });

        const result = await response.json();
        console.log('Move response:', result);

        if (result.success) {
            showNotification('Сеанс перемещен', 'success');
            // Обновляем timeline
            setTimeout(() => window.location.reload(), 500); // Просто перезагружаем для простоты
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Drop session error:', error);
        showNotification('Ошибка при перемещении сеанса', 'error');
    }
}

// Функция для изменения времени сеанса перетаскиванием по timeline
function initSessionDragHandlers() {
    const sessions = document.querySelectorAll('.conf-step__seances-movie--draggable');
    
    sessions.forEach(session => {
        session.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('sessionId', this.dataset.sessionId);
            e.dataTransfer.setData('currentPosition', this.style.left);
            this.classList.add('dragging');
        });
        
        session.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
}

// ============================================================================
// TIMELINE УПРАВЛЕНИЕ
// ============================================================================

async function changeTimelineDate(date) {
    try {
        const response = await fetch(`/admin/sessions?date=${date}`);
        const sessions = await response.json();
        
        // Обновляем отображение сеансов
        updateSessionsTimeline(sessions);
        
        // Обновляем отображаемую дату
        const dateDisplay = document.querySelector('.conf-step__date-display');
        if (dateDisplay) {
            dateDisplay.textContent = new Date(date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        showNotification(`Загружены сеансы на ${date}`, 'success');
    } catch (error) {
        showNotification('Ошибка загрузки сеансов', 'error');
    }
}

function updateSessionsTimeline(sessions) {
    const timeline = document.getElementById('sessionsTimeline');
    if (!timeline) return;

    // Группируем сеансы по залам
    const sessionsByHall = sessions.reduce((acc, session) => {
        const hallId = session.cinema_hall_id;
        if (!acc[hallId]) acc[hallId] = [];
        acc[hallId].push(session);
        return acc;
    }, {});

    // Обновляем каждый зал
    document.querySelectorAll('.conf-step__timeline-hall').forEach(hallElement => {
        const hallId = hallElement.dataset.hallId;
        const hallSessions = sessionsByHall[hallId] || [];
        const sessionsTrack = hallElement.querySelector('.conf-step__sessions-track');
        
        if (sessionsTrack) {
            sessionsTrack.innerHTML = '';
            
            if (hallSessions.length === 0) {
                sessionsTrack.innerHTML = `
                    <div class="conf-step__empty-track">
                        <p>Нет сеансов на эту дату</p>
                        <button class="conf-step__button conf-step__button-accent conf-step__button-small"
                                onclick="openAddSessionModal(${hallId}, '${document.querySelector('input[type="date"]').value}')">
                            Добавить сеанс
                        </button>
                    </div>
                `;
            } else {
                hallSessions.forEach(session => {
                    sessionsTrack.innerHTML += generateSessionBlockHTML(session);
                });
            }
        }
    });

    // Инициализируем обработчики для новых сеансов
    initSessionDragHandlers();
}

function generateSessionBlockHTML(session) {
    const startTime = new Date(session.session_start);
    const endTime = new Date(session.session_end);
    const position = calculateTimelinePosition(startTime, endTime);
    
    return `
        <div class="conf-step__seances-movie conf-step__seances-movie--draggable"
             style="width: ${position.width}%; left: ${position.left}%;"
             data-session-id="${session.id}"
             draggable="true"
             ondragstart="dragSession(event, ${session.id})"
             ondblclick="openDeleteSessionModal(${session.id}, '${session.movie.title}')"
             title="${session.movie.title} | ${startTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}">
            <div class="conf-step__seances-movie-content">
                <p class="conf-step__seances-movie-title">
                    ${session.movie.title.length > 15 ? session.movie.title.substring(0, 15) + '...' : session.movie.title}
                </p>
                <p class="conf-step__seances-movie-start">
                    ${startTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                </p>
            </div>
        </div>
    `;
}

function calculateTimelinePosition(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    // Расчет для timeline с 8:00 до 2:00 следующего дня
    const timelineStart = 8 * 60; // 8:00
    const timelineEnd = 26 * 60;  // 2:00 следующего дня
    
    const left = ((startMinutes - timelineStart) / (timelineEnd - timelineStart)) * 100;
    const width = ((endMinutes - startMinutes) / (timelineEnd - timelineStart)) * 100;
    
    return {
        left: Math.max(0, Math.min(100, left)),
        width: Math.max(1.5, Math.min(100, width))
    };
}

// ============================================================================
// УПРАВЛЕНИЕ ПРОДАЖАМИ
// ============================================================================
function initSales(csrfToken) {
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-toggle-sales')) {
            const hallId = e.target.getAttribute('data-toggle-sales');
            const isActive = e.target.getAttribute('data-is-active') === 'true';
            toggleSales(hallId, isActive, csrfToken);
        }
    });
}

async function toggleSales(hallId, isActive, csrfToken) {
    const action = isActive ? 'deactivate' : 'activate';
    
    try {
        const response = await fetch('/admin/toggle-sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({
                hall_id: hallId,
                action: action
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            // Обновляем кнопку
            const button = document.querySelector(`[data-toggle-sales="${hallId}"]`);
            if (button) {
                const newIsActive = !isActive;
                button.setAttribute('data-is-active', newIsActive);
                button.textContent = newIsActive ? 'Приостановить продажи' : 'Открыть продажи';
                button.classList.toggle('conf-step__button-warning', newIsActive);
                button.classList.toggle('conf-step__button-accent', !newIsActive);
                
                // Обновляем статус
                const statusElement = button.closest('li').querySelector('.sales-status');
                if (statusElement) {
                    statusElement.textContent = newIsActive ? 'Продажи открыты' : 'Продажи приостановлены';
                    statusElement.className = `sales-status ${newIsActive ? 'active' : 'inactive'}`;
                }
            }
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка при изменении статуса продаж', 'error');
    }
}

// ============================================================================
// УВЕДОМЛЕНИЯ
// ============================================================================
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#16a6af' : '#dc3545'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        font-size: 1.4rem;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
