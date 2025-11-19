@php
    // Используем переданную позицию или вычисляем заново
    if (!isset($position)) {
        $position = $session->getTimelinePosition($dayStart, $pixelsPerMinute);
    }
    
    // Создаем информационный tooltip
    $tooltip = "{$session->movie->title}\nНачало: {$position['start_time']}\nОкончание: {$position['end_time']}\nДлительность: {$session->getDisplayDuration()} мин\n\nДвойной клик для редактирования";
    
    // Определяем классы для длинных сеансов
    $sessionDuration = $session->getDisplayDuration();
    $isVeryLong = $sessionDuration > 240;
    $isLong = $sessionDuration > 180 && !$isVeryLong;
@endphp

<div class="conf-step__seances-movie
            @if($isLong) conf-step__seances-movie--long @endif 
            @if($isVeryLong) conf-step__seances-movie--very-long @endif"
     style="left: {{ $position['left'] }}px; width: {{ $position['width'] }}px;"
     data-session-id="{{ $session->id }}"
     ondblclick="openEditSessionModal({{ $session->id }})"
     title="{{ $tooltip }}">
    
    <div class="conf-step__seances-movie-content">
        <h4 class="conf-step__seances-movie-title">{{ $session->movie->title }}</h4>
        <div class="conf-step__seances-movie-time">
            <span>{{ $position['start_time'] }}</span>
        </div>
    </div>
    
    @if($isVeryLong)
    <div class="conf-step__duration-indicator">
        {{ floor($sessionDuration / 60) }}ч {{ $sessionDuration % 60 }}м
    </div>
    @endif
</div>
