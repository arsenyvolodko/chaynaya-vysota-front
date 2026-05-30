import { useMemo, useRef, useState } from "react";

/**
 * TastePlot — двумерный график «как продукт раскрывается вдоль оси X».
 *
 * В отличие от одиночных шкал (StepSlider) и радара (CriteriaChart), где каждый
 * критерий даёт ОДНО значение, здесь каждый критерий — это КРИВАЯ: набор точек
 * (x, mark) по общей оси X. По оси X — деления x_axis (напр. проливы), по оси
 * Y — общая шкала y_axis. Несколько критериев = несколько кривых на одной
 * плоскости (ср. прототип Tea Evaluation Chart).
 *
 * Контролируемый компонент. Оценка двухкоординатная — точка (x, mark):
 *   value:    { [criteriaId]: { [xValue]: markValue } }
 *   onChange: (criteriaId, xValue, markValue) => void  // апсёрт одной точки
 *
 * Редактирование: выбираем критерий в легенде, тапаем по сетке — точка встаёт
 * в ближайшее деление (x_axis × y_axis). Повторный тап по другому делению того
 * же X двигает точку. readOnly выключает постановку (легенда только подсвечивает).
 *
 * Props:
 *   plot: { id, name, description, color, x_axis:[{value,label}],
 *           y_axis:[{value,label}], x_axis_name, y_axis_name,
 *           criterias:[{ id, name, description, for_tea_combination }] }
 */

// Палитра по индексу критерия — гармоничные мид-тона в землистом мире
// приложения. Цвет самого plot (plot.color) служит лишь базой/фолбэком.
const PALETTE = [
  { color: "#C99A3A", soft: "#FBF3DF" }, // золотой
  { color: "#5E8C3E", soft: "#EDF3E2" }, // матча
  { color: "#C2693E", soft: "#FBEBE0" }, // терракота
  { color: "#4F7CAC", soft: "#E6EEF6" }, // приглушённый синий
  { color: "#8A5FB0", soft: "#F0E9F6" }, // приглушённый сиреневый
];

// Геометрия viewBox.
const VB_W = 380;
const VB_H = 300;
const PAD = { l: 30, r: 8, t: 14, b: 40 };
const PLOT_W = VB_W - PAD.l - PAD.r;
const PLOT_H = VB_H - PAD.t - PAD.b;

