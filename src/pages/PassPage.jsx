import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import PassCheckoutSheet from "../components/PassCheckoutSheet.jsx";
import { IconCalendar, IconChevronLeft, IconTicket, IconUser } from "../components/icons.jsx";
import { formatPrice } from "../utils/price.js";
import { PASS_BASE_VISIT_PRICE, PASS_PLANS } from "../data/passPlans.js";
import { useAuth } from "../auth/AuthContext.jsx";

const EXAMPLES = [
  { count: "4 × 1", title: "Четыре вечера одному", text: "Ходите сами и выбирайте новую дегустацию тогда, когда удобно." },
  { count: "2 × 2", title: "Два вечера вдвоём", text: "На каждое событие списываются два посещения — за вас и вашего гостя." },
  { count: "1 + 3", title: "В любой комбинации", text: "Одно посещение сегодня, три на следующей встрече — баланс расходуется свободно." },
];

export default function PassPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const edgeSwipe = useRef(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [initialPlan, setInitialPlan] = useState(PASS_PLANS[1]);

  const goBack = () => navigate(isAuthenticated ? "/schedule" : "/design/schedule-preview");

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    edgeSwipe.current = touch.clientX <= 32
      ? { x: touch.clientX, y: touch.clientY }
      : null;
  };

  const onTouchEnd = (event) => {
    if (!edgeSwipe.current || !event.changedTouches[0]) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - edgeSwipe.current.x;
    const dy = Math.abs(touch.clientY - edgeSwipe.current.y);
    edgeSwipe.current = null;
    if (dx > 90 && dy < dx * 0.65) goBack();
  };

  const openCheckout = (plan = PASS_PLANS[1]) => {
    setInitialPlan(plan);
    setCheckoutOpen(true);
  };

  return (
    <div className="pass-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <PageHeader
        back={(
          <button type="button" className="pass-back" onClick={goBack} aria-label="Вернуться к расписанию">
            <IconChevronLeft size={19} stroke={1.9} />
          </button>
        )}
      />

      <main className="pass-page__scroll">
        <section className="pass-hero">
          <span className="pass-hero__eyebrow">Абонемент на дегустации</span>
          <h1>Чайные планы без привязки к датам</h1>
          <p>
            Покупаете общий баланс посещений и расходуете его как удобно:
            по одному месту на разные вечера или сразу несколько мест, если идёте компанией.
          </p>
          <div className="pass-hero__facts">
            <span><IconCalendar size={15} /> 12 месяцев</span>
            <span><IconUser size={15} /> можно делиться</span>
            <span><IconTicket size={15} /> от 4 посещений</span>
          </div>
        </section>

        <section className="pass-section">
          <h2>Чем больше встреч, тем выгоднее</h2>
          <div className="pass-plans">
            {PASS_PLANS.map((plan) => {
              const perVisit = Math.round(plan.price / plan.visits);
              const fullPrice = PASS_BASE_VISIT_PRICE * plan.visits;
              return (
                <button type="button" className="pass-plan-card" onClick={() => openCheckout(plan)} key={plan.id}>
                  <span className="pass-plan-card__count"><strong>{plan.visits}</strong> посещений</span>
                  <span className="pass-plan-card__old-price">{formatPrice(fullPrice)} ₽</span>
                  <span className="pass-plan-card__price">{formatPrice(plan.price)} ₽</span>
                  <span className="pass-plan-card__per">{formatPrice(perVisit)} ₽ за место</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pass-section pass-mechanics">
          <span className="pass-section__eyebrow">Как это работает</span>
          <h2>Один баланс — много сценариев</h2>
          <div className="pass-mechanics__steps">
            <div><i>1</i><span><strong>Покупаете баланс</strong>Выбираете 4, 6, 8 или 10 посещений. Он появляется в личном кабинете.</span></div>
            <div><i>2</i><span><strong>Выбираете событие</strong>Записываетесь на любую чартерную дегустацию, где есть свободные места.</span></div>
            <div><i>3</i><span><strong>Указываете гостей</strong>Списываете одно посещение для себя или несколько, если приходите вместе.</span></div>
          </div>
        </section>

        <section className="pass-section">
          <span className="pass-section__eyebrow">Примеры</span>
          <h2>Расходуйте по-своему</h2>
          <div className="pass-examples">
            {EXAMPLES.map((example) => (
              <article key={example.count}>
                <span>{example.count}</span>
                <div><h3>{example.title}</h3><p>{example.text}</p></div>
              </article>
            ))}
          </div>
        </section>

        <AppFooter />
      </main>

      {checkoutOpen && (
        <PassCheckoutSheet plans={PASS_PLANS} initialPlan={initialPlan} onClose={() => setCheckoutOpen(false)} />
      )}
    </div>
  );
}
