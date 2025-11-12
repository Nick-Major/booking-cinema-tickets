document.addEventListener('DOMContentLoaded', function() {
    async function generateHallLayout(hallId, rows, seatsPerRow) {
        try {
            const response = await fetch(`/admin/halls/${hallId}/generate-layout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ rows, seats_per_row: seatsPerRow })
            });

            if (!response.ok) throw new Error('Network error');
            
            const html = await response.text();
            document.getElementById('hallLayout').innerHTML = html;
            
        } catch (error) {
            console.error('Error generating layout:', error);
            alert('Ошибка при генерации схемы зала');
        }
    }

    function changeSeatType(element) {
        const currentType = element.getAttribute('data-type');
        const types = ['regular', 'vip', 'blocked'];
        const currentIndex = types.indexOf(currentType);
        const nextType = types[(currentIndex + 1) % types.length];
        
        element.setAttribute('data-type', nextType);
        element.className = `conf-step__chair ${getSeatClass(nextType)}`;
    }

    function getSeatClass(type) {
        switch(type) {
            case 'regular': return 'conf-step__chair_standart';
            case 'vip': return 'conf-step__chair_vip';
            case 'blocked': return 'conf-step__chair_disabled';
            default: return 'conf-step__chair_standart';
        }
    }

    function resetHallLayout(hallId) {
        if (confirm('Вы уверены, что хотите сбросить схему зала?')) {
            console.log('Resetting hall layout for:', hallId);
        }
    }

    async function saveHallConfiguration(hallId) {
        const seats = [];
        document.querySelectorAll('.conf-step__chair').forEach(seat => {
            seats.push({
                row: seat.getAttribute('data-row'),
                seat: seat.getAttribute('data-seat'),
                type: seat.getAttribute('data-type')
            });
        });

        try {
            const response = await fetch(`/admin/halls/${hallId}/save-configuration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ seats })
            });

            if (!response.ok) throw new Error('Network error');
            
            const result = await response.json();
            if (result.success) {
                alert('Конфигурация сохранена успешно!');
            } else {
                alert('Ошибка при сохранении: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            alert('Ошибка при сохранении конфигурации');
        }
    }

    window.generateHallLayout = generateHallLayout;
    window.changeSeatType = changeSeatType;
    window.resetHallLayout = resetHallLayout;
    window.saveHallConfiguration = saveHallConfiguration;
});