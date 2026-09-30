import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import {
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
  IconGift,
  IconTicket,
  IconUser,
} from "../components/icons.jsx";
import { PASS_PLANS } from "../data/passPlans.js";
import { formatPrice } from "../utils/price.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { activateGift, getGift, giftBalance, saveGift } from "../utils/gifts.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 280;

const DESIGNS = [
  { id: "forest", name: "Тихий лес", tone: "Тёплый и спокойный" },
  { id: "sunset", name: "Золотой час", tone: "Праздничный и яркий" },
  { id: "ink", name: "Чайная тушь", tone: "Сдержанный и графичный" },
];

const GIFT_PLANS = [{ id: "gift-2", visits: 2, price: 3800 }, ...PASS_PLANS];

const visitWord = (count) => count % 10 === 1 && count % 100 !== 11
  ? "посещение"
  : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)
    ? "посещения"
    : "посещений";

function GiftCard({ design, plan, message = "", compact = false }) {
  return (
    <article className={`gift-card gift-card--${design.id} ${compact ? "gift-card--compact" : ""}`}>
      <div className="gift-card__glow" aria-hidden="true" />
      <div className="gift-card__top">
        <span>Чайная высота</span>
        <span className="gift-card__type"><IconGift size={14} stroke={1.7} /> Подарок</span>
      </div>
      <div className="gift-card__main">
        <span className="gift-card__to">Подарочный сертификат</span>
        <strong>{plan.visits} {visitWord(plan.visits)}</strong>
        <span>чартерных дегустаций</span>
      </div>
      {message.trim() && !compact && <p className="gift-card__message">«{message.trim()}»</p>}
      <div className="gift-card__bottom">
        <span>Действует 12 месяцев</span>
        <span>Любые даты</span>
      </div>
    </article>
  );
}

