import { IconArrowRight, IconCalendar, IconTicket, IconUser } from "./icons.jsx";
import { formatPrice } from "../utils/price.js";

// Блок под промо-листалкой: два формата чаепитий рядом — общий стол по
// расписанию и приватная церемония с шефом. Каждая карточка ведёт к своему
// списку ниже по странице. Отдельной плашкой — абонемент.

const FORMATS = [
  {
    key: "charter",
    tone: "charter",
    title: "Чартерные дегустации",
    text: "Общий стол на несколько гостей: дата и программа известны заранее. Вы пробуете чай и мороженое, оцениваете по шкалам, а в конце вечера стол собирает общий подиум фаворитов.",
    facts: [
      { icon: IconUser, label: "12–23 гостя" },
      { icon: IconCalendar, label: "по расписанию" },
    ],
  },
  {
    key: "chef",
    tone: "chef",
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

export default function TastingFormatsBlock({ onPickCharter, onPickChef, onOpenPass, charterPriceFrom, chefPriceFrom }) {
  const priceByKey = { charter: charterPriceFrom, chef: chefPriceFrom };
  const goByKey = { charter: onPickCharter, chef: onPickChef };

  return (
    <>
      <section className="info-block">
        <div className="info-block__intro">
          <h2 className="info-block__title">Как устроены дегустации</h2>
          <p className="info-block__lede">
            В церемониальной комнате «Чайной высоты» чаепитие разворачивается
            на два-три часа: старший мастер или чайный шеф ведёт гостей по
            чаям и способам заваривания. Начните с любимой части коллекции —
            дальше вместе найдёте свой вкус, ритм и маршрут вечера.
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

      <button type="button" className="plank" onClick={onOpenPass}>
        <span className="plank__art" aria-hidden="true">
          <IconTicket size={25} stroke={1.45} />
          <i /><i /><i /><i />
        </span>
        <span className="plank__content">
          <span className="plank__title">Абонемент на дегустации</span>
          <span className="plank__text">
            От 4 до 10 стандартных мест на чартерные дегустации. Ходите сами,
            приглашайте друзей и распределяйте посещения между разными датами.
          </span>
        </span>
        <span className="plank__btn">
          Выбрать абонемент
          <IconArrowRight size={16} stroke={2} />
        </span>
      </button>
    </>
  );
}
