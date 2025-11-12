@extends('layouts.base')

@section('title', 'Вход в систему')

@section('content')
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Авторизация | ИдёмВКино</title>
</head>

<body>
  <header class="page-header">
    <h1 class="page-header__title">Идём<span>в</span>кино</h1>
    <span class="page-header__subtitle">Администраторррская</span>
  </header>
  
  <main>
    <section class="login">
      <header class="login__header">
        <h2 class="login__title">Авторизация</h2>
      </header>
      <div class="login__wrapper">
        <form class="login__form" action="{{ route('login') }}" method="POST">
          @csrf
          <label class="login__label" for="email">
            E-mail
            <input class="login__input" type="email" placeholder="example@domain.xyz" name="email" value="{{ old('email') }}" required>
          </label>
          <label class="login__label" for="password">
            Пароль
            <input class="login__input" type="password" placeholder="" name="password" required>
          </label>
          <div class="text-center">
            <button type="submit" class="login__button">Авторизоваться</button>
          </div>
        </form>
      </div>
    </section>
  </main>
</body>
</html>
@endsection
