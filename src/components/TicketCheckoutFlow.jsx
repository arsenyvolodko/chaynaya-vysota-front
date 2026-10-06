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
  IconGift,
  IconX,
} from "./icons.jsx";
import { formatPrice } from "../utils/price.js";
import { formatTastingTime, formatWeekdayDate } from "../utils/date.js";
import { getActivatedGifts, giftBalance, spendGiftVisits } from "../utils/gifts.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TICKET_KIND_LABELS = {
  dated: "Билет на дегустацию",
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

function visitWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "посещение";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "посещения";
  return "посещений";
}

function OrderSummary({ selections, total, compact = false }) {
  return (
    <div className={`checkout-summary ${compact ? "checkout-summary--compact" : ""}`}>
      {selections.map((item) => (
        <div className="checkout-summary__row" key={item.id}>
          <span>
            {item.title}
            <small>{item.quantityLabel || `${item.guests} ${guestWord(item.guests)}`}</small>
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

function PurchasedTicket({ tasting, selections, total, cashTotal, certificateVisits, buyer, orderId, onDone }) {
  const guests = selections.reduce((sum, item) => sum + item.guests, 0);
  const ticketKind = tasting.ticket_kind || "dated";

  return (
    <div className="checkout-success">
      <div className="checkout-success__mark"><IconCheck size={28} stroke={2.4} /></div>
      <span className="checkout-success__eyebrow">Заказ оформлен</span>
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
            {ticketKind === "open-date"
              ? <span>Свободная дата<small>Выберете позже</small></span>
              : <span>{formatWeekdayDate(tasting.date)}<small>{formatTastingTime(tasting.date)}</small></span>}
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
            <span>Оплата<strong>{certificateVisits > 0 && cashTotal === 0 ? "Сертификат" : `${formatPrice(cashTotal)} ₽`}</strong></span>
            <span>Заказ<strong>№ {orderId}</strong></span>
          </div>
        </div>
      </article>

      <p className="checkout-success__hint">
        {certificateVisits > 0 && `С сертификата списано ${certificateVisits} ${visitWord(certificateVisits)}. `}
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
  const [paymentError, setPaymentError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [activeGifts, setActiveGifts] = useState(() => getActivatedGifts(user?.phone).filter((gift) => giftBalance(gift) > 0));
  const [selectedGiftIds, setSelectedGiftIds] = useState([]);
  const paymentTimer = useRef(null);
  const portalTarget = document.querySelector(".phone") || document.body;

  useEffect(() => () => window.clearTimeout(paymentTimer.current), []);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name || "");
    setEmail((current) => current || user.email || "");
  }, [user]);

  useEffect(() => {
    const next = getActivatedGifts(user?.phone).filter((gift) => giftBalance(gift) > 0);
    setActiveGifts(next);
    setSelectedGiftIds((current) => current.filter((id) => next.some((gift) => gift.id === id)));
  }, [user?.phone]);

  const totalGuests = useMemo(() => selections.reduce((sum, item) => sum + item.guests, 0), [selections]);
  const certificateEligible = tasting.ticket_kind !== "pass"
    && !selections.some((item) => item.id === "front" || /перв(ый|ого) ряд/i.test(item.title));

  const certificatePayment = useMemo(() => {
    let visitsLeft = totalGuests;
    const allocations = [];
    activeGifts.forEach((gift) => {
      if (!selectedGiftIds.includes(gift.id) || visitsLeft <= 0) return;
      const visits = Math.min(giftBalance(gift), visitsLeft);
      allocations.push({ giftId: gift.id, visits });
      visitsLeft -= visits;
    });

    let visitsToValue = allocations.reduce((sum, item) => sum + item.visits, 0);
    let coveredValue = 0;
    selections.forEach((item) => {
      if (visitsToValue <= 0) return;
      const covered = Math.min(item.guests, visitsToValue);
      coveredValue += covered * (item.total / item.guests);
      visitsToValue -= covered;
    });

    return {
      allocations,
      visits: allocations.reduce((sum, item) => sum + item.visits, 0),
      coveredValue: Math.round(coveredValue),
      cashTotal: Math.max(0, total - Math.round(coveredValue)),
    };
  }, [activeGifts, selectedGiftIds, selections, total, totalGuests]);

  const toggleGift = (giftId) => {
    setPaymentError("");
    setSelectedGiftIds((current) => current.includes(giftId)
      ? current.filter((id) => id !== giftId)
      : [...current, giftId]);
  };

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const validateContact = (preferCertificate = false) => {
    const next = {};
    if (!name.trim()) next.name = "Укажите имя";
    if (!EMAIL_RE.test(email.trim())) next.email = "Проверьте адрес почты";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (preferCertificate && certificateEligible) {
      let visitsLeft = totalGuests;
      const ids = [];
      activeGifts.forEach((gift) => {
        if (visitsLeft <= 0) return;
        ids.push(gift.id);
        visitsLeft -= giftBalance(gift);
      });
      setSelectedGiftIds(ids);
    } else {
      setSelectedGiftIds([]);
      setMethod("card");
    }
    setStep("payment");
  };

  const pay = () => {
    if (processing) return;
    setProcessing(true);
    paymentTimer.current = window.setTimeout(() => {
      const nextOrderId = `CV-${Date.now().toString().slice(-6)}`;
      try {
        if (certificatePayment.allocations.length) {
          spendGiftVisits(certificatePayment.allocations, {
            orderId: nextOrderId,
            tastingId: tasting.id,
            tastingTitle: tasting.title,
          });
        }
        setOrderId(nextOrderId);
        setStep("success");
      } catch (_) {
        const next = getActivatedGifts(user?.phone).filter((gift) => giftBalance(gift) > 0);
        setActiveGifts(next);
        setSelectedGiftIds([]);
        setPaymentError("Баланс сертификата изменился. Выберите его ещё раз.");
      } finally {
        setProcessing(false);
      }
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
                  <span>Имя</span>
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
              {activeGifts.length > 0 && certificateEligible && (
                <button type="button" className="btn checkout-certificate-cta" onClick={() => validateContact(true)}>
                  <IconGift size={17} stroke={1.9} />
                  <span>Использовать сертификат</span>
                  <IconArrowRight size={17} stroke={2} />
                </button>
              )}
              <button type="button" className="btn btn--primary checkout-primary" onClick={() => validateContact(false)}>
                <span>Оплатить</span><IconArrowRight size={17} stroke={2} />
              </button>
              <p className="checkout-legal">Нажимая кнопку, вы соглашаетесь с условиями покупки и возврата билетов.</p>
            </div>
          )}

          {step === "payment" && (
            <div className="checkout-step">
              <span className="checkout-eyebrow">Шаг 2 из 2</span>
              <h2 className="checkout-title" id="checkout-title">Способ оплаты</h2>
              <p className="checkout-lede">Можно списать места с активного сертификата, а остаток оплатить удобным способом.</p>

              {activeGifts.length > 0 && certificateEligible && (
                <section className="certificate-payment">
                  <div className="certificate-payment__head">
                    <span className="certificate-payment__icon"><IconGift size={18} stroke={1.8} /></span>
                    <span><strong>Оплатить сертификатом</strong><small>1 посещение = 1 место в заказе</small></span>
                  </div>
                  <div className="certificate-payment__list" role="group" aria-label="Сертификаты для списания">
                    {activeGifts.map((gift) => {
                      const balance = giftBalance(gift);
                      const allocation = certificatePayment.allocations.find((item) => item.giftId === gift.id);
                      const selected = selectedGiftIds.includes(gift.id);
                      const enoughAlready = certificatePayment.visits >= totalGuests && !selected;
                      return (
                        <button
                          type="button"
                          className={`certificate-payment__item ${selected ? "is-on" : ""}`}
                          onClick={() => toggleGift(gift.id)}
                          disabled={enoughAlready}
                          aria-pressed={selected}
                          key={gift.id}
                        >
                          <i>{selected && <IconCheck size={12} stroke={2.6} />}</i>
                          <span><strong>Сертификат · {balance} {visitWord(balance)}</strong><small>№ {gift.id}</small></span>
                          <b>{allocation ? `−${allocation.visits}` : "Выбрать"}</b>
                        </button>
                      );
                    })}
                  </div>
                  {certificatePayment.visits > 0 && (
                    <div className="certificate-payment__result">
                      <span>С сертификатов<small>{certificatePayment.visits} из {totalGuests} мест</small></span>
                      <strong>−{formatPrice(certificatePayment.coveredValue)} ₽</strong>
                    </div>
                  )}
                  {activeGifts.length > 1 && <p>Можно выбрать несколько сертификатов — сначала спишем верхний, затем следующий.</p>}
                </section>
              )}

              {activeGifts.length > 0 && !certificateEligible && (
                <div className="certificate-payment-note">
                  <IconGift size={18} stroke={1.8} />
                  <span><strong>Сертификат здесь не действует</strong>Первый ряд и специальные события оплачиваются отдельно.</span>
                </div>
              )}

              {certificatePayment.cashTotal > 0 && <div className="payment-methods" role="radiogroup" aria-label="Способ оплаты">
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
              </div>}

              {certificatePayment.cashTotal > 0 && <div className="payment-demo">
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
              </div>}

              <OrderSummary selections={selections} total={total} compact />
              {certificatePayment.visits > 0 && (
                <div className="certificate-payment-total">
                  <span>К оплате {certificatePayment.cashTotal > 0 ? "деньгами" : ""}</span>
                  <strong>{certificatePayment.cashTotal > 0 ? `${formatPrice(certificatePayment.cashTotal)} ₽` : `${certificatePayment.visits} ${visitWord(certificatePayment.visits)}`}</strong>
                </div>
              )}
              {paymentError && <div className="checkout-payment-error">{paymentError}</div>}
              <button type="button" className="btn btn--primary checkout-primary" onClick={pay} disabled={processing}>
                {processing
                  ? <><span className="checkout-spinner" /> Оформляем билет…</>
                  : certificatePayment.cashTotal === 0
                    ? `Списать ${certificatePayment.visits} ${visitWord(certificatePayment.visits)}`
                    : `Оплатить ${formatPrice(certificatePayment.cashTotal)} ₽`}
              </button>
            </div>
          )}

          {step === "success" && (
            <PurchasedTicket
              tasting={tasting}
              selections={selections}
              total={total}
              cashTotal={certificatePayment.cashTotal}
              certificateVisits={certificatePayment.visits}
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
