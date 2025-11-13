document.addEventListener('DOMContentLoaded', function() {
    function openAddSessionModal() {
        const modal = document.getElementById('addSessionModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    window.openAddSessionModal = openAddSessionModal;
});