@php
    use Carbon\Carbon;
    $startOfDay = $selectedDate->copy()->startOfDay();
    $endOfDay = $selectedDate->copy()->endOfDay();
    $dayStartHour = 8; // 8:00 утра
    $dayEndHour = 26; // 2:00 следующего дня (24+2)
    $totalHours = $dayEndHour - $dayStartHour;
    $pixelsPerHour = 60; // 60px в час
    $totalMinutes = $totalHours * 60;
    $pixelsPerMinute = $pixelsPerHour / 60;
    $timelineWidth = $totalMinutes * $pixelsPerMinute;
@endphp

<!-- Временно добавим отладочный блок -->
@if(false) {{-- Установите true для включения отладки --}}
<div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px; font-size: 12px; border: 2px solid red;">
    <h4>Отладка сеансов для зала: {{ $hall->hall_name }}</h4>
    @foreach($hallSessions as $session)
        @php
            $sessionStart = Carbon::parse($session->session_start);
            $sessionEnd = Carbon::parse($session->session_end);
            $startMinutesFromDayStart = max(0, $sessionStart->diffInMinutes($startOfDay->copy()->addHours($dayStartHour)));
            $durationMinutes = $sessionStart->diffInMinutes($sessionEnd);
            $left = $startMinutesFromDayStart * $pixelsPerMinute;
            $width = $durationMinutes * $pixelsPerMinute;
        @endphp
        <div>
            <strong>{{ $session->movie->title }}</strong><br>
            Начало: {{ $sessionStart }}<br>
            Конец: {{ $sessionEnd }}<br>
            От начала дня: {{ $startMinutesFromDayStart }} мин<br>
            Длительность: {{ $durationMinutes }} мин<br>
            Позиция: {{ $left }}px, Ширина: {{ $width }}px<br>
            <hr>
        </div>
    @endforeach
</div>
@endif

<!-- Динамическая шкала времени -->
<div class="conf-step__dynamic-timeline" style="width: {{ $timelineWidth }}px;">
    <!-- Шкала с часами -->
    <div class="conf-step__timeline-scale">
        @for($hour = $dayStartHour; $hour <= $dayEndHour; $hour++)
            @php
                $displayHour = $hour % 24;
                $isOvernight = $hour >= 24;
                $positionPercent = (($hour - $dayStartHour) / $totalHours) * 100;
            @endphp
            <div class="conf-step__timeline-mark @if($isOvernight) conf-step__timeline-mark--overnight @endif" 
                 style="left: {{ $positionPercent }}%;">
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
            @php
                $sessionStart = Carbon::parse($session->session_start);
                $sessionEnd = Carbon::parse($session->session_end);
                
                // Расчет позиции относительно начала дня (8:00)
                $startMinutesFromDayStart = max(0, $sessionStart->diffInMinutes($startOfDay->copy()->addHours($dayStartHour)));
                $durationMinutes = $sessionStart->diffInMinutes($sessionEnd);
                
                // Позиция и ширина в пикселях
                $left = $startMinutesFromDayStart * $pixelsPerMinute;
                $width = $durationMinutes * $pixelsPerMinute;
                
                // Ограничиваем ширину, если сеанс выходит за границы дня
                $maxWidth = $totalMinutes * $pixelsPerMinute - $left;
                $width = min($width, $maxWidth);
                
                // Определяем классы для длинных сеансов
                $isLong = $durationMinutes > 240; // Более 4 часов
                $isVeryLong = $durationMinutes > 360; // Более 6 часов
                $isOvernight = $sessionStart->hour < 6 || $sessionEnd->hour < 6;
            @endphp

            <!-- Сеанс -->
            <div class="conf-step__seances-movie 
                        @if($isLong) conf-step__seances-movie--long @endif
                        @if($isVeryLong) conf-step__seances-movie--very-long @endif
                        @if($isOvernight) conf-step__seances-movie--overnight @endif"
                 style="left: {{ $left }}px; width: {{ $width }}px;"
                 data-session-id="{{ $session->id }}"
                 ondblclick="openEditSessionModal({{ $session->id }})"
                 title="{{ $session->movie->title }} ({{ $sessionStart->format('H:i') }} - {{ $sessionEnd->format('H:i') }})">
                
                <div class="conf-step__seances-movie-content">
                    <h4 class="conf-step__seances-movie-title">{{ $session->movie->title }}</h4>
                    <div class="conf-step__seances-movie-time">
                        <span>{{ $sessionStart->format('H:i') }}</span>
                        @if($isOvernight)
                            <span class="conf-step__overnight-indicator">🌙</span>
                        @endif
                    </div>
                </div>
                
                <div class="conf-step__duration-indicator">
                    {{ floor($durationMinutes / 60) }}ч {{ $durationMinutes % 60 }}м
                </div>
            </div>
        @empty
            <div class="conf-step__empty-track">
                <p>Нет сеансов на выбранную дату</p>
                <button class="conf-step__button conf-step__button-accent"
                        onclick="openAddSessionModal({{ $hall->id }}, '{{ $currentDate }}')">
                    Добавить сеанс
                </button>
            </div>
        @endforelse
    </div>
</div>
