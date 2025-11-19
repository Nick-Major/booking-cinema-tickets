@php
    if (!isset($position)) {
        $position = $session->getTimelinePosition();
    }
    $tooltip = "{$session->movie->title}\nНачало: {$position['start_time']}\nОкончание: {$position['end_time']}\nДлительность: {$session->getTotalDuration()} мин\n\nДвойной клик для редактирования";
@endphp

<div class="conf-step__seances-movie"
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
    
    <div class="conf-step__duration-indicator">
        {{ floor($session->movie->movie_duration / 60) }}ч {{ $session->movie->movie_duration % 60 }}м
    </div>
</div>
