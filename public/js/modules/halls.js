// Модуль для управления залами
class HallsManager {
    constructor() {
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
            console.error('Delete hall modal not found');
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

    // НОВЫЙ МЕТОД: Обновление всех секций
    updateAllSections(deletedHallId) {
        // 1. Обновляем секцию "Конфигурация залов"
        this.updateHallConfigurationSection(deletedHallId);
        
        // 2. Обновляем секцию "Конфигурация цен"
        this.updatePriceConfigurationSection(deletedHallId);
        
        // 3. Обновляем секцию "Управление продажами"
        this.updateSalesManagementSection(deletedHallId);
        
        // 4. Проверяем, нужно ли скрыть секции если залов не осталось
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

    checkAndHideSections() {
        const hallsList = document.querySelector('.conf-step__list');
        const hasHalls = hallsList && hallsList.children.length > 0;

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

        // Если залов не осталось, показываем сообщение
        if (!hasHalls) {
            this.showNoHallsMessage();
        }
    }

    showNoHallsMessage() {
        // Можно добавить сообщение, что залов нет
        console.log('No halls remaining');
    }

    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений или создаем простую
        alert(message); // Временное решение
    }
}

// Экспорт модуля
export default HallsManager;
