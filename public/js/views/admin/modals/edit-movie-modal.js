document.addEventListener('DOMContentLoaded', function() {
    function closeEditMovieModal() {
        const modal = document.getElementById('editMovieModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    window.closeEditMovieModal = closeEditMovieModal;
});