// Catmull-Rom → кубический Безье: гладкая кривая через имеющиеся точки.
function smoothPath(points) {
  if (points.length < 2) return "";
  const p = points;
  let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export default function TastePlot({ plot, value, onChange, readOnly }) {
  const svgRef = useRef(null);
  const [ghost, setGhost] = useState(null); // {xi, yi} превью в режиме редактирования

  const xAxis = useMemo(() => (Array.isArray(plot?.x_axis) ? plot.x_axis : []), [plot]);
  const yAxis = useMemo(() => (Array.isArray(plot?.y_axis) ? plot.y_axis : []), [plot]);
  const criterias = useMemo(
    () => (Array.isArray(plot?.criterias) ? plot.criterias : []),
    [plot]
  );

  const xCount = xAxis.length;
  const yCount = yAxis.length;

  // По умолчанию для редактирования выбираем первый критерий (чтобы можно было
  // сразу ставить точки). В readOnly — ничего не выделено, все кривые яркие.
  const [active, setActive] = useState(() =>
    !readOnly && criterias.length ? criterias[0].id : null
  );

  // idx деления оси → экранная координата.
  const xFor = (xi) =>
    xCount <= 1 ? PAD.l + PLOT_W / 2 : PAD.l + (xi / (xCount - 1)) * PLOT_W;
  // idx 0 — низ шкалы, последний — верх.
  const yFor = (yi) =>
    yCount <= 1 ? PAD.t + PLOT_H / 2 : PAD.t + (1 - yi / (yCount - 1)) * PLOT_H;

  const xIndexOf = (val) => xAxis.findIndex((a) => Number(a.value) === Number(val));
  const yIndexOf = (val) => yAxis.findIndex((a) => Number(a.value) === Number(val));

  // value критерия → массив экранных точек, отсортированных по X.
  const pointsOf = (criteriaId) => {
    const byX = (value && value[criteriaId]) || {};
    return Object.entries(byX)
      .map(([xVal, mark]) => {
        const xi = xIndexOf(xVal);
        const yi = yIndexOf(mark);
        if (xi < 0 || yi < 0) return null;
        return { xi, yi, x: xFor(xi), y: yFor(yi) };
      })
      .filter(Boolean)
      .sort((a, b) => a.xi - b.xi);
  };

  const curves = useMemo(() => {
    return criterias.map((c, i) => {
      const pal = PALETTE[i % PALETTE.length];
      return { c, color: pal.color, soft: pal.soft, points: pointsOf(c.id) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criterias, value, xAxis, yAxis]);

  if (xCount < 2 || yCount < 2 || criterias.length === 0) return null;

  const activeCurve = active != null ? curves.find((cu) => cu.c.id === active) : null;
  const activeColor = activeCurve?.color || PALETTE[0].color;

  // Активную кривую рисуем последней, чтобы её точки/линия были сверху.
  const drawOrder = [...curves].sort(
    (a, b) => (a.c.id === active ? 1 : 0) - (b.c.id === active ? 1 : 0)
  );

  const pick = (id) => {
    if (readOnly) setActive((cur) => (cur === id ? null : id));
    else setActive(id);
  };

  // Перевод координат указателя в систему viewBox (через CTM — устойчиво к
  // адаптивному ресайзу и тачам).
  const svgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg || !svg.createSVGPoint) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  };

  // Ближайшие деления осей к точке (с лёгким припуском за границы сетки).
  const nearest = (p) => {
    if (
      p.x < PAD.l - 16 ||
      p.x > VB_W - PAD.r + 8 ||
      p.y < PAD.t - 10 ||
      p.y > VB_H - PAD.b + 12
    ) {
      return null;
    }
    const fx = xCount <= 1 ? 0 : (p.x - PAD.l) / PLOT_W;
    const xi = Math.max(0, Math.min(xCount - 1, Math.round(fx * (xCount - 1))));
    const fy = yCount <= 1 ? 0 : 1 - (p.y - PAD.t) / PLOT_H;
    const yi = Math.max(0, Math.min(yCount - 1, Math.round(fy * (yCount - 1))));
    return { xi, yi };
  };

  const handleMove = (e) => {
    if (readOnly || active == null) return;
    const p = svgPoint(e.clientX, e.clientY);
    if (!p) return;
    setGhost(nearest(p));
  };

  const handlePlace = (e) => {
    if (readOnly || active == null) return;
    const src = e.touches && e.touches[0] ? e.touches[0] : e;
    const p = svgPoint(src.clientX, src.clientY);
    if (!p) return;
    const n = nearest(p);
    if (!n) return;
    setGhost(null);
    onChange?.(active, Number(xAxis[n.xi].value), Number(yAxis[n.yi].value));
  };

  return (
    <div className="taste-plot">
      <div className="taste-plot__legend" role="radiogroup" aria-label="Критерий">
        {curves.map((cu) => {
          const on = cu.c.id === active;
          return (
            <button
              key={cu.c.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`taste-plot__seg ${on ? "is-on" : ""}`}
              style={on ? { color: cu.color, background: cu.soft } : undefined}
              onClick={() => pick(cu.c.id)}
            >
              <span
                className="taste-plot__swatch"
                style={{ background: cu.color, boxShadow: on ? `0 0 0 4px ${cu.soft}` : "none" }}
              />
              <span className="taste-plot__seg-name">{cu.c.name}</span>
              <span className="taste-plot__seg-count">
                {cu.points.length}/{xCount}
              </span>
            </button>
          );
        })}
      </div>

      <svg
        ref={svgRef}
        className={`taste-plot__svg ${readOnly ? "" : "is-edit"}`}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={plot.name || "График оценок"}
        onClick={handlePlace}
        onMouseMove={handleMove}
        onMouseLeave={() => setGhost(null)}
        onTouchStart={(e) => { if (!readOnly && active != null) { e.preventDefault(); handlePlace(e); } }}
      >
        {/* горизонтальная сетка + подписи Y */}
        {yAxis.map((a, yi) => (
          <g key={`h-${yi}`}>
            <line
              className={yi === 0 ? "taste-plot__grid taste-plot__grid--base" : "taste-plot__grid"}
              x1={PAD.l}
              y1={yFor(yi)}
              x2={VB_W - PAD.r}
              y2={yFor(yi)}
            />
            <text className="taste-plot__axis-label" x={PAD.l - 7} y={yFor(yi) + 3.5} textAnchor="end">
              {a.label}
            </text>
          </g>
        ))}

        {/* вертикальная сетка + подписи X */}
        {xAxis.map((a, xi) => (
          <g key={`v-${xi}`}>
            <line
              className={xi === 0 ? "taste-plot__grid taste-plot__grid--base" : "taste-plot__grid"}
              x1={xFor(xi)}
              y1={PAD.t}
              x2={xFor(xi)}
              y2={VB_H - PAD.b}
            />
            <text className="taste-plot__axis-label" x={xFor(xi)} y={VB_H - PAD.b + 16} textAnchor="middle">
              {a.label}
            </text>
          </g>
        ))}

        {/* названия осей */}
        {plot.x_axis_name && (
          <text className="taste-plot__axis-cap" x={VB_W - PAD.r} y={VB_H - 6} textAnchor="end">
            {plot.x_axis_name}
          </text>
        )}
        {plot.y_axis_name && (
          <text
            className="taste-plot__axis-cap"
            x={10}
            y={PAD.t + PLOT_H / 2}
            textAnchor="middle"
            transform={`rotate(-90 10 ${PAD.t + PLOT_H / 2})`}
          >
            {plot.y_axis_name}
          </text>
        )}

        {/* ghost-превью в режиме редактирования */}
        {!readOnly && ghost && (
          <g className="taste-plot__ghost" style={{ pointerEvents: "none" }}>
            <line
              x1={xFor(ghost.xi)}
              y1={PAD.t}
              x2={xFor(ghost.xi)}
              y2={VB_H - PAD.b}
              stroke={activeColor}
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity="0.5"
            />
            <circle cx={xFor(ghost.xi)} cy={yFor(ghost.yi)} r="7" fill={activeColor} opacity="0.22" />
            <circle
              cx={xFor(ghost.xi)}
              cy={yFor(ghost.yi)}
              r="3.5"
              fill="none"
              stroke={activeColor}
              strokeWidth="1.5"
              opacity="0.7"
            />
          </g>
        )}

        {/* кривые */}
        {drawOrder.map((cu) => {
          const dim = active != null && cu.c.id !== active;
          const d = smoothPath(cu.points);
          if (!d) return null;
          return (
            <path
              key={`curve-${cu.c.id}`}
              className="taste-plot__curve"
              d={d}
              stroke={cu.color}
              strokeWidth={cu.c.id === active ? 3 : 2.5}
              style={{ opacity: dim ? 0.18 : 1, pointerEvents: "none" }}
            />
          );
        })}

        {/* точки */}
        {drawOrder.map((cu) => {
          const dim = active != null && cu.c.id !== active;
          return cu.points.map((pt) => (
            <g
              key={`dot-${cu.c.id}-${pt.xi}`}
              className="taste-plot__dot"
              style={{ opacity: dim ? 0.3 : 1, pointerEvents: "none" }}
            >
              <circle cx={pt.x} cy={pt.y} r="9" fill={cu.color} opacity="0.16" />
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#fff" stroke={cu.color} strokeWidth="2.5" />
            </g>
          ));
        })}
      </svg>

      <div className="taste-plot__hint">
        {readOnly ? (
          activeCurve ? (
            <span>
              <em>«{activeCurve.c.name}»</em> выделен — нажмите ещё раз, чтобы показать все кривые
            </span>
          ) : (
            <span>Нажмите критерий, чтобы выделить его кривую</span>
          )
        ) : activeCurve ? (
          <span>
            Ставите <em>«{activeCurve.c.name}»</em>: {activeCurve.points.length} из {xCount}. Тапните
            по сетке, чтобы отметить деление.
          </span>
        ) : (
          <span>Выберите критерий, чтобы отмечать точки</span>
        )}
      </div>
    </div>
  );
}
