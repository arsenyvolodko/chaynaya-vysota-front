import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconMapPin,
  IconTicket,
  IconX,
} from "./icons.jsx";
import { formatPrice } from "../utils/price.js";
import { formatTastingTime, formatWeekdayDate } from "../utils/date.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TICKET_KIND_LABELS = {
  dated: "Билет на дату",
  "open-date": "Открытая дата",
  pass: "Абонемент",
};

function guestWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "гость";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "гостя";
  return "гостей";
}

function OrderSummary({ selections, total, compact = false }) {
  return (
    <div className={`checkout-summary ${compact ? "checkout-summary--compact" : ""}`}>
      {selections.map((item) => (
        <div className="checkout-summary__row" key={item.id}>
          <span>
            {item.title}
            <small>{item.guests} {guestWord(item.guests)}</small>
          </span>
          <strong>{formatPrice(item.total)} ₽</strong>
        </div>
      ))}
      <div className="checkout-summary__total">
        <span>Итого</span>
        <strong>{formatPrice(total)} ₽</strong>
      </div>
    </div>
  );
}

function TicketCode() {
  const cells = useMemo(
    () => Array.from({ length: 81 }, (_, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;
      const finder = (
        (row < 3 && col < 3)
        || (row < 3 && col > 5)
        || (row > 5 && col < 3)
      );
      const data = ((row * 7 + col * 5 + row * col) % 4) < 2;
      return finder || data;
    }),
    []
  );

  return (
    <div className="purchased-ticket__code" aria-label="QR-код билета">
      {cells.map((filled, index) => (
        <span className={filled ? "is-filled" : ""} key={index} />
      ))}
    </div>
  );
}

function PurchasedTicket({ tasting, selections, total, buyer, orderId, onDone }) {
  const guests = selections.reduce((sum, item) => sum + item.guests, 0);
  const ticketKind = tasting.ticket_kind || "dated";

  return (
    <div className="checkout-success">
      <div className="checkout-success__mark"><IconCheck size={28} stroke={2.4} /></div>
      <span className="checkout-success__eyebrow">Оплата прошла</span>
      <h2 className="checkout-title">Билет уже ваш</h2>
      <p className="checkout-lede">Отправили копию на {buyer.email}</p>

      <article className="purchased-ticket">
        <div className="purchased-ticket__head">
          <span className="purchased-ticket__kind">
            <IconTicket size={15} /> {TICKET_KIND_LABELS[ticketKind] || "Билет"}
          </span>
          <span className="purchased-ticket__status"><i /> Оплачен</span>
        </div>

        <h3 className="purchased-ticket__title">{tasting.title}</h3>

        <div className="purchased-ticket__meta">
          <div>
            <IconCalendar size={17} />
            <span>{formatWeekdayDate(tasting.date)}<small>{formatTastingTime(tasting.date)}</small></span>
          </div>
          <div>
            <IconMapPin size={17} />
            <span>{tasting.location_name}<small>{tasting.location_address}</small></span>
          </div>
        </div>

        <div className="purchased-ticket__tear" aria-hidden="true"><span /></div>

        <div className="purchased-ticket__bottom">
          <TicketCode />
          <div className="purchased-ticket__facts">
            <span>Владелец<strong>{buyer.name}</strong></span>
            <span>Гостей<strong>{guests}</strong></span>
            <span>Сумма<strong>{formatPrice(total)} ₽</strong></span>
            <span>Заказ<strong>№ {orderId}</strong></span>
          </div>
        </div>
      </article>

      <p className="checkout-success__hint">
        Покажите QR-код администратору. Билет также появится в личном кабинете,
        когда подключим сохранение заказов на бэкенде.
      </p>
      <button type="button" className="btn btn--primary checkout-primary" onClick={onDone}>
        Готово
      </button>
    </div>
  );
}

