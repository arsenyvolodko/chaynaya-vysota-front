import { IconArrowRight, IconCalendar, IconUser } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";

// Блок под промо-листалкой: два формата чаепитий рядом — общий стол по
// расписанию и приватная церемония с шефом. Каждая карточка ведёт к своему
// списку ниже по странице. Отдельной плашкой — абонемент.

const FORMATS = [
  {
    key: "charter",
    tone: "charter",
    badge: "Каждую неделю",
    title: "Чартерные дегустации",
    text: "Общий стол на несколько гостей: дата и программа известны заранее. Чай и мороженое подают вслепую — вы оцениваете по шкалам, а в конце вечера стол собирает общий подиум фаворитов.",
    facts: [
      { icon: IconUser, label: "12–23 гостя" },
      { icon: IconCalendar, label: "по расписанию" },
    ],
  },
  {
    key: "chef",
    tone: "chef",
    badge: "По записи",
    title: "Шеф-чаепития",
    text: "Церемониальная комната и чайный шеф, который ведёт встречу от первой заварки до финала. У каждой — свой сценарий: тематические чаи, варка по древнему методу Лу Юя и перерывы на мороженое подходящих вкусов.",
    facts: [
      { icon: IconUser, label: "1–6 гостей" },
      { icon: IconCalendar, label: "резерв за 3–5 дней" },
    ],
  },
];

function FormatCard({ format, priceFrom, onGo }) {
  return (
    <article className={`format-card format-card--${format.tone}`}>
      <span className="format-card__badge">{format.badge}</span>

      <h3 className="format-card__title">{format.title}</h3>
      <p className="format-card__text">{format.text}</p>

      <ul className="format-card__facts">
        {format.facts.map(({ icon: FactIcon, label }) => (
          <li className="format-card__fact" key={label}>
            <FactIcon size={14} stroke={1.7} />
            {label}
          </li>
        ))}
      </ul>

      <div className="format-card__bottom">
        {priceFrom != null && (
          <span className="format-card__price tabnum">от {formatPrice(priceFrom)} ₽</span>
        )}
        <button type="button" className="format-card__btn" onClick={onGo}>
          Перейти
          <IconArrowRight size={16} stroke={2} />
        </button>
      </div>
    </article>
  );
}

export default function TastingFormatsBlock({ onPickCharter, onPickChef, charterPriceFrom, chefPriceFrom }) {
  const priceByKey = { charter: charterPriceFrom, chef: chefPriceFrom };
  const goByKey = { charter: onPickCharter, chef: onPickChef };

  return (
    <>
      <section className="info-block">
        <div className="info-block__intro">
          <span className="section-head__eyebrow">Форматы</span>
          <h2 className="info-block__title">Как устроены дегустации</h2>
          <p className="info-block__lede">
            Чаепитие здесь — не просто заваренный чай, а встреча на два-три
            часа: ведут её старшие мастера и чайный шеф клуба, а гости сами
            выбирают сорта и сценарий вечера.
          </p>
        </div>

        <div className="format-cards">
          {FORMATS.map((f) => (
            <FormatCard
              key={f.key}
              format={f}
              priceFrom={priceByKey[f.key]}
              onGo={goByKey[f.key]}
            />
          ))}
        </div>
      </section>

      <div className="plank">
        <h3 className="plank__title">Абонемент на чаепития</h3>
        <p className="plank__text">
          Билет на свободную дату — без привязки к конкретному дню. Берите на
          одно посещение или сразу на несколько: расходуется постепенно, как
          будет удобно вам.
        </p>
        {/* TODO: заменить на реальную ссылку/маршрут оформления абонемента */}
        <a className="plank__btn" href="https://t.me/" target="_blank" rel="noopener noreferrer">
          Оформить абонемент
          <IconArrowRight size={16} stroke={2} />
        </a>
      </div>
    </>
  );
}
