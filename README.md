# Система бронирования билетов в кинотеатр

Веб-приложение для онлайн-бронирования билетов в кинотеатр с административной панелью управления.

## Технические требования

- PHP 8.4.14
- Laravel 12.35.1
- MySQL 8.0+
- Docker + Laravel Sail
- Node.js + Yarn (для сборки фронтенда)

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
./vendor/bin/sail yarn install
./vendor/bin/sail yarn build
```

5. **Настройка прав доступа для загрузки файлов**

## Для корректной работы загрузки постеров фильмов необходимо настроить права доступа в Docker-контейнере:

```bash
# Настройка прав в контейнере
./vendor/bin/sail exec laravel.test chmod -R 775 storage/app/public
./vendor/bin/sail exec laravel.test chown -R www-data:www-data storage/app/public
```

## **Примечание:** Если возникают проблемы с загрузкой файлов, убедитесь что:

- Директория storage/app/public/posters существует и доступна для записи

- Симлинк public/storage ведет на storage/app/public (создается автоматически при запуске sail)

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

## Работа с файлами

- Постеры фильмов сохраняются в storage/app/public/posters/

- Доступ к файлам через симлинк public/storage

- Автоматическая генерация заглушки при отсутствии постера

- Поддержка загрузки изображений форматов: JPEG, PNG, GIF, SVG

## Технические примечания

- Для корректной работы загрузки файлов в Docker-окружении требуются дополнительные права доступа (см. пункт 5 "Настройка прав")

- При разработке в Windows с использованием WSL убедитесь, что файловая система контейнера имеет правильные права

- Все загруженные файлы доступны по URL: http://localhost/storage/posters/имя_файла.jpg

- Проект использует Yarn как пакетный менеджер для фронтенда
