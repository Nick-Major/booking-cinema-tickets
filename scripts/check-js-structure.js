const fs = require('fs');
const path = require('path');

console.log('=== ПРОВЕРКА СТРУКТУРЫ JS ===');

const expectedStructure = {
    'core/': ['api-client.js', 'utils.js'],
    'modules/': ['halls.js', 'pricing.js', 'timeline.js', 'movies.js', 'sessions.js'],
    'views/admin/': ['dashboard.js', 'hall-configuration.js', 'sessions-timeline.js'],
    'views/admin/modals/': ['add-hall-modal.js', 'add-movie-modal.js', 'add-session-modal.js', 'edit-movie-modal.js', 'edit-session-modal.js']
};

let hasErrors = false;

Object.entries(expectedStructure).forEach(([folder, expectedFiles]) => {
    const fullPath = path.join(__dirname, '../public/js', folder);
    
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ Папка не найдена: ${folder}`);
        hasErrors = true;
        return;
    }

    const actualFiles = fs.readdirSync(fullPath).filter(file => file.endsWith('.js'));
    
    expectedFiles.forEach(expectedFile => {
        if (!actualFiles.includes(expectedFile)) {
            console.error(`❌ Файл не найден: ${folder}${expectedFile}`);
            hasErrors = true;
        }
    });

    // Проверяем лишние файлы
    actualFiles.forEach(actualFile => {
        if (!expectedFiles.includes(actualFile)) {
            console.warn(`⚠️  Неожиданный файл: ${folder}${actualFile}`);
        }
    });
});

if (!hasErrors) {
    console.log('✅ Структура JS файлов соответствует ожидаемой');
} else {
    console.log('\n💡 Рекомендации:');
    console.log('- Проверьте пути импортов в dashboard.js');
    console.log('- Убедитесь, что все модули экспортируют классы правильно');
}
