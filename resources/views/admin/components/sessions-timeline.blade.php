@php
    use Carbon\Carbon;
@endphp

<div class="conf-step__seances-timeline-wrapper" id="sessionsTimelineWrapper">
    <!-- Навигация по датам -->
    <div class="conf-step__timeline-nav">
        <button class="conf-step__button conf-step__button-regular timeline-nav-btn" 
                data-action="prev"
                data-prev-date="{{ $prevDate }}"
                style="width: 100px;">
            ← Назад
        </button>
        
        <input type="date" 
                value="{{ $currentDate }}" 
                class="conf-step__input timeline-date-input"
                style="width: 150px;">
        
        <button class="conf-step__button conf-step__button-regular timeline-nav-btn"
                data-action="next" 
                data-next-date="{{ $nextDate }}"
                style="width: 100px;">
            Вперед →
        </button>
    </div>

    <!-- Остальная разметка без изменений -->
    <div class="conf-step__timeline-vertical">
        @foreach($halls as $hall)
            @php
                $schedule = $hallSchedules[$hall->id] ?? null;
                $hallSessions = $sessions[$hall->id] ?? collect();
            @endphp

            <div class="conf-step__timeline-hall" data-hall-id="{{ $hall->id }}">
                <div class="conf-step__hall-header">
                    <div class="conf-step__hall-title-section">
                        <h3 class="conf-step__seances-title">{{ $hall->hall_name }}</h3>

                        @if($schedule)
                            <button class="conf-step__button conf-step__button-accent"
                                    onclick="openAddSessionModal({{ $hall->id ?? 0 }}, '{{ $selectedDate->format('Y-m-d') }}')">
                                + Добавить сеанс
                            </button>
                            
                            <div class="conf-step__schedule-controls">
                                <button class="conf-step__button conf-step__button-small conf-step__button-regular"
                                        onclick="openEditScheduleModal({{ $schedule->id }})"
                                        title="Редактировать расписание">
                                </button>
                                <button class="conf-step__button conf-step__button-small conf-step__button-trash"
                                        onclick="openDeleteScheduleModal({{ $schedule->id }}, {{ $hall->id }}, '{{ $hall->hall_name }}', '{{ $currentDate }}')"
                                        title="Удалить расписание">
                                </button>
                            </div>
                        @endif

                    </div>

                    @if(!$schedule)
                        <button class="conf-step__button conf-step__button-schedule"
                                onclick="openCreateScheduleModal({{ $hall->id }}, '{{ $selectedDate->format('Y-m-d') }}', '{{ $hall->hall_name }}')">
                            Создать расписание
                        </button>
                    @endif
                </div>

                @if($schedule)
                    <div class="conf-step__schedule-created">
                        <div class="conf-step__schedule-info">
                            <span class="schedule-label">Расписание:</span>
                            <span class="schedule-time">{{ \Carbon\Carbon::parse($schedule->start_time)->format('H:i') }} - {{ \Carbon\Carbon::parse($schedule->end_time)->format('H:i') }}</span>
                            @if($schedule->overnight)
                                <span class="schedule-overnight">(ночной режим)</span>
                            @endif
                        </div>

                        <div class="conf-step__timeline-scroll-container">
                            <div class="conf-step__timeline-content">
                                @include('admin.components.dynamic-timeline', [
                                    'hallSessions' => $hallSessions,
                                    'selectedDate' => $selectedDate,
                                    'hall' => $hall,
                                    'schedule' => $schedule
                                ])
                            </div>
                        </div>
                    </div>
                @else
                    <div class="conf-step__no-schedule">
                        <p>Расписание еще не создано</p>
                    </div>
                @endif
            </div>
        @endforeach
    </div>
</div>
