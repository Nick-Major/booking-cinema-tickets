@if($hall)
<div class="hall-configuration" data-hall-id="{{ $hall->id }}">
    <p class="conf-step__paragraph">Укажите количество рядов и максимальное количество кресел в ряду:</p>
    <div class="conf-step__legend">
        <label class="conf-step__label">Рядов, шт
            <input type="number" class="conf-step__input rows-input" placeholder="10" 
                   value="{{ $hall->row_count }}" min="1" max="20">
        </label>
        <span class="multiplier">x</span>
        <label class="conf-step__label">Мест, шт
            <input type="number" class="conf-step__input seats-input" placeholder="8" 
                   value="{{ $hall->max_seats_number_in_row }}" min="1" max="20">
        </label>
        <button class="conf-step__button conf-step__button-regular" onclick="generateHallLayout({{ $hall->id }})">
            Сгенерировать схему
        </button>
    </div>
    
    <p class="conf-step__paragraph">Теперь вы можете указать типы кресел на схеме зала:</p>
    <div class="conf-step__legend">
        <span class="conf-step__chair conf-step__chair_standart" data-type="regular"></span> — обычные кресла
        <span class="conf-step__chair conf-step__chair_vip" data-type="vip"></span> — VIP кресла
        <span class="conf-step__chair conf-step__chair_disabled" data-type="blocked"></span> — заблокированные (нет кресла)
        <p class="conf-step__hint">Чтобы изменить вид кресла, нажмите по нему левой кнопкой мыши</p>
    </div>  
    
    <div class="conf-step__hall">
        <div class="conf-step__hall-wrapper" id="hallLayout-{{ $hall->id }}">
            @if($hall->row_count > 0 && $hall->max_seats_number_in_row > 0)
                @for($row = 1; $row <= $hall->row_count; $row++)
                    <div class="conf-step__row" data-row="{{ $row }}">
                        @for($seatNum = 1; $seatNum <= $hall->max_seats_number_in_row; $seatNum++)
                            @php
                                $seat = $hall->seats->where('row_number', $row)->where('row_seat_number', $seatNum)->first();
                                $seatType = $seat ? $seat->seat_status : 'regular';
                                $seatClass = match($seatType) {
                                    'regular' => 'conf-step__chair_standart',
                                    'vip' => 'conf-step__chair_vip',
                                    'blocked' => 'conf-step__chair_disabled',
                                    default => 'conf-step__chair_standart'
                                };
                            @endphp
                            <span class="conf-step__chair {{ $seatClass }}" 
                                data-row="{{ $row }}" 
                                data-seat="{{ $seatNum }}"
                                data-type="{{ $seatType }}"
                                onclick="changeSeatType(this)"></span>
                        @endfor
                    </div>
                @endfor
            @else
                <p class="conf-step__paragraph">Сгенерируйте схему зала</p>
            @endif
        </div>
    </div>
    
    <fieldset class="conf-step__buttons text-center">
        <button class="conf-step__button conf-step__button-regular" onclick="resetHallLayout({{ $hall->id }})">Отмена</button>
        <button class="conf-step__button conf-step__button-accent" onclick="saveHallConfiguration({{ $hall->id }})">Сохранить</button>
    </fieldset>
</div>
@endif