import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import TicketPicker, { guestsWord, ticketTotal } from "../components/TicketPicker.jsx";
import TicketCheckoutFlow from "../components/TicketCheckoutFlow.jsx";
import MapChoiceSheet from "../components/MapChoiceSheet.jsx";
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
  ticket_kind: "dated",
  title: "«72 чайных отражения Сунь Укуна»: дегустация х2 с NAMAchaiCHOCO",
  host: "Виктор Енин",
  date: "2026-10-04T19:00:00",
  location_name: "Чайная высота / Винная глубина",
  location_address: "Тверская, 6 стр. 1",
  yandex_maps_url: "https://yandex.ru/maps/-/CTxlUUI5",
  two_gis_url: "https://2gis.ru/moscow/inside/4504235282757536/firm/70000001031691993",
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
function TastingCoverPhoto({ tasting }) {
  if (tasting.cover_url) {
    return (
      <div className="tasting-cover">
        <img
          className="tasting-cover__img"
          src={tasting.cover_url}
          alt={`Обложка: ${tasting.title}`}
        />
      </div>
    );
  }

  const isIceCream = tasting.cover === "ice_cream" || tasting.tags?.includes("ice_cream");
  return (
    <div className={`tasting-cover tasting-cover--ph ${isIceCream ? "tasting-cover--ice-cream" : "tasting-cover--tea"}`}>
      {isIceCream
        ? <IconIceCream size={40} stroke={1.4} />
        : <IconLeaf size={40} stroke={1.4} />}
      <span className="tasting-cover__label">фото</span>
    </div>
  );
}

export default function TastingDetailPreviewPage({ tastingOverride = null }) {
  // Детали билетов пока демонстрационные, но основные данные и обложку берём
  // с выбранной карточки — при открытии шторки контекст события не теряется.
  const tasting = { ...DEMO_TASTING, ...(tastingOverride || {}) };
  const [ticketId, setTicketId] = useState("hall");
  const [guests, setGuests] = useState(2);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mapChoiceOpen, setMapChoiceOpen] = useState(false);
  const selectedTicket = tasting.tickets.find((ticket) => ticket.id === ticketId) || tasting.tickets[0];
  const total = ticketTotal(selectedTicket.tiers, guests);
  const selections = [{ id: selectedTicket.id, title: selectedTicket.title, guests, total }];

  return (
    <>
    <div className="main-scroll">
      <div className="preview-banner">Превью дизайна — демо-данные, не боевая страница</div>
      <PageHeader />

      <TastingCoverPhoto tasting={tasting} />

      <div className="hero">
        <span className="tasting-kind">Чартерная дегустация</span>
        <h1 className="hero__title hero__title--tasting">{tasting.title}</h1>

        <div className="tasting-meta-card">
          <div className="hero-meta-row hero-meta-row--date">
            <DateBadge date={tasting.date} />
            <div className="hero-meta-row__text">
              <div className="hero-meta-row__main">{formatWeekdayDate(tasting.date)}</div>
              <div className="hero-meta-row__sub">Начало в {formatTastingTime(tasting.date)}</div>
            </div>
          </div>
          <button type="button" className="hero-meta-row hero-meta-row--place" onClick={() => setMapChoiceOpen(true)}>
            <span className="hero-meta-row__icon"><IconMapPin size={16} stroke={1.8} /></span>
            <div className="hero-meta-row__text">
              <div className="hero-meta-row__main">{tasting.location_name}</div>
              <div className="hero-meta-row__sub">{tasting.location_address}</div>
            </div>
            <IconArrowRight className="hero-meta-row__arrow" size={16} stroke={2} />
          </button>
          <div className="hero-meta-row">
            <span className="hero-meta-row__icon"><IconUser size={16} stroke={1.8} /></span>
            <div className="hero-meta-row__text">
              <div className="hero-meta-row__main">{tasting.host}</div>
              <div className="hero-meta-row__sub">Ведущий дегустации</div>
            </div>
          </div>
        </div>

        <p className="hero__lede">{tasting.description}</p>

        <div className="tasting-program-title">В программе</div>
        <div className="hero-features">
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <div className="hero-features__item" key={i}>
              <span className="hero-features__icon"><Icon size={18} stroke={1.6} /></span>
              <span className="hero-features__label">{label}</span>
            </div>
          ))}
        </div>

        {/* TODO: строка [текст от Александры] — вставить перед блоком билетов, как только пришлёте текст. */}

        <TicketPicker
          tickets={tasting.tickets}
          selectedId={selectedTicket.id}
          guests={guests}
          onSelect={setTicketId}
          onChange={setGuests}
          onCheckout={() => setCheckoutOpen(true)}
        />

        <section className="tasting-about">
          <span className="tasting-about__eyebrow">История встречи</span>
          <h2>О дегустации</h2>
          <div className="tasting-about__body">
            {tasting.about.map((paragraph, i) => (
              <p className="tasting-about__text" key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>

      <AppFooter />
      <div className="main-footer-spacer" />
    </div>

    <div className="footer buy-bar">
      <div className="buy-bar__total">
        <span className="buy-bar__sum tabnum">{formatPrice(total)} ₽</span>
        <span className="buy-bar__note">{guests} {guestsWord(guests)}</span>
      </div>
      <button
        type="button"
        className="btn btn--primary buy-bar__btn"
        disabled={total === 0}
        onClick={() => setCheckoutOpen(true)}
      >
        <span>Оплатить билет</span>
        <IconArrowRight size={17} stroke={2} />
      </button>
    </div>

    {checkoutOpen && (
      <TicketCheckoutFlow
        tasting={tasting}
        selections={selections}
        total={total}
        onClose={() => setCheckoutOpen(false)}
      />
    )}
    {mapChoiceOpen && (
      <MapChoiceSheet
        name={tasting.location_name}
        address={tasting.location_address}
        yandexUrl={tasting.yandex_maps_url}
        twoGisUrl={tasting.two_gis_url}
        onClose={() => setMapChoiceOpen(false)}
      />
    )}
    </>
  );
}
