<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'ИдёмВКино')</title>
    
    <!-- Общие стили -->
    <link rel="stylesheet" href="{{ asset('css/common/normalize.css') }}">
    
    <!-- Стили в зависимости от раздела -->
    @if(request()->is('admin*') || request()->is('login') || request()->is('register'))
        <link rel="stylesheet" href="{{ asset('css/admin/styles.css') }}">
    @else
        <link rel="stylesheet" href="{{ asset('css/client/styles.css') }}">
    @endif
    
    <!-- Шрифты -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic,cyrillic-ext,latin-ext" rel="stylesheet">
    
    @stack('styles')
</head>
<body>
    @yield('content')
    
    @stack('scripts')
</body>
</html>