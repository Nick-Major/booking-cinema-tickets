const fs = require('fs');
const path = require('path');

class JSEnhancedDuplicateFinder {
    constructor() {
        this.functionMap = new Map();
        this.duplicates = [];
        this.functionCount = 0;
        this.anonymousCount = 0;
    }

    analyzeFile(filePath) {
        console.log(`🔍 Анализируем файл: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Файл не найден: ${filePath}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        
        // Только реальные объявления функций, исключаем встроенные методы
        const patterns = [
            // Function declarations (только на уровне модуля)
            { regex: /^function\s+(\w+)\s*\([^)]*\)\s*\{/gm, type: 'function declaration' },
            
            // Arrow functions assignments
            { regex: /(const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/g, type: 'arrow function', group: 2 },
            
            // Function expressions
            { regex: /(const|let|var)\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{/g, type: 'function expression', group: 2 },
            
            // Class methods (только в классах, которые мы определяем)
            { regex: /class\s+(\w+)\s*\{[^}]*?(\w+)\s*\([^)]*\)\s*\{/g, type: 'class method', group: 2, context: 'user-class' },
            
            // Async functions
            { regex: /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g, type: 'async function' },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{/g, type: 'async arrow function', group: 2 },
        ];

        patterns.forEach(({ regex, type, group = 1, context }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const funcName = match[group] || match[1];
                
                if (this.isValidFunctionName(funcName)) {
                    this.functionCount++;
                    this.registerFunction(funcName, filePath, type, context);
                }
            }
        });
    }

    isValidFunctionName(name) {
        // Исключаем встроенные методы и служебные слова
        const excludedNames = [
            'function', 'if', 'for', 'while', 'switch', 'catch', 'then', 
            'addEventListener', 'forEach', 'map', 'filter', 'reduce', 'find',
            'setTimeout', 'setInterval', 'querySelector', 'getElementById'
        ];
        return !excludedNames.includes(name) && 
               /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) &&
               name.length > 2; // Исключаем слишком короткие имена
    }

    registerFunction(name, filePath, type, context) {
        const functionInfo = { filePath, type, name, context };
        
        if (this.functionMap.has(name)) {
            const existing = this.functionMap.get(name);
            // Проверяем, действительно ли это дубликат (разные типы могут быть нормально)
            const isRealDuplicate = existing.some(existingFunc => 
                existingFunc.type === type && existingFunc.context === context
            );
            
            if (isRealDuplicate) {
                this.duplicates.push({
                    name,
                    type,
                    occurrences: [...existing, functionInfo]
                });
            }
        } else {
            this.functionMap.set(name, [functionInfo]);
        }
    }

    generateReport() {
        console.log('\n=== УЛУЧШЕННЫЙ ОТЧЕТ О ДУБЛИКАТАХ ===\n');
        
        console.log(`📊 Всего найдено функций: ${this.functionCount}`);
        console.log(`📊 Уникальных функций: ${this.functionMap.size}`);
        
        const realDuplicates = this.duplicates.filter(dup => 
            dup.occurrences.length > 1
        );

        if (realDuplicates.length === 0) {
            console.log('✅ Настоящие дубликаты не найдены!');
            
            // Покажем статистику по функциям
            console.log('\n📈 СТАТИСТИКА ФУНКЦИЙ:');
            const functionTypes = {};
            this.functionMap.forEach((occurrences, name) => {
                occurrences.forEach(occ => {
                    functionTypes[occ.type] = (functionTypes[occ.type] || 0) + 1;
                });
            });
            
            Object.entries(functionTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
        } else {
            console.log(`🚨 Найдено ${realDuplicates.length} настоящих дубликатов:\n`);
            
            realDuplicates.forEach((dup, index) => {
                console.log(`${index + 1}. Функция: "${dup.name}"`);
                dup.occurrences.forEach((occ, occIndex) => {
                    console.log(`   ${occIndex + 1}. ${occ.type}${occ.context ? ` (${occ.context})` : ''}`);
                });
            });
        }
    }
}

// Запуск
const finder = new JSEnhancedDuplicateFinder();
const adminJsPath = path.join(__dirname, '../../public/js/admin/app.js');
finder.analyzeFile(adminJsPath);
finder.generateReport();
