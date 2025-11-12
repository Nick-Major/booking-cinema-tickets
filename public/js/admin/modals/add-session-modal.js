document.addEventListener('DOMContentLoaded', function() {
    function closeAllModals() {
        const modals = document.querySelectorAll('.popup');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    window.closeAllModals = closeAllModals;
});