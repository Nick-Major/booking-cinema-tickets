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
        
        // Улучшенные паттерны с лучшим определением контекста
        const patterns = [
            // Function declarations
            { regex: /^function\s+(\w+)\s*\([^)]*\)\s*\{/gm, type: 'function declaration' },
            
            // Arrow functions
            { regex: /(const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/g, type: 'arrow function', group: 2 },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g, type: 'arrow function (short)', group: 2 },
            
            // Function expressions
            { regex: /(const|let|var)\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{/g, type: 'function expression', group: 2 },
            
            // Methods in classes
            { regex: /class\s+\w+\s*\{[^}]*?(\w+)\s*\([^)]*\)\s*\{/g, type: 'class method' },
            { regex: /(\w+)\s*\([^)]*\)\s*\{[^{]*\}/g, type: 'method', context: 'class' },
            
            // Async functions
            { regex: /async\s+(\w+)\s*\([^)]*\)\s*\{/g, type: 'async function' },
            { regex: /(const|let|var)\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{/g, type: 'async arrow function', group: 2 },
        ];

        patterns.forEach(({ regex, type, group = 1, context }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const funcName = match[group] || match[1];
                
                // Фильтруем ложные срабатывания
                if (!this.isValidFunctionName(funcName)) {
                    this.anonymousCount++;
                    continue;
                }

                if (funcName && funcName.length > 1) {
                    this.functionCount++;
                    this.registerFunction(funcName, filePath, type, context);
                }
            }
        });
    }

    isValidFunctionName(name) {
        const invalidNames = ['function', 'if', 'for', 'while', 'switch', 'catch', 'then', 'catch'];
        return !invalidNames.includes(name) && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
    }

    registerFunction(name, filePath, type, context) {
        const functionInfo = { filePath, type, name, context };
        const key = `${name}|${type}`; // Учитываем и имя и тип
        
        if (this.functionMap.has(key)) {
            const existing = this.functionMap.get(key);
            this.duplicates.push({
                name,
                type,
                occurrences: [...existing, functionInfo]
            });
        } else {
            this.functionMap.set(key, [functionInfo]);
        }
    }

    generateReport() {
        console.log('\n=== УЛУЧШЕННЫЙ ОТЧЕТ О ДУБЛИКАТАХ ===\n');
        
        console.log(`📊 Всего найдено функций: ${this.functionCount}`);
        console.log(`📊 Анонимных функций пропущено: ${this.anonymousCount}`);
        console.log(`📊 Уникальных функций: ${this.functionMap.size}`);
        
        if (this.duplicates.length === 0) {
            console.log('✅ Дубликаты не найдены!');
        } else {
            console.log(`🚨 Найдено ${this.duplicates.length} групп дубликатов:\n`);
            
            // Группируем по серьезности
            const seriousDuplicates = this.duplicates.filter(dup => 
                dup.occurrences.length > 1 && 
                !dup.name.includes('function') // Исключаем ложные срабатывания
            );
            
            const falsePositives = this.duplicates.filter(dup => 
                dup.name.includes('function')
            );

            if (seriousDuplicates.length > 0) {
                console.log('🔴 СЕРЬЕЗНЫЕ ДУБЛИКАТЫ (требуют внимания):');
                seriousDuplicates.forEach((dup, index) => {
                    console.log(`\n${index + 1}. Функция: "${dup.name}" (${dup.type})`);
                    console.log(`   Найдено ${dup.occurrences.length} вхождений:`);
                    dup.occurrences.forEach((occ, occIndex) => {
                        console.log(`   ${occIndex + 1}. ${occ.type}${occ.context ? ` (${occ.context})` : ''}`);
                    });
                });
            }

            if (falsePositives.length > 0) {
                console.log(`\n🟡 ЛОЖНЫЕ СРАБАТЫВАНИЯ (${falsePositives.length}):`);
                console.log('   Эти функции, скорее всего, анонимные и не являются дубликатами');
            }
        }
    }
}

// Запуск
const finder = new JSEnhancedDuplicateFinder();
const adminJsPath = path.join(__dirname, '../../public/js/admin/app.js');
finder.analyzeFile(adminJsPath);
finder.generateReport();
