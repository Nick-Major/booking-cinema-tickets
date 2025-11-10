@php
    $position = $session->getTimelinePosition();
    $isLong = $session->getTotalDuration() > 180;
    $tooltip = "{$session->movie->title}\nНачало: {$position['start_time']}\nОкончание: {$position['end_time']}\nДлительность: {$session->getTotalDuration()} мин";
@endphp

<div class="conf-step__seances-movie 
    {{ $isLong ? 'conf-step__seances-movie--long' : '' }}
    {{ $position['spans_days'] ? 'conf-step__seances-movie--overnight' : '' }}"
     style="width: {{ $position['width'] }}%; left: {{ $position['left'] }}%;"
     data-session-id="{{ $session->id }}"
     ondblclick="openEditSessionModal({{ $session->id }})"
     title="{{ $tooltip }}">
    
    <div class="conf-step__seances-movie-content">
        <p class="conf-step__seances-movie-title">
            {{ \Illuminate\Support\Str::limit($session->movie->title, $isLong ? 20 : 12) }}
        </p>
        <p class="conf-step__seances-movie-time">
            {{ $position['start_time'] }}
            @if($position['spans_days'])
                <span class="conf-step__overnight-indicator">🌙</span>
            @endif
        </p>
    </div>
    
    <!-- Индикатор длительности -->
    <div class="conf-step__duration-indicator" 
         title="Общая длительность: {{ $session->getTotalDuration() }} мин">
        {{ $session->movie->movie_duration }}′
    </div>
</div>