function Progress({ step }) {
  const labels = ["Дизайн", "Номинал", "Поздравление", "Оплата"];
  return (
    <div className="gift-progress" aria-label={`Шаг ${step} из 4`}>
      <div className="gift-progress__line" aria-hidden="true">
        <i style={{ width: `${((step - 1) / 3) * 100}%` }} />
      </div>
      {labels.map((label, index) => {
        const number = index + 1;
        return (
          <div className={`gift-progress__step ${number <= step ? "is-on" : ""}`} key={label}>
            <span>{number < step ? <IconCheck size={12} stroke={2.6} /> : number}</span>
            <small>{label}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function GiftCertificatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [design, setDesign] = useState(DESIGNS[0]);
  const [plan, setPlan] = useState(GIFT_PLANS[2]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState("");
  const designCarousel = useRef(null);
  const paymentTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(paymentTimer.current), []);

  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email);
  }, [user]);

  const goBack = () => {
    if (success) return navigate("/schedule");
    if (step > 1) setStep((current) => current - 1);
    else navigate("/schedule");
  };

  const pay = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Проверьте адрес почты");
      return;
    }
    if (processing) return;
    setProcessing(true);
    paymentTimer.current = window.setTimeout(() => {
      const nextOrderId = `GIFT-${Date.now().toString().slice(-6)}`;
      setOrderId(nextOrderId);
      try {
        saveGift(nextOrderId, {
          designId: design.id,
          planId: plan.id,
          visits: plan.visits,
          price: plan.price,
          message: message.trim(),
          createdAt: new Date().toISOString(),
        });
      } catch (_) {}
      setProcessing(false);
      setSuccess(true);
    }, 1100);
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/gift/${orderId || "demo"}`;
    try { await navigator.clipboard.writeText(link); } catch (_) {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const chooseDesign = (item, element) => {
    setDesign(item);
    element?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  if (success) {
    return (
      <div className="gift-page gift-page--success">
        <main className="gift-success">
          <div className="gift-success__mark"><IconCheck size={30} stroke={2.5} /></div>
          <span className="gift-kicker">Подарок готов</span>
          <h1>Сертификат уже у вас</h1>
          <p>Чек и уникальную ссылку отправили на <strong>{email.trim()}</strong>.</p>
          <GiftCard design={design} plan={plan} message={message} />
          <div className="gift-success__link">
            <div><span>Ссылка на подарок</span><strong>chaynaya-vysota.ru/gift/{orderId}</strong></div>
            <button type="button" onClick={copyLink}>{copied ? "Скопировано" : "Копировать"}</button>
          </div>
          <p className="gift-success__hint">Отправьте ссылку получателю. При открытии он увидит сертификат и ваше поздравление.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate("/schedule")}>Готово</button>
        </main>
      </div>
    );
  }

  return (
    <div className="gift-page">
      <PageHeader
        back={(
          <button type="button" className="pass-back" onClick={goBack} aria-label="Назад">
            <IconChevronLeft size={19} stroke={1.9} />
          </button>
        )}
      />

      <Progress step={step} />

      <main className="gift-page__scroll">
        {step === 1 && (
          <section className="gift-step">
            <span className="gift-kicker">Шаг 1 из 4</span>
            <h1>Выберите настроение</h1>
            <p className="gift-step__lede">Получатель увидит эту карточку, когда откроет свою подарочную ссылку.</p>
            <div className="gift-design-carousel" ref={designCarousel} role="radiogroup" aria-label="Дизайн сертификата">
              {DESIGNS.map((item) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={design.id === item.id}
                  className={`gift-design-slide ${design.id === item.id ? "is-on" : ""}`}
                  onClick={(event) => chooseDesign(item, event.currentTarget)}
                  key={item.id}
                >
                  <GiftCard design={item} plan={plan} compact />
                  <span className="gift-design-slide__meta"><strong>{item.name}</strong><small>{item.tone}</small></span>
                  <i><IconCheck size={13} stroke={2.5} /></i>
                </button>
              ))}
            </div>
            <div className="gift-design-dots" aria-hidden="true">
              {DESIGNS.map((item) => <i className={design.id === item.id ? "is-on" : ""} key={item.id} />)}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="gift-step">
            <span className="gift-kicker">Шаг 2 из 4</span>
            <h1>Сколько встреч подарить?</h1>
            <p className="gift-step__lede">Это не одна конкретная дата, а баланс посещений. Получатель сам выберет события и решит, как его потратить.</p>
            <div className="gift-spend-map" aria-label="Как можно использовать посещения">
              <div className="gift-spend-map__balance">
                <span>Баланс сертификата</span><strong>{plan.visits} {visitWord(plan.visits)}</strong><small>получатель выбирает сам</small>
              </div>
              <div className="gift-spend-map__branches" aria-hidden="true"><i /><i /></div>
              <div className="gift-spend-map__ways">
                <div><span className="gift-spend-map__icon"><IconUser size={19} /></span><strong>Вместе</strong><b>1 дата × {plan.visits} {plan.visits === 2 ? "гостя" : "гостей"}</b><small>Весь баланс на одну встречу с близкими</small></div>
                <div><span className="gift-spend-map__icon"><IconTicket size={19} /></span><strong>Постепенно</strong><b>{plan.visits} дат × 1 место</b><small>Разные события, списывая по одному</small></div>
              </div>
              {plan.visits > 2 && (
                <p><IconCheck size={14} stroke={2.3} /> Комбинации можно смешивать: сходить вдвоём, а остаток оставить на потом</p>
              )}
            </div>
            <div className="gift-plans" role="radiogroup" aria-label="Номинал сертификата">
              {GIFT_PLANS.map((item) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={plan.id === item.id}
                  className={`gift-plan ${plan.id === item.id ? "is-on" : ""}`}
                  onClick={() => setPlan(item)}
                  key={item.id}
                >
                  <span><strong>{item.visits}</strong> {visitWord(item.visits)}</span>
                  <span className="gift-plan__price">{formatPrice(item.price)} ₽<small>{formatPrice(Math.round(item.price / item.visits))} ₽ за билет</small></span>
                  <i><IconCheck size={13} stroke={2.5} /></i>
                </button>
              ))}
            </div>
            <p className="gift-validity"><IconCheck size={15} stroke={2.2} /> Сертификат действует 12 месяцев с момента покупки</p>
          </section>
        )}

        {step === 3 && (
          <section className="gift-step">
            <span className="gift-kicker">Шаг 3 из 4</span>
            <h1>Добавьте пару тёплых слов</h1>
            <p className="gift-step__lede">Поздравление откроется вместе с подарком. Этот шаг можно пропустить.</p>
            <div className="gift-message-fields">
              <label className="checkout-field gift-message-field">
                <span>Ваше поздравление</span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={MAX_MESSAGE_LENGTH} placeholder="Пусть впереди будет много тёплых встреч и хорошего чая…" />
                <small>{message.length} / {MAX_MESSAGE_LENGTH}</small>
              </label>
            </div>
            <GiftCard design={design} plan={plan} message={message} />
          </section>
        )}

        {step === 4 && (
          <section className="gift-step">
            <span className="gift-kicker">Шаг 4 из 4</span>
            <h1>Куда отправить подарок?</h1>
            <p className="gift-step__lede">На эту почту мы пришлём чек и уникальную ссылку на сертификат. Вы сможете сами поделиться ею с тем, кому дарите подарок.</p>
            <label className={`checkout-field gift-email ${emailError ? "has-error" : ""}`}>
              <span>Ваша почта</span>
              <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(""); }} placeholder="you@example.com" autoComplete="email" inputMode="email" />
              {emailError && <small>{emailError}</small>}
            </label>
            <div className="gift-order-summary">
              <GiftCard design={design} plan={plan} compact />
              <div className="gift-order-summary__row"><span>Сертификат</span><strong>{plan.visits} посещений</strong></div>
              <div className="gift-order-summary__row"><span>Действует</span><strong>12 месяцев</strong></div>
              <div className="gift-order-summary__total"><span>Итого</span><strong>{formatPrice(plan.price)} ₽</strong></div>
            </div>
            <div className="payment-methods" role="radiogroup" aria-label="Способ оплаты">
              <button type="button" role="radio" aria-checked={method === "card"} className={`payment-method ${method === "card" ? "is-on" : ""}`} onClick={() => setMethod("card")}>
                <span className="payment-method__icon">••••</span><span>Банковская карта<small>МИР · Visa · Mastercard</small></span><i><IconCheck size={13} stroke={2.6} /></i>
              </button>
              <button type="button" role="radio" aria-checked={method === "sbp"} className={`payment-method ${method === "sbp" ? "is-on" : ""}`} onClick={() => setMethod("sbp")}>
                <span className="payment-method__icon payment-method__icon--sbp">СБП</span><span>Система быстрых платежей<small>Через приложение банка</small></span><i><IconCheck size={13} stroke={2.6} /></i>
              </button>
            </div>
            <p className="gift-payment-note">Демо-оплата: реальные деньги и данные карты не используются.</p>
          </section>
        )}
      </main>

      <footer className="gift-page__action">
        {step < 4 ? (
          <button type="button" className="btn btn--primary" onClick={() => setStep((current) => current + 1)}>
            {step === 3 && !message.trim() ? "Пропустить" : "Продолжить"}<IconArrowRight size={17} stroke={2} />
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={pay} disabled={processing}>
            {processing ? <><span className="checkout-spinner" /> Проводим платёж…</> : `Оплатить ${formatPrice(plan.price)} ₽`}
          </button>
        )}
      </footer>
    </div>
  );
}

export function GiftRecipientPage() {
  const { giftId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [stored, setStored] = useState(() => getGift(giftId));
  const [activatedNow, setActivatedNow] = useState(false);

  useEffect(() => {
    if (searchParams.get("activate") !== "1" || !user?.phone || stored?.activatedPhone) return;
    const activated = activateGift(giftId, user.phone);
    if (activated) {
      setStored(activated);
      setActivatedNow(true);
      navigate(`/gift/${giftId}`, { replace: true });
    }
  }, [giftId, navigate, searchParams, stored?.activatedPhone, user?.phone]);

  const startActivation = () => {
    if (user?.phone) {
      const activated = activateGift(giftId, user.phone);
      if (activated) { setStored(activated); setActivatedNow(true); }
      return;
    }
    const returnTo = encodeURIComponent(`/gift/${giftId}?activate=1`);
    const backTo = encodeURIComponent(`/gift/${giftId}`);
    navigate(`/auth?return=${returnTo}&back=${backTo}`);
  };

  if (!stored) {
    return (
      <div className="gift-recipient-page">
        <main className="gift-recipient gift-recipient--missing">
          <div className="gift-success__mark"><IconGift size={27} stroke={1.8} /></div>
          <span className="gift-kicker">Подарочный сертификат</span>
          <h1>Подарок пока не найден</h1>
          <p>Проверьте, полностью ли скопирована ссылка. Если всё верно, попросите отправителя переслать её ещё раз.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate("/schedule")}>Перейти к расписанию</button>
        </main>
      </div>
    );
  }

  const design = DESIGNS.find((item) => item.id === stored.designId) || DESIGNS[0];
  const plan = GIFT_PLANS.find((item) => item.id === stored.planId)
    || { id: stored.planId, visits: stored.visits || 2, price: stored.price || 0 };
  const isActivated = !!stored.activatedPhone;
  const remainingVisits = giftBalance(stored);

  return (
    <div className="gift-recipient-page">
      <main className="gift-recipient">
        <header className="gift-recipient__head">
          <span className="gift-recipient__brand">Чайная высота</span>
          <span className="gift-kicker">Вам подарили впечатление</span>
          <h1>{isActivated ? "Сертификат теперь ваш" : "Вас ждут чайные открытия"}</h1>
          <p>{isActivated ? "Мы привязали подарок к вашему аккаунту — он уже доступен в личном кабинете." : `В сертификате ${plan.visits} ${visitWord(plan.visits)} чартерных дегустаций. Дату и компанию выбираете вы.`}</p>
        </header>

        <GiftCard design={design} plan={plan} message={stored.message} />
        {stored.message && (
          <blockquote>
            <span>Поздравление для вас</span>
            <p>«{stored.message}»</p>
          </blockquote>
        )}

        <section className="gift-recipient__possibilities">
          <span className="gift-kicker">Как распорядиться подарком</span>
          <h2>Вы выбираете свой сценарий</h2>
          <div>
            <article><i><IconUser size={20} /></i><strong>Позвать близких</strong><span>Списать несколько посещений на одну дату и прийти вместе</span></article>
            <article><i><IconTicket size={20} /></i><strong>Пробовать новое</strong><span>Ходить на разные дегустации, расходуя баланс постепенно</span></article>
          </div>
          <p><IconCheck size={15} stroke={2.2} /> Любые чартерные дегустации со свободными местами</p>
          <p><IconCheck size={15} stroke={2.2} /> 12 месяцев на использование</p>
        </section>

        {isActivated ? (
          <div className="gift-activation-success">
            <div><IconCheck size={22} stroke={2.4} /></div>
            <strong>{activatedNow ? "Готово! Сертификат активирован" : "Сертификат активирован"}</strong>
            <span>Баланс: {remainingVisits} {visitWord(remainingVisits)}</span>
            <button type="button" className="btn btn--primary" onClick={() => navigate("/profile")}>Открыть личный кабинет</button>
          </div>
        ) : (
          <section className="gift-activate">
            <div className="gift-activate__icon"><IconGift size={24} stroke={1.8} /></div>
            <h2>Заберите подарок себе</h2>
            <p>Привяжем сертификат к аккаунту по номеру телефона. После этого баланс появится в личном кабинете и не потеряется.</p>
            <button type="button" className="btn btn--primary" onClick={startActivation}>Активировать сертификат</button>
            <small>{isAuthenticated ? "Подтвердим привязку к вашему номеру" : "Понадобится войти или зарегистрироваться"}</small>
          </section>
        )}
      </main>
    </div>
  );
}
