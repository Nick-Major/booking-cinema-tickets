const fs = require('fs');
const path = require('path');

console.log('=== АНАЛИЗ СТИЛЕЙ POPUP ===');

// Проверяем admin styles
const adminCssPath = path.join(__dirname, '../../public/css/admin/styles.css');
if (fs.existsSync(adminCssPath)) {
    const content = fs.readFileSync(adminCssPath, 'utf8');
    const popupRules = content.match(/\.popup[^{]*\{[^}]+\}/g) || [];
    const popupContainerRules = content.match(/\.popup__container[^{]*\{[^}]+\}/g) || [];
    
    console.log('\n--- POPUP правила в admin/styles.css ---');
    popupRules.forEach(rule => console.log(rule));
    
    console.log('\n--- POPUP_CONTAINER правила в admin/styles.css ---');
    popupContainerRules.forEach(rule => console.log(rule));
} else {
    console.log('Admin CSS не найден:', adminCssPath);
}

// Проверяем common styles
const commonCssPath = path.join(__dirname, '../../public/css/common/normalize.css');
if (fs.existsSync(commonCssPath)) {
    const content = fs.readFileSync(commonCssPath, 'utf8');
    if (content.includes('popup')) {
        console.log('\n--- POPUP упоминается в normalize.css ---');
        console.log(content.match(/\.popup[^{]*\{[^}]+\}/g) || 'Не найдено конкретных правил');
    }
}
