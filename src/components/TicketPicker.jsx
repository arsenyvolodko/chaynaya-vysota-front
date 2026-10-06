import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconArrowRight, IconCalendar, IconCandy, IconGift, IconMinus, IconPlus, IconX } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";
import { formatTastingTime, formatWeekdayDate } from "../utils/date.js";

function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

export function guestsWord(count) {
  return plural(count, "гость", "гостя", "гостей");
}

export function kitsWord(count) {
  return plural(count, "набор", "набора", "наборов");
}

export function tablesWord(count) {
  return plural(count, "столик", "столика", "столиков");
}

const FORMAT_TITLES = { standard: "Стандарт", front: "Первый ряд", table: "Столик" };

// Цена за гостя в зависимости от размера компании (для столика — null, он продаётся целиком).
export function guestPrice(ticket, guests) {
  if (ticket.price != null) return null;
  return guests >= (ticket.companyFrom ?? 2) && ticket.companyPricePerGuest != null
    ? ticket.companyPricePerGuest
    : ticket.pricePerGuest;
}

function ticketsCost(ticket, guests, tables = 1) {
  return ticket.price != null ? ticket.price * tables : guestPrice(ticket, guests) * guests;
}

export function maxGuestsFor(ticket, availableSeats) {
  const limits = [ticket?.maxGuests, availableSeats].filter((value) => value != null);
  return limits.length ? Math.min(...limits) : Infinity;
}

// Позиции заказа в формате TicketCheckoutFlow.
export function orderSelections(order, ticket, kitPrice) {
  const ticketTitle = order.mode === "open-date"
    ? "Билет на свободную дату"
    : ticket.id === "standard" && order.guests >= (ticket.companyFrom ?? 2) ? "Стандарт · компания" : ticket.title;
  const isTable = ticket.price != null;
  const tables = isTable ? order.tables : 1;
  // Столик продаётся целиком — гостей не выбирают, считаем по вместимости.
  const guests = isTable ? ticket.maxGuests * tables : order.guests;
  return [
    {
      id: order.mode === "open-date" ? "open-date" : ticket.id,
      title: ticketTitle,
      quantityLabel: isTable ? `${tables} ${tablesWord(tables)} · до ${guests} ${guestsWord(guests)}` : undefined,
      guests,
      total: ticketsCost(ticket, guests, tables),
    },
    ...(order.kits > 0
      ? [{ id: "program-kit", title: "Расширенная программа", quantityLabel: `${order.kits} ${kitsWord(order.kits)}`, guests: 0, total: order.kits * kitPrice }]
      : []),
  ];
}

export function orderTotal(selections) {
  return selections.reduce((sum, item) => sum + item.total, 0);
}

function QuantityStepper({ count, min = 0, max = Infinity, onChange, label }) {
  return (
    <div className="ticket-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(count - 1)} disabled={count <= min} aria-label={`Меньше: ${label}`}>
        <IconMinus size={16} stroke={2.2} />
      </button>
      <span aria-live="polite">{count}</span>
      <button type="button" onClick={() => onChange(count + 1)} disabled={count >= max} aria-label={`Больше: ${label}`}>
        <IconPlus size={16} stroke={2.2} />
      </button>
    </div>
  );
}

// Блок на странице: три формата с ценами. Каждый открывает шторку покупки
// с уже выбранным форматом — все настройки живут там.
export default function TicketPicker({ tickets, soldOut, onSelect, onOpenDate }) {
  return (
    <section className="ticket-picker">
      <div className="ticket-picker__head"><h2>Билеты</h2></div>
      <p className="ticket-picker__lede">
        Выберите стандартный билет в зал на одного или на компанию, билет в первый ряд за барную стойку или забронируйте весь столик.
      </p>

      <div className="ticket-formats">
        {tickets.map((ticket) => (
          <button
            type="button"
            className={`ticket-format ticket-format--${ticket.id}`}
            onClick={() => onSelect(ticket.id)}
            disabled={soldOut}
            key={ticket.id}
          >
            <span className="ticket-format__name">{FORMAT_TITLES[ticket.id] || ticket.title}</span>
            <span className="ticket-format__price">
              {ticket.price != null
                ? `${formatPrice(ticket.price)} ₽`
                : <>{ticket.companyPricePerGuest != null && <small>от </small>}{formatPrice(ticket.companyPricePerGuest ?? ticket.pricePerGuest)} ₽</>}
            </span>
            <span className="ticket-format__note">{ticket.price != null ? `до ${ticket.maxGuests} гостей` : "за гостя"}</span>
          </button>
        ))}
      </div>

      <button type="button" className="ticket-picker__open-date" onClick={onOpenDate}>
        <IconCalendar size={18} stroke={1.8} />
        <span>Билет на свободную дату</span>
        <IconArrowRight size={16} stroke={1.8} />
      </button>
    </section>
  );
}

// Лесенка цены у стандарта: сразу видно, что с компанией дешевле.
function PriceLadder({ ticket, guests, maxGuests, onGuestsChange }) {
  const companyFrom = ticket.companyFrom ?? 2;
  const company = guests >= companyFrom;
  return (
    <div className="price-ladder" role="group" aria-label="Цена за гостя">
      <button type="button" className={company ? "" : "is-on"} onClick={() => onGuestsChange(1)}>
        <span>1 гость</span><strong>{formatPrice(ticket.pricePerGuest)} ₽</strong>
      </button>
      <button type="button" className={company ? "is-on" : ""} onClick={() => !company && onGuestsChange(companyFrom)} disabled={maxGuests < companyFrom}>
        <span>от {companyFrom} гостей</span><strong>{formatPrice(ticket.companyPricePerGuest)} ₽</strong>
      </button>
    </div>
  );
}

