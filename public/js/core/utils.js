// Вспомогательные функции
export function showNotification(message, type = "info") {
    console.log(`[${type}] ${message}`);
    // Можно добавить toast уведомления
}

export function formatPrice(price) {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB"
    }).format(price);
}
