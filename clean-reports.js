const fs = require('fs');
const path = require('path');

function cleanReports() {
    const filesToDelete = [
        'css-conflict-report.json',
        'css-conflict-report.html'
    ];

    let deletedCount = 0;

    filesToDelete.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`🗑️  Удален: ${file}`);
            deletedCount++;
        } else {
            console.log(`⚠️  Файл не найден: ${file}`);
        }
    });

    console.log(`\n✅ Удалено файлов: ${deletedCount}`);
}

cleanReports();
