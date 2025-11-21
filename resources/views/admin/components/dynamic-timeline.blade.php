@php
    use Carbon\Carbon;

    $pixelsPerMinute = 1;
    
    // Если есть расписание, используем его для расчета шкалы
    if ($schedule) {
        // Рассчитываем рабочее время зала
        $workStart = Carbon::parse($schedule->date->format('Y-m-d') . ' ' . $schedule->start_time);
        $workEnd = Carbon::parse($schedule->date->format('Y-m-d') . ' ' . $schedule->end_time);
        
        if ($schedule->overnight) {
            $workEnd->addDay(); // Если ночной режим, добавляем день
        }
        
        $totalMinutes = $workStart->diffInMinutes($workEnd);
        $timelineWidth = $totalMinutes * $pixelsPerMinute;
        $dayStart = $workStart;
    } else {
        // Если расписания нет, используем стандартную шкалу
        $dayStart = $selectedDate->copy()->startOfDay()->addHours(8);
        $totalMinutes = 20 * 60; // 20 часов
        $timelineWidth = $totalMinutes * $pixelsPerMinute;
    }
@endphp

<!-- Динамическая шкала времени -->
<div class="conf-step__seances-timeline" style="width: {{ $timelineWidth }}px;">
    <!-- Шкала с часами -->
    <div class="conf-step__timeline-scale">
        @if($schedule)
            <!-- Генерируем метки на основе реального расписания -->
            @php
                $current = $workStart->copy()->startOfHour();
                $end = $workEnd->copy()->startOfHour();
                $hourStep = $totalMinutes > 6 * 60 ? 2 : 1; // Шаг зависит от длительности
                
                // Собираем все метки, которые нужно отобразить
                $marks = [];
                
                // Добавляем метки для каждого часа
                while ($current <= $end) {
                    $position = $workStart->diffInMinutes($current) * $pixelsPerMinute;
                    $displayHour = $current->format('H:i');
                    $isOvernight = !$current->isSameDay($workStart);
                    
                    $marks[] = [
                        'position' => $position,
                        'displayHour' => $displayHour,
                        'isOvernight' => $isOvernight
                    ];
                    
                    $current->addHours($hourStep);
                }
                
                // ВАЖНО: Добавляем метку для точного времени окончания работы
                $endPosition = $workStart->diffInMinutes($workEnd) * $pixelsPerMinute;
                $endDisplayHour = $workEnd->format('H:i');
                $endIsOvernight = !$workEnd->isSameDay($workStart);
                
                // Проверяем, нет ли уже метки на этой позиции (чтобы избежать дублирования)
                $hasEndMark = false;
                foreach ($marks as $mark) {
                    if (abs($mark['position'] - $endPosition) < 30) { // 30 пикселей ~ 30 минут
                        $hasEndMark = true;
                        break;
                    }
                }
                
                if (!$hasEndMark) {
                    $marks[] = [
                        'position' => $endPosition,
                        'displayHour' => $endDisplayHour,
                        'isOvernight' => $endIsOvernight
                    ];
                }
            @endphp
            
            <!-- Рендерим все метки -->
            @foreach($marks as $mark)
                <div class="conf-step__timeline-mark @if($mark['isOvernight']) conf-step__timeline-mark--overnight @endif"
                     style="left: {{ $mark['position'] }}px;">
                    <span class="conf-step__timeline-label">
                        {{ $mark['displayHour'] }}
                    </span>
                    <div class="conf-step__timeline-line"></div>
                </div>
            @endforeach
        @else
            <!-- Стандартная шкала если расписания нет -->
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
            
            <!-- Добавляем метку для 01:00 если она не была добавлена -->
            @php
                $oneAmPosition = ((1 + 24 - 8) * 60) * $pixelsPerMinute; // 01:00 = 25-й час от 8:00
            @endphp
            <div class="conf-step__timeline-mark conf-step__timeline-mark--overnight"
                 style="left: {{ $oneAmPosition }}px;">
                <span class="conf-step__timeline-label">01:00</span>
                <div class="conf-step__timeline-line"></div>
            </div>
        @endif
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

                <!-- ВКЛЮЧАЕМ БЛОК СЕАНСА -->
                @include('admin.components.session-block', [
                    'session' => $session,
                    'position' => $position,
                    'isLong' => $isLong,
                    'isVeryLong' => $isVeryLong,
                    'dayStart' => $dayStart,
                    'pixelsPerMinute' => $pixelsPerMinute
                ])
            @endif
        @empty
            <div class="conf-step__empty-track">
                <p class="no-seances">Нет сеансов на выбранную дату</p>
            </div>
        @endforelse
    </div>
</div>
