@php
    $position = $session->getTimelinePosition();
    $isLong = $session->getTotalDuration() > 180;
    $spansDays = $position['spans_days'];
    $tooltipContent = "
        <strong>{$session->movie->title}</strong><br>
        Начало: {$session->session_start->format('d.m.Y H:i')}<br>
        Фильм: {$session->movie->movie_duration} мин<br>
        Реклама: 10 мин<br> 
        Уборка: 15 мин<br>
        <em>Двойной клик - удалить</em>
    ";
@endphp

<div class="conf-step__seances-movie conf-step__seances-movie--draggable
    {{ $isLong ? 'conf-step__seances-movie--long' : '' }} 
    {{ $spansDays ? 'conf-step__seances-movie--overnight' : '' }}"
    style="width: {{ max($position['width'], 1.5) }}%; left: {{ $position['left'] }}%;"
    data-session-id="{{ $session->id }}"
    data-session-start="{{ $session->session_start->format('Y-m-d H:i:s') }}"
    data-movie-duration="{{ $session->movie->movie_duration }}"
    draggable="true"
    ondragstart="dragSession(event, {{ $session->id }})"
    ondblclick="openDeleteSessionModal({{ $session->id }}, '{{ $session->movie->title }}')"
    title="{{ $session->movie->title }} | {{ $session->session_start->format('H:i') }}">
    
    <!-- Основной контент блока -->
    <div class="conf-step__seances-movie-content">
        <p class="conf-step__seances-movie-title">
            {{ \Illuminate\Support\Str::limit($session->movie->title, $isLong ? 25 : 15) }}
        </p>
        <p class="conf-step__seances-movie-start">
            {{ $session->session_start->format('H:i') }}
            @if($spansDays)
                <span style="font-size: 0.8rem; opacity: 0.8;">
                    → {{ $session->getCleaningEndTime()->format('H:i') }}
                </span>
            @endif
        </p>
    </div>
    
    <!-- Индикатор перетаскивания -->
    <div class="conf-step__seances-drag-handle"></div>
</div>
