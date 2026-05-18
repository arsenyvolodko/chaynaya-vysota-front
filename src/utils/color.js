// hex ↔ HSL утилиты + палитра-обёртки для «акцентной» окраски подиума.
// Логика взята из макета result.jsx (`auraShades`) — приглушенный фон,
// насыщенный текст того же тона, мягкое свечение для подиум-победителя.

function hexToHsl(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h, s, l) {
  const normH = ((h % 360) + 360) % 360;
  const safeS = Math.max(0, Math.min(1, s));
  const safeL = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * safeL - 1)) * safeS;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = safeL - c / 2;
  let r;
  let g;
  let b;
  if (normH < 60) { r = c; g = x; b = 0; }
  else if (normH < 120) { r = x; g = c; b = 0; }
  else if (normH < 180) { r = 0; g = c; b = x; }
  else if (normH < 240) { r = 0; g = x; b = c; }
  else if (normH < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const FALLBACK = "#FFB987";

export function productPalette(hex) {
  const base = hex || FALLBACK;
  const { h } = hexToHsl(base);
  return {
    base: hslToHex(h, 0.85, 0.62),
    bg: hslToHex(h, 0.55, 0.94),
    bgEnd: hslToHex(h, 0.55, 0.97),
    border: hslToHex(h, 0.55, 0.78),
    text: hslToHex(h, 0.6, 0.3),
    glow: hslToHex(h, 0.85, 0.55),
  };
}
