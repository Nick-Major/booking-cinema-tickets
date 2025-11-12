const fs = require('fs');
const path = require('path');

class BladeJSAnalyzer {
    constructor() {
        this.functions = new Map();
        this.views = new Map(); // view -> functions used
        this.functionViews = new Map(); // function -> views that use it
        this.jsContent = '';
    }

    analyze() {
        console.log('🔍 Начинаем анализ связей Blade и JS...\n');

        // 1. Загружаем JS файл
        this.loadJSFile();
        
        // 2. Анализируем Blade шаблоны
        this.analyzeBladeTemplates();
        
        // 3. Генерируем отчет
        this.generateReport();
        
        // 4. Создаем план распределения
        this.generateDistributionPlan();
    }

    loadJSFile() {
        const jsPath = path.join(__dirname, '../../public/js/admin/app.js');
        this.jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Собираем все функции из JS
        this.collectJSFunctions();
        console.log(`📊 Загружено функций из JS: ${this.functions.size}`);
    }

    collectJSFunctions() {
        const patterns = [
            { regex: /function\s+(\w+)\s*\(/g, type: 'declaration' },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function)/g, type: 'expression', group: 2 },
        ];

        patterns.forEach(({ regex, type, group = 1 }) => {
            let match;
            while ((match = regex.exec(this.jsContent)) !== null) {
                const funcName = match[group] || match[1];
                if (this.isValidFunctionName(funcName)) {
                    this.functions.set(funcName, {
                        type,
                        definition: this.extractFunctionDefinition(funcName),
                        usedInViews: new Set()
                    });
                }
            }
        });
    }

    extractFunctionDefinition(funcName) {
        // Упрощенное извлечение кода функции
        const pattern = new RegExp(`(function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}\\s*|(const|let|var)\\s+${funcName}\\s*=[\\s\\S]*?\\}\\s*;?)`, 'g');
        const match = pattern.exec(this.jsContent);
        return match ? match[0] : null;
    }

    analyzeBladeTemplates() {
        const bladeTemplates = this.findBladeTemplates(path.join(__dirname, '../../resources/views'));
        console.log(`📁 Анализируем ${bladeTemplates.length} Blade шаблонов...`);

        bladeTemplates.forEach(templatePath => {
            try {
                const content = fs.readFileSync(templatePath, 'utf8');
                const viewName = path.relative(path.join(__dirname, '../../resources/views'), templatePath)
                    .replace('.blade.php', '')
                    .replace(/\\/g, '/');
                
                this.analyzeBladeTemplate(content, viewName, templatePath);
            } catch (error) {
                console.log(`⚠️  Ошибка чтения шаблона: ${templatePath}`);
            }
        });
    }

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

    analyzeBladeTemplate(content, viewName, templatePath) {
        const usedFunctions = new Set();

        // Ищем вызовы функций в HTML атрибутах
        const patterns = [
            /onclick=["']([^"']*)["']/gi,
            /onchange=["']([^"']*)["']/gi,
            /onsubmit=["']([^"']*)["']/gi,
            /@click=["']([^"']*)["']/gi,
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const jsCode = match[1];
                // Извлекаем имена функций из JS кода
                const functionNames = this.extractFunctionNamesFromCode(jsCode);
                functionNames.forEach(funcName => {
                    if (this.functions.has(funcName)) {
                        usedFunctions.add(funcName);
                        this.functions.get(funcName).usedInViews.add(viewName);
                        
                        if (!this.functionViews.has(funcName)) {
                            this.functionViews.set(funcName, new Set());
                        }
                        this.functionViews.get(funcName).add(viewName);
                    }
                });
            }
        });

        if (usedFunctions.size > 0) {
            this.views.set(viewName, {
                path: templatePath,
                usedFunctions: Array.from(usedFunctions)
            });
        }
    }

    extractFunctionNamesFromCode(jsCode) {
        // Упрощенное извлечение имен функций из строки JS кода
        return jsCode.split(/[\(\)\s,;]/)
            .filter(part => this.functions.has(part))
            .filter(part => part.length > 2);
    }

    isValidFunctionName(name) {
        const excluded = ['function', 'if', 'for', 'while', 'switch', 'catch'];
        return !excluded.includes(name) && name.length > 2;
    }

    generateReport() {
        console.log('\n=== ОТЧЕТ О СВЯЗЯХ BLADE И JS ===\n');

        // Статистика по функциям
        const functionsUsedInBlade = Array.from(this.functions.values())
            .filter(func => func.usedInViews.size > 0).length;
        
        const functionsUsedOnlyInJS = Array.from(this.functions.values())
            .filter(func => func.usedInViews.size === 0).length;

        console.log(`📊 Функций используется в Blade: ${functionsUsedInBlade}`);
        console.log(`📊 Функций используется только в JS: ${functionsUsedOnlyInJS}`);
        console.log(`📊 Шаблонов используют JS функции: ${this.views.size}\n`);

        // Топ шаблонов по количеству используемых функций
        console.log('🏆 ТОП ШАБЛОНОВ ПО ИСПОЛЬЗОВАНИЮ JS:');
        const sortedViews = Array.from(this.views.entries())
            .sort((a, b) => b[1].usedFunctions.length - a[1].usedFunctions.length)
            .slice(0, 10);

        sortedViews.forEach(([viewName, data], index) => {
            console.log(`${index + 1}. ${viewName}: ${data.usedFunctions.length} функций`);
        });

        // Функции, используемые в нескольких шаблонах
        console.log('\n🔗 ФУНКЦИИ, ИСПОЛЬЗУЕМЫЕ В НЕСКОЛЬКИХ ШАБЛОНАХ:');
        const multiViewFunctions = Array.from(this.functionViews.entries())
            .filter(([_, views]) => views.size > 1)
            .sort((a, b) => b[1].size - a[1].size);

        multiViewFunctions.forEach(([funcName, views], index) => {
            console.log(`${index + 1}. ${funcName}: ${views.size} шаблонов`);
        });
    }

    generateDistributionPlan() {
        console.log('\n📋 ПЛАН РАСПРЕДЕЛЕНИЯ ПО ФАЙЛАМ:\n');

        // Группируем функции по шаблонам
        const viewGroups = new Map();

        this.views.forEach((viewData, viewName) => {
            console.log(`📄 ${viewName}.js будет содержать:`);
            viewData.usedFunctions.forEach(funcName => {
                console.log(`   - ${funcName}`);
            });
            console.log('');

            // Сохраняем для создания файлов
            viewGroups.set(viewName, viewData.usedFunctions);
        });

        // Функции, не используемые в Blade (останутся в общем файле)
        const jsOnlyFunctions = Array.from(this.functions.entries())
            .filter(([name, func]) => func.usedInViews.size === 0)
            .map(([name]) => name);

        if (jsOnlyFunctions.length > 0) {
            console.log('🔧 ФУНКЦИИ ДЛЯ ОБЩЕГО ФАЙЛА (не используются в Blade):');
            jsOnlyFunctions.forEach(funcName => {
                console.log(`   - ${funcName}`);
            });
        }

        this.saveDistributionPlan(viewGroups, jsOnlyFunctions);
    }

    saveDistributionPlan(viewGroups, jsOnlyFunctions) {
        const planPath = path.join(__dirname, '../../reports/js-distribution-plan.txt');
        let content = 'ПЛАН РАСПРЕДЕЛЕНИЯ JS ФУНКЦИЙ ПО ФАЙЛАМ\n';
        content += '='.repeat(60) + '\n\n';

        content += 'VIEW-SPECIFIC ФАЙЛЫ:\n\n';
        viewGroups.forEach((functions, viewName) => {
            content += `${viewName}.js:\n`;
            functions.forEach(funcName => {
                content += `  - ${funcName}\n`;
            });
            content += '\n';
        });

        content += 'ОБЩИЕ ФУНКЦИИ (оставить в app.js):\n\n';
        jsOnlyFunctions.forEach(funcName => {
            content += `  - ${funcName}\n`;
        });

        content += `\nВсего view-файлов: ${viewGroups.size}\n`;
        content += `Всего функций в view-файлах: ${Array.from(viewGroups.values()).flat().length}\n`;
        content += `Функций в общем файле: ${jsOnlyFunctions.length}\n`;

        fs.writeFileSync(planPath, content);
        console.log(`\n📄 План распределения сохранен: ${planPath}`);
    }
}

// Запуск анализа
const analyzer = new BladeJSAnalyzer();
analyzer.analyze();
