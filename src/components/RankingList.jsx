import { useRef, useState } from "react";
import { IconGrip } from "./icons.jsx";

export default function RankingList({ items, onChange, readOnly }) {
  const listRef = useRef(null);
  const stateRef = useRef(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const onPointerDown = (i) => (e) => {
    if (readOnly) return;
    e.preventDefault();
    const itemEl = e.currentTarget.closest(".ranking__item");
    try { itemEl.setPointerCapture(e.pointerId); } catch (_) {}
    const rect = itemEl.getBoundingClientRect();
    stateRef.current = {
      idx: i,
      pointerId: e.pointerId,
      startY: e.clientY,
      offsetY: 0,
      itemH: rect.height,
      itemEl,
    };
    rerender();
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    e.preventDefault();
    // Clamp so the dragged item never escapes the list vertically.
    const itemRect = s.itemEl.getBoundingClientRect(); // includes current transform
    const naturalTop = itemRect.top - s.offsetY;
    const naturalBottom = itemRect.bottom - s.offsetY;
    const listRect = listRef.current.getBoundingClientRect();
    const minOff = listRect.top - naturalTop;
    const maxOff = listRect.bottom - naturalBottom;
    const raw = e.clientY - s.startY;
    const offsetY = Math.max(minOff, Math.min(maxOff, raw));
    s.offsetY = offsetY;

    const list = listRef.current;
    const itemEls = list.children;
    const draggedRect = itemEls[s.idx].getBoundingClientRect();
    const draggedCenter = draggedRect.top + draggedRect.height / 2 + offsetY;

    let newIdx = s.idx;
    for (let j = 0; j < itemEls.length; j++) {
      if (j === s.idx) continue;
      const r = itemEls[j].getBoundingClientRect();
      const c = r.top + r.height / 2;
      if (j < s.idx && draggedCenter < c) { newIdx = j; break; }
      if (j > s.idx && draggedCenter > c) { newIdx = j; }
    }

    if (newIdx !== s.idx) {
      const next = items.slice();
      const [moved] = next.splice(s.idx, 1);
      next.splice(newIdx, 0, moved);
      onChange(next);
      s.idx = newIdx;
      s.startY = e.clientY;
      s.offsetY = 0;
    }
    rerender();
  };

  const onPointerUp = (e) => {
    const s = stateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    try { s.itemEl.releasePointerCapture(e.pointerId); } catch (_) {}
    stateRef.current = null;
    rerender();
  };

  const s = stateRef.current;

  return (
    <ul
      ref={listRef}
      className="ranking"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {items.map((item, i) => {
        const isDragging = s && s.idx === i;
        return (
          <li
            key={item}
            className={`ranking__item ${isDragging ? "ranking__item--dragging" : ""}`}
            style={
              isDragging
                ? { transform: `translateY(${s.offsetY}px)`, zIndex: 10, transition: "none" }
                : undefined
            }
          >
            <span className="ranking__rank tabnum">{i + 1}</span>
            <span className="ranking__name">{item}</span>
            <span
              className="ranking__grip"
              onPointerDown={onPointerDown(i)}
              aria-label="Перетащить"
            >
              <IconGrip size={16} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
