const fs = require('fs');
const path = require('path');

class BladeTemplateUpdater {
    constructor() {
        this.viewJsMap = {
            'admin/components/dynamic-timeline': 'admin/components/dynamic-timeline',
            'admin/components/hall-configuration': 'admin/components/hall-configuration', 
            'admin/components/price-configuration': 'admin/components/price-configuration',
            'admin/components/sessions-timeline': 'admin/components/sessions-timeline',
            'admin/dashboard': 'admin/dashboard',
            'admin/modals/add-hall-modal': 'admin/modals/add-hall-modal',
            'admin/modals/add-movie-modal': 'admin/modals/add-movie-modal',
            'admin/modals/add-session-modal': 'admin/modals/add-session-modal',
            'admin/modals/edit-movie-modal': 'admin/modals/edit-movie-modal',
            'admin/modals/edit-session-modal': 'admin/modals/edit-session-modal'
        };
    }

    updateTemplates() {
        console.log('🔧 Обновление Blade шаблонов...\n');

        Object.entries(this.viewJsMap).forEach(([viewPath, jsPath]) => {
            const bladePath = path.join(__dirname, '../../resources/views', `${viewPath}.blade.php`);
            const jsAssetPath = `js/${jsPath}.js`;

            if (fs.existsSync(bladePath)) {
                this.addScriptToBlade(bladePath, jsAssetPath, viewPath);
            } else {
                console.log(`❌ Blade шаблон не найден: ${bladePath}`);
            }
        });

        console.log('\n🎉 Обновление шаблонов завершено!');
    }

    addScriptToBlade(bladePath, jsAssetPath, viewName) {
        let content = fs.readFileSync(bladePath, 'utf8');
        
        // Проверяем, не добавлен ли уже скрипт
        if (content.includes(jsAssetPath)) {
            console.log(`✅ Скрипт уже добавлен в: ${viewName}`);
            return;
        }

        // Ищем место для вставки - перед закрывающим тегом </body> или в конце файла
        const scriptTag = `\n<script src="{{ asset('${jsAssetPath}') }}"></script>\n`;
        
        if (content.includes('</body>')) {
            content = content.replace('</body>', scriptTag + '</body>');
        } else {
            content += scriptTag;
        }

        // Создаем backup
        const backupPath = bladePath + '.backup.' + Date.now();
        fs.writeFileSync(backupPath, fs.readFileSync(bladePath));

        // Записываем обновленный файл
        fs.writeFileSync(bladePath, content);
        console.log(`✅ Добавлен скрипт в: ${viewName}`);
    }
}

// Запуск обновления шаблонов
const updater = new BladeTemplateUpdater();
updater.updateTemplates();
