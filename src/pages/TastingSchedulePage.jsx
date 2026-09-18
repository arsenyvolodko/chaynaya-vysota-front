import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import PromoCarousel from "../components/PromoCarousel.jsx";
import TastingFormatsBlock from "../components/TastingFormatsBlock.jsx";
import EveningStepsBlock from "../components/EveningStepsBlock.jsx";
import TastingScheduleCard from "../components/TastingScheduleCard.jsx";
import Dropdown from "../components/Dropdown.jsx";
import ScheduleCalendar from "../components/ScheduleCalendar.jsx";
import TastingDetailPreviewPage from "./TastingDetailPreviewPage.jsx";
import AuthPrompt from "../components/AuthPrompt.jsx";
import WaitlistSheet from "../components/WaitlistSheet.jsx";
import { IconCalendar, IconCart, IconCheck, IconChevronUp, IconSort, IconTelegram, IconX } from "../components/icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { getTastingSchedule } from "../api/schedule.js";
import { getCeremonies } from "../api/ceremony.js";
import { formatMonthYear } from "../utils/date.js";
import { initialsOf } from "../utils/initials.js";
import { seatsLeft } from "../utils/tastingCapacity.js";

const TAG_ORDER = { tea: 0, ice_cream: 1 };

// Предложение войти показываем, когда гость долистал до третьей карточки —
// к этому моменту интерес уже виден, а на первом экране просьба выглядела бы
// как шлагбаум. Один показ на сессию: второй раз это уже навязчивость.
// Гостевой вход выдаёт токен, но аккаунта у человека нет — таким предлагаем
// тоже, иначе «просто посмотреть» навсегда отключает регистрацию.
const AUTH_PROMPT_AFTER_CARDS = 3;
const AUTH_PROMPT_SEEN_KEY = "cv.authPrompt.seen";

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

