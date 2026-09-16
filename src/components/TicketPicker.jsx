import { IconMinus, IconPlus } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";

// Выбор билета. Цена за гостя падает с размером компании (как в «Чайной
// высоте»: на двоих дешевле, чем одному, компанией — ещё дешевле), поэтому
// вся сетка тарифов показана сразу плитками — так видно и текущую цену, и
// то, что дальше она ниже. Отдельного «выбора тарифа» нет: тариф всегда
// следует за числом гостей, плитка лишь подсвечивается и по тапу ставит
// своё минимальное число. Точное число (в том числе своё) набирается
// степпером.

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

function guestsWord(n) {
  return plural(n, "гость", "гостя", "гостей");
}

function tierLabel(tier) {
  return tier.min === tier.max
    ? `${tier.min} ${guestsWord(tier.min)}`
    : `${tier.min}–${tier.max} ${guestsWord(tier.max)}`;
}

export function tierFor(tiers, guests) {
  return tiers.find((t) => guests >= t.min && guests <= t.max) || tiers[tiers.length - 1];
}

export default function TicketPicker({ tiers, guests, onChange }) {
  const maxGuests = tiers[tiers.length - 1].max;
  const current = tierFor(tiers, guests);
  const next = tiers.find((t) => t.min === guests + 1);

  const setGuests = (n) => onChange(Math.min(maxGuests, Math.max(1, n)));

  return (
    <div className="ticket-card">
      <div className="ticket-card__head">
        <span className="section__label">Билет</span>
        <span className="ticket-card__note">чем больше компания, тем дешевле за гостя</span>
      </div>

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

      <div className="ticket-count">
        <span className="ticket-count__label">Гостей</span>
        <div className="stepper">
          <button
            type="button"
            className="stepper__btn"
            onClick={() => setGuests(guests - 1)}
            disabled={guests <= 1}
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

      {next && (
        <p className="ticket-card__nudge">
          Ещё один гость — и билет выйдет по {formatPrice(next.pricePerPerson)} ₽ за человека
        </p>
      )}

      <div className="ticket-card__break tabnum">
        {formatPrice(current.pricePerPerson)} ₽ × {guests} {guestsWord(guests)}
      </div>
    </div>
  );
}
