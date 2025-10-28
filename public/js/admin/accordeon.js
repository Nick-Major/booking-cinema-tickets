// Аккордеон для секций админки
document.addEventListener('DOMContentLoaded', function() {
    const headers = Array.from(document.querySelectorAll('.conf-step__header'));
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_closed');
            header.classList.toggle('conf-step__header_opened');
        });
    });
});