export default function TastingSchedulePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, wasSkipped } = useAuth();

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [sortBy, setSortBy] = useState("date");
  const [waitlisted, setWaitlisted] = useState(() => new Set());

  const [ceremonies, setCeremonies] = useState([]);
  const [ceremoniesLoading, setCeremoniesLoading] = useState(true);

  const scrollRef = useRef(null);
  const sheetRef = useRef(null);
  const sheetBackdropRef = useRef(null);
  const [showToTop, setShowToTop] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTasting, setSelectedTasting] = useState(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [waitlistTasting, setWaitlistTasting] = useState(null);
  const authGateRef = useRef(null);

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

  // Расписание пока целиком собрано из моков, поэтому его ID отсутствуют в
  // боевом API. До появления эндпоинта деталей показываем готовую демо-страницу
  // шторкой поверх списка и в обычном расписании, и в дизайн-превью.
  const openUpcoming = (tasting) => {
    setSelectedTasting(tasting || null);
    setSheetOpen(true);
  };

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

  const openWaitlist = (tasting) => {
    setAuthPromptOpen(false);
    setWaitlistTasting(tasting);
  };

  const joinWaitlist = () => {
    if (!waitlistTasting) return;
    setWaitlisted((prev) => new Set(prev).add(waitlistTasting.id));
    setWaitlistTasting(null);
  };

  const scrollToSchedule = () => {
    document.getElementById("schedule-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openScheduleCalendar = () => {
    scrollToSchedule();
    setCalendarOpen(true);
  };

  const openProfile = () => {
    if (isAuthenticated && !wasSkipped) {
      navigate("/profile");
      return;
    }
    navigate("/auth?return=%2Fprofile&back=%2Fschedule");
  };

  const scrollToChefTeas = () => {
    document.getElementById("chef-teas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const needsAccount = !isAuthenticated || wasSkipped;

  // Один обработчик прокрутки на две задачи: кнопка «наверх» и предложение
  // войти. Актуальные значения читаем из рефа — иначе обработчик пришлось бы
  // переподписывать на каждый рендер.
  const promptStateRef = useRef({ needsAccount: false, opened: false });
  promptStateRef.current.needsAccount = needsAccount && !sheetOpen && !waitlistTasting;

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const update = () => {
      setShowToTop(scroller.scrollTop > 700);

      const state = promptStateRef.current;
      if (state.opened || !state.needsAccount) return;
      // Предложение ждёт, пока список реально пролистан: на первом экране
      // карточки ещё грузят фото и якорь может оказаться в зоне видимости,
      // хотя гость ничего не листал.
      if (scroller.scrollTop < 400) return;
      const anchor = authGateRef.current;
      if (!anchor) return;
      if (anchor.getBoundingClientRect().top > scroller.getBoundingClientRect().bottom) return;

      let seen = false;
      try { seen = sessionStorage.getItem(AUTH_PROMPT_SEEN_KEY) === "1"; } catch (_) {}
      state.opened = true;
      if (seen) return;
      setAuthPromptOpen(true);
      try { sessionStorage.setItem(AUTH_PROMPT_SEEN_KEY, "1"); } catch (_) {}
    };

    scroller.addEventListener("scroll", update, { passive: true });
    update();
    return () => scroller.removeEventListener("scroll", update);
  }, [loading, ceremoniesLoading]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // Свайп вниз закрывает шторку из любой точки её содержимого, даже если
  // внутренняя страница уже прокручена. Свайп вверх остаётся обычным скроллом.
  useEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    const backdrop = sheetBackdropRef.current;
    if (!sheet) return;

    let gesture = null;
    let closeTimer = null;

    const resetPosition = () => {
      sheet.classList.remove("is-dragging");
      sheet.style.removeProperty("--sheet-drag-y");
      backdrop?.style.removeProperty("--sheet-backdrop-opacity");
    };

    const onTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      gesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        startedAt: performance.now(),
        distance: 0,
        dragging: false,
        cancelled: false,
      };
    };

    const onTouchMove = (event) => {
      if (!gesture || gesture.cancelled || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;

      if (!gesture.dragging) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          gesture.cancelled = true;
          return;
        }
        gesture.dragging = true;
        sheet.classList.add("is-dragging");
      }

      event.preventDefault();
      gesture.distance = Math.max(0, dy);
      sheet.style.setProperty("--sheet-drag-y", `${gesture.distance}px`);
      const opacity = Math.max(0, 1 - gesture.distance / (sheet.clientHeight * 0.75));
      backdrop?.style.setProperty("--sheet-backdrop-opacity", String(opacity));
    };

    const finishGesture = () => {
      if (!gesture) return;
      const elapsed = Math.max(1, performance.now() - gesture.startedAt);
      const velocity = gesture.distance / elapsed;
      const shouldClose = gesture.dragging && (
        gesture.distance >= Math.min(120, sheet.clientHeight * 0.18)
        || (gesture.distance >= 44 && velocity > 0.55)
      );
      gesture = null;

      if (shouldClose) {
        sheet.classList.remove("is-dragging");
        sheet.classList.add("is-dismissing");
        backdrop?.classList.add("is-dismissing");
        closeTimer = window.setTimeout(() => setSheetOpen(false), 220);
      } else {
        resetPosition();
      }
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", finishGesture, { passive: true });
    sheet.addEventListener("touchcancel", finishGesture, { passive: true });

    return () => {
      window.clearTimeout(closeTimer);
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", finishGesture);
      sheet.removeEventListener("touchcancel", finishGesture);
    };
  }, [sheetOpen]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderCard = (tasting, index) => (
    <Fragment key={tasting.id}>
      <TastingScheduleCard
        tasting={tasting}
        past={tab === "past"}
        onOpen={openTasting}
        waitlisted={waitlisted.has(tasting.id)}
        onJoinWaitlist={openWaitlist}
      />
      {index === Math.min(AUTH_PROMPT_AFTER_CARDS, list.length) - 1 && (
        <div className="auth-gate-anchor" ref={authGateRef} aria-hidden="true" />
      )}
    </Fragment>
  );

  return (
    <>
    <div className="schedule-scroll" ref={scrollRef}>
      <PageHeader
        right={
          <div className="page-header__icons">
            <button type="button" className="icon-btn" aria-label="Корзина">
              <IconCart size={20} stroke={1.7} />
            </button>
            <button type="button" className="avatar" onClick={openProfile} aria-label="Личный кабинет">
              {initialsOf(user?.name)}
            </button>
          </div>
        }
      />

      <PromoCarousel
        nearestTasting={upcoming[0] || null}
        onOpenNearest={openUpcoming}
        onOpenChefTeas={scrollToChefTeas}
      />

      <TastingFormatsBlock
        onPickCharter={scrollToSchedule}
        onPickChef={scrollToChefTeas}
        onOpenPass={() => navigate("/passes")}
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
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
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
          {monthGroups.map((group, gi) => {
            // Нумерация карточек сквозная по всем месяцам — иначе якорь
            // предложения войти встанет в каждой группе.
            const offset = monthGroups.slice(0, gi).reduce((n, g) => n + g.items.length, 0);
            return (
              <div className="schedule-timeline__group" id={`schedule-month-${group.key}`} key={group.key}>
                <div className="schedule-timeline__marker">
                  <span className="schedule-timeline__dot" />
                  <span className="schedule-timeline__label">{group.label}</span>
                </div>
                <div className="schedule-list">
                  {group.items.map((t, i) => renderCard(t, offset + i))}
                </div>
              </div>
            );
          })}
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
          aria-label="Написать нам в Telegram"
          title="Написать в Telegram"
        >
          <IconTelegram size={18} />
        </a>
      </div>

      <EveningStepsBlock onPickDate={openScheduleCalendar} />

      <div className="section-head" id="chef-teas">
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

    {authPromptOpen && !sheetOpen && !waitlistTasting && (
      <AuthPrompt
        onClose={() => setAuthPromptOpen(false)}
      />
    )}

    {waitlistTasting && (
      <WaitlistSheet
        tasting={waitlistTasting}
        initialName={user?.name || ""}
        initialEmail={user?.email || ""}
        onClose={() => setWaitlistTasting(null)}
        onConfirm={joinWaitlist}
      />
    )}

    {sheetOpen && (
      <>
        <div ref={sheetBackdropRef} className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
        <div ref={sheetRef} className="sheet" role="dialog" aria-modal="true" aria-label="Дегустация">
          <span className="sheet__grip" aria-hidden="true" />
          <button
            type="button"
            className="sheet__close"
            onClick={() => setSheetOpen(false)}
            aria-label="Закрыть"
          >
            <IconX size={18} stroke={2.2} />
          </button>
          <TastingDetailPreviewPage tastingOverride={selectedTasting} />
        </div>
      </>
    )}
    </>
  );
}
