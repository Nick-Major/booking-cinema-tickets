@if($hall)
<div class="price-configuration" data-hall-id="{{ $hall->id }}">
    <p class="conf-step__paragraph">Установите цены для типов кресел:</p>
    
    <div class="conf-step__legend">
        <label class="conf-step__label">Цена, рублей
            <input type="number" class="conf-step__input regular-price-input" 
                   value="{{ $hall->regular_price }}" min="0" step="0.01" required>
        </label>
        за <span class="conf-step__chair conf-step__chair_standart"></span> обычные кресла
    </div>  
    
    <div class="conf-step__legend">
        <label class="conf-step__label">Цена, рублей
            <input type="number" class="conf-step__input vip-price-input" 
                   value="{{ $hall->vip_price }}" min="0" step="0.01" required>
        </label>
        за <span class="conf-step__chair conf-step__chair_vip"></span> VIP кресла
    </div>  
    
    <fieldset class="conf-step__buttons text-center">
        <button class="conf-step__button conf-step__button-regular" onclick="resetPrices({{ $hall->id }})">Отмена</button>
        <button class="conf-step__button conf-step__button-accent" onclick="savePrices({{ $hall->id }})">Сохранить</button>
    </fieldset>  
</div>
@endif
