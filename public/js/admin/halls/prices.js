// Управление ценами залов

// Загрузка конфигурации цен
window.loadPriceConfiguration = function(hallId) {
    fetch(`/admin/halls/${hallId}/prices`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('priceConfiguration').innerHTML = html;
        })
        .catch(error => console.error('Error:', error));
}

// Сохранение цен
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
            alert('Цены сохранены!');
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка при сохранении цен');
    });
}

// Сброс цен
window.resetPrices = function(hallId) {
    if (confirm('Сбросить цены к значениям по умолчанию?')) {
        const regularPriceInput = document.querySelector('.regular-price-input');
        const vipPriceInput = document.querySelector('.vip-price-input');
        
        if (regularPriceInput && vipPriceInput) {
            regularPriceInput.value = 300;
            vipPriceInput.value = 500;
        }
    }
}
