@if($sessions->count() > 0)
    @foreach($sessions->groupBy('cinema_hall_id') as $hallId => $hallSessions)
        @php
            $hall = $hallSessions->first()->cinemaHall;
        @endphp
        <div class="conf-step__seances-hall">
            <h3 class="conf-step__seances-title">{{ $hall->hall_name }}</h3>
            <div class="conf-step__seances-timeline">
                <!-- Шкала времени 0-24 часа -->
                <div class="conf-step__timeline-scale">
                    @for($i = 0; $i <= 24; $i += 2)
                        <div class="conf-step__timeline-hour" style="left: {{ ($i / 24) * 100 }}%;">
                            {{ sprintf('%02d:00', $i) }}
                        </div>
                    @endfor
                </div>
                
                @foreach($hallSessions as $session)
                    @php
                        $startTime = $session->session_start;
                        $endTime = $session->session_end;
                        $startMinutes = $startTime->hour * 60 + $startTime->minute;
                        $durationMinutes = $session->movie->movie_duration;
                        $left = ($startMinutes / 1440) * 100; // 1440 минут в сутках
                        $width = ($durationMinutes / 1440) * 100;
                    @endphp
                    <div class="conf-step__seances-movie"
                         style="width: {{ max($width, 2) }}%; left: {{ $left }}%; background-color: #{{ substr(md5($session->movie_id), 0, 6) }};"
                         data-session-id="{{ $session->id }}"
                         onmouseover="showSessionControls(this)"
                         onmouseout="hideSessionControls(this)">
                        <p class="conf-step__seances-movie-title">{{ $session->movie->title }}</p>
                        <p class="conf-step__seances-movie-start">{{ $startTime->format('H:i') }}</p>
                        
                        <!-- Кнопка удаления (показывается при наведении) -->
                        <div class="conf-step__seances-controls" style="display: none;">
                            <button class="conf-step__button conf-step__button-small conf-step__button-trash"
                                    onclick="deleteSession({{ $session->id }}, '{{ $session->movie->title }}')"
                                    title="Удалить сеанс"></button>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endforeach
@else
    <div class="conf-step__empty-seances">
        <p>Нет созданных сеансов</p>
    </div>
@endif