export default function TicketCheckoutFlow({ tasting, selections, total, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState("contact");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const paymentTimer = useRef(null);
  const portalTarget = document.querySelector(".phone") || document.body;

  useEffect(() => () => window.clearTimeout(paymentTimer.current), []);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name || "");
    setEmail((current) => current || user.email || "");
  }, [user]);

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const validateContact = () => {
    const next = {};
    if (!name.trim()) next.name = "Укажите имя";
    if (!EMAIL_RE.test(email.trim())) next.email = "Проверьте адрес почты";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep("payment");
  };

  const pay = () => {
    if (processing) return;
    setProcessing(true);
    paymentTimer.current = window.setTimeout(() => {
      setOrderId(`CV-${Date.now().toString().slice(-6)}`);
      setProcessing(false);
      setStep("success");
    }, 1100);
  };

  const buyer = { name: name.trim(), email: email.trim() };

  return createPortal(
    <div className="checkout-layer" role="presentation">
      <button type="button" className="checkout-layer__backdrop" onClick={onClose} aria-label="Закрыть оформление" />
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        {step !== "success" && (
          <header className="checkout-head">
            {step === "payment" ? (
              <button type="button" className="checkout-head__back" onClick={() => setStep("contact")} aria-label="Назад">
                <IconChevronLeft size={20} />
              </button>
            ) : <span className="checkout-head__spacer" />}
            <div className="checkout-progress" aria-label={`Шаг ${step === "contact" ? 1 : 2} из 2`}>
              <span className="is-on" />
              <span className={step === "payment" ? "is-on" : ""} />
            </div>
            <button type="button" className="checkout-head__close" onClick={onClose} aria-label="Закрыть">
              <IconX size={20} stroke={2} />
            </button>
          </header>
        )}

        <div className="checkout-scroll">
          {step === "contact" && (
            <div className="checkout-step">
              <span className="checkout-eyebrow">Шаг 1 из 2</span>
              <h2 className="checkout-title" id="checkout-title">
                {isAuthenticated ? "Проверьте ваши данные" : "Куда отправить билет?"}
              </h2>
              <p className="checkout-lede">
                {isAuthenticated
                  ? "Мы взяли данные из профиля. Их можно изменить только для этого заказа."
                  : "Имя понадобится для билета, а на почту придут чек и QR-код."}
              </p>

              <div className="checkout-fields">
                <label className={`checkout-field ${errors.name ? "has-error" : ""}`}>
                  <span>Имя гостя</span>
                  <input
                    value={name}
                    onChange={(event) => { setName(event.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                    autoComplete="name"
                    placeholder="Как к вам обращаться"
                  />
                  {errors.name && <small>{errors.name}</small>}
                </label>
                <label className={`checkout-field ${errors.email ? "has-error" : ""}`}>
                  <span>Email для билета и чека</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                  />
                  {errors.email && <small>{errors.email}</small>}
                </label>
              </div>

              <OrderSummary selections={selections} total={total} />
              <button type="button" className="btn btn--primary checkout-primary" onClick={validateContact}>
                <span>К оплате</span><IconArrowRight size={17} stroke={2} />
              </button>
              <p className="checkout-legal">Нажимая кнопку, вы соглашаетесь с условиями покупки и возврата билетов.</p>
            </div>
          )}

          {step === "payment" && (
            <div className="checkout-step">
              <span className="checkout-eyebrow">Шаг 2 из 2</span>
              <h2 className="checkout-title" id="checkout-title">Способ оплаты</h2>
              <p className="checkout-lede">Выберите удобный вариант. Сейчас это безопасная демонстрация — реальные деньги не списываются.</p>

              <div className="payment-methods" role="radiogroup" aria-label="Способ оплаты">
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === "card"}
                  className={`payment-method ${method === "card" ? "is-on" : ""}`}
                  onClick={() => setMethod("card")}
                >
                  <span className="payment-method__icon">••••</span>
                  <span>Банковская карта<small>МИР · Visa · Mastercard</small></span>
                  <i><IconCheck size={13} stroke={2.6} /></i>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === "sbp"}
                  className={`payment-method ${method === "sbp" ? "is-on" : ""}`}
                  onClick={() => setMethod("sbp")}
                >
                  <span className="payment-method__icon payment-method__icon--sbp">СБП</span>
                  <span>Система быстрых платежей<small>Через приложение банка</small></span>
                  <i><IconCheck size={13} stroke={2.6} /></i>
                </button>
              </div>

              <div className="payment-demo">
                <div className="payment-demo__brand"><span>Ю</span>касса <small>демо</small></div>
                {method === "card" ? (
                  <div className="payment-demo__card">
                    <span>Тестовая карта</span>
                    <strong>2200&nbsp;••••&nbsp;••••&nbsp;2026</strong>
                    <small>Данные карты вводить не нужно</small>
                  </div>
                ) : (
                  <div className="payment-demo__sbp">
                    <TicketCode />
                    <span>В реальной оплате здесь появится QR-код банка</span>
                  </div>
                )}
              </div>

              <OrderSummary selections={selections} total={total} compact />
              <button type="button" className="btn btn--primary checkout-primary" onClick={pay} disabled={processing}>
                {processing ? <><span className="checkout-spinner" /> Проводим платёж…</> : `Оплатить ${formatPrice(total)} ₽`}
              </button>
            </div>
          )}

          {step === "success" && (
            <PurchasedTicket
              tasting={tasting}
              selections={selections}
              total={total}
              buyer={buyer}
              orderId={orderId}
              onDone={onClose}
            />
          )}
        </div>
      </section>
    </div>,
    portalTarget
  );
}
