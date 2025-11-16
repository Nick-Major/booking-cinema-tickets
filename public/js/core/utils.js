// Вспомогательные функции
export function showNotification(message, type = "info") {
    console.log(`[${type}] ${message}`);
}

export function formatPrice(price) {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB"
    }).format(price);
}
