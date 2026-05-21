import { useEffect, useRef, useState } from "react";
import InfoTip from "./InfoTip.jsx";

/**
 * Вертикальный аналог StepSlider. Низ шкалы = первый элемент grade (idx 0),
 * верх = последний (idx n-1). Шлёт value из grade, как и горизонтальный.
 */
export default function VerticalStepSlider({ label, info, steps, value, onChange, readOnly }) {
  const n = steps.length;

  const findIdxByValue = (val) =>
    steps.findIndex((s) => Number(s.value) === Number(val));

  const [idx, setIdx] = useState(() => {
    if (n === 0) return 0;
    const found = findIdxByValue(value);
    return found >= 0 ? found : Math.floor((n - 1) / 2);
  });

  useEffect(() => {
    if (n === 0) return;
    const current = steps[idx]?.value;
    if (current == null && value == null) return;
    if (Number(current) === Number(value)) return;
    const found = findIdxByValue(value);
    if (found >= 0) setIdx(found);
    else if (value == null) setIdx(Math.floor((n - 1) / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, n]);

  useEffect(() => {
    if (n > 0 && idx >= n) setIdx(n - 1);
  }, [n, idx]);

  const trackRef = useRef(null);
  const draggingRef = useRef(false);

  if (n === 0) return null;

  // bottom = idx 0, top = idx n-1
  const idxFromClientY = (clientY) => {
    const el = trackRef.current;
    if (!el) return idx;
    const rect = el.getBoundingClientRect();
    const total = Math.max(1, rect.height - 50);
    const r = Math.min(1, Math.max(0, (rect.bottom - 25 - clientY) / total));
    return Math.max(0, Math.min(n - 1, Math.round(r * (n - 1))));
  };

  const commit = (i) => {
    if (i < 0 || i >= n) return;
    if (i !== idx) setIdx(i);
    const v = Number(steps[i].value);
    if (Number(value) !== v) onChange(v);
  };

  const onTrackPointerDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    draggingRef.current = true;
    const stepEl = e.target?.closest?.(".vstep-picker__step");
    const fromData = stepEl ? Number(stepEl.dataset.idx) : NaN;
    commit(Number.isFinite(fromData) ? fromData : idxFromClientY(e.clientY));
  };
  const onTrackPointerMove = (e) => {
    if (readOnly || !draggingRef.current) return;
    commit(idxFromClientY(e.clientY));
  };
  const onTrackPointerUp = (e) => {
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const ratio = n === 1 ? 0.5 : idx / (n - 1);

  // Визуально сверху вниз: idx (n-1), ..., idx 0.
  const visualSteps = steps.map((s, i) => ({ s, i })).reverse();

  const labelStyle = (i) => {
    const r = n === 1 ? 0.5 : i / (n - 1);
    return {
      top: `calc(25px + (100% - 50px) * ${1 - r})`,
      transform: "translateY(-50%)",
    };
  };

  const onLabelPointerDown = (i) => (e) => {
    if (readOnly) return;
    e.preventDefault();
    commit(i);
  };

  return (
    <div className="vstep-slider">
      <div className="vstep-slider__body">
        <div
          ref={trackRef}
          className="vstep-picker__track"
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
          role="slider"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={idx}
          aria-valuetext={steps[idx]?.label}
        >
          <div className="vstep-picker__rail" />
          <div
            className="vstep-picker__fill"
            style={{ height: `calc((100% - 50px) * ${ratio})` }}
          />
          <div className="vstep-picker__steps">
            {visualSteps.map(({ s, i }) => {
              const state = i === idx ? "is-current" : i < idx ? "is-past" : "";
              return (
                <button
                  key={i}
                  type="button"
                  className={`vstep-picker__step ${state}`}
                  aria-label={s.label}
                  data-idx={i}
                >
                  <span className="vstep-picker__dot" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="vstep-slider__labels">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`vstep-slider__label ${i === idx ? "vstep-slider__label--on" : ""}`}
              style={labelStyle(i)}
              onPointerDown={onLabelPointerDown(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="vstep-slider__foot">
        {info ? <span className="vstep-slider__foot-spacer" aria-hidden="true" /> : null}
        <span className="vstep-slider__name">{label}</span>
        <InfoTip text={info} />
      </div>
    </div>
  );
}
