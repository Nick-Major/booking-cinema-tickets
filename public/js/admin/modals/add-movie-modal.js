document.addEventListener('DOMContentLoaded', function() {
    function closeAddMovieModal() {
        const modal = document.getElementById('addMovieModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function previewMoviePoster(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('posterPreview');
                preview.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                preview.appendChild(img);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    window.closeAddMovieModal = closeAddMovieModal;
    window.previewMoviePoster = previewMoviePoster;
});