import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { IconArrowRight, IconCalendar, IconCheck, IconChevronLeft, IconTicket, IconUser, IconX } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";
import { PASS_BASE_VISIT_PRICE } from "../data/passPlans.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PassPreview({ plan, holder, orderId, success = false }) {
  return (
    <article className={`pass-card ${success ? "pass-card--success" : ""}`}>
      <div className="pass-card__top">
        <span className="pass-card__brand">Чайная высота</span>
        <span className="pass-card__type"><IconTicket size={14} /> Абонемент</span>
      </div>
      <div className="pass-card__count">
        <strong>{plan.visits}</strong>
        <span>посещений<br />чартерных дегустаций</span>
      </div>
      <div className="pass-card__dots" aria-label={`${plan.visits} доступных посещений`}>
        {Array.from({ length: plan.visits }, (_, index) => <i key={index}>{index + 1}</i>)}
      </div>
      <div className="pass-card__bottom">
        <span>{holder || "Имя владельца"}</span>
        <span>{orderId ? `№ ${orderId}` : "12 месяцев"}</span>
      </div>
    </article>
  );
}

export default function PassCheckoutSheet({ plans, initialPlan, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState("plan");
  const [plan, setPlan] = useState(initialPlan || plans[1] || plans[0]);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const paymentTimer = useRef(null);
  const planCarousel = useRef(null);
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

  useEffect(() => {
    if (step !== "plan") return;
    const track = planCarousel.current;
    const slide = track?.querySelector(`[data-plan-id="${plan.id}"]`);
    if (!track || !slide) return;
    const frame = requestAnimationFrame(() => {
      track.scrollLeft = slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const syncPlanFromCarousel = () => {
    const track = planCarousel.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = plans[0];
    let distance = Infinity;
    track.querySelectorAll("[data-plan-id]").forEach((slide) => {
      const nextDistance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = plans.find((item) => item.id === slide.dataset.planId) || nearest;
      }
    });
    setPlan((current) => current.id === nearest.id ? current : nearest);
  };

  const validateContact = () => {
    const next = {};
    if (!name.trim()) next.name = "Укажите имя";
    if (!EMAIL_RE.test(email.trim())) next.email = "Проверьте адрес почты";
    setErrors(next);
    if (!Object.keys(next).length) setStep("payment");
  };

  const pay = () => {
    if (processing) return;
    setProcessing(true);
    paymentTimer.current = window.setTimeout(() => {
      setOrderId(`PASS-${Date.now().toString().slice(-6)}`);
      setProcessing(false);
      setStep("success");
    }, 1100);
  };

  const back = () => {
    if (step === "contact") setStep("plan");
    if (step === "payment") setStep("contact");
  };

  const stepNumber = step === "plan" ? 1 : step === "contact" ? 2 : 3;

  return createPortal(
    <div className="checkout-layer pass-checkout-layer">
      <button type="button" className="checkout-layer__backdrop" onClick={onClose} aria-label="Закрыть оформление" />
      <section className="checkout-modal pass-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="pass-checkout-title">
        {step !== "success" && (
          <header className="checkout-head">
            {step !== "plan" ? (
              <button type="button" className="checkout-head__back" onClick={back} aria-label="Назад">
                <IconChevronLeft size={20} />
              </button>
            ) : <span className="checkout-head__spacer" />}
            <div className="checkout-progress checkout-progress--three" aria-label={`Шаг ${stepNumber} из 3`}>
              {[1, 2, 3].map((number) => <span className={stepNumber >= number ? "is-on" : ""} key={number} />)}
            </div>
            <button type="button" className="checkout-head__close" onClick={onClose} aria-label="Закрыть">
              <IconX size={20} stroke={2} />
            </button>
          </header>
        )}

        <div className="checkout-scroll">
          {step === "plan" && (
            <div className="checkout-step">
              <span className="checkout-eyebrow">Шаг 1 из 3</span>
              <h2 className="checkout-title" id="pass-checkout-title">Ваш абонемент</h2>
              <p className="checkout-lede">Листайте тарифы. Откроется тот, который вы выбрали на странице.</p>

              <div className="pass-plan-carousel" ref={planCarousel} onScroll={syncPlanFromCarousel} role="radiogroup" aria-label="Количество посещений">
                {plans.map((item) => {
                  const fullPrice = PASS_BASE_VISIT_PRICE * item.visits;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={plan.id === item.id}
                      className={`pass-plan-slide ${plan.id === item.id ? "is-on" : ""}`}
                      data-plan-id={item.id}
                      onClick={(event) => {
                        setPlan(item);
                        event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                      }}
                      key={item.id}
                    >
                      {item.popular && <span className="pass-plan-slide__badge">Оптимальный</span>}
                      <span className="pass-plan-slide__eyebrow">Абонемент</span>
                      <span className="pass-plan-slide__visits"><strong>{item.visits}</strong> посещений</span>
                      <span className="pass-plan-slide__tokens" aria-hidden="true">
                        {Array.from({ length: item.visits }, (_, index) => <i key={index}><IconTicket size={11} stroke={1.8} /></i>)}
                      </span>
                      <span className="pass-plan-slide__price-block">
                        <span className="pass-plan-slide__old">обычно {formatPrice(fullPrice)} ₽</span>
                        <span className="pass-plan-slide__price">{formatPrice(item.price)} ₽</span>
                        <span className="pass-plan-slide__per">{formatPrice(Math.round(item.price / item.visits))} ₽ за стандартное место</span>
                      </span>
                      <span className="pass-plan-slide__conditions-title">Условия абонемента</span>
                      <span className="pass-plan-slide__conditions">
                        <span>
                          <i><IconCalendar size={17} stroke={1.7} /></i>
                          <b>12 месяцев</b>
                          <small>на использование</small>
                        </span>
                        <span>
                          <i><IconTicket size={17} stroke={1.7} /></i>
                          <b>Стандарт</b>
                          <small>обычное место</small>
                        </span>
                        <span>
                          <i><IconUser size={17} stroke={1.7} /></i>
                          <b>1–{item.visits} гостей</b>
                          <small>за одну запись</small>
                        </span>
                        <span>
                          <i><IconCheck size={17} stroke={2} /></i>
                          <b>Любая дата</b>
                          <small>при наличии мест</small>
                        </span>
                      </span>
                      <span className="pass-plan-slide__restriction">
                        <IconX size={13} stroke={2} /> Не действует на шеф-чаепития, первый ряд и специальные события
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pass-plan-dots" aria-hidden="true">
                {plans.map((item) => <i className={plan.id === item.id ? "is-on" : ""} key={item.id} />)}
              </div>

              <button type="button" className="btn btn--primary checkout-primary" onClick={() => setStep("contact")}>
                Продолжить · {formatPrice(plan.price)} ₽ <IconArrowRight size={17} stroke={2} />
              </button>
            </div>
          )}

          {step === "contact" && (
            <div className="checkout-step">
              <span className="checkout-eyebrow">Шаг 2 из 3</span>
              <h2 className="checkout-title" id="pass-checkout-title">
                {isAuthenticated ? "Проверьте ваши данные" : "На кого оформить?"}
              </h2>
              <p className="checkout-lede">Абонемент и чек придут на почту. Имя будет указано в личном кабинете владельца.</p>

              <div className="checkout-fields">
                <label className={`checkout-field ${errors.name ? "has-error" : ""}`}>
                  <span>Имя владельца</span>
                  <input value={name} onChange={(event) => { setName(event.target.value); setErrors((prev) => ({ ...prev, name: "" })); }} autoComplete="name" placeholder="Как к вам обращаться" />
                  {errors.name && <small>{errors.name}</small>}
                </label>
                <label className={`checkout-field ${errors.email ? "has-error" : ""}`}>
                  <span>Email для абонемента и чека</span>
                  <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((prev) => ({ ...prev, email: "" })); }} autoComplete="email" inputMode="email" placeholder="you@example.com" />
                  {errors.email && <small>{errors.email}</small>}
                </label>
              </div>

              <PassPreview plan={plan} holder={name.trim()} />
              <button type="button" className="btn btn--primary checkout-primary" onClick={validateContact}>
                К оплате <IconArrowRight size={17} stroke={2} />
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="checkout-step">
              <span className="checkout-eyebrow">Шаг 3 из 3</span>
              <h2 className="checkout-title" id="pass-checkout-title">Оплата абонемента</h2>
              <p className="checkout-lede">Демо-оплата через ЮKassa. Реальные деньги и данные карты не используются.</p>

              <div className="payment-methods" role="radiogroup" aria-label="Способ оплаты">
                <button type="button" role="radio" aria-checked={method === "card"} className={`payment-method ${method === "card" ? "is-on" : ""}`} onClick={() => setMethod("card")}>
                  <span className="payment-method__icon">••••</span>
                  <span>Банковская карта<small>МИР · Visa · Mastercard</small></span>
                  <i><IconCheck size={13} stroke={2.6} /></i>
                </button>
                <button type="button" role="radio" aria-checked={method === "sbp"} className={`payment-method ${method === "sbp" ? "is-on" : ""}`} onClick={() => setMethod("sbp")}>
                  <span className="payment-method__icon payment-method__icon--sbp">СБП</span>
                  <span>Система быстрых платежей<small>Через приложение банка</small></span>
                  <i><IconCheck size={13} stroke={2.6} /></i>
                </button>
              </div>

              <div className="pass-payment-total">
                <span>{plan.visits} посещений<small>Действуют 12 месяцев</small></span>
                <strong>{formatPrice(plan.price)} ₽</strong>
              </div>
              <button type="button" className="btn btn--primary checkout-primary" onClick={pay} disabled={processing}>
                {processing ? <><span className="checkout-spinner" /> Проводим платёж…</> : `Оплатить ${formatPrice(plan.price)} ₽`}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="checkout-success pass-checkout-success">
              <div className="checkout-success__mark"><IconCheck size={28} stroke={2.4} /></div>
              <span className="checkout-success__eyebrow">Оплата прошла</span>
              <h2 className="checkout-title">Абонемент активен</h2>
              <p className="checkout-lede">{plan.visits} посещений уже доступны. Копию отправили на {email.trim()}.</p>
              <PassPreview plan={plan} holder={name.trim()} orderId={orderId} success />
              <div className="pass-success-note">
                <strong>Как использовать</strong>
                Выберите чартерную дегустацию и укажите нужное число гостей — посещения спишутся из баланса после подтверждения записи.
              </div>
              <button type="button" className="btn btn--primary checkout-primary" onClick={onClose}>Готово</button>
            </div>
          )}
        </div>
      </section>
    </div>,
    portalTarget
  );
}
