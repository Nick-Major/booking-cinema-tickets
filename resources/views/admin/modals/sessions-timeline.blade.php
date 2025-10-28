@if($sessions->count() > 0)
    @foreach($sessions->groupBy('cinema_hall_id') as $hallId => $hallSessions)
        @php
            $hall = $hallSessions->first()->cinemaHall;
        @endphp
        <div class="conf-step__seances-hall">
            <h3 class="conf-step__seances-title">{{ $hall->hall_name }}</h3>
            <div class="conf-step__seances-timeline">
                @foreach($hallSessions as $session)
                    @php
                        // Расчет позиции и ширины для таймлайна
                        $startTime = $session->session_start;
                        $endTime = $session->session_end;
                        $startMinutes = $startTime->hour * 60 + $startTime->minute;
                        $durationMinutes = $session->movie->movie_duration;
                        $left = ($startMinutes / 1440) * 100; // 1440 минут в сутках
                        $width = ($durationMinutes / 1440) * 100;
                    @endphp
                    <div class="conf-step__seances-movie" 
                         style="width: {{ max($width, 5) }}%; left: {{ $left }}%; background-color: #{{ substr(md5($session->movie_id), 0, 6) }};"
                         onclick="openEditSessionModal({{ $session->id }})">
                        <p class="conf-step__seances-movie-title">{{ $session->movie->title }}</p>
                        <p class="conf-step__seances-movie-start">{{ $startTime->format('H:i') }}</p>
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