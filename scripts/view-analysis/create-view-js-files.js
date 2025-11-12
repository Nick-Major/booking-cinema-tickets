const fs = require('fs');
const path = require('path');

class ViewJSFileCreator {
    constructor() {
        this.jsContent = '';
        this.functions = new Map();
        this.distributionPlan = {
            'admin/components/dynamic-timeline': ['openAddSessionModal'],
            'admin/components/hall-configuration': ['generateHallLayout', 'changeSeatType', 'resetHallLayout', 'saveHallConfiguration'],
            'admin/components/price-configuration': ['savePrices'],
            'admin/components/sessions-timeline': ['changeTimelineDate', 'openModal'],
            'admin/dashboard': ['updateSession', 'loadHallConfiguration', 'loadPriceConfiguration'],
            'admin/modals/add-hall-modal': ['closeAddHallModal'],
            'admin/modals/add-movie-modal': ['closeAddMovieModal', 'previewMoviePoster'],
            'admin/modals/add-session-modal': ['closeAllModals'],
            'admin/modals/edit-movie-modal': ['closeEditMovieModal'],
            'admin/modals/edit-session-modal': ['closeModal']
        };
    }

    createViewJSFiles() {
        console.log('🚀 Создание view-specific JS файлов...\n');

        // Загружаем исходный JS файл
        this.loadJSFile();
        
        // Создаем папки если нужно
        this.createDirectories();
        
        // Создаем view-specific файлы
        this.createViewFiles();
        
        // Создаем обновленный app.js без вынесенных функций
        this.createUpdatedAppJS();
        
        console.log('\n🎉 Все файлы созданы!');
    }

    loadJSFile() {
        const jsPath = path.join(__dirname, '../../public/js/admin/app.js');
        this.jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Собираем информацию о всех функциях
        this.collectAllFunctions();
    }

    collectAllFunctions() {
        const patterns = [
            { regex: /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\}\s*/g, type: 'declaration' },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function[^}]*\}/g, type: 'function expression', group: 2 },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>[^}]*\}/g, type: 'arrow function', group: 2 },
        ];

        patterns.forEach(({ regex, type, group = 1 }) => {
            let match;
            while ((match = regex.exec(this.jsContent)) !== null) {
                const funcName = match[group] || match[1];
                if (funcName && this.isValidFunctionName(funcName)) {
                    this.functions.set(funcName, {
                        code: match[0],
                        type: type
                    });
                }
            }
        });

        console.log(`📊 Собрано функций: ${this.functions.size}`);
    }

    createDirectories() {
        const directories = new Set();
        Object.keys(this.distributionPlan).forEach(viewPath => {
            const dir = path.dirname(viewPath);
            directories.add(path.join(__dirname, '../../public/js', dir));
        });

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Создана папка: ${dir}`);
            }
        });
    }

    createViewFiles() {
        Object.entries(this.distributionPlan).forEach(([viewPath, functionNames]) => {
            const filePath = path.join(__dirname, '../../public/js', `${viewPath}.js`);
            let fileContent = `// View-specific JS for ${viewPath}\n`;
            fileContent += '// Auto-generated file\n\n';

            // Добавляем функции в файл
            functionNames.forEach(funcName => {
                if (this.functions.has(funcName)) {
                    fileContent += this.functions.get(funcName).code + '\n\n';
                    console.log(`✅ Функция ${funcName} добавлена в ${viewPath}.js`);
                } else {
                    console.log(`❌ Функция ${funcName} не найдена в исходном коде`);
                }
            });

            fs.writeFileSync(filePath, fileContent);
            console.log(`📄 Создан файл: ${filePath}`);
        });
    }

    createUpdatedAppJS() {
        const appJsPath = path.join(__dirname, '../../public/js/admin/app.js');
        
        // Удаляем функции, которые были вынесены в view-specific файлы
        let updatedContent = this.jsContent;
        const functionsToRemove = Object.values(this.distributionPlan).flat();

        functionsToRemove.forEach(funcName => {
            if (this.functions.has(funcName)) {
                const functionCode = this.functions.get(funcName).code;
                updatedContent = updatedContent.replace(functionCode, '');
                console.log(`🗑️  Удалена функция ${funcName} из app.js`);
            }
        });

        // Удаляем множественные пустые строки
        updatedContent = updatedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

        // Создаем backup оригинального файла
        const backupPath = appJsPath + '.backup.' + Date.now();
        fs.writeFileSync(backupPath, this.jsContent);
        console.log(`📦 Создан backup оригинального app.js: ${backupPath}`);

        // Записываем обновленный app.js
        fs.writeFileSync(appJsPath, updatedContent);
        console.log(`📄 Обновлен app.js: ${appJsPath}`);

        // Сохраняем список оставшихся функций
        this.saveRemainingFunctionsReport(updatedContent);
    }

    saveRemainingFunctionsReport(updatedContent) {
        const reportPath = path.join(__dirname, '../../reports/remaining-functions.txt');
        const remainingFunctions = Array.from(this.functions.keys())
            .filter(funcName => !Object.values(this.distributionPlan).flat().includes(funcName));

        let report = 'ОСТАВШИЕСЯ ФУНКЦИИ В APP.JS\n';
        report += '='.repeat(50) + '\n\n';
        report += `Всего функций: ${remainingFunctions.length}\n\n`;
        remainingFunctions.forEach(funcName => {
            report += `- ${funcName}\n`;
        });

        fs.writeFileSync(reportPath, report);
        console.log(`📄 Отчет по оставшимся функциям: ${reportPath}`);
    }

    isValidFunctionName(name) {
        const excluded = ['function', 'if', 'for', 'while', 'switch', 'catch'];
        return !excluded.includes(name) && name.length > 2;
    }
}

// Запуск создания файлов
const creator = new ViewJSFileCreator();
creator.createViewJSFiles();
