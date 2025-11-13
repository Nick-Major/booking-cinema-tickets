document.addEventListener('DOMContentLoaded', function() {
    function closeAddHallModal() {
        const modal = document.getElementById('addHallModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    window.closeAddHallModal = closeAddHallModal;
});