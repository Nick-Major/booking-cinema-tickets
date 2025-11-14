// @ts-nocheck

document.addEventListener('DOMContentLoaded', function() {
    function showSafeNotification(message, type = 'info') {
        if (window.notifications && typeof window.notifications.show === 'function') {
            try {
                window.notifications.show(message, type);
            } catch (error) {
                console.error('Notification error:', error);
                alert(message);
            }
        } else {
            console.log(`[${type}] ${message}`);
            alert(message);
        }
    }

    async function savePrices(hallId) {
        try {
            console.log('Saving prices for hall:', hallId);

            const regularPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .regular-price-input`);
            const vipPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .vip-price-input`);
            
            if (!regularPriceInput || !vipPriceInput) {
                throw new Error('Поля ввода цен не найдены');
            }

            const regularPrice = parseFloat(regularPriceInput.value);
            const vipPrice = parseFloat(vipPriceInput.value);

            if (isNaN(regularPrice) || isNaN(vipPrice) || regularPrice < 0 || vipPrice < 0) {
                throw new Error('Введите корректные значения цен');
            }

            const response = await fetch(`/admin/halls/${hallId}/update-prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    regular_price: regularPrice,
                    vip_price: vipPrice
                })
            });

            const result = await response.json();

            if (result.success) {
                showSafeNotification('Цены обновлены успешно!', 'success');
            } else {
                throw new Error(result.message || 'Ошибка при обновлении цен');
            }
        } catch (error) {
            console.error('Error updating prices:', error);
            showSafeNotification('Ошибка при обновлении цен: ' + error.message, 'error');
        }
    }

    async function resetPrices(hallId) {
        try {
            const regularPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .regular-price-input`);
            const vipPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .vip-price-input`);
            
            if (!regularPriceInput || !vipPriceInput) {
                throw new Error('Поля ввода цен не найдены');
            }

            // Базовые значения
            const baseRegularPrice = 350;
            const baseVipPrice = 500;

            // Устанавливаем базовые значения в поля ввода
            regularPriceInput.value = baseRegularPrice.toFixed(2);
            vipPriceInput.value = baseVipPrice.toFixed(2);

            // Сохраняем базовые значения в базу данных
            const response = await fetch(`/admin/halls/${hallId}/update-prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    regular_price: baseRegularPrice,
                    vip_price: baseVipPrice
                })
            });

            const result = await response.json();

            if (result.success) {
                showSafeNotification('Цены сброшены до базовых значений и сохранены', 'success');
            } else {
                throw new Error(result.message || 'Ошибка при сбросе цен');
            }
        } catch (error) {
            console.error('Error resetting prices:', error);
            showSafeNotification('Ошибка при сбросе цен: ' + error.message, 'error');
        }
    }

    window.savePrices = savePrices;
    window.resetPrices = resetPrices;
});
