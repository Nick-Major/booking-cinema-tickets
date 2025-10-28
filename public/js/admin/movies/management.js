// Управление фильмами

// Управление модалкой редактирования фильма
window.openEditMovieModal = function(movieId) {
    fetch(`/admin/movies/${movieId}/edit`)
        .then(response => response.text())
        .then(html => {
            // Удаляем существующую модалку если есть
            const existingModal = document.getElementById('editMovieModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Добавляем новую модалку
            document.body.insertAdjacentHTML('beforeend', html);
            document.getElementById('editMovieModal').classList.add('active');
        })
        .catch(error => console.error('Error:', error));
}

window.closeEditMovieModal = function() {
    const modal = document.getElementById('editMovieModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Переключение активности фильма
window.toggleMovieActive = function(movieId) {
    fetch(`/admin/movies/${movieId}/toggle-active`, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
}
