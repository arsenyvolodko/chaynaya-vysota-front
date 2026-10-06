import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFooter from "../components/AppFooter.jsx";
import TicketPicker, { TicketSheet } from "../components/TicketPicker.jsx";
import TicketCheckoutFlow from "../components/TicketCheckoutFlow.jsx";
import MapChoiceSheet from "../components/MapChoiceSheet.jsx";
import {
  IconArrowRight,
  IconCandy,
  IconIceCream,
  IconLeaf,
  IconMapPin,
  IconSparkles,
} from "../components/icons.jsx";
import { formatDayNumber, formatMonthAbbr, formatTastingTime, formatWeekdayDate } from "../utils/date.js";
import { formatPrice } from "../utils/price.js";
import { seatsLeft } from "../utils/tastingCapacity.js";

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
  tickets: [
    {
      id: "standard",
      title: "Стандарт",
      pricePerGuest: 3200,
      companyPricePerGuest: 2750,
      companyFrom: 2,
    },
    {
      id: "front",
      title: "Первый ряд",
      pricePerGuest: 4200,
    },
    {
      id: "table",
      title: "Отдельный столик",
      price: 12000,
      maxGuests: 4,
      maxTables: 3,
    },
  ],
  // Расширенная программа — доп. набор, добавляется к любому заказу.
  kitPrice: 1500,
  // Формально пробивается как абонемент на 1 посещение, но в интерфейсе это «билет».
  openDateTicket: { visits: 1, price: 3200 },
  description:
    "Годовой цикл из 72 дегустаций — на каждой гости пробуют от 5 до 8 сортов чая, у каждой встречи свой тематический вектор.",
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
  const navigate = useNavigate();
  const [order, setOrder] = useState({ mode: "dated", format: "standard", guests: 1, tables: 1, kits: 0 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [mapChoiceOpen, setMapChoiceOpen] = useState(false);
  const availableSeats = tasting.guests_count == null ? null : seatsLeft(tasting.guests_count);
  const soldOut = availableSeats === 0;
  const minGuestPrice = Math.min(...tasting.tickets.filter((ticket) => ticket.price == null).map((ticket) => ticket.companyPricePerGuest ?? ticket.pricePerGuest));
  const openSheet = (patch) => {
    setOrder((current) => {
      const next = { ...current, ...patch };
      // Билет на свободную дату — всегда один; при возврате к дате гостей оставляем.
      return next.mode === "open-date" ? { ...next, guests: 1 } : next;
    });
    setSheetOpen(true);
  };

  return (
    <>
    <div className="main-scroll">
      <div className="preview-banner">Превью дизайна — демо-данные, не боевая страница</div>

      <TastingCoverPhoto tasting={tasting} />

      <div className="hero">
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
        </div>

        <p className="hero__lede">{tasting.description}</p>
        <p className="tasting-host">Ведущие: {tasting.host}</p>

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
          soldOut={soldOut}
          onSelect={(format) => openSheet({ mode: "dated", format })}
          onOpenDate={() => openSheet({ mode: "open-date" })}
        />

        <section className="tasting-about">
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
        <span className="buy-bar__sum tabnum">от {formatPrice(minGuestPrice)} ₽</span>
        <span className="buy-bar__note">за гостя</span>
      </div>
      <button
        type="button"
        className="btn btn--primary buy-bar__btn"
        disabled={soldOut}
        onClick={() => openSheet({ mode: "dated" })}
      >
        <span>{soldOut ? "Мест нет" : "Купить билет"}</span>
      </button>
    </div>

    {sheetOpen && (
      <TicketSheet
        tasting={tasting}
        order={order}
        availableSeats={availableSeats}
        onChange={setOrder}
        onClose={() => setSheetOpen(false)}
        onOpenGift={() => { setSheetOpen(false); navigate("/gift-certificates"); }}
        onContinue={(selections, total) => { setSheetOpen(false); setCheckout({ selections, total }); }}
      />
    )}
    {checkout && (
      <TicketCheckoutFlow
        tasting={order.mode === "open-date"
          ? { ...tasting, title: "Дегустация «Чайной Высоты»", ticket_kind: "open-date", date: null }
          : tasting}
        selections={checkout.selections}
        total={checkout.total}
        onClose={() => setCheckout(null)}
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
