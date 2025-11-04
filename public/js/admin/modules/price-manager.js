import { getCsrfToken, showSuccessMessage } from './utils.js';

// УПРАВЛЕНИЕ ЦЕНАМИ
export function initPriceManager() {
    console.log('Price manager initialized');

    // ЗАГРУЗКА КОНФИГУРАЦИИ ЦЕН
    window.loadPriceConfiguration = function(hallId) {
        fetch(`/admin/halls/${hallId}/prices`)
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('text/html')) {
                    throw new Error('Invalid response format');
                }
                return response.text();
            })
            .then(html => {
                document.getElementById('priceConfiguration').innerHTML = html;
                initPriceControls(); // Инициализируем управление после загрузки
            })
            .catch(error => {
                document.getElementById('priceConfiguration').innerHTML = 
                    '<p class="conf-step__paragraph">Сначала создайте зал</p>';
            });
    }

    // ИНИЦИАЛИЗАЦИЯ УПРАВЛЕНИЯ ЦЕНАМИ
    function initPriceControls() {
        const saveButton = document.getElementById('price-save');
        const cancelButton = document.getElementById('price-cancel');
        const regularInput = document.querySelector('.regular-price-input');
        const vipInput = document.querySelector('.vip-price-input');
        const hallRadios = document.querySelectorAll('input[name="prices-hall"]');
        
        if (!saveButton || !cancelButton || !regularInput || !vipInput) return;
        
        let currentHallId = document.querySelector('input[name="prices-hall"]:checked')?.value;
        let originalPrices = {};
        
        // СОХРАНЕНИЕ ОРИГИНАЛЬНЫХ ЦЕН ДЛЯ ОТМЕНЫ
        function saveOriginalPrices() {
            if (currentHallId) {
                originalPrices[currentHallId] = {
                    regular: regularInput.value,
                    vip: vipInput.value
                };
            }
        }
        
        // СОХРАНЕНИЕ ЦЕН
        saveButton.addEventListener('click', function() {
            const regularPrice = parseFloat(regularInput.value);
            const vipPrice = parseFloat(vipInput.value);
            
            // ВАЛИДАЦИЯ
            if (isNaN(regularPrice) || isNaN(vipPrice)) {
                alert('Пожалуйста, введите корректные числовые значения');
                return;
            }
            
            if (regularPrice < 0 || vipPrice < 0) {
                alert('Цены не могут быть отрицательными');
                return;
            }
            
            if (vipPrice <= regularPrice) {
                if (!confirm('VIP цена меньше или равна обычной цене. Вы уверены?')) {
                    return;
                }
            }
            
            fetch(`/admin/halls/${currentHallId}/update-prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    regular_price: regularPrice,
                    vip_price: vipPrice
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccessMessage('Цены успешно обновлены!');
                    saveOriginalPrices(); // ОБНОВЛЯЕМ ОРИГИНАЛЬНЫЕ ЗНАЧЕНИЯ
                } else {
                    alert('Ошибка: ' + data.message);
                }
            })
            .catch(error => {
                alert('Ошибка при сохранении цен: ' + error.message);
            });
        });
        
        // ОТМЕНА ИЗМЕНЕНИЙ
        cancelButton.addEventListener('click', function() {
            if (originalPrices[currentHallId]) {
                regularInput.value = originalPrices[currentHallId].regular;
                vipInput.value = originalPrices[currentHallId].vip;
                showSuccessMessage('Изменения отменены');
            }
        });
        
        // ОБРАБОТКА ИЗМЕНЕНИЯ ЗАЛА
        hallRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                currentHallId = this.value;
                window.loadPriceConfiguration(this.value);
            });
        });
        
        // СОХРАНЯЕМ ОРИГИНАЛЬНЫЕ ЗНАЧЕНИЯ ПРИ ЗАГРУЗКЕ
        saveOriginalPrices();
    }

    // СТАРАЯ ФУНКЦИЯ ДЛЯ СОВМЕСТИМОСТИ
    window.savePrices = function(hallId) {
        const regularPriceInput = document.querySelector('.regular-price-input');
        const vipPriceInput = document.querySelector('.vip-price-input');
        
        if (!regularPriceInput || !vipPriceInput) {
            alert('Элементы формы не найдены');
            return;
        }
        
        const regularPrice = regularPriceInput.value;
        const vipPrice = vipPriceInput.value;
        
        fetch(`/admin/halls/${hallId}/update-prices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({
                regular_price: regularPrice,
                vip_price: vipPrice
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessMessage('Цены сохранены!');
            } else {
                alert('Ошибка: ' + data.message);
            }
        })
        .catch(error => {
            alert('Ошибка при сохранении цен');
        });
    }

    // ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
    initPriceControls();
}
