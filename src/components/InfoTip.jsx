import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconInfo } from "./icons.jsx";

const VIEWPORT_MARGIN = 8;
const ARROW_BASE_LEFT = 10;

export default function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const [shiftX, setShiftX] = useState(0);
  const wrapRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onDown, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onDown, true);
    };
  }, [open]);

  // Меряем popover и сдвигаем его внутрь видимой области. Видимая область —
  // это .phone (max-width 420 с overflow: hidden), а не window, иначе при
  // широком экране проверка считает, что места ещё много, а контент клипается.
  useLayoutEffect(() => {
    if (!open) { setShiftX(0); return; }
    const el = popRef.current;
    if (!el) return;
    el.style.transform = "translateX(0px)";
    const rect = el.getBoundingClientRect();
    const phone = wrapRef.current?.closest(".phone");
    const bounds = phone
      ? phone.getBoundingClientRect()
      : { left: 0, right: window.innerWidth };
    let shift = 0;
    const overflowRight = rect.right - (bounds.right - VIEWPORT_MARGIN);
    const overflowLeft = (bounds.left + VIEWPORT_MARGIN) - rect.left;
    if (overflowRight > 0) shift = -overflowRight;
    else if (overflowLeft > 0) shift = overflowLeft;
    setShiftX(shift);
  }, [open, text]);

  if (!text) return null;

  return (
    <span className={`info-tip ${open ? "is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className={`info-tip__btn ${open ? "is-on" : ""}`}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-label="Подсказка"
        aria-expanded={open}
      >
        <IconInfo size={13} stroke={2} />
      </button>
      {open && (
        <div
          className="info-tip__pop"
          role="tooltip"
          ref={popRef}
          style={{ transform: `translateX(${shiftX}px)` }}
        >
          <span
            className="info-tip__arrow"
            aria-hidden="true"
            style={{ left: `${ARROW_BASE_LEFT - shiftX}px` }}
          />
          {text}
        </div>
      )}
    </span>
  );
}
