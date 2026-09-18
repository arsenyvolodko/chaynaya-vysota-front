import { IconArrowRight, IconCheck, IconMinus, IconPlus, IconSparkles, IconTicket } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

export function guestsWord(n) {
  return plural(n, "гость", "гостя", "гостей");
}

function tierLabel(tier) {
  return tier.min === tier.max ? `${tier.min}` : `${tier.min}–${tier.max}`;
}

export function tierFor(tiers, guests) {
  return tiers.find((tier) => guests >= tier.min && guests <= tier.max) || null;
}

export function ticketTotal(tiers, guests) {
  const tier = tierFor(tiers, guests);
  return tier ? tier.pricePerPerson * guests : 0;
}

export default function TicketPicker({ tickets, selectedId, guests, onSelect, onChange, onCheckout }) {
  const selected = tickets.find((ticket) => ticket.id === selectedId) || tickets[0];
  const maxGuests = selected.tiers[selected.tiers.length - 1].max;
  const currentTier = tierFor(selected.tiers, guests);
  const total = ticketTotal(selected.tiers, guests);
  const setGuests = (count) => onChange(Math.min(maxGuests, Math.max(1, count)));

  const selectTicket = (ticket) => {
    const ticketMax = ticket.tiers[ticket.tiers.length - 1].max;
    onSelect(ticket.id);
    if (guests > ticketMax) onChange(ticketMax);
  };

  return (
    <section className="ticket-picker">
      <div className="ticket-picker__head">
        <span className="ticket-picker__eyebrow">Билеты</span>
        <h2>Выберите место</h2>
        <p>Цена за гостя становится ниже, если вы приходите компанией.</p>
      </div>

      <div className="seat-options" role="radiogroup" aria-label="Тип места">
        {tickets.map((ticket) => {
          const active = ticket.id === selected.id;
          const minPrice = Math.min(...ticket.tiers.map((tier) => tier.pricePerPerson));
          const isFront = ticket.tone === "front";
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              className={`seat-option ${active ? "is-on" : ""} ${isFront ? "seat-option--front" : ""}`}
              onClick={() => selectTicket(ticket)}
              key={ticket.id}
            >
              <span className="seat-option__icon">
                {isFront ? <IconSparkles size={18} stroke={1.7} /> : <IconTicket size={18} stroke={1.7} />}
              </span>
              <span className="seat-option__body">
                <strong>{isFront ? "Первый ряд" : "Основной зал"}</strong>
                <small>{isFront ? "Ближе к ведущему" : "Стандартное место"}</small>
              </span>
              <span className="seat-option__price">от {formatPrice(minPrice)} ₽</span>
              <span className="seat-option__check"><IconCheck size={13} stroke={2.6} /></span>
            </button>
          );
        })}
      </div>

      <div className="ticket-picker__quantity">
        <div>
          <strong>Сколько гостей?</strong>
          <span>Можно оформить до {maxGuests} мест одним заказом</span>
        </div>
        <div className="ticket-stepper">
          <button type="button" onClick={() => setGuests(guests - 1)} disabled={guests <= 1} aria-label="Меньше гостей">
            <IconMinus size={17} stroke={2.2} />
          </button>
          <span><strong>{guests}</strong><small>{guestsWord(guests)}</small></span>
          <button type="button" onClick={() => setGuests(guests + 1)} disabled={guests >= maxGuests} aria-label="Больше гостей">
            <IconPlus size={17} stroke={2.2} />
          </button>
        </div>
      </div>

      <div className="ticket-picker__tiers" aria-label="Тарифы по числу гостей">
        {selected.tiers.map((tier) => (
          <button type="button" className={tier === currentTier ? "is-on" : ""} onClick={() => setGuests(tier.min)} key={tier.min}>
            <span>{tierLabel(tier)} {plural(tier.max, "место", "места", "мест")}</span>
            <strong>{formatPrice(tier.pricePerPerson)} ₽</strong>
            <small>за гостя</small>
          </button>
        ))}
      </div>

      <button type="button" className="ticket-picker__result" onClick={onCheckout} aria-label={`Перейти к оплате, ${formatPrice(total)} рублей`}>
        <span>
          {guests} {guestsWord(guests)} × {formatPrice(currentTier?.pricePerPerson || 0)} ₽
          <small>{selected.title}</small>
        </span>
        <span className="ticket-picker__result-total">
          <strong>{formatPrice(total)} ₽</strong>
          <i><IconArrowRight size={15} stroke={2.2} /></i>
        </span>
      </button>
    </section>
  );
}
