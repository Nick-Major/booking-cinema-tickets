const fs = require('fs');
const path = require('path');

class SafeUnusedFunctionRemover {
    constructor() {
        // Только полностью неиспользуемые функции (проверенные в Blade и JS)
        this.unusedFunctions = [
            'closeAddSessionModal',
            'closeEditSessionModal',
            'closeDeleteHallModal',
            'handleAddSessionSubmit',
            'handleEditSessionSubmit',
            'scrollToSession'
        ];
    }

    removeUnusedFunctions(filePath) {
        console.log(`🧹 Удаляем неиспользуемые функции из: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Файл не найден: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let originalLength = content.length;
        let removedCount = 0;

        // Создаем backup
        const backupPath = filePath + '.backup.' + new Date().getTime();
        fs.writeFileSync(backupPath, content);
        console.log(`📦 Создан backup: ${backupPath}`);

        this.unusedFunctions.forEach(funcName => {
            const result = this.removeFunction(content, funcName);
            if (result.removed) {
                content = result.content;
                removedCount++;
                console.log(`✅ Удалена функция: ${funcName}`);
                console.log(`   📝 Код: ${result.code.substring(0, 80)}...`);
            }
        });

        if (removedCount > 0) {
            // Записываем обновленный файл
            fs.writeFileSync(filePath, content);
            console.log(`\n🎉 Удалено функций: ${removedCount}`);
            console.log(`📏 Сокращение: ${originalLength} → ${content.length} символов (${Math.round((originalLength - content.length) / originalLength * 100)}%)`);
            
            // Сохраняем список удаленных функций
            const reportPath = path.join(path.dirname(filePath), 'removed-functions-report.txt');
            fs.writeFileSync(reportPath, `Удаленные функции (${new Date().toISOString()}):\n${this.unusedFunctions.join('\n')}`);
            console.log(`📄 Отчет об удалении: ${reportPath}`);
        } else {
            console.log('ℹ️  Неиспользуемые функции не найдены для удаления');
        }
    }

    removeFunction(content, funcName) {
        // Паттерны для поиска функций
        const patterns = [
            // function declaration
            {
                regex: new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}\\s*`, 'g'),
                type: 'function declaration'
            },
            // const/let/var function expression
            {
                regex: new RegExp(`(const|let|var)\\s+${funcName}\\s*=\\s*(?:async\\s*)?function[\\s\\S]*?\\}\\s*;?\\s*`, 'g'),
                type: 'function expression'
            },
            // arrow function
            {
                regex: new RegExp(`(const|let|var)\\s+${funcName}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>[\\s\\S]*?\\}\\s*;?\\s*`, 'g'),
                type: 'arrow function'
            }
        ];

        for (const pattern of patterns) {
            const match = pattern.regex.exec(content);
            if (match) {
                return {
                    removed: true,
                    content: content.replace(pattern.regex, ''),
                    code: match[0].replace(/\n/g, ' ').substring(0, 100)
                };
            }
        }
        
        return { removed: false, content: content };
    }
}

// Запуск с предварительным просмотром
function main() {
    const remover = new SafeUnusedFunctionRemover();
    const filePath = path.join(__dirname, '../../public/js/admin/app.js');
    
    console.log('🔍 ПРЕВЬЮ УДАЛЕНИЯ НЕИСПОЛЬЗУЕМЫХ ФУНКЦИЙ:\n');
    
    let content = fs.readFileSync(filePath, 'utf8');
    let foundCount = 0;
    
    remover.unusedFunctions.forEach(funcName => {
        const patterns = [
            new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}\\s*`, 'g'),
            new RegExp(`(const|let|var)\\s+${funcName}\\s*=\\s*(?:async\\s*)?function[\\s\\S]*?\\}\\s*;?\\s*`, 'g'),
            new RegExp(`(const|let|var)\\s+${funcName}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>[\\s\\S]*?\\}\\s*;?\\s*`, 'g')
        ];

        let found = false;
        patterns.forEach(pattern => {
            const match = pattern.exec(content);
            if (match) {
                console.log(`📝 Найдена функция: ${funcName}`);
                console.log(`   Тип: ${pattern.toString().includes('function') ? 'function declaration' : 'function expression'}`);
                console.log(`   Код: ${match[0].substring(0, 100).replace(/\n/g, ' ')}...`);
                console.log('');
                found = true;
                foundCount++;
            }
        });

        if (!found) {
            console.log(`❓ Функция не найдена: ${funcName}`);
        }
    });

    console.log(`\n📊 Найдено функций для удаления: ${foundCount} из ${remover.unusedFunctions.length}`);
    
    if (foundCount > 0) {
        console.log('\n💡 Для реального удаления раскомментируйте код ниже:');
        remover.removeUnusedFunctions(filePath);
    }
}

main();
