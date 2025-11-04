import { getCsrfToken, showSuccessMessage, findSectionByTitle } from './utils.js';

// УПРАВЛЕНИЕ ЗАЛАМИ
export function initHallManager() {
    console.log('Hall manager initialized');

    // ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    window.currentHallToDelete = null;

    // ФУНКЦИИ УПРАВЛЕНИЯ ЗАЛАМИ
    window.deleteHall = function(id, name) {
        console.log('deleteHall called with id:', id, 'name:', name);
        window.openDeleteHallModal(id, name);
    }

    window.openDeleteHallModal = function(hallId, hallName) {
        window.currentHallToDelete = hallId;
        document.getElementById('hallIdToDelete').value = hallId;
        document.getElementById('hallNameToDelete').textContent = '"' + hallName + '"';
        document.getElementById('deleteHallModal').classList.add('active');
    }

    window.closeDeleteHallModal = function() {
        document.getElementById('deleteHallModal').classList.remove('active');
        window.currentHallToDelete = null;
    }

    window.performHallDeletion = function(hallId) {
        console.log('performHallDeletion called with id:', hallId);
        
        fetch(`/admin/halls/${hallId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('Delete response status:', response.status);
            if (response.ok || response.status === 204) {
                window.closeDeleteHallModal();
                showSuccessMessage('Зал успешно удален!');
                
                // Удаляем из списка залов
                const hallListItems = document.querySelectorAll('.conf-step__list li');
                hallListItems.forEach(li => {
                    const deleteButton = li.querySelector(`button[onclick*="deleteHall(${hallId}"]`);
                    if (deleteButton) {
                        console.log('Found hall list item to remove:', li);
                        li.remove();
                    }
                });

                window.updateHallSelectors(hallId);
                window.checkEmptyHallList();

            } else {
                return response.json().then(data => {
                    alert('Ошибка при удалении зала: ' + (data.message || 'Неизвестная ошибка'));
                });
            }
        })
        .catch(error => {
            alert('Ошибка сети при удалении зала');
        });
    }

    // ФУНКЦИИ КОНФИГУРАЦИИ ЗАЛОВ
    window.loadHallConfiguration = function(hallId) {
        fetch(`/admin/halls/${hallId}/configuration`)
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('text/html')) {
                    throw new Error('Invalid response format');
                }
                return response.text();
            })
            .then(html => {
                document.getElementById('hallConfiguration').innerHTML = html;
            })
            .catch(error => {
                document.getElementById('hallConfiguration').innerHTML = 
                    '<p class="conf-step__paragraph">Сначала создайте зал</p>';
            });
    }

    window.generateHallLayout = function(hallId) {
        const rowsInput = document.querySelector('.hall-configuration .rows-input');
        const seatsInput = document.querySelector('.hall-configuration .seats-input');
        
        if (!rowsInput || !seatsInput) {
            alert('Элементы формы не найдены');
            return;
        }
        
        const rows = rowsInput.value;
        const seatsPerRow = seatsInput.value;
        
        if (!rows || !seatsPerRow) {
            alert('Укажите количество рядов и мест');
            return;
        }
        
        fetch(`/admin/halls/${hallId}/generate-layout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ rows, seats_per_row: seatsPerRow })
        })
        .then(response => response.text())
        .then(html => {
            document.getElementById(`hallLayout-${hallId}`).innerHTML = html;
        })
        .catch(error => console.error('Error:', error));
    }

    window.changeSeatType = function(element) {
        const types = ['regular', 'vip', 'blocked'];
        const currentType = element.dataset.type;
        const currentIndex = types.indexOf(currentType);
        const nextType = types[(currentIndex + 1) % types.length];
        
        element.dataset.type = nextType;
        element.className = `conf-step__chair conf-step__chair_${nextType === 'regular' ? 'standart' : nextType}`;
    }

    window.saveHallConfiguration = function(hallId) {
        const seats = [];
        
        document.querySelectorAll('.conf-step__chair[data-row]').forEach(seat => {
            seats.push({
                row: seat.dataset.row,
                seat: seat.dataset.seat,
                type: seat.dataset.type
            });
        });
        
        console.log('Saving configuration for hall:', hallId);
        console.log('Seats data:', seats);
        
        fetch(`/admin/halls/${hallId}/save-configuration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ seats })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showSuccessMessage('Конфигурация зала сохранена!');
            } else {
                alert('Ошибка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Save configuration error:', error);
            alert('Ошибка при сохранении конфигурации: ' + error.message);
        });
    }

    window.resetHallLayout = function(hallId) {
        if (confirm('Вы уверены, что хотите сбросить конфигурацию зала? Все изменения будут потеряны.')) {
            window.loadHallConfiguration(hallId);
        }
    }

    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    window.checkEmptyHallList = function() {
        console.log('checkEmptyHallList called');
        const hallList = document.querySelector('.conf-step__list');
        console.log('Hall list children:', hallList?.children.length);
        
        if (hallList && hallList.children.length === 0) {
            console.log('Hall list is empty, adding message');
            hallList.innerHTML = '<li class="conf-step__empty">Нет созданных залов</li>';
            window.hideConfigurationSections();
        } else {
            console.log('Hall list has items, showing sections');
            window.showConfigurationSections();
        }
    }

    window.hideConfigurationSections = function() {
        const sectionsToHide = [
            'Конфигурация залов',
            'Конфигурация цен', 
            'Сетка сеансов',
            'Открыть продажи'
        ];
        
        sectionsToHide.forEach(sectionTitle => {
            const section = findSectionByTitle(sectionTitle);
            if (section) {
                section.style.display = 'none';
            }
        });
        
        document.getElementById('hallConfiguration').innerHTML = 
            '<p class="conf-step__paragraph">Сначала создайте зал</p>';
        document.getElementById('priceConfiguration').innerHTML = 
            '<p class="conf-step__paragraph">Сначала создайте зал</p>';
    }

    window.showConfigurationSections = function() {
        const sectionsToShow = [
            'Конфигурация залов',
            'Конфигурация цен',
            'Сетка сеансов',
            'Открыть продажи'
        ];
        
        sectionsToShow.forEach(sectionTitle => {
            const section = findSectionByTitle(sectionTitle);
            if (section) {
                section.style.display = 'block';
            }
        });
    }

    window.updateHallSelectors = function(deletedHallId) {
        console.log('updateHallSelectors called with:', deletedHallId);
        
        const hallRadio = document.querySelector(`input[value="${deletedHallId}"]`);
        console.log('Found hall radio:', hallRadio);
        if (hallRadio) {
            hallRadio.closest('li').remove();
            console.log('Hall radio removed');
        }

        const priceRadio = document.querySelector(`input[name="prices-hall"][value="${deletedHallId}"]`);
        console.log('Found price radio:', priceRadio);
        if (priceRadio) {
            priceRadio.closest('li').remove();
            console.log('Price radio removed');
        }

        const remainingHalls = document.querySelectorAll('input[name="chairs-hall"]');
        console.log('Remaining halls:', remainingHalls.length);

        if (remainingHalls.length === 0) {
            console.log('No halls left, hiding sections');
            window.hideConfigurationSections();
        } else {
            console.log('Halls remain, updating configurations');
            const firstHallRadio = document.querySelector('input[name="chairs-hall"]');
            if (firstHallRadio) {
                window.loadHallConfiguration(firstHallRadio.value);
            }

            const firstPriceRadio = document.querySelector('input[name="prices-hall"]');
            if (firstPriceRadio) {
                window.loadPriceConfiguration(firstPriceRadio.value);
            }
        }
    }

    // ОБРАБОТКА ФОРМЫ УДАЛЕНИЯ ЗАЛА
    const deleteHallForm = document.getElementById('deleteHallForm');
    if (deleteHallForm) {
        deleteHallForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (window.currentHallToDelete) {
                window.performHallDeletion(window.currentHallToDelete);
            }
        });
    }
}
