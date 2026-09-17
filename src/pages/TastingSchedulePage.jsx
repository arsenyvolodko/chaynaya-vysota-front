import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import PromoCarousel from "../components/PromoCarousel.jsx";
import TastingFormatsBlock from "../components/TastingFormatsBlock.jsx";
import EveningStepsBlock from "../components/EveningStepsBlock.jsx";
import TastingScheduleCard from "../components/TastingScheduleCard.jsx";
import Dropdown from "../components/Dropdown.jsx";
import ScheduleCalendar from "../components/ScheduleCalendar.jsx";
import { IconCalendar, IconCart, IconCheck, IconChevronUp, IconSearch, IconSort, IconTelegram } from "../components/icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { getTastingSchedule } from "../api/schedule.js";
import { getCeremonies } from "../api/ceremony.js";
import { formatMonthYear } from "../utils/date.js";
import { initialsOf } from "../utils/initials.js";
import { seatsLeft } from "../utils/tastingCapacity.js";

const TAG_ORDER = { tea: 0, ice_cream: 1 };

const SORT_OPTIONS = [
  { key: "date", label: "По дате" },
  { key: "type", label: "По типу" },
  { key: "price", label: "По стоимости" },
  { key: "availability", label: "По доступности" },
];

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function groupByMonth(items) {
  const groups = [];
  const byKey = new Map();
  for (const item of items) {
    const key = monthKey(item.date);
    if (!byKey.has(key)) {
      const group = { key, label: formatMonthYear(item.date), items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).items.push(item);
  }
  return groups;
}

// Секции, название которых подхватывает шапка при прокрутке.
const SPY_SECTIONS = [
  { id: "schedule-list", label: "Чартерные дегустации" },
  { id: "chef-teas", label: "Шеф-чаепития" },
];

// «от N ₽» на карточке формата — по самой доступной встрече этого формата.
function minPriceFrom(items) {
  const prices = (items || []).map((t) => t.price_from).filter((p) => Number.isFinite(p));
  return prices.length ? Math.min(...prices) : null;
}

function sortList(list, sortBy) {
  const sorted = [...list];
  if (sortBy === "type") {
    sorted.sort((a, b) => {
      const ra = Math.min(...(a.tags || []).map((t) => TAG_ORDER[t] ?? 9));
      const rb = Math.min(...(b.tags || []).map((t) => TAG_ORDER[t] ?? 9));
      return ra - rb || new Date(a.date) - new Date(b.date);
    });
  } else if (sortBy === "price") {
    sorted.sort((a, b) => a.price_from - b.price_from || new Date(a.date) - new Date(b.date));
  } else if (sortBy === "availability") {
    sorted.sort((a, b) => seatsLeft(b.guests_count) - seatsLeft(a.guests_count) || new Date(a.date) - new Date(b.date));
  }
  return sorted;
}

export default function TastingSchedulePage({ preview }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [sortBy, setSortBy] = useState("date");
  const [waitlisted, setWaitlisted] = useState(() => new Set());

  const [ceremonies, setCeremonies] = useState([]);
  const [ceremoniesLoading, setCeremoniesLoading] = useState(true);

  const scrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showToTop, setShowToTop] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTastingSchedule()
      .then((list) => !cancelled && setSchedule(list || []))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCeremonies()
      .then((list) => !cancelled && setCeremonies(list || []))
      .finally(() => !cancelled && setCeremoniesLoading(false));
    return () => { cancelled = true; };
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up = [];
    const done = [];
    for (const t of schedule) {
      const time = new Date(t.date).getTime();
      if (Number.isNaN(time)) continue;
      (time >= now ? up : done).push(t);
    }
    up.sort((a, b) => new Date(a.date) - new Date(b.date));
    done.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { upcoming: up, past: done };
  }, [schedule]);

  const dateOrderedList = tab === "upcoming" ? upcoming : past;
  const list = useMemo(() => sortList(dateOrderedList, sortBy), [dateOrderedList, sortBy]);
  const isTimeline = sortBy === "date";
  const monthGroups = useMemo(
    () => (isTimeline ? groupByMonth(list) : []),
    [list, isTimeline]
  );

  // В превью-режиме бэкенда нет: расписание собрано из моков, поэтому
  // предстоящая дегустация открывается демо-страницей дегустации — так
  // путь «карточка → страница дегустации → билет» проходится целиком.
  const openUpcoming = (tasting) =>
    navigate(preview ? `/design/tasting-preview` : `/tasting/${tasting.id}`);

  const openTasting = (tasting) => {
    if (tab === "past") navigate(`/tasting/${tasting.id}/result`);
    else openUpcoming(tasting);
  };

  // Календарь в шапке не привязан к активной вкладке — сам решает по дате
  // конкретной дегустации, вести на дегустацию или на её отчёт.
  const openFromCalendar = (tasting) => {
    const isPast = new Date(tasting.date).getTime() < Date.now();
    if (isPast) navigate(`/tasting/${tasting.id}/result`);
    else openUpcoming(tasting);
  };

  const joinWaitlist = (id) => {
    setWaitlisted((prev) => new Set(prev).add(id));
  };

  const scrollToSchedule = () => {
    document.getElementById("schedule-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToChefTeas = () => {
    document.getElementById("chef-teas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Пока секция уехала под шапку, её название висит в шапке — иначе в длинном
  // списке теряется, к какому формату относятся карточки. Заодно считаем,
  // пора ли показывать кнопку возврата наверх.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const update = () => {
      const header = scroller.querySelector(".page-header");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      // Полоса с названием секции висит fixed сразу под шапкой, а высота
      // шапки зависит от вёрстки — отдаём её в CSS.
      scroller.style.setProperty("--header-h", `${Math.round(headerBottom)}px`);
      let current = null;
      for (const section of SPY_SECTIONS) {
        const node = document.getElementById(section.id);
        if (node && node.getBoundingClientRect().top <= headerBottom + 8) current = section.label;
      }
      setActiveSection(current);
      setShowToTop(scroller.scrollTop > 700);
    };

    scroller.addEventListener("scroll", update, { passive: true });
    update();
    return () => scroller.removeEventListener("scroll", update);
  }, [loading, ceremoniesLoading]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderCard = (tasting) => (
    <TastingScheduleCard
      key={tasting.id}
      tasting={tasting}
      past={tab === "past"}
      onOpen={openTasting}
      waitlisted={waitlisted.has(tasting.id)}
      onJoinWaitlist={joinWaitlist}
    />
  );

  return (
    <div className="schedule-scroll" ref={scrollRef}>
      <PageHeader
        right={
          <div className="page-header__icons">
            <button type="button" className="icon-btn" aria-label="Корзина">
              <IconCart size={20} stroke={1.7} />
            </button>
            <button type="button" className="avatar" onClick={() => navigate("/profile")}>
              {initialsOf(user?.name)}
            </button>
          </div>
        }
      />

      {/* Отдельная полоса под шапкой: пока секция прокручивается, её название
          остаётся на виду, но не теснит лого и иконки в самой шапке. */}
      <div className={`section-bar ${activeSection ? "is-on" : ""}`} aria-hidden={!activeSection}>
        <span className="section-bar__title">{activeSection}</span>
      </div>

      <PromoCarousel
        nearestTasting={upcoming[0] || null}
        onOpenNearest={openUpcoming}
        onOpenChefTeas={scrollToChefTeas}
      />

      <TastingFormatsBlock
        onPickCharter={scrollToSchedule}
        onPickChef={scrollToChefTeas}
        charterPriceFrom={minPriceFrom(upcoming)}
        chefPriceFrom={minPriceFrom(ceremonies)}
      />

      <div className="section-head section-head--row" id="schedule-list">
        <div>
          <span className="section-head__eyebrow">Расписание</span>
          <h2 className="section-head__title">Чартерные дегустации</h2>
        </div>
        <div className="schedule-section-head__actions">
          <Dropdown
            trigger={({ open, toggle }) => (
              <button type="button" className={`icon-btn ${open ? "is-on" : ""}`} onClick={toggle} aria-label="Календарь">
                <IconCalendar size={18} stroke={1.8} />
              </button>
            )}
          >
            {({ close }) => (
              <ScheduleCalendar
                tastings={schedule}
                onSelect={(t) => { close(); openFromCalendar(t); }}
              />
            )}
          </Dropdown>
          <Dropdown
            trigger={({ open, toggle }) => (
              <button type="button" className={`icon-btn ${open ? "is-on" : ""}`} onClick={toggle} aria-label="Сортировка">
                <IconSort size={18} stroke={1.8} />
              </button>
            )}
          >
            {({ close }) => (
              <div className="dropdown__list">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className="dropdown__item"
                    onClick={() => { setSortBy(opt.key); close(); }}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.key && <IconCheck size={14} stroke={2.4} />}
                  </button>
                ))}
              </div>
            )}
          </Dropdown>
          <button type="button" className="icon-btn" aria-label="Поиск">
            <IconSearch size={18} stroke={1.8} />
          </button>
        </div>
      </div>

      <div className="schedule-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upcoming"}
          className={`schedule-tabs__tab ${tab === "upcoming" ? "is-on" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Предстоящие
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "past"}
          className={`schedule-tabs__tab ${tab === "past" ? "is-on" : ""}`}
          onClick={() => setTab("past")}
        >
          Прошедшие
        </button>
      </div>

      {loading ? (
        <div className="fullscreen-center" style={{ position: "static", minHeight: 160 }}>
          Загружаем расписание…
        </div>
      ) : error ? (
        <div className="error-banner">Не удалось загрузить расписание. Попробуйте позже.</div>
      ) : list.length === 0 ? (
        <div className="schedule-empty">
          {tab === "upcoming"
            ? "Пока нет запланированных дегустаций — загляните позже."
            : "Прошедших дегустаций ещё не было."}
        </div>
      ) : isTimeline ? (
        <div className="schedule-timeline">
          {monthGroups.map((group) => (
            <div className="schedule-timeline__group" id={`schedule-month-${group.key}`} key={group.key}>
              <div className="schedule-timeline__marker">
                <span className="schedule-timeline__dot" />
                <span className="schedule-timeline__label">{group.label}</span>
              </div>
              <div className="schedule-list">{group.items.map(renderCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="schedule-list schedule-list--flat">{list.map(renderCard)}</div>
      )}

      <div className="inline-cta">
        <div className="inline-cta__body">
          <span className="inline-cta__title">Не нашли подходящую дату?</span>
          <span className="inline-cta__text">
            Подскажем ближайшие свободные места или соберём чаепитие под вашу компанию.
          </span>
        </div>
        {/* TODO: заменить на реальную ссылку на Telegram */}
        <a
          className="btn-outline inline-cta__btn"
          href="https://t.me/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconTelegram size={16} />
          <span>Связаться с нами</span>
        </a>
      </div>

      <EveningStepsBlock onPickDate={scrollToSchedule} />

      <div className="section-head" id="chef-teas">
        <span className="section-head__eyebrow">Приватно</span>
        <h2 className="section-head__title">Шеф-чаепития</h2>
        <p className="section-head__lede">
          Церемония с чайным шефом в отдельной комнате «Чайной высоты» — для
          двоих или небольшой компании, по договорённости о дате.
        </p>
      </div>

      {ceremoniesLoading ? (
        <div className="fullscreen-center" style={{ position: "static", minHeight: 120 }}>
          Загружаем…
        </div>
      ) : (
        <div className="schedule-list schedule-list--flat">
          {ceremonies.map((c) => (
            <TastingScheduleCard key={c.id} tasting={c} onOpen={openUpcoming} />
          ))}
        </div>
      )}

      <div className="schedule-cta-block">
        <h2 className="schedule-cta-block__title">Индивидуальное мероприятие</h2>
        <p className="schedule-cta-block__text">
          Организуем дегустацию или чаепитие под ваш запрос — для компании,
          дня рождения или корпоратива. Подберём формат, чай и программу.
        </p>
        {/* TODO: заменить на реальную ссылку на Telegram */}
        <a
          className="btn btn--primary schedule-cta-block__btn"
          href="https://t.me/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconTelegram size={17} />
          <span>Написать в Telegram</span>
        </a>
      </div>

      <AppFooter />

      <button
        type="button"
        className={`to-top ${showToTop ? "is-on" : ""}`}
        onClick={scrollToTop}
        aria-label="Наверх"
        tabIndex={showToTop ? 0 : -1}
      >
        <IconChevronUp size={20} stroke={2} />
      </button>
    </div>
  );
}
