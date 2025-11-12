const fs = require('fs');
const path = require('path');

class EnhancedUnusedFunctionFinder {
    constructor() {
        this.functions = new Map();
        this.unusedFunctions = [];
        this.bladeTemplates = [];
    }

    // Находим все Blade шаблоны
    findBladeTemplates(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.findBladeTemplates(fullPath));
            } else if (path.extname(item) === '.php' && item.includes('.blade.')) {
                files.push(fullPath);
            }
        });
        
        return files;
    }

    analyze() {
        console.log('🔍 Поиск Blade шаблонов...');
        this.bladeTemplates = this.findBladeTemplates(path.join(__dirname, '../../resources/views'));
        console.log(`📁 Найдено Blade шаблонов: ${this.bladeTemplates.length}`);

        // Анализируем JS файл
        this.analyzeJSFile(path.join(__dirname, '../../public/js/admin/app.js'));
        
        // Анализируем Blade шаблоны на использование функций
        this.analyzeBladeTemplates();
        
        this.generateReport();
    }

    analyzeJSFile(filePath) {
        console.log(`🔍 Анализируем JS файл: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        this.collectFunctionDeclarations(content, filePath);
        this.findJSFunctionUsages(content, filePath);
    }

    collectFunctionDeclarations(content, filePath) {
        const patterns = [
            { regex: /function\s+(\w+)\s*\(/g, type: 'declaration' },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function)/g, type: 'expression', group: 2 },
        ];

        patterns.forEach(({ regex, type, group = 1 }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const funcName = match[group] || match[1];
                if (this.isValidFunctionName(funcName)) {
                    this.functions.set(funcName, {
                        definition: { filePath, type, line: this.getLineNumber(content, match.index) },
                        usages: [],
                        bladeUsages: []
                    });
                }
            }
        });
    }

    findJSFunctionUsages(content, filePath) {
        this.functions.forEach((funcInfo, funcName) => {
            const usageRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
            let usageMatch;
            
            while ((usageMatch = usageRegex.exec(content)) !== null) {
                const beforeMatch = content.substring(0, usageMatch.index);
                if (!beforeMatch.match(/(function|const|let|var)\s+$/)) {
                    funcInfo.usages.push({
                        filePath,
                        line: this.getLineNumber(content, usageMatch.index),
                        context: content.substring(
                            Math.max(0, usageMatch.index - 20), 
                            Math.min(content.length, usageMatch.index + 20)
                        ).trim()
                    });
                }
            }
        });
    }

    analyzeBladeTemplates() {
        console.log('🔍 Анализируем Blade шаблоны на вызовы JS функций...');
        
        this.bladeTemplates.forEach(templatePath => {
            try {
                const content = fs.readFileSync(templatePath, 'utf8');
                this.findBladeFunctionUsages(content, templatePath);
            } catch (error) {
                console.log(`⚠️  Ошибка чтения шаблона: ${templatePath}`);
            }
        });
    }

    findBladeFunctionUsages(content, filePath) {
        this.functions.forEach((funcInfo, funcName) => {
            // Ищем вызовы функций в HTML атрибутах
            const patterns = [
                new RegExp(`onclick=["']([^"']*\\b${funcName}\\s*\\([^"']*)["']`, 'gi'),
                new RegExp(`onchange=["']([^"']*\\b${funcName}\\s*\\([^"']*)["']`, 'gi'),
                new RegExp(`onsubmit=["']([^"']*\\b${funcName}\\s*\\([^"']*)["']`, 'gi'),
                new RegExp(`@click=["']([^"']*\\b${funcName}\\s*\\([^"']*)["']`, 'gi'),
                new RegExp(`wire:click=["']([^"']*\\b${funcName}\\s*\\([^"']*)["']`, 'gi'),
            ];

            patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    funcInfo.bladeUsages.push({
                        filePath,
                        line: this.getLineNumber(content, match.index),
                        context: match[0],
                        attribute: pattern.toString().split('=')[0].replace('new RegExp("', '').replace('\\\\b', '')
                    });
                }
            });
        });
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    isValidFunctionName(name) {
        const excluded = ['function', 'if', 'for', 'while', 'switch', 'catch'];
        return !excluded.includes(name) && name.length > 2;
    }

    generateReport() {
        console.log('\n=== УЛУЧШЕННЫЙ ОТЧЕТ О НЕИСПОЛЬЗУЕМЫХ ФУНКЦИЯХ ===\n');
        
        // Функция считается неиспользуемой, если нет вызовов ни в JS, ни в Blade
        this.unusedFunctions = Array.from(this.functions.entries())
            .filter(([name, info]) => info.usages.length === 0 && info.bladeUsages.length === 0);

        const usedInBladeOnly = Array.from(this.functions.entries())
            .filter(([name, info]) => info.usages.length === 0 && info.bladeUsages.length > 0);

        const usedInJSOnly = Array.from(this.functions.entries())
            .filter(([name, info]) => info.usages.length > 0 && info.bladeUsages.length === 0);

        const usedInBoth = Array.from(this.functions.entries())
            .filter(([name, info]) => info.usages.length > 0 && info.bladeUsages.length > 0);

        console.log(`📊 Всего функций: ${this.functions.size}`);
        console.log(`📊 Используются только в Blade: ${usedInBladeOnly.length}`);
        console.log(`📊 Используются только в JS: ${usedInJSOnly.length}`);
        console.log(`📊 Используются в обоих: ${usedInBoth.length}`);
        console.log(`🚨 Полностью неиспользуемых: ${this.unusedFunctions.length}\n`);

        if (usedInBladeOnly.length > 0) {
            console.log('📋 ФУНКЦИИ, ИСПОЛЬЗУЕМЫЕ ТОЛЬКО В BLADE:');
            usedInBladeOnly.forEach(([name, info], index) => {
                console.log(`${index + 1}. ${name}`);
                info.bladeUsages.forEach(usage => {
                    console.log(`   📍 ${usage.filePath}:${usage.line} (${usage.attribute})`);
                });
                console.log('');
            });
        }

        if (this.unusedFunctions.length > 0) {
            console.log('🚨 ПОЛНОСТЬЮ НЕИСПОЛЬЗУЕМЫЕ ФУНКЦИИ:');
            this.unusedFunctions.forEach(([name, info], index) => {
                console.log(`${index + 1}. ${name}`);
                console.log(`   Тип: ${info.definition.type}`);
                console.log(`   Файл: ${info.definition.filePath}`);
                console.log(`   Строка: ${info.definition.line}`);
                console.log('');
            });
        } else {
            console.log('✅ Полностью неиспользуемых функций не найдено!');
        }

        this.saveReport(usedInBladeOnly, usedInJSOnly, usedInBoth);
    }

    saveReport(usedInBladeOnly, usedInJSOnly, usedInBoth) {
        const reportPath = path.join(__dirname, '../../reports/unused-functions-enhanced.txt');
        let content = 'УЛУЧШЕННЫЙ ОТЧЕТ О ИСПОЛЬЗОВАНИИ JS ФУНКЦИЙ\n';
        content += '='.repeat(60) + '\n\n';
        content += `Всего функций: ${this.functions.size}\n`;
        content += `Используются только в Blade: ${usedInBladeOnly.length}\n`;
        content += `Используются только в JS: ${usedInJSOnly.length}\n`;
        content += `Используются в обоих: ${usedInBoth.length}\n`;
        content += `Полностью неиспользуемых: ${this.unusedFunctions.length}\n\n`;

        if (usedInBladeOnly.length > 0) {
            content += 'ФУНКЦИИ, ИСПОЛЬЗУЕМЫЕ ТОЛЬКО В BLADE:\n';
            usedInBladeOnly.forEach(([name, info], index) => {
                content += `${index + 1}. ${name}\n`;
                info.bladeUsages.forEach(usage => {
                    content += `   📍 ${usage.filePath}:${usage.line} (${usage.attribute})\n`;
                });
                content += '\n';
            });
        }

        if (this.unusedFunctions.length > 0) {
            content += 'ПОЛНОСТЬЮ НЕИСПОЛЬЗУЕМЫЕ ФУНКЦИИ:\n';
            this.unusedFunctions.forEach(([name, info], index) => {
                content += `${index + 1}. ${name}\n`;
                content += `   Тип: ${info.definition.type}\n`;
                content += `   Файл: ${info.definition.filePath}\n`;
                content += `   Строка: ${info.definition.line}\n\n`;
            });
        }

        fs.writeFileSync(reportPath, content);
        console.log(`📄 Отчет сохранен: ${reportPath}`);
    }
}

// Запуск
const finder = new EnhancedUnusedFunctionFinder();
finder.analyze();
