# Система бронирования билетов в кинотеатр

Веб-приложение для онлайн-бронирования билетов в кинотеатр с административной панелью управления.

## Технические требования

- PHP 8.4.14
- Laravel 12.35.1
- MySQL 8.0+
- Docker + Laravel Sail
- Node.js (для сборки фронтенда)

## Установка и запуск

1. **Клонируйте репозиторий**
```bash
git clone <repository-url>
cd booking-cinema-tickets
```

2. **Настройте окружение**
```bash
cp .env.example .env
```

3. **Запустите контейнеры**
```bash
./vendor/bin/sail up -d
```

4. **Установите зависимости и настройте приложение**
```bash
./vendor/bin/sail composer install
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install
./vendor/bin/sail npm run build
```

## Миграции базы данных

```bash
# Запуск миграций
./vendor/bin/sail artisan migrate

# Заполнение тестовыми данными
./vendor/bin/sail artisan db:seed
```

## Доступ к приложению

- **Клиентская часть:** http://localhost

- **Админ панель:** http://localhost/admin

- **База данных:** localhost:3306 (логин: sail, пароль: password)


## Учетные данные администратора

- Email: admin@cinema.ru
- Пароль: password123

## Фронтенд сборка
```bash
# Разработка
./vendor/bin/sail yarn dev:all

# Продакшен
./vendor/bin/sail yarn build
```

## Структура проекта

- app/Models/ - Модели данных

- app/Http/Controllers/ - Контроллеры

- resources/views/ - Blade шаблоны

- database/migrations/ - Миграции БД

- public/css/, public/js/ - Скомпилированные ресурсы

## Особенности реализации

- Серверная валидация данных

- Хеширование паролей

- Генерация QR-кодов для билетов

- Транзакции при бронировании

- Разделение на клиентскую и административную части
