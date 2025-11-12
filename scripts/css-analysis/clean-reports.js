const fs = require('fs');
const path = require('path');

function cleanReports() {
    const reportsToClean = [
        'reports/css-analysis/css-conflict-report.json',
        'reports/css-analysis/css-conflict-report.html',
        'reports/js-duplicates.txt',
        'reports/unused-functions.txt',
        'reports/blade-js-relations.txt',
        'reports/common-functions.txt'
    ];

    let deletedCount = 0;

    reportsToClean.forEach(file => {
        const filePath = path.join(__dirname, '../..', file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Удален: ${file}`);
            deletedCount++;
        } else {
            console.log(`⚠️  Файл не найден: ${file}`);
        }
    });

    console.log(`\n✅ Удалено файлов: ${deletedCount}`);
}

cleanReports();
