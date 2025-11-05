// ВАЛИДАЦИЯ ФОРМ
import { showErrorMessage } from './utils.js';

export class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = [];
    }

    // Основной метод валидации
    validate() {
        this.errors = [];
        
        if (!this.form) {
            this.errors.push('Форма не найдена');
            return false;
        }

        // Валидируем все поля с data-validations
        const fields = this.form.querySelectorAll('[data-validation]');
        fields.forEach(field => this.validateField(field));

        return this.errors.length === 0;
    }

    // Валидация отдельного поля
    validateField(field) {
        const validations = field.dataset.validation.split('|');
        const value = field.value.trim();
        const fieldName = field.getAttribute('placeholder') || field.name;

        for (const validation of validations) {
            const [rule, param] = validation.split(':');
            
            switch (rule) {
                case 'required':
                    if (!this.required(value)) {
                        this.addError(field, `Поле "${fieldName}" обязательно для заполнения`);
                        return;
                    }
                    break;
                    
                case 'min':
                    if (!this.min(value, parseInt(param))) {
                        this.addError(field, `Поле "${fieldName}" должно быть не менее ${param}`);
                        return;
                    }
                    break;
                    
                case 'max':
                    if (!this.max(value, parseInt(param))) {
                        this.addError(field, `Поле "${fieldName}" не должно превышать ${param}`);
                        return;
                    }
                    break;
                    
                case 'integer':
                    if (!this.integer(value)) {
                        this.addError(field, `Поле "${fieldName}" должно быть целым числом`);
                        return;
                    }
                    break;
                    
                case 'time':
                    if (!this.timeFormat(value)) {
                        this.addError(field, `Поле "${fieldName}" должно быть в формате ЧЧ:ММ`);
                        return;
                    }
                    break;
                    
                case 'future':
                    if (!this.futureDate(value)) {
                        this.addError(field, `Поле "${fieldName}" должно быть будущей датой`);
                        return;
                    }
                    break;
            }
        }
    }

    // Правила валидации
    required(value) {
        return value !== '' && value !== null && value !== undefined;
    }

    min(value, min) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min;
    }

    max(value, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num <= max;
    }

    integer(value) {
        return /^\d+$/.test(value);
    }

    timeFormat(value) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
    }

    futureDate(value) {
        const inputDate = new Date(value);
        return inputDate > new Date();
    }

    // Добавление ошибки
    addError(field, message) {
        this.errors.push(message);
        this.highlightField(field, message);
    }

    // Подсветка поля с ошибкой
    highlightField(field, message) {
        field.style.borderColor = '#d32f2f';
        field.style.backgroundColor = '#ffebee';
        
        // Удаляем старые сообщения об ошибках
        const existingError = field.parentNode.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Добавляем новое сообщение
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.style.color = '#d32f2f';
        errorElement.style.fontSize = '1.2rem';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    // Очистка ошибок
    clearErrors() {
        this.errors = [];
        const errorElements = this.form.querySelectorAll('.validation-error');
        errorElements.forEach(el => el.remove());
        
        const fields = this.form.querySelectorAll('[data-validation]');
        fields.forEach(field => {
            field.style.borderColor = '';
            field.style.backgroundColor = '';
        });
    }

    // Получение ошибок
    getErrors() {
        return this.errors;
    }
}

// Утилиты для быстрой валидации
export function validateForm(formId) {
    const validator = new FormValidator(formId);
    return validator.validate();
}

export function getFormErrors(formId) {
    const validator = new FormValidator(formId);
    validator.validate();
    return validator.getErrors();
}