export function TicketSheet({ tasting, order, onChange, onContinue, onClose, onOpenGift, availableSeats }) {
  const openDate = order.mode === "open-date";
  const ticket = openDate
    ? { id: "standard", title: "Стандарт", pricePerGuest: tasting.openDateTicket.price }
    : tasting.tickets.find((item) => item.id === order.format);
  const isTable = ticket.price != null;
  const maxGuests = openDate ? 1 : maxGuestsFor(ticket, availableSeats);
  const selections = orderSelections(order, ticket, tasting.kitPrice);
  const total = orderTotal(selections);
  const setGuests = (guests) => onChange({ ...order, guests: Math.min(Math.max(1, guests), maxGuests) });
  const setFormat = (format) => {
    const next = tasting.tickets.find((item) => item.id === format);
    // У столика гостей не выбирают — не трогаем число, чтобы оно сохранилось при возврате.
    onChange({ ...order, format, guests: next.price != null ? order.guests : Math.min(order.guests, maxGuestsFor(next, availableSeats)) });
  };
  const setTables = (tables) => onChange({ ...order, tables: Math.min(Math.max(1, tables), ticket.maxTables ?? 1) });

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="checkout-layer" role="presentation">
      <button type="button" className="checkout-layer__backdrop" onClick={onClose} aria-label="Закрыть" />
      <section className="checkout-modal ticket-sheet" role="dialog" aria-modal="true" aria-labelledby="ticket-sheet-title">
        <div className="ticket-sheet__body">
          <button type="button" className="checkout-head__close ticket-sheet__close" onClick={onClose} aria-label="Закрыть">
            <IconX size={20} stroke={2} />
          </button>
          <span className="checkout-eyebrow">
            {openDate ? "Дата на выбор" : `${formatWeekdayDate(tasting.date)} · ${formatTastingTime(tasting.date)}`}
          </span>
          <h2 className="checkout-title" id="ticket-sheet-title">{openDate ? "Билет на свободную дату" : "Билеты"}</h2>

          {!openDate && (
            <div className="ticket-segments" role="radiogroup" aria-label="Формат">
              {tasting.tickets.map((item) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={item.id === order.format}
                  className={item.id === order.format ? "is-on" : ""}
                  onClick={() => setFormat(item.id)}
                  key={item.id}
                >
                  {FORMAT_TITLES[item.id] || item.title}
                </button>
              ))}
            </div>
          )}

          {isTable && (
            <div className="ticket-sheet__row">
              <span className="ticket-sheet__label">
                Столики
                <small>{formatPrice(ticket.price)} ₽ · до {ticket.maxGuests} гостей</small>
              </span>
              <QuantityStepper count={order.tables} min={1} max={ticket.maxTables ?? 1} onChange={setTables} label="Столики" />
            </div>
          )}

          {!isTable && <div className="ticket-sheet__row">
            <span className="ticket-sheet__label">
              Гости
              {ticket.price == null && ticket.companyPricePerGuest == null && <small>{formatPrice(ticket.pricePerGuest)} ₽ за гостя</small>}
            </span>
            {openDate
              ? <span className="ticket-sheet__fixed">1</span>
              : <QuantityStepper count={order.guests} min={1} max={maxGuests} onChange={setGuests} label="Гости" />}
          </div>}

          {ticket.companyPricePerGuest != null && (
            <PriceLadder ticket={ticket} guests={order.guests} maxGuests={maxGuests} onGuestsChange={setGuests} />
          )}

          <div className="ticket-sheet__row ticket-sheet__row--extra">
            <span className="ticket-sheet__extra-icon"><IconCandy size={18} stroke={1.7} /></span>
            <span className="ticket-sheet__label">
              Расширенная программа
              <small>+{formatPrice(tasting.kitPrice)} ₽ за набор</small>
            </span>
            <QuantityStepper count={order.kits} onChange={(kits) => onChange({ ...order, kits: Math.max(0, kits) })} label="Расширенная программа" />
          </div>

          {openDate && onOpenGift && (
            <button type="button" className="ticket-sheet__gift" onClick={onOpenGift}>
              <span className="ticket-sheet__gift-icon"><IconGift size={18} stroke={1.7} /></span>
              <span className="ticket-sheet__label">
                Сертификат на несколько посещений
                <small>Себе или в подарок близким</small>
              </span>
              <IconArrowRight size={16} stroke={1.8} />
            </button>
          )}
        </div>

        <footer className="ticket-sheet__foot">
          <span className="ticket-sheet__total">
            <strong className="tabnum">{formatPrice(total)} ₽</strong>
            <small>{isTable ? `${order.tables} ${tablesWord(order.tables)}` : `${order.guests} ${guestsWord(order.guests)}`}{order.kits > 0 ? ` · ${order.kits} ${kitsWord(order.kits)}` : ""}</small>
          </span>
          <button type="button" className="btn btn--primary ticket-sheet__cta" onClick={() => onContinue(selections, total)}>
            <span>Продолжить</span><IconArrowRight size={17} stroke={2} />
          </button>
        </footer>
      </section>
    </div>,
    document.querySelector(".phone") || document.body
  );
}
