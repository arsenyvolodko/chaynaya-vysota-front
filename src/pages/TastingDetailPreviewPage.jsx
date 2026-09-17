import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import TicketPicker, { guestsWord, ticketTotal } from "../components/TicketPicker.jsx";
import {
  IconArrowRight,
  IconCandy,
  IconIceCream,
  IconLeaf,
  IconMapPin,
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
  // Два вида билета, у каждого своя сетка тарифов: цена за гостя падает с
  // размером компании — как в «Чайной высоте», где чаепитие на двоих стоит
  // дешевле в пересчёте на человека, чем на одного, а на компанию — ещё
  // дешевле. Средний тариф зала совпадает с ценой билета «х2» на реальной
  // странице (2750 × 2 = 5500 ₽); первый ряд дороже.
  tickets: [
    {
      id: "hall",
      title: "Билет в зал",
      tiers: [
        { min: 1, max: 1, pricePerPerson: 3200 },
        { min: 2, max: 3, pricePerPerson: 2750 },
        { min: 4, max: 6, pricePerPerson: 2500 },
      ],
    },
    {
      id: "front",
      title: "Билет в первый ряд",
      tone: "front",
      tiers: [
        { min: 1, max: 1, pricePerPerson: 4200 },
        { min: 2, max: 3, pricePerPerson: 3700 },
        { min: 4, max: 6, pricePerPerson: 3400 },
      ],
    },
  ],
  description:
    "Годовой цикл из 72 дегустаций — на каждой гости пробуют от 5 до 8 сортов чая, у каждой встречи свой тематический вектор. Билет на двоих.",
  // Текст со страницы дегустации на teatix.com (product/dega_х2_namachocolate).
  about: [
    "72 — годовой план из семидесяти двух дегустаций, на каждой из которых гости попробуют от 5 до 8 сортов чая.",
    "Царь обезьян Сунь Укун — очень близкий нам персонаж китайского эпоса, нарушитель спокойствия, герой, хитрец и доблестный воин. Его называют мастером 72 превращений.",
    "Каждая встреча раскроет высокую чайную традицию с нового ракурса, а тот, кто пройдёт весь курс чайных отражений вместе с «Чайной высотой» и Укуном, попробует за год не меньше 365 чаёв.",
  ],
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
  const [guestsByTicket, setGuestsByTicket] = useState({ hall: 2, front: 0 });
  const setTicketGuests = (id, n) => setGuestsByTicket((prev) => ({ ...prev, [id]: n }));
  const guests = tasting.tickets.reduce((sum, t) => sum + guestsByTicket[t.id], 0);
  const total = tasting.tickets.reduce(
    (sum, t) => sum + ticketTotal(t.tiers, guestsByTicket[t.id]),
    0
  );

  return (
    <>
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

        {tasting.tickets.map((ticket) => (
          <TicketPicker
            key={ticket.id}
            title={ticket.title}
            tone={ticket.tone}
            tiers={ticket.tiers}
            guests={guestsByTicket[ticket.id]}
            onChange={(n) => setTicketGuests(ticket.id, n)}
          />
        ))}

        <div className="tasting-about">
          <div className="section__label">Описание</div>
          {tasting.about.map((paragraph, i) => (
            <p className="tasting-about__text" key={i}>{paragraph}</p>
          ))}
        </div>
      </div>

      <AppFooter />
      <div className="main-footer-spacer" />
    </div>

    <div className="footer buy-bar">
      <div className="buy-bar__total">
        <span className="buy-bar__sum tabnum">{formatPrice(total)} ₽</span>
        <span className="buy-bar__note">{guests} {guestsWord(guests)}</span>
      </div>
      {/* TODO: заменить на реальное оформление билета, когда появится оплата */}
      <button type="button" className="btn btn--primary buy-bar__btn" disabled={total === 0}>
        <span>Купить билет</span>
        <IconArrowRight size={17} stroke={2} />
      </button>
    </div>
    </>
  );
}
