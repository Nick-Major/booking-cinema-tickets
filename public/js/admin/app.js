// ============================================================================
// ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    console.log('Admin panel initializing...');
    
    // Проверяем наличие необходимых элементов
    if (!csrfToken) {
        console.error('CSRF token not found!');
    }
    
    try {
        initAccordeon();
        initModals();
        initHalls(csrfToken);
        initMovies(csrfToken);
        initSessions(csrfToken);
        initSales(csrfToken);
        initConfigurationHandlers();
        
        console.log('Admin panel initialized successfully!');
    } catch (error) {
        console.error('Error during admin panel initialization:', error);
    }
});

function initConfigurationHandlers() {
    // Инициализируем обработчики для уже загруженных конфигураций
    initHallConfigurationHandlers();
    initPriceConfigurationHandlers();
    initRadioHandlers();
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

function closeAddMovieModal() {
    const modal = document.getElementById('addMovieModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        // Очищаем форму
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Очищаем превью постера
        const preview = document.getElementById('posterPreview');
        if (preview) {
            preview.innerHTML = '<span>Постер фильма</span>';
        }
    }
}

function closeEditMovieModal() {
    const modal = document.getElementById('editMovieModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function closeAddSessionModal() {
    const modal = document.getElementById('addSessionModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function closeEditSessionModal() {
    const modal = document.getElementById('editSessionModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function closeAddHallModal() {
    const modal = document.getElementById('addHallModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function closeDeleteHallModal() {
    const modal = document.getElementById('deleteHallModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
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

function openAddHallModal() {
    const modal = document.getElementById('addHallModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
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
    console.log(`Removing hall ${hallId} from all sections`);
    
    // 1. Удаляем из списка в "Управление залами"
    const listItem = document.querySelector(`.conf-step__list li[data-hall-id="${hallId}"]`);
    if (listItem) {
        listItem.remove();
    } else {
        // Fallback: удаляем по тексту
        const listItems = document.querySelectorAll('.conf-step__list li');
        listItems.forEach(item => {
            if (item.textContent.includes(hallName.replace(/"/g, '')) && !item.classList.contains('conf-step__empty')) {
                item.remove();
            }
        });
    }

    // 2. Удаляем радио-кнопку из "Конфигурация залов" и обновляем выбор
    removeHallFromRadioGroup('input[name="chairs-hall"]', hallId);
    
    // 3. Удаляем радио-кнопку из "Конфигурация цен" и обновляем выбор
    removeHallFromRadioGroup('input[name="prices-hall"]', hallId);
    
    // 4. Удаляем зал из секции сеансов
    removeHallFromSessionsSection(hallId, hallName);

    // 5. Обновляем счетчики и скрываем секции если нужно
    updateHallsCount();
    updateConfigurationSections();
}

function removeHallFromRadioGroup(selector, hallId) {
    const radioInput = document.querySelector(`${selector}[value="${hallId}"]`);
    if (!radioInput) {
        console.warn(`Radio input not found for hall ${hallId} in ${selector}`);
        return;
    }

    const radioItem = radioInput.closest('li');
    if (radioItem) {
        // Проверяем, был ли этот элемент выбран
        const wasSelected = radioInput.checked;
        
        // Удаляем элемент
        radioItem.remove();
        console.log(`Removed hall ${hallId} from ${selector}`);
        
        // Если удаленный элемент был выбран, выбираем следующий доступный
        if (wasSelected) {
            const remainingRadios = document.querySelectorAll(selector);
            if (remainingRadios.length > 0) {
                // Выбираем первый доступный радио-элемент
                remainingRadios[0].checked = true;
                
                // Загружаем конфигурацию для выбранного зала
                if (selector.includes('chairs-hall')) {
                    loadHallConfiguration(remainingRadios[0].value);
                } else if (selector.includes('prices-hall')) {
                    loadPriceConfiguration(remainingRadios[0].value);
                }
            }
        }
    }
}

function updateConfigurationSections() {
    const hallCount = document.querySelectorAll('.conf-step__list li:not(.conf-step__empty)').length;
    console.log(`Updating configuration sections, hall count: ${hallCount}`);

    // Логируем текущее состояние радио-кнопок
    const chairsRadios = document.querySelectorAll('input[name="chairs-hall"]');
    const pricesRadios = document.querySelectorAll('input[name="prices-hall"]');
    
    console.log(`Available chairs halls: ${chairsRadios.length}`);
    console.log(`Available prices halls: ${pricesRadios.length}`);
    
    // Скрываем секции конфигурации если залов нет
    const configSections = document.querySelectorAll('.conf-step__wrapper .conf-step__selectors-box');
    configSections.forEach(section => {
        if (section.querySelectorAll('li').length === 0) {
            section.innerHTML = '<p class="conf-step__paragraph">Нет доступных залов для конфигурации</p>';
        }
    });

    // Проверяем и обновляем секцию конфигурации залов
    const hallConfig = document.querySelector('#hallConfiguration');
    if (hallConfig) {
        const currentHallId = hallConfig.querySelector('.hall-configuration')?.dataset.hallId;
        const hallStillExists = document.querySelector(`input[name="chairs-hall"][value="${currentHallId}"]`);
        
        console.log(`Hall config - current: ${currentHallId}, exists: ${!!hallStillExists}`);
        
        if (currentHallId && !hallStillExists) {
            // Перезагружаем конфигурацию для первого доступного зала
            const firstRadio = document.querySelector('input[name="chairs-hall"]');
            if (firstRadio) {
                firstRadio.checked = true;
                console.log(`Loading hall configuration for hall ${firstRadio.value}`);
                loadHallConfiguration(firstRadio.value);
            } else {
                hallConfig.innerHTML = '<p class="conf-step__paragraph">Нет доступных залов для конфигурации</p>';
            }
        }
    }

    // Проверяем и обновляем секцию конфигурации цен
    const priceConfig = document.querySelector('#priceConfiguration');
    if (priceConfig) {
        const currentHallId = priceConfig.querySelector('.price-configuration')?.dataset.hallId;
        const hallStillExists = document.querySelector(`input[name="prices-hall"][value="${currentHallId}"]`);
        
        console.log(`Price config - current: ${currentHallId}, exists: ${!!hallStillExists}`);
        
        if (currentHallId && !hallStillExists) {
            // Перезагружаем конфигурацию цен для первого доступного зала
            const firstRadio = document.querySelector('input[name="prices-hall"]');
            if (firstRadio) {
                firstRadio.checked = true;
                console.log(`Loading price configuration for hall ${firstRadio.value}`);
                loadPriceConfiguration(firstRadio.value);
            } else {
                priceConfig.innerHTML = '<p class="conf-step__paragraph">Нет доступных залов для конфигурации цен</p>';
            }
        } else if (!currentHallId) {
            // Если нет текущего зала, но есть доступные - загружаем первый
            const firstRadio = document.querySelector('input[name="prices-hall"]');
            if (firstRadio && !firstRadio.checked) {
                firstRadio.checked = true;
                console.log(`Loading price configuration for first available hall ${firstRadio.value}`);
                loadPriceConfiguration(firstRadio.value);
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
    
    // Показываем индикатор загрузки
    const priceConfig = document.getElementById('priceConfiguration');
    if (priceConfig) {
        priceConfig.innerHTML = '<p class="conf-step__paragraph">Загрузка конфигурации цен...</p>';
    }
    
    fetch(`/admin/halls/${hallId}/prices`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Зал с ID ${hallId} не найден`);
                }
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('priceConfiguration').innerHTML = html;
            initPriceConfigurationHandlers();
            console.log('Price configuration loaded successfully');
        })
        .catch(error => {
            console.error('Error loading price configuration:', error);
            
            // Показываем сообщение об ошибке
            const priceConfig = document.getElementById('priceConfiguration');
            if (priceConfig) {
                priceConfig.innerHTML = `
                    <p class="conf-step__paragraph" style="color: #dc3545;">
                        Ошибка загрузки конфигурации цен: ${error.message}
                    </p>
                `;
            }
            
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

function initRadioHandlers() {
    // Обработчики для радио-кнопок конфигурации залов
    const chairsRadios = document.querySelectorAll('input[name="chairs-hall"]');
    chairsRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                console.log(`Chairs hall changed to: ${this.value}`);
                loadHallConfiguration(this.value);
            }
        });
    });
    
    // Обработчики для радио-кнопок конфигурации цен
    const pricesRadios = document.querySelectorAll('input[name="prices-hall"]');
    pricesRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                console.log(`Prices hall changed to: ${this.value}`);
                loadPriceConfiguration(this.value);
            }
        });
    });
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
    
    // Показываем индикатор загрузки
    const saveBtn = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] [onclick*="savePrices"]`);
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
        saveBtn.textContent = 'Сохранение...';
        saveBtn.disabled = true;
    }
    
    // ИСПРАВЛЕННЫЙ URL - используем update-prices вместо prices
    fetch(`/admin/halls/${hallId}/update-prices`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
            regular_price: regularPrice,  // Изменено на regular_price
            vip_price: vipPrice           // Изменено на vip_price
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            showNotification('Цены успешно сохранены', 'success');
            console.log('Prices saved successfully:', result);
        } else {
            showNotification(result.message || 'Ошибка при сохранении цен', 'error');
            console.error('Save prices error:', result.message);
        }
    })
    .catch(error => {
        console.error('Error saving prices:', error);
        showNotification('Ошибка при сохранении цен', 'error');
    })
    .finally(() => {
        // Восстанавливаем кнопку
        if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    });
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
    console.log('Initializing sessions handlers');
    
    // Обработчики для кликов по элементам страницы
    document.addEventListener('click', function(e) {
        // Кнопка "Добавить сеанс" в пустом состоянии timeline
        if (e.target.classList.contains('conf-step__button') && 
            e.target.textContent.includes('Добавить сеанс')) {
            
            const timelineHall = e.target.closest('.conf-step__timeline-hall');
            if (timelineHall) {
                const hallId = timelineHall.dataset.hallId;
                const dateInput = document.querySelector('.conf-step__timeline-nav input[type="date"]');
                const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
                
                if (hallId) {
                    openAddSessionModal(hallId, date);
                }
            }
        }
        
        // Кнопки редактирования сеанса
        if (e.target.hasAttribute('data-edit-session')) {
            const sessionId = e.target.getAttribute('data-edit-session');
            openEditSessionModal(sessionId);
        }
        
        // Кнопки удаления сеанса
        if (e.target.hasAttribute('data-delete-session')) {
            const sessionId = e.target.getAttribute('data-delete-session');
            const movieName = e.target.getAttribute('data-movie-name');
            deleteSession(sessionId, movieName, csrfToken);
        }
    });

    // Обработчики для форм
    initSessionForms(csrfToken);
}

let currentEditingSessionId = null;

// Обработчик отправки формы добавления сеанса
function handleAddSessionSubmit(e) {
    e.preventDefault();
    createSession(this);
}

// Обработчик отправки формы редактирования сеанса
function handleEditSessionSubmit(e) {
    e.preventDefault();
    if (currentEditingSessionId) {
        updateSession(this, currentEditingSessionId);
    } else {
        showNotification('Ошибка: сеанс не выбран', 'error');
    }
}

function initSessionForms(csrfToken) {
    console.log('Initializing session forms');
    
    // Обработка формы добавления сеанса
    const addSessionForm = document.querySelector('#addSessionModal form');
    console.log('Add session form found:', !!addSessionForm);
    
    if (addSessionForm) {
        addSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Add session form submitted');
            createSession(this); // this = форма
        });
    }

    // Обработка формы редактирования сеанса
    const editSessionForm = document.querySelector('#editSessionModal form');
    console.log('Edit session form found:', !!editSessionForm);
    
    if (editSessionForm) {
        editSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Edit session form submitted');
            if (currentEditingSessionId) {
                updateSession(this, currentEditingSessionId); // this = форма
            } else {
                showNotification('Ошибка: сеанс не выбран', 'error');
            }
        });
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
            // Удаляем элемент сеанса из DOM
            const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (sessionElement) {
                sessionElement.remove();
                // Обновляем счетчик сеансов если нужно
                updateSessionCount(sessionElement.closest('.conf-step__timeline-hall'));
            }
            // Если это было в модальном окне, закрываем его
            closeAllModals();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        showNotification('Ошибка при удалении сеанса', 'error');
    }
}

function updateSessionCount(hallElement) {
    if (!hallElement) return;
    
    const sessionsCount = hallElement.querySelectorAll('.conf-step__seances-movie').length;
    const countElement = hallElement.querySelector('.conf-step__hall-sessions-count');
    
    if (countElement) {
        countElement.textContent = `${sessionsCount} сеансов`;
    }
}

async function createSession(form) {
    if (!form) {
        console.error('Form is undefined in createSession');
        showNotification('Ошибка: форма не найдена', 'error');
        return;
    }

    const formData = new FormData(form);
    
    // Безопасное получение кнопки отправки
    const submitBtn = form.querySelector('button[type="submit"]');
    let originalText = '';
    
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.textContent = 'Создание...';
        submitBtn.disabled = true;
    }
    
    try {
        const response = await fetch('/admin/sessions', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        // Проверяем тип контента
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            
            if (result.success) {
                showNotification(result.message || 'Сеанс создан', 'success');
                closeAllModals();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification(result.message || 'Ошибка при создании сеанса', 'error');
            }
        } else {
            // Если ответ не JSON
            const text = await response.text();
            console.error('Non-JSON response (first 500 chars):', text.substring(0, 500));
            
            if (response.ok) {
                showNotification('Сеанс создан', 'success');
                closeAllModals();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification('Ошибка при создании сеанса. Проверьте консоль для деталей.', 'error');
            }
        }

    } catch (error) {
        console.error('Error creating session:', error);
        showNotification('Ошибка сети при создании сеанса', 'error');
    } finally {
        // Восстанавливаем кнопку только если она была найдена
        if (submitBtn && originalText) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

function removeHallFromSessionsSection(hallId, hallName) {
    console.log(`Removing hall ${hallId} from sessions section`);
    
    // Ищем элемент зала в секции сеансов
    const sessionHallElement = document.querySelector(`.conf-step__timeline-hall[data-hall-id="${hallId}"]`);
    
    if (sessionHallElement) {
        sessionHallElement.remove();
        console.log(`Removed hall ${hallId} from sessions section`);
    } else {
        // Fallback: ищем по названию зала
        const hallElements = document.querySelectorAll('.conf-step__timeline-hall');
        hallElements.forEach(element => {
            const titleElement = element.querySelector('.conf-step__seances-title');
            if (titleElement && titleElement.textContent.includes(hallName)) {
                element.remove();
                console.log(`Removed hall ${hallId} from sessions section by name`);
            }
        });
    }
    
    // Если после удаления не осталось залов, показываем сообщение
    const remainingHalls = document.querySelectorAll('.conf-step__timeline-hall');
    if (remainingHalls.length === 0) {
        const sessionsContainer = document.querySelector('.conf-step__seances-hall');
        if (sessionsContainer) {
            sessionsContainer.innerHTML = `
                <div class="conf-step__empty-halls">
                    <p>Нет доступных залов для отображения сеансов</p>
                    <button class="conf-step__button conf-step__button-accent" onclick="openAddHallModal()">
                        Добавить зал
                    </button>
                </div>
            `;
        }
    }
}

// ============================================================================
// УПРАВЛЕНИЕ СЕАНСАМИ - НОВЫЙ ФУНКЦИОНАЛ
// ============================================================================



function openEditSessionModal(sessionId) {
    currentEditingSessionId = sessionId;
    
    console.log('Opening edit modal for session:', sessionId);
    
    // Загружаем данные сеанса
    fetch(`/admin/sessions/${sessionId}/edit`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(session => {
            console.log('Loaded session data:', session);
            
            if (!session) {
                throw new Error('Данные сеанса не получены');
            }
            
            const modal = document.getElementById('editSessionModal');
            if (!modal) {
                throw new Error('Модальное окно редактирования не найдено');
            }
            
            // Заполняем форму данными
            const movieSelect = modal.querySelector('select[name="movie_id"]');
            const hallSelect = modal.querySelector('select[name="cinema_hall_id"]');
            const sessionStartInput = modal.querySelector('input[name="session_start"]');
            const isActualCheckbox = modal.querySelector('input[name="is_actual"]');
            
            if (movieSelect) movieSelect.value = session.movie_id;
            if (hallSelect) hallSelect.value = session.cinema_hall_id;
            if (sessionStartInput && session.session_start) {
                // Форматируем дату и время для datetime-local
                const sessionStart = new Date(session.session_start);
                const formattedDate = sessionStart.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
                sessionStartInput.value = formattedDate;
                console.log('Set session_start to:', formattedDate);
            }
            if (isActualCheckbox) {
                isActualCheckbox.checked = session.is_actual;
            }
            
            // Показываем модальное окно
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            console.log('Edit session modal opened successfully');
        })
        .catch(error => {
            console.error('Error loading session data:', error);
            showNotification('Ошибка загрузки данных сеанса: ' + error.message, 'error');
        });
}

async function updateSession(form, sessionId) {
    const formData = new FormData(form);
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.textContent = 'Сохранение...';
        submitBtn.disabled = true;
    }
    
    try {
        const response = await fetch(`/admin/sessions/${sessionId}`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
        });

        // Проверяем тип контента
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            
            if (result.success) {
                showNotification(result.message || 'Сеанс обновлен', 'success');
                closeAllModals();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification(result.message || 'Ошибка при обновлении сеанса', 'error');
            }
        } else {
            // Если ответ не JSON
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 500));
            
            if (response.ok) {
                showNotification('Сеанс обновлен', 'success');
                closeAllModals();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification('Ошибка при обновлении сеанса', 'error');
            }
        }

    } catch (error) {
        console.error('Error updating session:', error);
        showNotification('Ошибка сети при обновлении сеанса', 'error');
    } finally {
        // Восстанавливаем кнопку
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Функция для смены даты в timeline
function changeTimelineDate(date) {
    // Просто перезагружаем страницу с новой датой
    const url = new URL(window.location.href);
    url.searchParams.set('date', date);
    window.location.href = url.toString();
}

// Обработчик формы редактирования
document.addEventListener('DOMContentLoaded', function() {
    const editSessionForm = document.getElementById('editSessionForm');
    if (editSessionForm) {
        editSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateSession(this, currentEditingSessionId);
        });
    }
});

// ============================================================================
// УЛУЧШЕНИЯ ДЛЯ ГОРИЗОНТАЛЬНОЙ ПРОКРУТКИ
// ============================================================================

// Функция для автоматической прокрутки к активному сеансу
function scrollToSession(sessionId) {
    const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
    if (sessionElement) {
        const scrollContainer = sessionElement.closest('.conf-step__timeline-scroll-container');
        if (scrollContainer) {
            const sessionRect = sessionElement.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            
            // Прокручиваем чтобы сеанс был видим
            scrollContainer.scrollLeft += (sessionRect.left - containerRect.left) - 100;
        }
    }
}

// Показываем/скрываем подсказки прокрутки при загрузке
function initScrollHints() {
    const scrollContainers = document.querySelectorAll('.conf-step__timeline-scroll-container');
    
    scrollContainers.forEach(container => {
        // Проверяем, нужна ли прокрутка
        const hasScroll = container.scrollWidth > container.clientWidth;
        const hint = container.nextElementSibling;
        
        if (hint && hint.classList.contains('conf-step__scroll-hint')) {
            if (hasScroll) {
                hint.style.display = 'block';
            } else {
                hint.style.display = 'none';
            }
        }
        
        // Скрываем подсказку через 5 секунд
        setTimeout(() => {
            if (hint) {
                hint.style.opacity = '0.3';
            }
        }, 5000);
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initScrollHints();
    
    // Также инициализируем при изменении размера окна
    window.addEventListener('resize', initScrollHints);
});

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

function openAddSessionModal(hallId = null, date = null) {
    console.log('Opening add session modal with hallId:', hallId, 'and date:', date);
    
    const modal = document.getElementById('addSessionModal');
    if (!modal) {
        console.error('Add session modal not found!');
        return;
    }
    
    // Очищаем форму
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
    
    // Устанавливаем зал, если передан
    if (hallId) {
        const hallSelect = modal.querySelector('select[name="cinema_hall_id"]');
        if (hallSelect) {
            hallSelect.value = hallId;
            console.log('Set hall select value to:', hallId);
        } else {
            console.warn('Hall select element not found in modal');
        }
    }
    
    // Устанавливаем дату и время, если переданы
    if (date) {
        // date в формате YYYY-MM-DD, нам нужно установить в datetime-local, который требует YYYY-MM-DDThh:mm
        // По умолчанию время можно установить на 12:00
        const dateTimeValue = date + 'T12:00';
        const sessionStartInput = modal.querySelector('input[name="session_start"]');
        if (sessionStartInput) {
            sessionStartInput.value = dateTimeValue;
            console.log('Set session_start input value to:', dateTimeValue);
        } else {
            console.warn('Session start input element not found in modal');
        }
    }
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    console.log('Add session modal opened successfully');
}

// Обработчик формы редактирования сеанса
document.addEventListener('DOMContentLoaded', function() {
    const editSessionForm = document.getElementById('editSessionForm');
    if (editSessionForm) {
        editSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (currentEditingSessionId) {
                updateSession(this, currentEditingSessionId);
            } else {
                showNotification('Ошибка: сеанс не выбран', 'error');
            }
        });
    }

    // Обработчик для кнопки "Добавить сеанс" в пустых состояниях
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('conf-step__button') && 
            e.target.textContent.includes('Добавить сеанс') &&
            e.target.closest('.conf-step__empty-track')) {
            const hallId = e.target.getAttribute('onclick')?.match(/openAddSessionModal\((\d+)/)?.[1];
            const date = e.target.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
            if (hallId && date) {
                openAddSessionModal(hallId, date);
            }
        }
    });
});
