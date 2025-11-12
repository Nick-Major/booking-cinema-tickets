document.addEventListener('DOMContentLoaded', function() {
    function closeModal() {
        const modal = document.getElementById('editSessionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    window.closeModal = closeModal;
});