import { useEffect, useRef } from "react";

/**
 * MarqueeRow — горизонтальная «бесконечная» лента тегов, полностью на JS.
 *
 * - Контент дублирован дважды → wrap-around невидим: при x <= -half делаем
 *   x += half (визуально одно и то же, потому что вторая копия идентична первой),
 *   а при x > 0 — x -= half. Поэтому листать можно бесконечно в обе стороны.
 * - На каждом кадре requestAnimationFrame: `vel = vel*0.95 + speed*0.05` →
 *   пользовательская скорость плавно затухает к базовой через трение, без
 *   моментального обрыва инерции.
 * - При касании пальцем (pointerdown) пишем смещение в `x` напрямую и
 *   фиксируем мгновенную скорость; когда отпускают (pointerup), rAF подхватывает
 *   `vel` и продолжает по инерции, пока не вернётся к базовой.
 * - Тап-vs-драг отличаем по сумме перемещения за весь жест (`totalMove < 5px`
 *   → тап → onToggle).
 */
function MarqueeRow({ tags, selectedIds, onToggle, readOnly, speed = 1.2 }) {
  const trackRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({
    x: 0,
    vel: speed,
    pressing: false,
    pointerId: null,
    startX: 0,
    lastX: 0,
    lastT: 0,
    totalMove: 0,
    tagEl: null,
    half: 0,
  });

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const s = stateRef.current;
      const track = trackRef.current;
      if (track) {
        s.half = track.scrollWidth / 2;
        if (!s.pressing) {
          const friction = 0.95;
          s.vel = s.vel * friction + speed * (1 - friction);
          s.x -= s.vel;
          if (s.half > 0) {
            if (s.x <= -s.half) s.x += s.half;
            else if (s.x > 0) s.x -= s.half;
          }
          track.style.transform = `translate3d(${s.x}px, 0, 0)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  const onPointerDown = (e) => {
    const s = stateRef.current;
    s.pressing = true;
    s.pointerId = e.pointerId;
    s.totalMove = 0;
    s.startX = e.clientX;
    s.lastX = e.clientX;
    s.lastT = performance.now();
    s.tagEl = e.target?.closest?.(".tag") || null;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s.pressing || s.pointerId !== e.pointerId) return;
    e.preventDefault();
    const now = performance.now();
    const dx = e.clientX - s.lastX;
    s.totalMove += Math.abs(dx);
    s.x += dx;
    if (s.half > 0) {
      if (s.x <= -s.half) s.x += s.half;
      else if (s.x > 0) s.x -= s.half;
    }
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${s.x}px, 0, 0)`;
    const dt = Math.max(1, now - s.lastT);
    // Мгновенная скорость в пикселях/кадр (предполагая 60 fps → 16.67 мс/кадр).
    s.vel = -dx * (16.67 / dt);
    s.lastX = e.clientX;
    s.lastT = now;
  };

  const onPointerUp = (e) => {
    const s = stateRef.current;
    if (!s.pressing || s.pointerId !== e.pointerId) return;
    s.pressing = false;
    s.pointerId = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    // Тап: палец почти не двигался → переключаем выбор по data-tag-id.
    if (s.totalMove < 5 && s.tagEl && !readOnly) {
      const idAttr = s.tagEl.dataset.tagId;
      if (idAttr) onToggle(Number(idAttr));
    }
    s.tagEl = null;
  };

  const renderCopy = (suffix) =>
    tags.map((t) => {
      const on = selectedIds.has(t.id);
      return (
        <span
          key={`${suffix}-${t.id}`}
          data-tag-id={t.id}
          className={`tag tag--impr ${on ? "tag--impr-on" : ""}`}
          role="button"
          tabIndex={readOnly ? -1 : 0}
          aria-pressed={on}
          onKeyDown={(e) => {
            if (readOnly) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(t.id);
            }
          }}
        >
          {t.name}
        </span>
      );
    });

  return (
    <div
      className="tag-marquee"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={trackRef} className="tag-marquee__track">
        {renderCopy("a")}
        <span className="tag-marquee__sep" aria-hidden="true" />
        {renderCopy("b")}
      </div>
    </div>
  );
}

export default function MarqueeTags({ tags, selectedIds, onToggle, readOnly }) {
  if (!tags || tags.length === 0) return null;
  const row1 = tags.filter((_, i) => i % 2 === 0);
  const row2 = tags.filter((_, i) => i % 2 === 1);
  const rows = [row1, row2].filter((r) => r.length > 0);
  const speeds = [0.7, 0.95];
  return (
    <div className="tag-rows">
      {rows.map((row, idx) => (
        <MarqueeRow
          key={idx}
          tags={row}
          selectedIds={selectedIds}
          onToggle={onToggle}
          readOnly={readOnly}
          speed={speeds[idx] ?? 0.85}
        />
      ))}
    </div>
  );
}
