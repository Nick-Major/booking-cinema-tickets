// Модуль для управления аккордеоном в админ-панели
export function initAccordeon() {
    const headers = document.querySelectorAll('.conf-step__header');
    
    headers.forEach((header) => {
        if (header.hasAttribute('data-accordeon-initialized')) {
            return;
        }
        
        header.setAttribute('data-accordeon-initialized', 'true');
        
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
}

export function toggleAccordeonSection(header) {
    if (header) {
        header.classList.toggle('conf-step__header_closed');
        header.classList.toggle('conf-step__header_opened');
    }
}

export function openAccordeonSection(header) {
    if (header) {
        header.classList.remove('conf-step__header_closed');
        header.classList.add('conf-step__header_opened');
    }
}

export function closeAccordeonSection(header) {
    if (header) {
        header.classList.add('conf-step__header_closed');
        header.classList.remove('conf-step__header_opened');
    }
}

export function closeAllAccordeonSections() {
    const headers = document.querySelectorAll('.conf-step__header');
    headers.forEach(header => {
        header.classList.add('conf-step__header_closed');
        header.classList.remove('conf-step__header_opened');
    });
}

export function openAllAccordeonSections() {
    const headers = document.querySelectorAll('.conf-step__header');
    headers.forEach(header => {
        header.classList.remove('conf-step__header_closed');
        header.classList.add('conf-step__header_opened');
    });
}
