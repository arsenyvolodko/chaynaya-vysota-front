import { useLayoutEffect, useMemo, useRef } from "react";

/**
 * CriteriaChart — радар на правильном N-угольнике.
 *
 * Каждой criteria соответствует одна ось. labelPlacement управляет, где
 * проходят оси: к серединам сторон ("edges", по умолчанию) или к вершинам
 * многоугольника ("vertices"). По оси расставлены точки grade (k=0 — «ноль
 * шкалы», слегка отодвинут от центра; k=gradeLen-1 — у самой границы).
 * Юзер тапает по точке или тащит вдоль оси — выставляется value. Выбранные
 * значения по всем criteria соединяются в закрашенный многоугольник.
 *
 * Props:
 *   criterias:      [{ id, name, description, grade: [{value, label}], ... }, ...]
 *   marks:          { [criteriaId]: number }
 *   onChange:       (criteriaId, value) => void
 *   readOnly:       bool
 *   labelPlacement: "edges" | "vertices"
 *   color:          опциональный hex цвет (заливка/штрих полигона)
 */
export default function CriteriaChart({ criterias, marks, onChange, readOnly, labelPlacement, color }) {
  const svgRef = useRef(null);
  const pressRef = useRef(null);
  const labelRefs = useRef([]);

  // После рендера сдвигаем foreignObject-подписи внутрь экрана, если они
  // выходят за края viewport. Базовая JSX-позиция дублируется в data-base-x,
  // оттуда сбрасываем x перед каждым измерением.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const vbW = svg.viewBox.baseVal.width || svgRect.width;
    const scale = svgRect.width / vbW;
    const vw = document.documentElement.clientWidth;
    const BUFFER = 4;
    if (scale <= 0) return;
    labelRefs.current.forEach((fo) => {
      if (!fo) return;
      const baseX = parseFloat(fo.getAttribute("data-base-x"));
      if (!Number.isFinite(baseX)) return;
      fo.setAttribute("x", String(baseX));
      const r = fo.getBoundingClientRect();
      let dx = 0;
      if (r.left < BUFFER) dx = BUFFER - r.left;
      else if (r.right > vw - BUFFER) dx = (vw - BUFFER) - r.right;
      if (Math.abs(dx) > 0.5) {
        fo.setAttribute("x", String(baseX + dx / scale));
      }
    });
  });

  const placement = labelPlacement === "vertices" ? "vertices" : "edges";

  const N = criterias.length;
  const gradeLen = (criterias[0]?.grade || []).length;

  const geom = useMemo(() => {
    // Единый viewBox для обоих placement — одинаковый рендер-размер шрифта
    // (HTML-px в foreignObject = единицы viewBox).
    const sizeX = 540;
    const sizeY = 440;
    const cx = sizeX / 2;
    const cy = sizeY / 2;
    const R = 160;
    const apothem = R * Math.cos(Math.PI / Math.max(3, N));
    const sideAngle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / N;
    const vertexAngle = (k) => -Math.PI / 2 - Math.PI / N + (2 * Math.PI * k) / N;
    const vertices = Array.from({ length: N }, (_, k) => ({
      x: cx + R * Math.cos(vertexAngle(k)),
      y: cy + R * Math.sin(vertexAngle(k)),
    }));
    const midpoints = Array.from({ length: N }, (_, i) => ({
      x: cx + apothem * Math.cos(sideAngle(i)),
      y: cy + apothem * Math.sin(sideAngle(i)),
    }));
    return { sizeX, sizeY, cx, cy, R, apothem, sideAngle, vertexAngle, vertices, midpoints };
  }, [N, placement]);

  if (N < 3 || gradeLen === 0) return null;

  // Шаг между точечками шкалы = innerR (расстояние от центра до «нуля» k=0).
  // Получается равномерная плотность точек от центра к краю: outerR ≈ gradeLen × шаг.
  const outerR = 0.92;
  const innerR = outerR / gradeLen;
  const dotFraction = (k) => {
    if (gradeLen === 1) return (innerR + outerR) / 2;
    return innerR + (outerR - innerR) * (k / (gradeLen - 1));
  };

  // Направление i-й оси (единичный вектор от центра).
  const axisAnchor = (i) => (placement === "vertices" ? geom.vertices[i] : geom.midpoints[i]);
  const axisAngle = (i) => (placement === "vertices" ? geom.vertexAngle(i) : geom.sideAngle(i));
  const labelBaseDist = placement === "vertices" ? geom.R : geom.apothem;

  const dotPos = (i, k) => {
    const anchor = axisAnchor(i);
    const f = dotFraction(k);
    return {
      x: geom.cx + (anchor.x - geom.cx) * f,
      y: geom.cy + (anchor.y - geom.cy) * f,
    };
  };

  const idxFor = (c) => {
    const v = marks[c.id];
    if (v == null) return -1;
    return (c.grade || []).findIndex((g) => Number(g.value) === Number(v));
  };

  const svgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg || !svg.createSVGPoint) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const snapAlongAxis = (i, clientX, clientY) => {
    const { cx, cy } = geom;
    const anchor = axisAnchor(i);
    const p = svgPoint(clientX, clientY);
    const dx = anchor.x - cx;
    const dy = anchor.y - cy;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - cx) * dx + (p.y - cy) * dy) / lenSq));
    if (gradeLen === 1) return 0;
    const span = outerR - innerR;
    const k0 = span > 0 ? ((t - innerR) / span) * (gradeLen - 1) : 0;
    return Math.max(0, Math.min(gradeLen - 1, Math.round(k0)));
  };

  const commit = (i, k) => {
    const c = criterias[i];
    const v = Number((c.grade || [])[k]?.value);
    if (Number.isFinite(v)) onChange(c.id, v);
  };

  // Tap-only: не захватываем поинтер и не отменяем нативный скролл — браузер
  // сам отличит скролл от тапа. Коммитим значение в pointerUp, если палец/
  // курсор почти не двинулся.
  const TAP_SLOP_SQ = 100;
  const onSpokeDown = (i) => (e) => {
    if (readOnly) return;
    pressRef.current = {
      i,
      pointerId: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      moved: false,
    };
  };
  const onSpokeMove = (e) => {
    const p = pressRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const dx = e.clientX - p.x0;
    const dy = e.clientY - p.y0;
    if (dx * dx + dy * dy > TAP_SLOP_SQ) p.moved = true;
  };
  const onSpokeUp = (e) => {
    const p = pressRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    pressRef.current = null;
    if (p.moved) return;
    commit(p.i, snapAlongAxis(p.i, e.clientX, e.clientY));
  };
  const onSpokeCancel = (e) => {
    const p = pressRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    pressRef.current = null;
  };

  const selectedPolygonPath = (() => {
    // Дефолт «ноль» — нулевая точка шкалы (k=0) у каждой оси: полигон рисуем
    // всегда; неотмеченные оси трактуем как k=0 (внутреннее innerR-кольцо).
    const pts = criterias.map((c, i) => {
      const k = idxFor(c);
      return dotPos(i, k >= 0 ? k : 0);
    });
    return (
      pts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(" ") + " Z"
    );
  })();

  const { sizeX, sizeY, cx, cy, vertices } = geom;
  const ringPolygon = (f) =>
    vertices
      .map((v) => {
        const x = cx + (v.x - cx) * f;
        const y = cy + (v.y - cy) * f;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

  // Один hex на чарт; прозрачности per-element — на фронте через fill-opacity.
  // Если бек не прислал color — используем тёплый пастельный сиреневый.
  const accent = color || "#b58fd4";

  return (
    <div className="criteria-chart">
      <svg
        ref={svgRef}
        className={`criteria-chart__svg ${readOnly ? "is-readonly" : ""}`}
        viewBox={`0 0 ${sizeX} ${sizeY}`}
        aria-label="Радар оценок"
      >
        {Array.from({ length: gradeLen }, (_, k) => k).filter((k) => dotFraction(k) > 0).map((k) => (
          <polygon
            key={`ring-${k}`}
            points={ringPolygon(dotFraction(k))}
            fill="none"
            stroke="var(--stone-200)"
            strokeWidth="1"
            strokeDasharray={k === gradeLen - 1 ? "" : "2 3"}
            style={{ pointerEvents: "none" }}
          />
        ))}

        {criterias.map((_, i) => {
          const anchor = axisAnchor(i);
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={anchor.x}
              y2={anchor.y}
              stroke="var(--stone-200)"
              strokeWidth="1"
              strokeDasharray="2 3"
              style={{ pointerEvents: "none" }}
            />
          );
        })}

        {criterias.map((c, i) => {
          const sel = idxFor(c);
          const effSel = sel >= 0 ? sel : 0;
          const p = dotPos(i, effSel);
          return (
            <line
              key={`filled-spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={accent}
              strokeWidth="1.5"
              style={{ pointerEvents: "none" }}
            />
          );
        })}

        {criterias.map((_, i) => {
          const anchor = axisAnchor(i);
          return (
            <line
              key={`hit-${i}`}
              x1={cx}
              y1={cy}
              x2={anchor.x}
              y2={anchor.y}
              stroke="transparent"
              strokeWidth="18"
              strokeLinecap="round"
              style={{
                cursor: readOnly ? "default" : "pointer",
              }}
              onPointerDown={onSpokeDown(i)}
              onPointerMove={onSpokeMove}
              onPointerUp={onSpokeUp}
              onPointerCancel={onSpokeCancel}
            />
          );
        })}

        {selectedPolygonPath && (
          <path
            d={selectedPolygonPath}
            fill={accent}
            fillOpacity={0.55}
            stroke={accent}
            strokeWidth="1.5"
            strokeLinejoin="round"
            style={{ pointerEvents: "none" }}
          />
        )}

        {criterias.map((c, i) => {
          const sel = idxFor(c);
          // Если значение ещё не выставлено — визуально считаем «ноль» (k=0)
          // выбранным: нулевая точка светится цветом, а сам ноль является
          // дефолтом, по которому строится полигон.
          const effSel = sel >= 0 ? sel : 0;
          return Array.from({ length: gradeLen }, (_, j) => {
            const k = j;
            const p = dotPos(i, k);
            const isOn = k === effSel;
            const isPast = k < effSel;
            const isMarked = isOn || isPast;
            const fill = isMarked ? accent : "white";
            const stroke = isMarked ? accent : "var(--stone-300)";
            const opacity = isPast ? 0.8 : 1;
            return (
              <circle
                key={`dot-${i}-${k}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.2}
                opacity={opacity}
                style={{ pointerEvents: "none" }}
              />
            );
          });
        })}

        {criterias.map((c, i) => {
          const a = axisAngle(i);
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          const lx = cx + (labelBaseDist + 12) * cos;
          const ly = cy + (labelBaseDist + 12) * sin;
          const boxW = 84;
          const boxH = 38;
          const fx = lx + cos * (boxW / 2) - boxW / 2;
          const fy = ly + sin * (boxH / 2) - boxH / 2;
          let textAlign = "center";
          if (cos > 0.25) textAlign = "left";
          else if (cos < -0.25) textAlign = "right";
          const sel = idxFor(c);
          const curLabel = sel >= 0 ? (c.grade || [])[sel]?.label : null;
          return (
            <foreignObject
              key={`label-${i}`}
              ref={(el) => { labelRefs.current[i] = el; }}
              x={fx}
              y={fy}
              width={boxW}
              height={boxH}
              data-base-x={fx}
              style={{ pointerEvents: "none", overflow: "visible" }}
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems:
                    textAlign === "left"
                      ? "flex-start"
                      : textAlign === "right"
                      ? "flex-end"
                      : "center",
                  textAlign,
                  lineHeight: 1.15,
                  fontFamily: "inherit",
                  color: "var(--stone-700)",
                  fontWeight: 500,
                  fontSize: 11,
                }}
              >
                <div style={{ wordBreak: "normal", overflowWrap: "anywhere", hyphens: "auto" }}>
                  {String(c.name || "").replace(/\//g, "/​")}
                </div>
                {curLabel && (
                  <div
                    style={{
                      marginTop: 2,
                      color: accent,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {curLabel}
                  </div>
                )}
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
