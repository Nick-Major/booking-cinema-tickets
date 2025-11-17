// @ts-nocheck

export async function savePrices(hallId) {
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
            // Используем нашу систему уведомлений
            if (window.notifications && typeof window.notifications.show === 'function') {
                window.notifications.show('Цены обновлены успешно!', 'success');
            } else {
                console.log('Цены обновлены успешно!');
                alert('Цены обновлены успешно!');
            }
        } else {
            throw new Error(result.message || 'Ошибка при обновлении цен');
        }
    } catch (error) {
        console.error('Error updating prices:', error);
        // Используем нашу систему уведомлений для ошибок
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при обновлении цен: ' + error.message, 'error');
        } else {
            console.error('Ошибка при обновлении цен:', error.message);
            alert('Ошибка при обновлении цен: ' + error.message);
        }
    }
}

export async function resetPrices(hallId) {
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
            // Используем нашу систему уведомлений
            if (window.notifications && typeof window.notifications.show === 'function') {
                window.notifications.show('Цены сброшены до базовых значений и сохранены', 'success');
            } else {
                console.log('Цены сброшены до базовых значений и сохранены');
                alert('Цены сброшены до базовых значений и сохранены');
            }
        } else {
            throw new Error(result.message || 'Ошибка при сбросе цен');
        }
    } catch (error) {
        console.error('Error resetting prices:', error);
        // Используем нашу систему уведомлений для ошибок
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show('Ошибка при сбросе цен: ' + error.message, 'error');
        } else {
            console.error('Ошибка при сбросе цен:', error.message);
            alert('Ошибка при сбросе цен: ' + error.message);
        }
    }
}
