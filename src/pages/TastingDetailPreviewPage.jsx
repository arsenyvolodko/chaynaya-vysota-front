import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import {
  IconCandy,
  IconCheck,
  IconChevronRight,
  IconIceCream,
  IconLeaf,
  IconMapPin,
  IconMedal,
  IconSparkles,
  IconUser,
} from "../components/icons.jsx";
import { formatDayNumber, formatMonthAbbr, formatTastingTime, formatWeekdayDate } from "../utils/date.js";
import { formatPrice } from "../utils/price.js";

// Демо-данные — по карточке teatix.com/product/dega_х2_namachocolate
// (цикл дегустаций «72 чайных отражения Сунь Укуна», «Чайная высота»).
// Бэкенд пока не отдаёт ни фото, ни ведущего, ни место, ни цену, ни состав —
// эта страница нужна только чтобы показать дизайн, без реальных данных.
const DEMO_TASTING = {
  title: "«72 чайных отражения Сунь Укуна»: дегустация х2 с NAMAchaiCHOCO",
  host: "Виктор Енин",
  date: "2026-10-04T19:00:00",
  location_name: "Чайная высота / Винная глубина",
  location_address: "Тверская, 6 стр. 1",
  // Цена — за одного гостя. По умолчанию выбрано 2 человека — совпадает с
  // ценой билета «х2» на реальной странице (2750 × 2 = 5500 ₽).
  price_per_person: 2750,
  description:
    "Годовой цикл из 72 дегустаций — на каждой гости пробуют от 5 до 8 сортов чая, у каждой встречи свой тематический вектор. Билет на двоих.",
  includes: [
    "6–7 сортов чая",
    "2 шарика чайного мороженого",
    "Сет шоколадных конфет «Чайной высоты» NAMAchaiCHOCO",
    "Безалкогольные пряные имбирные шоты",
    "Чайные закуски",
  ],
};

const FEATURES = [
  { icon: IconLeaf, label: "6–7 сортов чая" },
  { icon: IconIceCream, label: "Чайное мороженое" },
  { icon: IconCandy, label: "Конфеты NAMAchaiCHOCO" },
  { icon: IconSparkles, label: "Закуски и шоты" },
];

const MAX_GUESTS_PICKER = 6;

const DEMO_PRODUCTS = [
  { id: 1, number: 1, name: "Улун Дун Дин", description: "Тайваньский высокогорный улун средней обжарки.", is_reviewed: true },
  { id: 2, number: 2, name: "Да Хун Пао", description: "Уишаньский утёсный чай, ореховый и минеральный.", is_reviewed: true },
  { id: 3, number: 3, name: "Шу Пуэр 2018", description: "Выдержанный тёмный пуэр, плотный и сладковатый.", is_reviewed: false },
  { id: 4, number: 4, name: "Тегуаньинь осень", description: "Свежий улун с молочно-цветочным характером.", is_reviewed: false, is_nominated: true },
];

// Бейдж-«календарик» у даты — по образцу карточки события на luma.com,
// в нашей цветовой стилистике.
function DateBadge({ date }) {
  return (
    <span className="tasting-datebadge">
      <span className="tasting-datebadge__month">{formatMonthAbbr(date)}</span>
      <span className="tasting-datebadge__day">{formatDayNumber(date)}</span>
    </span>
  );
}

// Фото дегустации — бэкенд пока не отдаёт cover_image, поэтому заглушка,
// как в карточках расписания.
function TastingCoverPhoto() {
  return (
    <div className="tasting-cover tasting-cover--ph tasting-cover--tea">
      <IconLeaf size={40} stroke={1.4} />
      <span className="tasting-cover__label">фото</span>
    </div>
  );
}

export default function TastingDetailPreviewPage() {
  const tasting = DEMO_TASTING;
  const products = DEMO_PRODUCTS;
  const [guests, setGuests] = useState(2);
  const total = tasting.price_per_person * guests;

  return (
    <div className="main-scroll">
      <div className="preview-banner">Превью дизайна — демо-данные, не боевая страница</div>
      <PageHeader />

      <TastingCoverPhoto />

      <div className="hero">
        <h1 className="title-xl hero__title">{tasting.title}</h1>

        <div className="hero-meta-row">
          <span className="hero-meta-row__icon"><IconUser size={14} stroke={1.8} /></span>
          <span>Ведущие: {tasting.host}</span>
        </div>

        <div className="hero-meta-row hero-meta-row--date">
          <DateBadge date={tasting.date} />
          <div className="hero-meta-row__text">
            <div className="hero-meta-row__main">{formatWeekdayDate(tasting.date)}</div>
            <div className="hero-meta-row__sub">{formatTastingTime(tasting.date)}</div>
          </div>
        </div>

        <div className="hero-meta-row">
          <span className="hero-meta-row__icon"><IconMapPin size={14} stroke={1.8} /></span>
          <div className="hero-meta-row__text">
            <div className="hero-meta-row__main">{tasting.location_name}</div>
            <div className="hero-meta-row__sub">{tasting.location_address}</div>
          </div>
        </div>

        <p className="hero__lede">{tasting.description}</p>

        <div className="hero-includes">
          <div className="section__label">В стоимость входит</div>
          <ul className="hero-includes__list">
            {tasting.includes.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <div className="hero-features">
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <div className="hero-features__item" key={i}>
              <span className="hero-features__icon"><Icon size={18} stroke={1.6} /></span>
              <span className="hero-features__label">{label}</span>
            </div>
          ))}
        </div>

        {/* TODO: строка [текст от Александры] — вставить перед блоком билетов, как только пришлёте текст. */}

        <div className="ticket-block">
          <div className="section__label">Билет</div>
          <div className="ticket-row">
            <span className="ticket-row__icon"><IconUser size={15} stroke={1.8} /></span>
            <div className="ticket-row__picker">
              {Array.from({ length: MAX_GUESTS_PICKER }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`ticket-row__dot ${n <= guests ? "is-on" : ""}`}
                  onClick={() => setGuests(n)}
                  aria-label={`${n} чел.`}
                  aria-pressed={n === guests}
                >
                  <IconUser size={12} stroke={2} />
                </button>
              ))}
            </div>
            <span className="ticket-row__price tabnum">{formatPrice(total)} ₽</span>
          </div>
        </div>
      </div>

      <div className="blocks">
        <section>
          <div className="block__list">
            {products.map((p) => (
              <div key={p.id} className="card" style={{ cursor: "default" }}>
                <div className="card__num tabnum">№{p.number}</div>
                <div className="card__body">
                  <div className="card__title-row">
                    <span className="card__title">{p.name}</span>
                    {p.is_reviewed && (
                      <span className="card__check">
                        <IconCheck size={13} stroke={2.5} />
                      </span>
                    )}
                  </div>
                  {p.description && <div className="card__line">{p.description}</div>}
                </div>
                <div className="card__rating-slot">
                  {p.is_nominated ? (
                    <span className="card__finalist">
                      <IconMedal size={16} filled stroke={1.8} />
                    </span>
                  ) : (
                    <span className="card__chev">
                      <IconChevronRight size={16} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AppFooter />
      <div className="main-footer-spacer" />
    </div>
  );
}
