import { useEffect, useMemo, useRef, useState } from "react";
import cloud from "d3-cloud";

/**
 * WordCloud — облако слов на d3-cloud (sprite-упаковка) с обрезкой по фактическим
 * границам слов: SVG = bounding box размещённых слов, без пустых полей, поэтому
 * даже немного слов выглядят плотной группой, а не разбросаны по прямоугольнику.
 *
 * Размер/жирность растут с весом (частотой), цвет стабилен по имени, раскладка
 * детерминирована (свой random). Адаптив по ширине контейнера (ResizeObserver).
 *
 * Props: words: [{ name, weight, source }]
 */
const COLORS = [
  "#5E8C3E", "#C99A3A", "#C2693E", "#4F7CAC",
  "#8A5FB0", "#3F8F8A", "#7E9A6C", "#57534e",
];
const FONT = "Inter, system-ui, -apple-system, sans-serif";

function colorFor(name) {
  const s = String(name || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let _ctx = null;
function measureCtx() {
  if (_ctx) return _ctx;
  _ctx = document.createElement("canvas").getContext("2d");
  return _ctx;
}

export default function WordCloud({ words }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [laid, setLaid] = useState(null); // { items, vb }

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(
    () => (words || []).map((x) => ({ text: x.name, value: Number(x.weight) || 1, source: x.source })),
    [words]
  );

  useEffect(() => {
    if (!data.length || !width) {
      setLaid(null);
      return;
    }
    let min = Infinity;
    let max = 1;
    for (const d of data) {
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
    }
    if (!Number.isFinite(min)) min = 1;
    const ratio = (v) => (max <= min ? 1 : (Math.max(min, v) - min) / (max - min));
    const small = Math.max(13, width / 22);
    const big = Math.max(small + 8, width / 6.5);

    const prepared = data.map((d) => ({
      ...d,
      size: Math.round(small + ratio(d.value) * (big - small)),
      bold: Math.round(500 + ratio(d.value) * 200),
    }));

    // Холст с запасом, чтобы d3-cloud ничего не отбрасывал; лишнее обрежем.
    const area = prepared.reduce((a, d) => a + d.size * d.size * (d.text.length * 0.6 + 1), 0);
    const side = Math.max(width, Math.ceil(Math.sqrt(area) * 1.9));

    let cancelled = false;
    const layout = cloud()
      .size([side, side])
      .words(prepared)
      .padding(1.5)
      .rotate(0)
      .random(seededRandom(0x9e3779b1))
      .font(FONT)
      .fontWeight((d) => d.bold)
      .fontSize((d) => d.size)
      .on("end", (placed) => {
        if (cancelled || !placed.length) return;
        const ctx = measureCtx();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const w of placed) {
          ctx.font = `${w.bold} ${w.size}px ${FONT}`;
          const tw = ctx.measureText(w.text).width;
          const th = w.size * 0.96;
          // AABB повёрнутого слова (для 90° ширина/высота меняются местами).
          const rad = ((w.rotate || 0) * Math.PI) / 180;
          const cos = Math.abs(Math.cos(rad));
          const sin = Math.abs(Math.sin(rad));
          const bw = tw * cos + th * sin;
          const bh = tw * sin + th * cos;
          minX = Math.min(minX, w.x - bw / 2);
          maxX = Math.max(maxX, w.x + bw / 2);
          minY = Math.min(minY, w.y - bh / 2);
          maxY = Math.max(maxY, w.y + bh / 2);
        }
        const pad = 6;
        setLaid({
          items: placed,
          vb: { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 },
        });
      });
    layout.start();
    return () => {
      cancelled = true;
      layout.stop();
    };
  }, [data, width]);

  return (
    <div ref={wrapRef} className="word-cloud-wrap">
      {laid && (
        <svg
          className="word-cloud-svg"
          viewBox={`${laid.vb.x} ${laid.vb.y} ${laid.vb.w} ${laid.vb.h}`}
          width={Math.round(laid.vb.w)}
          height={Math.round(laid.vb.h)}
          role="img"
          aria-label="Облако впечатлений"
        >
          {laid.items.map((w, i) => (
            <text
              key={`${w.text}-${i}`}
              transform={`translate(${w.x.toFixed(1)},${w.y.toFixed(1)}) rotate(${w.rotate || 0})`}
              fontSize={w.size}
              fontWeight={w.bold}
              fontStyle={w.source === "phrase" ? "italic" : "normal"}
              fill={colorFor(w.text)}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: FONT }}
            >
              {w.text}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
