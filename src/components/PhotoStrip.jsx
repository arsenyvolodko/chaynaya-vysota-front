import { useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconX } from "./icons.jsx";

/**
 * PhotoStrip — горизонтальная лента квадратных превью (≈3 в ширину экрана,
 * с «подглядыванием» следующего → понятно, что листается). Тап по фото —
 * раскрытие в полноэкранный лайтбокс с листанием (стрелки / свайп / клавиши).
 *
 * Props: photos: [{ id, image }]
 */
export default function PhotoStrip({ photos }) {
  const list = Array.isArray(photos) ? photos : [];
  const [openIdx, setOpenIdx] = useState(null);
  const touchX = useRef(null);

  const close = () => setOpenIdx(null);
  const prev = () => setOpenIdx((i) => (i > 0 ? i - 1 : list.length - 1));
  const next = () => setOpenIdx((i) => (i < list.length - 1 ? i + 1 : 0));

  useEffect(() => {
    if (openIdx == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx, list.length]);

  if (!list.length) return null;

  const onTouchStart = (e) => { touchX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (touchX.current == null || list.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  return (
    <>
      <div className="photo-strip">
        {list.map((p, i) => (
          <button
            key={p.id ?? i}
            type="button"
            className="photo-strip__item"
            onClick={() => setOpenIdx(i)}
            aria-label="Открыть фото"
          >
            <img className="photo-strip__img" src={p.image} alt="" loading="lazy" />
          </button>
        ))}
      </div>

      {list.length > 1 && (
        <div className="photo-strip__hint">
          <span className="section__hint-swipe section__hint-swipe--left" aria-hidden="true">
            <IconChevronLeft size={11} stroke={2.2} />
          </span>
          <span>Листайте фото — нажмите, чтобы открыть</span>
          <span className="section__hint-swipe section__hint-swipe--right" aria-hidden="true">
            <IconChevronRight size={11} stroke={2.2} />
          </span>
        </div>
      )}

      {openIdx != null && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true">
          <button className="lightbox__close" onClick={close} aria-label="Закрыть">
            <IconX size={22} stroke={2} />
          </button>
          <div
            className="lightbox__stage"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img className="lightbox__img" src={list[openIdx].image} alt="" />
          </div>
          {list.length > 1 && (
            <>
              <button
                className="lightbox__nav lightbox__nav--prev"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Предыдущее фото"
              >
                <IconChevronLeft size={24} stroke={2} />
              </button>
              <button
                className="lightbox__nav lightbox__nav--next"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Следующее фото"
              >
                <IconChevronRight size={24} stroke={2} />
              </button>
              <div className="lightbox__counter">{openIdx + 1} / {list.length}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
