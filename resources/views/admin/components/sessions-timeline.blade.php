@php
    use Carbon\Carbon;
    $currentDate = request('date', now()->format('Y-m-d'));
    $selectedDate = Carbon::parse($currentDate);
@endphp

<div class="conf-step__seances-timeline-wrapper">
    <!-- Навигация по датам -->
    <div class="conf-step__timeline-nav">
        <button class="conf-step__button conf-step__button-regular" 
                onclick="changeTimelineDate('{{ $selectedDate->copy()->subDay()->format('Y-m-d') }}')"
                style="width: 100px;">
            ← Назад
        </button>
        
        <input type="date" 
               value="{{ $currentDate }}" 
               onchange="changeTimelineDate(this.value)"
               class="conf-step__input"
               style="width: 150px;">
        
        <button class="conf-step__button conf-step__button-regular"
                onclick="changeTimelineDate('{{ $selectedDate->copy()->addDay()->format('Y-m-d') }}')"
                style="width: 100px;">
            Вперед →
        </button>
    </div>

    <!-- Вертикальный таймлайн с залами -->
    <div class="conf-step__timeline-vertical">
        @forelse($halls as $hall)
            @php
                $hallSessions = $sessions->where('cinema_hall_id', $hall->id)
                    ->sortBy('session_start');
                    
                // Проверяем, есть ли очень длинные сеансы для подсказки прокрутки
                $hasLongSessions = $hallSessions->contains(function($session) {
                    return $session->getTotalDuration() > 240; // Более 4 часов
                });
            @endphp
            
            <!-- ДОБАВЛЕН data-hall-id АТРИБУТ -->
            <div class="conf-step__timeline-hall" data-hall-id="{{ $hall->id }}">
                <!-- Заголовок зала -->
                <div class="conf-step__hall-header">
                    <h3 class="conf-step__seances-title">{{ $hall->hall_name }}</h3>
                    <span class="conf-step__hall-sessions-count">
                        {{ $hallSessions->count() }} сеансов
                        @if($hasLongSessions)
                            <span class="conf-step__long-sessions-hint" title="Есть длинные сеансы - используйте горизонтальную прокрутку">📏</span>
                        @endif
                    </span>
                </div>
                
                <!-- Контейнер с горизонтальной прокруткой -->
                <div class="conf-step__timeline-scroll-container">
                    <div class="conf-step__timeline-content">
                        <!-- Динамическая шкала времени -->
                        @include('admin.components.dynamic-timeline', [
                            'hallSessions' => $hallSessions,
                            'selectedDate' => $selectedDate,
                            'currentDate' => $currentDate,
                            'hall' => $hall
                        ])
                    </div>
                </div>
                
                <!-- Подсказка о прокрутке (показываем только если есть длинные сеансы) -->
                @if($hasLongSessions)
                    <div class="conf-step__scroll-hint">
                        Используйте горизонтальную прокрутку для просмотра всех сеансов
                    </div>
                @endif
            </div>
        @empty
            <div class="conf-step__empty-halls">
                <p>Нет доступных залов</p>
                <!-- ИСПРАВЛЕНА ФУНКЦИЯ В ONCLICK -->
                <button class="conf-step__button conf-step__button-accent"
                        onclick="openModal('addHallModal')">
                    Создать первый зал
                </button>
            </div>
        @endforelse
    </div>
</div>

<!-- Обновленная подсказка -->
<div class="conf-step__legend">
    <p class="conf-step__paragraph">
        💡 <strong>Управление сеансами:</strong> 
        Двойной клик по сеансу для редактирования • Наведите для подробной информации • 
        Используйте горизонтальную прокрутку для длинных сеансов
    </p>
</div>
