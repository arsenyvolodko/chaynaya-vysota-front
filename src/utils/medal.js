// Цвета медалей по позиции: золото, серебро, бронза. Возвращаем CSS-переменные
// (--medal-bg/border/text), которые читают .podium-slot / .ranking__rank--medal.
const MEDAL_PALETTE = [
  { bg: "#fff5d4", border: "#e3bb45", text: "#9c7926" }, // 1 — gold
  { bg: "#f0f1f4", border: "#b8bcc4", text: "#73767e" }, // 2 — silver
  { bg: "#fae0c6", border: "#cf8744", text: "#88491b" }, // 3 — bronze
];

// i — индекс 0..2 (1-3 место). Для мест за пьедесталом возвращаем undefined.
export function medalStyle(i) {
  const c = MEDAL_PALETTE[i];
  if (!c) return undefined;
  return {
    "--medal-bg": c.bg,
    "--medal-border": c.border,
    "--medal-text": c.text,
  };
}

export { MEDAL_PALETTE };
