import { IconMinus, IconPlus } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";

// Выбор билета, свёрстанный как кассовый чек: плитки тарифов, линия отрыва
// пунктиром, итог и счётчик гостей снизу, нижний край — волной.
// Цена за гостя падает с размером компании (как в «Чайной высоте»: на
// двоих дешевле, чем одному, компанией — ещё дешевле), поэтому вся сетка
// тарифов показана сразу — видно и текущую цену, и то, что дальше ниже.
// Отдельного «выбора тарифа» нет: тариф следует за числом гостей, плитка
// лишь подсвечивается и по тапу ставит своё минимальное число. Точное
// число (в том числе своё) набирается степпером.

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
  return tier.min === tier.max
    ? `${tier.min} ${guestsWord(tier.min)}`
    : `${tier.min}–${tier.max} ${guestsWord(tier.max)}`;
}

// Ноль гостей — валидное состояние: билеты двух видов, и любой из них
// можно не брать вовсе, поэтому тариф тогда не подсвечен, а сумма нулевая.
export function tierFor(tiers, guests) {
  return tiers.find((t) => guests >= t.min && guests <= t.max) || null;
}

export function ticketTotal(tiers, guests) {
  const tier = tierFor(tiers, guests);
  return tier ? tier.pricePerPerson * guests : 0;
}

export default function TicketPicker({ title, tone, tiers, guests, onChange }) {
  const maxGuests = tiers[tiers.length - 1].max;
  const current = tierFor(tiers, guests);
  const total = ticketTotal(tiers, guests);

  const setGuests = (n) => onChange(Math.min(maxGuests, Math.max(0, n)));

  return (
    <div className={`ticket-card ${tone ? `ticket-card--${tone}` : ""}`}>
      <div className="ticket-card__title">{title}</div>

      <div className="tariffs">
        {tiers.map((t) => (
          <button
            key={t.min}
            type="button"
            className={`tariff ${t === current ? "is-on" : ""}`}
            aria-pressed={t === current}
            onClick={() => setGuests(t.min)}
          >
            <span className="tariff__guests">{tierLabel(t)}</span>
            <span className="tariff__price tabnum">{formatPrice(t.pricePerPerson)} ₽</span>
            <span className="tariff__per">за гостя</span>
          </button>
        ))}
      </div>

      <div className="ticket-card__cut" aria-hidden="true" />

      <div className="ticket-card__bottom">
        <span className={`ticket-card__total tabnum ${total ? "" : "is-empty"}`}>
          {formatPrice(total)} ₽
        </span>
        <div className="stepper">
          <button
            type="button"
            className="stepper__btn"
            onClick={() => setGuests(guests - 1)}
            disabled={guests <= 0}
            aria-label="Меньше гостей"
          >
            <IconMinus size={16} stroke={2.2} />
          </button>
          <span className="stepper__value tabnum">{guests}</span>
          <button
            type="button"
            className="stepper__btn"
            onClick={() => setGuests(guests + 1)}
            disabled={guests >= maxGuests}
            aria-label="Больше гостей"
          >
            <IconPlus size={16} stroke={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
