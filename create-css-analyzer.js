const fs = require('fs');
const path = require('path');
const sass = require('sass'); // Добавляем компилятор SASS

class CSSConflictFinder {
    constructor() {
        this.conflicts = [];
        this.duplicates = [];
    }

    // Рекурсивный поиск CSS и SCSS файлов
    findStyleFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.findStyleFiles(fullPath));
            } else if (path.extname(item) === '.css' || path.extname(item) === '.scss') {
                // Игнорируем partials SCSS (файлы начинающиеся с _)
                if (!path.basename(item).startsWith('_')) {
                    files.push(fullPath);
                }
            }
        });
        
        return files;
    }

    // Компиляция SCSS в CSS
    compileSCSS(filePath) {
        try {
            const result = sass.compile(filePath);
            return result.css;
        } catch (error) {
            console.log(`❌ Ошибка компиляции SCSS: ${filePath} - ${error.message}`);
            return '';
        }
    }

    analyzeFile(filePath) {
        try {
            console.log(`🔍 Анализирую: ${filePath}`);
            
            let content;
            if (path.extname(filePath) === '.scss') {
                content = this.compileSCSS(filePath);
                if (!content) return; // Пропускаем если ошибка компиляции
            } else {
                content = fs.readFileSync(filePath, 'utf8');
            }
            
            const rules = this.extractRules(content);
            this.findConflicts(rules, filePath);
            this.findDuplicates(rules, filePath);
        } catch (error) {
            console.log(`⚠️  Ошибка чтения файла: ${filePath} - ${error.message}`);
        }
    }

    extractRules(cssContent) {
        const rules = [];
        // Удаляем комментарии
        const withoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
        // Разделяем на правила
        const ruleBlocks = withoutComments.split('}').filter(block => block.trim());
        
        ruleBlocks.forEach(block => {
            const parts = block.split('{');
            if (parts.length === 2) {
                const selectors = parts[0].trim()
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('@'));
                
                const properties = parts[1].trim()
                    .split(';')
                    .filter(p => p.trim())
                    .map(prop => {
                        const [key, ...valueParts] = prop.split(':');
                        return {
                            key: key ? key.trim() : '',
                            value: valueParts.length > 0 ? valueParts.join(':').trim() : ''
                        };
                    })
                    .filter(p => p.key && p.value);

                if (selectors.length > 0 && properties.length > 0) {
                    rules.push({
                        selectors,
                        properties,
                        fullRule: block + '}'
                    });
                }
            }
        });
        
        return rules;
    }

    findConflicts(rules, filePath) {
        const selectorMap = new Map();
        
        rules.forEach(rule => {
            rule.selectors.forEach(selector => {
                if (!selectorMap.has(selector)) {
                    selectorMap.set(selector, []);
                }
                selectorMap.get(selector).push({
                    file: filePath,
                    properties: rule.properties,
                    fullRule: rule.fullRule
                });
            });
        });

        selectorMap.forEach((occurrences, selector) => {
            if (occurrences.length > 1) {
                this.conflicts.push({
                    type: 'CONFLICT',
                    selector,
                    occurrences,
                    severity: this.calculateSeverity(occurrences)
                });
            }
        });
    }

    findDuplicates(rules, filePath) {
        const propertyMap = new Map();
        
        rules.forEach(rule => {
            rule.properties.forEach(prop => {
                const key = `${rule.selectors.join(',')}-${prop.key}`;
                if (!propertyMap.has(key)) {
                    propertyMap.set(key, []);
                }
                propertyMap.get(key).push({
                    file: filePath,
                    value: prop.value,
                    fullRule: rule.fullRule
                });
            });
        });

        propertyMap.forEach((occurrences, key) => {
            if (occurrences.length > 1) {
                const uniqueValues = new Set(occurrences.map(o => o.value));
                if (uniqueValues.size === 1) {
                    this.duplicates.push({
                        type: 'DUPLICATE',
                        key,
                        occurrences,
                        severity: 'LOW'
                    });
                } else {
                    this.duplicates.push({
                        type: 'CONFLICT_VALUE',
                        key,
                        occurrences,
                        severity: 'HIGH'
                    });
                }
            }
        });
    }

    calculateSeverity(occurrences) {
        const uniqueFiles = new Set(occurrences.map(o => o.file));
        if (uniqueFiles.size > 1) return 'HIGH';
        return 'MEDIUM';
    }

    generateReport() {
        const report = {
            summary: {
                totalConflicts: this.conflicts.length,
                totalDuplicates: this.duplicates.length,
                highPriority: this.conflicts.filter(c => c.severity === 'HIGH').length,
                mediumPriority: this.conflicts.filter(c => c.severity === 'MEDIUM').length,
                lowPriority: this.duplicates.filter(d => d.severity === 'LOW').length
            },
            conflicts: this.conflicts,
            duplicates: this.duplicates
        };

        // Сохраняем отчет
        fs.writeFileSync('css-conflict-report.json', JSON.stringify(report, null, 2));
        
        // Создаем читабельный HTML отчет
        this.generateHTMLReport(report);
        
        this.printSummary(report);
    }

    generateHTMLReport(report) {
        const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS/SCSS Conflict Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .high { color: #dc3545; }
        .medium { color: #ffc107; }
        .low { color: #28a745; }
        .conflict { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .high-severity { border-left: 4px solid #dc3545; }
        .medium-severity { border-left: 4px solid #ffc107; }
        .occurrence { background: #f8f9fa; margin: 5px 0; padding: 10px; border-radius: 3px; }
        pre { background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🎯 Отчет о конфликтах CSS/SCSS</h1>
    
    <div class="summary">
        <h2>📊 Статистика</h2>
        <p><span class="high">🔴 Высокий приоритет: ${report.summary.highPriority}</span></p>
        <p><span class="medium">🟡 Средний приоритет: ${report.summary.mediumPriority}</span></p>
        <p><span class="low">🟢 Низкий приоритет: ${report.summary.lowPriority}</span></p>
        <p><strong>📊 Всего конфликтов: ${report.summary.totalConflicts}</strong></p>
        <p><strong>📊 Всего дубликатов: ${report.summary.totalDuplicates}</strong></p>
    </div>

    <h2>🚨 Конфликты селекторов</h2>
    ${report.conflicts.map(conflict => `
        <div class="conflict ${conflict.severity === 'HIGH' ? 'high-severity' : 'medium-severity'}">
            <h3>Селектор: ${conflict.selector}</h3>
            <p><strong>Тип:</strong> ${conflict.type} | <strong>Приоритет:</strong> ${conflict.severity}</p>
            ${conflict.occurrences.map(occurrence => `
                <div class="occurrence">
                    <p><strong>Файл:</strong> ${occurrence.file}</p>
                    <pre>${occurrence.fullRule}</pre>
                </div>
            `).join('')}
        </div>
    `).join('')}

    <h2>📝 Дубликаты свойств</h2>
    ${report.duplicates.map(duplicate => `
        <div class="conflict ${duplicate.severity === 'HIGH' ? 'high-severity' : 'low-severity'}">
            <h3>Свойство: ${duplicate.key}</h3>
            <p><strong>Тип:</strong> ${duplicate.type} | <strong>Приоритет:</strong> ${duplicate.severity}</p>
            ${duplicate.occurrences.map(occurrence => `
                <div class="occurrence">
                    <p><strong>Файл:</strong> ${occurrence.file}</p>
                    <p><strong>Значение:</strong> ${occurrence.value}</p>
                    <pre>${occurrence.fullRule}</pre>
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;

        fs.writeFileSync('css-conflict-report.html', html);
    }

    printSummary(report) {
        console.log('\n🎯 ОТЧЕТ О КОНФЛИКТАХ CSS/SCSS');
        console.log('══════════════════════════════');
        console.log(`🔴 Высокий приоритет: ${report.summary.highPriority}`);
        console.log(`🟡 Средний приоритет: ${report.summary.mediumPriority}`);
        console.log(`🟢 Низкий приоритет: ${report.summary.lowPriority}`);
        console.log(`📊 Всего конфликтов: ${report.summary.totalConflicts}`);
        console.log(`📊 Всего дубликатов: ${report.summary.totalDuplicates}`);
        
        if (report.conflicts.length > 0) {
            console.log('\n🚨 ТОП-5 проблемных селекторов:');
            report.conflicts
                .sort((a, b) => b.occurrences.length - a.occurrences.length)
                .slice(0, 5)
                .forEach((conflict, index) => {
                    console.log(`${index + 1}. ${conflict.selector}`);
                    console.log(`   Файлов: ${new Set(conflict.occurrences.map(o => o.file)).size}`);
                    console.log(`   Правил: ${conflict.occurrences.length}`);
                });
        }

        console.log('\n📁 Отчеты сохранены:');
        console.log('   - css-conflict-report.json (машиночитаемый)');
        console.log('   - css-conflict-report.html (человекочитаемый)');
    }
}

// Запуск анализа
const finder = new CSSConflictFinder();

// Автоматически находим все CSS и SCSS файлы
console.log('🕵️  Поиск CSS/SCSS файлов...');
const styleFiles = [
    ...finder.findStyleFiles('resources/css'),
    ...finder.findStyleFiles('public/css'),
    ...finder.findStyleFiles('resources/views')
];

if (styleFiles.length === 0) {
    console.log('❌ CSS/SCSS файлы не найдены!');
    process.exit(1);
}

console.log(`📁 Найдено ${styleFiles.length} CSS/SCSS файлов:`);
styleFiles.forEach(file => console.log(`   - ${file}`));

// Анализируем каждый файл
styleFiles.forEach(file => finder.analyzeFile(file));

// Генерируем отчет
finder.generateReport();
