// Result screen — data-driven tasting summary based on liked flavors only.
// Sections (top→bottom):
//   1. Header ("Дегустация завершена") — unchanged
//   2. Aura — 3-color floating cloud built from the top-3 liked colors
//   3. Dynamic phrase line — "Сегодняшний вечер для вас X, Y и Z."
//   4. Топ-3 вкусов — podium of the 3 highest-scoring liked flavors
//   5. Также вам понравились: — rest of liked flavors, ranked 4+
//   6. Farewell / restart link

const { useMemo, useState: useResultState } = React;

// ─── Helpers ──────────────────────────────────────────────────────────────

function rankedLiked(tastings) {
  return [...ICE_CREAMS]
    .map((ic) => ({ ic, t: tastings[ic.id] || {} }))
    .filter((x) => x.t.liked)
    .map((x) => ({ ...x, score: computeFlavorScore(x.t) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aN = a.t.impressions?.length || 0;
      const bN = b.t.impressions?.length || 0;
      return bN - aN;
    });
}

// Compose the dynamic phrase line from the top-3 ranked flavors. Returns
// null when there's nothing to say.
//
// Rules per spec: keep "про" only on the very first phrase, strip it from
// the rest, and split any inner " и " inside a phrase into separate items
// joined with commas — so the final line only ever has one " и ", right
// before the last item.
function eveningLine(top3) {
  const raw = top3.map((x) => x.ic.phrase).filter(Boolean);
  if (!raw.length) return null;
  const parts = [];
  raw.forEach((p, i) => {
    const stripped = i === 0 ? p : p.replace(/^про\s+/i, "");
    // Split inner "и" so the final line never has it twice.
    stripped.split(/\s+и\s+/i).forEach((s) => {
      const t = s.trim();
      if (t) parts.push(t);
    });
  });
  if (parts.length === 1) return `Сегодняшний вечер для вас ${parts[0]}.`;
  const head = parts.slice(0, -1).join(", ");
  const tail = parts[parts.length - 1];
  return `Сегодняшний вечер для вас ${head} и ${tail}.`;
}

// Group ice creams by their paired tea, keeping only those whose tea-match
// slider scored +2 or higher (the "Сочетание удачно" and "Идеальный мэтч"
// steps). Returns an array of { tea, items } where items is sorted by the
// match score descending. Teas with no qualifying matches are excluded.
function perfectMatches(tastings) {
  const groups = new Map();
  ICE_CREAMS.forEach((ic) => {
    const t = tastings[ic.id];
    if (!t || t.match == null) return;
    const pts = MATCH_SLIDER_DEF.steps[t.match]?.pts ?? 0;
    if (pts < 2) return;
    const tea = ic.pairedTea || "—";
    if (!groups.has(tea)) groups.set(tea, []);
    groups.get(tea).push({ ic, t, matchPts: pts });
  });
  // Sort each group: higher match points first; tie → flavor name.
  const out = [];
  for (const [tea, items] of groups.entries()) {
    items.sort((a, b) => {
      if (b.matchPts !== a.matchPts) return b.matchPts - a.matchPts;
      return a.ic.title.localeCompare(b.ic.title, "ru");
    });
    out.push({ tea, items });
  }
  // Sort teas: more perfect matches first, then by tea name.
  out.sort((a, b) => {
    if (b.items.length !== a.items.length) return b.items.length - a.items.length;
    return a.tea.localeCompare(b.tea, "ru");
  });
  return out;
}

// Top-N impression chips across all evaluated ice creams. Counts how
// often each tag was chosen; ties broken by the tag's intrinsic positive
// weight (more positive wins) so the cloud leans into what the guest
// actually liked when frequencies are equal.
function topImpressions(tastings, k = 5) {
  const counts = new Map();
  Object.values(tastings).forEach((t) => {
    (t?.impressions || []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const wa = IMPRESSION_WEIGHTS[a[0]] ?? 0;
      const wb = IMPRESSION_WEIGHTS[b[0]] ?? 0;
      return wb - wa;
    })
    .slice(0, k)
    .map(([tag]) => tag);
}

// Raw sum of hidden points for one flavour-slider param across all 13
// evaluated ice creams. Used by the "Вкусовой портрет" axis chart. Items
// without a value for that slider are skipped (count as 0).
function paramSum(tastings, sliderKey) {
  const def = FLAVOR_SLIDER_DEFS.find((d) => d.key === sliderKey);
  if (!def) return 0;
  let s = 0;
  Object.values(tastings).forEach((t) => {
    const i = t?.flavor?.[sliderKey];
    if (i == null) return;
    s += def.steps[i]?.pts ?? 0;
  });
  return s;
}

// A single axis row inside the "Вкусовой портрет" block. Domain is the
// raw sum [-13, +26] across 13 ice creams; we shift by -6.5 to land the
// midpoint at 0 on a symmetric [-20, 20] axis, then map to a 0-100% left
// percentage for the star (✦).
function PortraitAxis({ label, sum }) {
  const normalized = sum - 6.5;
  const pct = Math.max(2, Math.min(98, ((normalized + 20) / 40) * 100));
  return (
    <div className="portrait-axis">
      <div className="portrait-axis__label">{label}</div>
      <div className="portrait-axis__track">
        <span className="portrait-axis__line" />
        <span className="portrait-axis__center" aria-hidden="true" />
        <span
          className="portrait-axis__star"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        >
          ✦
        </span>
      </div>
      <div className="portrait-axis__ends">
        <span>Частый дисбаланс</span>
        <span>Идеальное попадание</span>
      </div>
    </div>
  );
}

// ─── Vibrant color mapping ─────────────────────────────────────────────
// The aura needs vivid, saturated colors to glow. Some ice cream colors
// (browns, beiges, deep wines) read as muddy when blended. We remap any
// dull/dark/light input into a vibrant analogous color before handing it
// to the gradient so the cloud never looks dirty.

function hexToHsl(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
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
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return "#" + to(r) + to(g) + to(b);
}

function vibrant(hex) {
  const { h, s, l } = hexToHsl(hex);
  let nh = h, ns = s, nl = l;

  const warm = h < 60 || h > 320;
  const cool = h >= 180 && h <= 290;
  const isBrownBeige = warm && s < 0.45 && l > 0.22;
  const isCoolGrey   = cool && s < 0.32;

  if (isBrownBeige) {
    // Brown / coffee / beige → vibrant amber-gold
    nh = warm && h > 0 && h < 50 ? 36 : (h > 320 ? 18 : 36);
  } else if (isCoolGrey) {
    // Cool grey → glowing indigo / electric violet
    nh = 250;
  }
  // Always land in a bright, saturated, glowable range so the three
  // colors mix into pleasing in-between hues (not grey/brown).
  ns = Math.max(0.78, Math.min(0.95, ns + 0.3));
  nl = 0.62;
  return hslToHex(nh, ns, nl);
}

// Derive a small palette around the aura color so tier rows + tag cloud
// echo the bubble's hue instead of the green accent. Inputs are first
// sanitized via `vibrant()` so dull seed colors still produce a clean tint.
function auraShades(hex) {
  const { h } = hexToHsl(vibrant(hex || "#FFB987"));
  return {
    base:   hslToHex(h, 0.85, 0.62),                  // saturated, mid lightness
    bg:     hslToHex(h, 0.55, 0.94),                  // very light wash
    bgEnd:  hslToHex(h, 0.55, 0.97),                  // even lighter for gradient end
    border: hslToHex(h, 0.55, 0.78),
    text:   hslToHex(h, 0.6,  0.3),                   // deep, readable
    glow:   hslToHex(h, 0.85, 0.55),
  };
}

// Three signature colors for the aura — pulled from the top-3 ranked
// liked flavors and remapped through `vibrant()` so the cloud is always
// vivid and never muddy.
const AURA_FALLBACK = ["#FFB987", "#FF6B8E", "#7C7CFF"];
function auraTriad(top3) {
  const cols = top3.map((x) => x.ic.color).filter(Boolean);
  let i = 0;
  while (cols.length < 3) cols.push(AURA_FALLBACK[i++ % AURA_FALLBACK.length]);
  return cols.slice(0, 3).map(vibrant);
}

// Pretty-print the score. Whole numbers stay integer ("15"), partial scores
// keep 1 decimal ("5.7"). No leading "+" — the unit ("баллов") makes the
// type clear.
function formatScore(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? `${r}` : `${r.toFixed(1)}`;
}

// Russian pluralization for "балл / балла / баллов" based on the score.
function pluralizeBall(n) {
  if (!Number.isInteger(n)) return "балла";
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return "баллов";
  if (mod10 === 1) return "балл";
  if (mod10 >= 2 && mod10 <= 4) return "балла";
  return "баллов";
}

// ─── Aura — Yandex-Vibe-style fluid mesh gradient ───────────────────
// Built from the TOP-1 flavor color only. `derivePalette` sanitizes dull
// inputs and spins them into 4 vibrant analogous shades that read like a
// cohesive, glowing premium gradient.

const PALETTE_FALLBACK = ["#FFB987", "#FF8E6B", "#FFCB89", "#F9A26C"];

function derivePalette(baseHex) {
  if (!baseHex) return PALETTE_FALLBACK;
  const { h, s, l } = hexToHsl(baseHex);

  // Anchor dull/dark inputs to a vibrant equivalent hue so the gradient
  // always glows — brown/beige → amber; cool grey → indigo; very dark
  // colors keep their hue but get lifted.
  let baseH = h;
  const warm = h < 60 || h > 320;
  const cool = h >= 180 && h <= 290;
  if (s < 0.4 && warm && l > 0.2) baseH = 36;       // amber-gold
  else if (s < 0.3 && cool)        baseH = 250;     // electric indigo
  // (otherwise the hue is already worth keeping)

  // Four analogous shades spanning ~85° — a cohesive, glowing palette.
  return [
    hslToHex(baseH,        0.9,  0.62),
    hslToHex(baseH + 30,   0.88, 0.6 ),
    hslToHex(baseH - 30,   0.85, 0.65),
    hslToHex(baseH + 60,   0.92, 0.6 ),
  ];
}

function Aura({ colors }) {
  // Strict spec: only the TOP-1 color drives the bubble. `vibrant()`
  // sanitizes dull inputs (brown→amber, grey→indigo, etc.) but the
  // sanitized result is still a SINGLE hue.
  const base = (colors && colors[0]) || "#FFB987";
  const sanitized = vibrant(base);
  const style = {
    "--c1": sanitized,
    "--aura-glow": sanitized + "66",
  };
  return (
    <div className="aura aura--bubble" style={style} aria-hidden="true">
      <div className="aura__inner">
        <div className="aura__blob aura__blob--1" />
        <div className="aura__blob aura__blob--2" />
        <div className="aura__blob aura__blob--3" />
        <div className="aura__noise" />
      </div>
    </div>
  );
}

// ─── Auth reminder (inline mini-form) ───────────────────────────────────

function AuthReminder({ setUser }) {
  const [name, setName] = useResultState("");
  const [phone, setPhone] = useResultState("");

  const submit = () => {
    if (!phone.trim()) return;
    setUser({ name: name.trim() || "Гость", phone: phone.trim() });
  };

  return (
    <div className="auth-cta">
      <h3 className="auth-cta__title">Сохраните результаты</h3>
      <div className="auth-cta__form">
        <input
          className="auth-cta__input"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="auth-cta__input"
          placeholder="+7 ___ ___ __ __"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <button
        className="btn btn--primary auth-cta__submit"
        disabled={!phone.trim()}
        onClick={submit}
      >
        Сохранить и войти
      </button>
    </div>
  );
}

// ─── Result screen ──────────────────────────────────────────────────────

function ResultScreen({ go, tastings, user, setUser, reset, reviewIceCream, pinnedTop3 }) {
  const liked = useMemo(() => rankedLiked(tastings), [tastings]);
  // If the guest hand-picked their top-3 on the previous screen, honor it:
  // pinned ids become the podium (still ranked by score among themselves),
  // and the remaining liked entries slide into "Также вы оценили".
  const pinnedSet = useMemo(
    () => new Set(pinnedTop3 || []),
    [pinnedTop3]
  );
  const top3 = useMemo(() => {
    if (pinnedSet.size > 0) {
      return liked.filter((x) => pinnedSet.has(x.ic.id)).slice(0, 3);
    }
    return liked.slice(0, 3);
  }, [liked, pinnedSet]);
  const others = useMemo(() => {
    if (pinnedSet.size > 0) {
      return liked.filter((x) => !pinnedSet.has(x.ic.id));
    }
    return liked.slice(3);
  }, [liked, pinnedSet]);
  const triad  = useMemo(() => auraTriad(top3), [top3]);
  const line   = useMemo(() => eveningLine(top3), [top3]);
  const matches = useMemo(() => perfectMatches(tastings), [tastings]);
  const impressions = useMemo(() => topImpressions(tastings, 5), [tastings]);

  // Aura-tint shades — drive top-3 row highlights + tag cloud styling so
  // the result screen feels like an extension of the bubble.
  const tintShades = useMemo(
    () => auraShades(top3[0]?.ic.color),
    [top3]
  );
  const tintStyle = {
    "--aura-tint":         tintShades.base,
    "--aura-tint-bg":      tintShades.bg,
    "--aura-tint-bg-end":  tintShades.bgEnd,
    "--aura-tint-border":  tintShades.border,
    "--aura-tint-text":    tintShades.text,
    "--aura-tint-glow":    tintShades.glow,
  };

  return (
    <div className="screen">
      <div className="result-scroll" style={tintStyle}>
        {/* Header */}
        <div className="result-head">
          <div className="result-head__icon">
            <IconSparkles size={26} stroke={1.5} />
          </div>
          <div className="result-head__thanks">Спасибо, что были с&nbsp;нами</div>
          <h1 className="result-head__title">Дегустация завершена</h1>
          <p className="result-head__sub">
            Вы попробовали и оценили {ICE_CREAMS.length}&nbsp;вкусов сегодняшнего сета.
          </p>
        </div>

        {/* Aura — its own section below header, built from top-3 colors */}
        <div className="aura-section" aria-hidden="true">
          <Aura colors={triad} />
        </div>

        {/* Dynamic phrase or fallback */}
        {line ? (
          <p className="evening-line">{line}</p>
        ) : (
          <p className="evening-line evening-line--empty">
            Отметьте сердечком вкусы, которые понравились — здесь появится фраза о вашем вечере.
          </p>
        )}

        {/* Top-3 podium — one grouped card with rows + dividers */}
        {top3.length > 0 && (
          <div className="podium-section">
            <div className="tier-head">
              <div className="profile-card-head__eyebrow tier-head__title">Топ-3 вкусов</div>
              <span className="tier-head__col">Баллы</span>
            </div>

            <ol className="tier-card">
              {top3.map((x, i) => (
                <li
                  key={x.ic.id}
                  className={`tier-row tier-row--accent ${i === 0 ? "tier-row--winner" : ""} tier-row--clickable`}
                  onClick={() => reviewIceCream?.(x.ic.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="tier-row__rank tabnum">{i + 1}</span>
                  <div className="tier-row__body">
                    <div className="tier-row__title-row">
                      <span className="tier-row__title">{x.ic.title}</span>
                      <span className="tier-row__num tabnum">№{x.ic.num}</span>
                    </div>
                    <div className="tier-row__line">{x.ic.short}</div>
                  </div>
                  <span className="tier-row__score tabnum">
                    {formatScore(x.score)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* "Также вы оценили" — same layout, heart icon stands in for the rank */}
        {others.length > 0 && (
          <div className="favs-section">
            <div className="tier-head">
              <div className="profile-card-head__eyebrow tier-head__title">Также вы оценили</div>
              <span className="tier-head__col">Баллы</span>
            </div>
            <ol className="tier-card">
              {others.map((x) => (
                <li
                  key={x.ic.id}
                  className="tier-row tier-row--liked tier-row--clickable"
                  onClick={() => reviewIceCream?.(x.ic.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="tier-row__heart" aria-label="Понравилось">
                    <IconHeart size={14} filled stroke={2} />
                  </span>
                  <div className="tier-row__body">
                    <div className="tier-row__title-row">
                      <span className="tier-row__title">{x.ic.title}</span>
                      <span className="tier-row__num tabnum">№{x.ic.num}</span>
                    </div>
                    <div className="tier-row__line">{x.ic.short}</div>
                  </div>
                  <span className="tier-row__score tabnum">
                    {formatScore(x.score)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Вкусовой портрет дегустации — 3-axis star chart */}
        <div className="portrait-section">
          <div className="profile-card-head__eyebrow">Вкусовой портрет дегустации</div>
          <p className="portrait-section__intro">
            Чем правее расположена звезда, тем чаще вы&nbsp;находили вкус идеально сбалансированным. Смещение влево говорит о&nbsp;том, что вы&nbsp;более требовательны к&nbsp;деталям и&nbsp;находитесь в&nbsp;поиске своего уникального баланса.
          </p>
          <div className="portrait">
            <PortraitAxis label="Баланс сладости"    sum={paramSum(tastings, "sweetness")} />
            <PortraitAxis label="Оценка кислотности" sum={paramSum(tastings, "sourness")} />
            <PortraitAxis label="Восприятие текстуры" sum={paramSum(tastings, "texture")} />
          </div>
        </div>

        {/* Floating impression cloud — top 5 most-used tags */}
        {impressions.length > 0 && (
          <div className="impressions-section">
            <div className="profile-card-head__eyebrow">Впечатление</div>
            <div className="tag-cloud">
              {impressions.map((tag, i) => (
                <span
                  key={tag}
                  className={`tag-cloud__pill tag-cloud__pill--${(i % 5) + 1}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Perfect matches — one elegant pair-card per tea */}
        {matches.length > 0 && (
          <div className="matches-section">
            <div className="profile-card-head__eyebrow">Идеальный мэтч</div>
            <h2 className="profile-card-head__title">Чай нашёл свою пару</h2>

            <div className="pair-cards">
              {matches.map((g) => (
                <article
                  key={g.tea}
                  className="pair-card"
                  data-tea={g.tea}
                >
                  <div className="pair-card__head">
                    <span className="pair-card__eyebrow">в&nbsp;паре с&nbsp;чаем</span>
                    <span className="pair-card__tea">{g.tea}</span>
                  </div>
                  <ul className="pair-card__list">
                    {g.items.map((x) => (
                      <li
                        key={x.ic.id}
                        className="pair-card__row pair-card__row--clickable"
                        onClick={() => reviewIceCream?.(x.ic.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="pair-card__name">{x.ic.title}</span>
                        <span className="pair-card__num tabnum">№{x.ic.num}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Auth reminder — guest users only */}
        {!user?.phone && <AuthReminder setUser={setUser} />}

        {/* Bottom */}
        <div className="result-bottom">
          <button className="text-link" onClick={reset}>
            Вернуться на Главную
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ResultScreen, Aura, AuthReminder,
  rankedLiked, eveningLine, auraTriad, formatScore, perfectMatches, topImpressions, paramSum,
});
