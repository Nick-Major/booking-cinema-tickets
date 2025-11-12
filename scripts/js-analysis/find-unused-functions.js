const fs = require('fs');
const path = require('path');

class UnusedFunctionFinder {
    constructor() {
        this.functions = new Map(); // name -> {definition, usages}
        this.unusedFunctions = [];
    }

    analyzeFile(filePath) {
        console.log(`🔍 Анализируем использование функций в: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 1. Сначала собираем все объявления функций
        this.collectFunctionDeclarations(content, filePath);
        
        // 2. Затем ищем их использования
        this.findFunctionUsages(content, filePath);
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
                        usages: []
                    });
                }
            }
        });
    }

    findFunctionUsages(content, filePath) {
        this.functions.forEach((funcInfo, funcName) => {
            // Ищем вызовы функции (имя followed by '(')
            const usageRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
            let usageMatch;
            
            while ((usageMatch = usageRegex.exec(content)) !== null) {
                // Проверяем, что это не объявление функции
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

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    isValidFunctionName(name) {
        const excluded = ['function', 'if', 'for', 'while', 'switch', 'catch'];
        return !excluded.includes(name) && name.length > 2;
    }

    generateReport() {
        console.log('\n=== ОТЧЕТ О НЕИСПОЛЬЗУЕМЫХ ФУНКЦИЯХ ===\n');
        
        this.unusedFunctions = Array.from(this.functions.entries())
            .filter(([name, info]) => info.usages.length === 0);

        console.log(`📊 Всего функций: ${this.functions.size}`);
        console.log(`🚨 Неиспользуемых функций: ${this.unusedFunctions.length}\n`);

        if (this.unusedFunctions.length > 0) {
            console.log('СПИСОК НЕИСПОЛЬЗУЕМЫХ ФУНКЦИЙ:');
            this.unusedFunctions.forEach(([name, info], index) => {
                console.log(`${index + 1}. ${name}`);
                console.log(`   Тип: ${info.definition.type}`);
                console.log(`   Файл: ${info.definition.filePath}`);
                console.log(`   Строка: ${info.definition.line}`);
                console.log('');
            });
        } else {
            console.log('✅ Неиспользуемых функций не найдено!');
        }

        this.saveReport();
    }

    saveReport() {
        const reportPath = path.join(__dirname, '../../reports/unused-functions.txt');
        let content = 'ОТЧЕТ О НЕИСПОЛЬЗУЕМЫХ JS ФУНКЦИЯХ\n';
        content += '='.repeat(50) + '\n\n';
        content += `Всего функций: ${this.functions.size}\n`;
        content += `Неиспользуемых функций: ${this.unusedFunctions.length}\n\n`;

        if (this.unusedFunctions.length > 0) {
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
const finder = new UnusedFunctionFinder();
finder.analyzeFile(path.join(__dirname, '../../public/js/admin/app.js'));
finder.generateReport();
