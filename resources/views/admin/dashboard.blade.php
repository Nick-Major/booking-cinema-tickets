<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ИдёмВКино</title>
  <link rel="stylesheet" href="{{ asset('css/admin/normalize.css') }}">
  <link rel="stylesheet" href="{{ asset('css/admin/styles.css') }}">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
</head>

<body>

  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
    <span class="page-header__subtitle">Администраторррская</span>
  </header>
  
  <main class="conf-steps">
    <!-- ВСТАВЛЯЕМ ВЕСЬ ВАШ HTML КОД АДМИНКИ ЗДЕСЬ -->
    <!-- Управление залами -->
    <section class="conf-step">
      <header class="conf-step__header conf-step__header_opened">
        <h2 class="conf-step__title">Управление залами</h2>
      </header>
      <div class="conf-step__wrapper">
        <p class="conf-step__paragraph">Доступные залы:</p>
        <ul class="conf-step__list">
          @foreach($halls as $hall)
          <li>{{ $hall->hall_name }}
            <button class="conf-step__button conf-step__button-trash"></button>
          </li>
          @endforeach
        </ul>
        <button class="conf-step__button conf-step__button-accent">Создать зал</button>
      </div>
    </section>
    
    <!-- Остальные секции конфигурации залов, цен, сеансов -->
    <!-- ... -->
    
  </main>
  <script src="{{ asset('js/accordeon.js') }}"></script>
</body>
</html>