import { useMemo, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "./icons.jsx";
import { formatMonthYear } from "../utils/date.js";

// Компактный календарь на месяц для дропдауна в шапке расписания. Отмечает
// дни, где есть дегустация (точка под числом — яркая для предстоящих,
// тусклая для прошедших), клик по такому дню ведёт сразу на страницу
// дегустации. Не привязан к активной вкладке/сортировке списка — показывает
// вообще все дегустации сразу.

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function ScheduleCalendar({ tastings, onSelect }) {
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => startOfDay(now), [now]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const t of tastings || []) {
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = dateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    for (const items of map.values()) items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return map;
  }, [tastings]);

  const initialMonth = useMemo(() => {
    const upcoming = (tastings || [])
      .filter((t) => new Date(t.date).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    return startOfMonth(upcoming ? new Date(upcoming.date) : now);
  }, [tastings, now]);

  const [month, setMonth] = useState(initialMonth);
  const goMonth = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const weeks = useMemo(() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const leadOffset = (first.getDay() + 6) % 7; // неделя с понедельника
    const cells = [];
    for (let i = 0; i < leadOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const monthLabel = formatMonthYear(month.toISOString());

  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" className="cal__nav" onClick={() => goMonth(-1)} aria-label="Предыдущий месяц">
          <IconChevronLeft size={15} stroke={2} />
        </button>
        <span className="cal__month">{monthLabel}</span>
        <button type="button" className="cal__nav" onClick={() => goMonth(1)} aria-label="Следующий месяц">
          <IconChevronRight size={15} stroke={2} />
        </button>
      </div>

      <div className="cal__weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="cal__weekday">{w}</span>
        ))}
      </div>

      <div className="cal__grid">
        {weeks.map((row, ri) =>
          row.map((d, ci) => {
            if (!d) return <span key={`${ri}-${ci}`} className="cal__cell cal__cell--empty" />;
            const key = dateKey(d);
            const dayTastings = byDay.get(key);
            const isToday = key === dateKey(today);
            if (!dayTastings) {
              return (
                <span key={key} className={`cal__cell ${isToday ? "is-today" : ""}`}>
                  {d.getDate()}
                </span>
              );
            }
            const isPastDay = d.getTime() < today.getTime();
            return (
              <button
                key={key}
                type="button"
                className={`cal__cell cal__cell--has-event ${isToday ? "is-today" : ""} ${isPastDay ? "is-past" : ""}`}
                onClick={() => onSelect?.(dayTastings[0])}
              >
                {d.getDate()}
                <span className="cal__dot" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
