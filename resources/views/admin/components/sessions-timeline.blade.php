@php
    use Carbon\Carbon;
    $currentDate = request('date', now()->format('Y-m-d'));
    $selectedDate = Carbon::parse($currentDate);
@endphp

<div class="conf-step__seances-timeline-wrapper">
    <!-- Навигация по датам -->
    <div class="conf-step__timeline-nav">
        <button class="conf-step__button conf-step__button-regular" 
                onclick="changeTimelineDate('{{ $selectedDate->copy()->subDay()->format('Y-m-d') }}')">
            ← Назад
        </button>
        
        <div class="conf-step__current-date">
            <input type="date" 
                   value="{{ $currentDate }}" 
                   onchange="changeTimelineDate(this.value)"
                   class="conf-step__input"
                   style="width: 150px; display: inline-block;">
            <span class="conf-step__date-display" style="margin-left: 10px; font-size: 1.6rem;">
                {{ $selectedDate->translatedFormat('d F Y') }}
            </span>
        </div>
        
        <button class="conf-step__button conf-step__button-regular"
                onclick="changeTimelineDate('{{ $selectedDate->copy()->addDay()->format('Y-m-d') }}')">
            Вперед →
        </button>
        
        <button class="conf-step__button conf-step__button-accent"
                onclick="changeTimelineDate('{{ now()->format('Y-m-d') }}')">
            Сегодня
        </button>
    </div>

    <!-- Вертикальный таймлайн -->
    <div class="conf-step__timeline-vertical" id="sessionsTimeline">
        @forelse($halls as $hall)
            @php
                $hallSessions = $sessions->where('cinema_hall_id', $hall->id)
                    ->sortBy('order_column');
            @endphp
            
            <div class="conf-step__timeline-hall" 
                 data-hall-id="{{ $hall->id }}"
                 ondrop="dropSession(event, {{ $hall->id }})"
                 ondragover="allowDrop(event)">
                
                <!-- Заголовок зала -->
                <div class="conf-step__hall-header">
                    <h3 class="conf-step__seances-title">{{ $hall->hall_name }}</h3>
                    <span class="conf-step__hall-sessions-count" style="font-size: 1.4rem; color: #848484;">
                        {{ $hallSessions->count() }} сеансов
                    </span>
                </div>
                
                <!-- Шкала времени -->
                <div class="conf-step__seances-timeline">
                    <div class="conf-step__timeline-scale">
                        @for($hour = 8; $hour <= 24; $hour += 2)
                            <div class="conf-step__timeline-hour" style="left: {{ (($hour - 8) / 16) * 100 }}%;">
                                {{ sprintf('%02d:00', $hour > 24 ? $hour - 24 : $hour) }}
                            </div>
                        @endfor
                        @if($hour <= 26)
                            <div class="conf-step__timeline-hour conf-step__timeline-hour--overnight" style="left: 100%;">
                                02:00
                            </div>
                        @endif
                    </div>
                    
                    <!-- Трек сеансов -->
                    <div class="conf-step__sessions-track">
                        @foreach($hallSessions as $session)
                            @include('admin.components.session-block', [
                                'session' => $session,
                                'selectedDate' => $selectedDate
                            ])
                        @endforeach
                        
                        <!-- Пустой state -->
                        @if($hallSessions->count() == 0)
                            <div class="conf-step__empty-track" style="text-align: center; padding: 20px; color: #848484;">
                                <p style="font-size: 1.4rem; margin-bottom: 10px;">Нет сеансов на эту дату</p>
                                <button class="conf-step__button conf-step__button-accent conf-step__button-small"
                                        onclick="openAddSessionModal({{ $hall->id }}, '{{ $currentDate }}')"
                                        style="padding: 8px 16px; font-size: 1.2rem;">
                                    Добавить сеанс
                                </button>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        @empty
            <div class="conf-step__empty-halls" style="text-align: center; padding: 40px; color: #848484;">
                <p style="font-size: 1.6rem; margin-bottom: 20px;">Нет доступных залов</p>
                <button class="conf-step__button conf-step__button-accent"
                        onclick="openAddHallModal()">
                    Создать первый зал
                </button>
            </div>
        @endforelse
    </div>
</div>

<!-- Подсказка по управлению -->
<div class="conf-step__legend" style="margin-top: 20px; background: #eae9eb; padding: 15px; border-radius: 4px;">
    <p class="conf-step__paragraph" style="margin-bottom: 0; font-size: 1.4rem;">
        💡 <strong>Управление сеансами:</strong> 
        Перетаскивайте для изменения времени • Двойной клик для удаления • 
        Наведите для подробной информации
    </p>
</div>
