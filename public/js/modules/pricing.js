document.addEventListener('DOMContentLoaded', function() {
    async function savePrices(hallId) {
        const regularPrice = document.getElementById('regular_price').value;
        const vipPrice = document.getElementById('vip_price').value;

        try {
            const response = await fetch(`/admin/halls/${hallId}/update-prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    regular_price: regularPrice,
                    vip_price: vipPrice
                })
            });

            if (!response.ok) throw new Error('Network error');
            
            const result = await response.json();
            if (result.success) {
                alert('Цены обновлены успешно!');
            } else {
                alert('Ошибка при обновлении цен: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating prices:', error);
            alert('Ошибка при обновлении цен');
        }
    }

    window.savePrices = savePrices;
});