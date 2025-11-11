<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Регистрация | ИдёмВКино</title>
  <link rel="stylesheet" href="{{ asset('css/common/normalize.css') }}">
  <link rel="stylesheet" href="{{ asset('css/admin/styles.css') }}">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
</head>

<body>
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
    <span class="page-header__subtitle">Регистрация</span>
  </header>
  
  <main>
    <section class="login">
      <header class="login__header">
        <h2 class="login__title">Регистрация</h2>
      </header>
      <div class="login__wrapper">
        
        @if ($errors->any())
          <div class="alert alert-danger">
            <ul>
              @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
              @endforeach
            </ul>
          </div>
        @endif

        <form class="login__form" action="{{ route('register') }}" method="POST">
          @csrf
          
          <label class="login__label" for="name">
            Имя
            <input class="login__input" type="text" placeholder="Ваше имя" name="name" value="{{ old('name') }}" required autofocus>
          </label>

          <label class="login__label" for="email">
            E-mail
            <input class="login__input" type="email" placeholder="example@domain.xyz" name="email" value="{{ old('email') }}" required>
          </label>

          <label class="login__label" for="password">
            Пароль
            <input class="login__input" type="password" placeholder="" name="password" required>
          </label>

          <label class="login__label" for="password_confirmation">
            Подтверждение пароля
            <input class="login__input" type="password" placeholder="" name="password_confirmation" required>
          </label>

          <div class="text-center">
            <button type="submit" class="login__button">Зарегистрироваться</button>
          </div>
        </form>

        <div class="login__link text-center">
          <p>Уже есть аккаунт? <a href="{{ route('login') }}">Войдите</a></p>
        </div>
      </div>
    </section>
  </main>
</body>
</html>
