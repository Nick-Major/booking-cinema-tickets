@php
    use Carbon\Carbon;
    
    $pixelsPerMinute = 1;
    $dayStart = $selectedDate->copy()->startOfDay()->addHours(8);
    $totalMinutes = 20 * 60;
    $timelineWidth = $totalMinutes * $pixelsPerMinute;
@endphp

<!-- Динамическая шкала времени -->
<div class="conf-step__seances-timeline" style="width: {{ $timelineWidth }}px;">
    <!-- Шкала с часами -->
    <div class="conf-step__timeline-scale">
        @for($hour = 8; $hour <= 28; $hour += 2)
            @php
                $displayHour = $hour % 24;
                $isOvernight = $hour >= 24;
                $position = (($hour - 8) * 60) * $pixelsPerMinute;
            @endphp
            <div class="conf-step__timeline-mark @if($isOvernight) conf-step__timeline-mark--overnight @endif" 
                 style="left: {{ $position }}px;">
                <span class="conf-step__timeline-label">
                    {{ $displayHour }}:00
                </span>
                <div class="conf-step__timeline-line"></div>
            </div>
        @endfor
    </div>

    <!-- Область сеансов -->
    <div class="conf-step__sessions-area">
        @forelse($hallSessions as $session)
            @if($session->movie)
            @php
                try {
                    $position = $session->getTimelinePosition($dayStart, $pixelsPerMinute);
                    
                    // Пропускаем сеансы за пределами видимой области
                    if ($position['left'] > $timelineWidth) {
                        continue;
                    }
                    
                    $isLong = $session->getDisplayDuration() > 180;
                    $isVeryLong = $session->getDisplayDuration() > 240;
                    $isOvernight = $position['is_overnight'];
                } catch (Exception $e) {
                    continue;
                }
            @endphp

            <!-- Сеанс -->
            <div class="conf-step__seances-movie
                        @if($isLong) conf-step__seances-movie--long @endif
                        @if($isVeryLong) conf-step__seances-movie--very-long @endif
                        @if($isOvernight) conf-step__seances-movie--overnight @endif"
                 style="left: {{ $position['left'] }}px; width: {{ $position['width'] }}px;"
                 data-session-id="{{ $session->id }}"
                 ondblclick="openEditSessionModal({{ $session->id }})"
                 title="{{ $session->movie->title }} ({{ $position['start_time'] }} - {{ $position['end_time'] }})">

                <div class="conf-step__seances-movie-content">
                    <h4 class="conf-step__seances-movie-title">{{ $session->movie->title }}</h4>
                    <div class="conf-step__seances-movie-time">
                        <span>{{ $position['start_time'] }}</span>
                        @if($isOvernight)
                            <span class="conf-step__overnight-indicator">🌙</span>
                        @endif
                    </div>
                </div>

                <div class="conf-step__duration-indicator">
                    {{ floor($session->movie->movie_duration / 60) }}ч {{ $session->movie->movie_duration % 60 }}м
                </div>
            </div>
        @empty
            <div class="conf-step__empty-track">
                <p class="no-seances">Нет сеансов на выбранную дату</p>
                <button class="conf-step__button conf-step__button-accent"
                        onclick="openAddSessionModal({{ $hall->id ?? 0 }}, '{{ $selectedDate->format('Y-m-d') }}')">
                    Добавить сеанс
                </button>
            </div>
            @endif
        @endforelse
    </div>
</div>