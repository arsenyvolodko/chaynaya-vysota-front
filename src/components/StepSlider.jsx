import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfoTip from "./InfoTip.jsx";

/**
 * StepSlider — дискретный слайдер по списку шагов.
 *
 * Контракт:
 *   steps:   [{ value: number, label: string }, ...] из TasteCriteria.grade
 *   value:   текущий выбранный value (целое из grade) либо null
 *   onChange(nextValue) — отдаёт VALUE из grade (не индекс!)
 *
 * Внутри держим собственный idx. Если бы доверяли только findIndex(value),
 * дубли значений в grade ломали бы UX: клик на правую точку отдавал бы тот же
 * value, что у левого дубля, и findIndex возвращал бы 0 — визуал «откатывался»
 * влево. Поэтому idx ресинхронизируется из value лишь когда наш текущий шаг
 * перестал соответствовать пришедшему value.
 */
export default function StepSlider({ label, info, steps, value, onChange, readOnly }) {
  const n = steps.length;

  const findIdxByValue = (val) => {
    const i = steps.findIndex((s) => Number(s.value) === Number(val));
    return i;
  };

  const [idx, setIdx] = useState(() => {
    if (n === 0) return 0;
    const found = findIdxByValue(value);
    return found >= 0 ? found : Math.floor((n - 1) / 2);
  });

  // Resync from `value` only when our currently shown step's value no longer
  // matches the incoming prop — i.e. value changed externally (mount/refresh).
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

  // Clamp idx if steps array shrinks.
  useEffect(() => {
    if (n > 0 && idx >= n) setIdx(n - 1);
  }, [n, idx]);

  if (n === 0) return null;

  const ratio = n === 1 ? 0.5 : idx / (n - 1);

  const trackRef = useRef(null);
  const draggingRef = useRef(false);

  const idxFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return idx;
    const rect = el.getBoundingClientRect();
    // Dot centers run from rect.left+25 (first) to rect.right-25 (last):
    // .step-picker__track has padding 0 11px, .step-picker__step is 28px wide,
    // .step-picker__steps uses justify-content: space-between → first dot
    // center sits at 11 + 14 = 25, last at width - 11 - 14 = width - 25.
    const total = Math.max(1, rect.width - 50);
    const r = Math.min(1, Math.max(0, (clientX - rect.left - 25) / total));
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
    // Если pointerdown пришёл на саму точку — берём её индекс из data-idx,
    // мимо клик-математики (надёжно даже у краёв). В остальных случаях
    // считаем индекс по координате.
    const stepEl = e.target?.closest?.(".step-picker__step");
    const fromData = stepEl ? Number(stepEl.dataset.idx) : NaN;
    const i = Number.isFinite(fromData) ? fromData : idxFromClientX(e.clientX);
    commit(i);
  };
  const onTrackPointerMove = (e) => {
    if (readOnly || !draggingRef.current) return;
    commit(idxFromClientX(e.clientX));
  };
  const onTrackPointerUp = (e) => {
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const labelStyle = (i) => {
    const r = n === 1 ? 0.5 : i / (n - 1);
    return {
      left: `calc(25px + (100% - 50px) * ${r})`,
      transform: "translateX(-50%)",
      textAlign: "center",
    };
  };

  // По умолчанию все подписи под рейлом. Если они перекрывают друг друга или
  // вылезают за границы экрана — переключаемся в режим «через одну», т.е.
  // нечётные подписи уходят над рейлом, чётные — остаются под.
  const [alternate, setAlternate] = useState(false);
  const railWrapRef = useRef(null);

  useEffect(() => {
    const onResize = () => setAlternate(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    const wrap = railWrapRef.current;
    if (!wrap) return;

    // 1. Решаем, надо ли разводить подписи на два ряда. Триггер — только
    //    наложение СОСЕДНИХ подписей при текущем размещении (все снизу).
    if (!alternate) {
      const belowLabels = Array.from(
        wrap.querySelectorAll(".step-slider__labels--bot .step-slider__label")
      );
      if (belowLabels.length >= 2) {
        let overlap = false;
        let prevRight = -Infinity;
        for (const lab of belowLabels) {
          const r = lab.getBoundingClientRect();
          if (r.left < prevRight + 2) { overlap = true; break; }
          prevRight = r.right;
        }
        if (overlap) {
          setAlternate(true);
          return; // следующий рендер сам отнаджит крайние
        }
      }
    }

    // 2. Если крайняя подпись чуть-чуть вылезает за край экрана — двигаем её
    //    ровно настолько, чтобы вернулась в viewport.
    const labels = Array.from(wrap.querySelectorAll(".step-slider__label"));
    const vw = document.documentElement.clientWidth;
    const BUFFER = 4;
    for (const lab of labels) {
      lab.style.transform = "translateX(-50%)";
      const r = lab.getBoundingClientRect();
      let nudge = 0;
      if (r.left < BUFFER) nudge = BUFFER - r.left;
      else if (r.right > vw - BUFFER) nudge = (vw - BUFFER) - r.right;
      if (Math.abs(nudge) > 0.5) {
        lab.style.transform = `translateX(calc(-50% + ${Math.round(nudge)}px))`;
      }
    }
  });

  const aboveSteps = alternate
    ? steps.map((s, i) => ({ s, i })).filter(({ i }) => i % 2 === 1)
    : [];
  const belowSteps = alternate
    ? steps.map((s, i) => ({ s, i })).filter(({ i }) => i % 2 === 0)
    : steps.map((s, i) => ({ s, i }));

  // Подписи вне трека — у них собственный pointerdown, чтобы тап по подписи
  // под точкой тоже её выбирал.
  const onLabelPointerDown = (i) => (e) => {
    if (readOnly) return;
    e.preventDefault();
    commit(i);
  };

  const renderLabel = ({ s, i }) => (
    <button
      key={i}
      type="button"
      className={`step-slider__label ${i === idx ? "step-slider__label--on" : ""}`}
      style={labelStyle(i)}
      onPointerDown={onLabelPointerDown(i)}
    >
      {s.label}
    </button>
  );

  return (
    <div className="step-slider">
      <div className="step-slider__head">
        <span className="step-slider__name">{label}</span>
        <InfoTip text={info} />
      </div>

      <div className="step-slider__rail-wrap" ref={railWrapRef}>
        {alternate && (
          <div className="step-slider__labels step-slider__labels--top">
            {aboveSteps.map(renderLabel)}
          </div>
        )}

        <div
          ref={trackRef}
          className="step-picker__track"
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={idx}
          aria-valuetext={steps[idx]?.label}
        >
          <div className="step-picker__rail" />
          <div className="step-picker__fill" style={{ width: `calc((100% - 50px) * ${ratio})` }} />
          <div className="step-picker__steps">
            {steps.map((s, i) => {
              const state = i === idx ? "is-current" : i < idx ? "is-past" : "";
              return (
                <button
                  key={i}
                  type="button"
                  className={`step-picker__step ${state}`}
                  aria-label={s.label}
                  data-idx={i}
                >
                  <span className="step-picker__dot" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="step-slider__labels step-slider__labels--bot">
          {belowSteps.map(renderLabel)}
        </div>
      </div>
    </div>
  );
}
