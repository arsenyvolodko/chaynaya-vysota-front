import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import ShareSheet from "../components/ShareSheet.jsx";
import { IconChevronLeft, IconMedal, IconShare, IconSparkles, IconTelegram } from "../components/icons.jsx";
import { getResult, getSharedResult } from "../api/catalog";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTasting } from "../hooks/useTasting.js";
import { productPalette } from "../utils/color.js";
import { formatPhoneInput, isValidE164, normalizeToE164 } from "../utils/phone.js";

function vibrant(hex) {
  if (!hex) return "#FFB987";
  return hex;
}

function pluralRu(n, forms) {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function Aura({ color }) {
  const style = { "--c1": vibrant(color), "--aura-glow": (vibrant(color) || "#ffb987") + "66" };
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

function AuthReminder({ onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e?.preventDefault?.();
    const phoneE164 = normalizeToE164(phone);
    if (!isValidE164(phoneE164)) {
      setError("Введите телефон в формате +7 ___ ___ __ __");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ phone: phoneE164, name: name.trim() || undefined });
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сохранить.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-cta" onSubmit={submit}>
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
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
        />
      </div>
      {error && <div className="error-banner" style={{ margin: "0 0 8px" }}>{error}</div>}
      <button type="submit" className="btn btn--primary auth-cta__submit" disabled={!phone.trim() || submitting}>
        {submitting ? "Сохраняем…" : "Сохранить и войти"}
      </button>
    </form>
  );
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function IceCreamStats({ stats }) {
  if (!stats) return null;
  const sortAsc = (a, b) => (a[1].amount || 0) - (b[1].amount || 0);
  const iceCreamEntries = stats.ice_cream
    ? Object.entries(stats.ice_cream).sort(sortAsc)
    : [];
  const teaEntries = stats.tea
    ? Object.entries(stats.tea).sort(sortAsc)
    : [];
  if (iceCreamEntries.length === 0 && teaEntries.length === 0) return null;

  const renderRow = ([name, v]) => (
    <div key={name} className="stats-row">
      <span className="stats-row__amount tabnum">{v.amount}</span>
      {v.image ? (
        <img className="stats-row__icon" src={v.image} alt="" aria-hidden="true" />
      ) : (
        <span className="stats-row__icon stats-row__icon--empty" aria-hidden="true" />
      )}
      <span className="stats-row__name">{capitalize(name)}</span>
    </div>
  );

  const Column = ({ title, entries }) => (
    <div className="stats-col">
      <div className="stats-col__heading">{title}</div>
      <div className="stats-col__subhead">
        <span className="stats-col__subhead-amount">Кол-во шариков</span>
        <span className="stats-col__subhead-name">сорт</span>
      </div>
      <div className="stats-col__list">{entries.map(renderRow)}</div>
    </div>
  );

  return (
    <section className="stats-section">
      <div className="profile-card-head__eyebrow">Попробовали и оценили</div>
      <p className="stats-section__intro">
        Инфографика&nbsp;— сколько шариков мороженого каждого типа и&nbsp;основы вы&nbsp;попробовали и&nbsp;оценили за&nbsp;вечер.
      </p>
      <div className="stats-grid">
        {iceCreamEntries.length > 0 && (
          <Column title="Тип мороженого" entries={iceCreamEntries} />
        )}
        {teaEntries.length > 0 && (
          <Column title="Основа мороженого" entries={teaEntries} />
        )}
      </div>
    </section>
  );
}

function portraitPct(userTotal, minTotal, maxTotal) {
  // Кусочная шкала: 0 всегда в центре (50%). Левая половина — линейно
  // мапит [min, 0] → [0%, 50%], правая — [0, max] → [50%, 100%].
  // Масштаб у половин может отличаться: это сознательный приём, чтобы
  // нейтраль визуально была по центру при смещённых оценках.
  // Фолбэк — если одна из сторон отсутствует, обычная линейная шкала.
  let pct;
  if (minTotal < 0 && maxTotal > 0) {
    pct = userTotal <= 0
      ? (1 - userTotal / minTotal) * 50
      : 50 + (userTotal / maxTotal) * 50;
  } else {
    const range = maxTotal - minTotal;
    pct = range > 0 ? ((userTotal - minTotal) / range) * 100 : 50;
  }
  return Math.max(2, Math.min(98, pct));
}

function PortraitAxis({ name, userTotal, minTotal, maxTotal }) {
  const pct = portraitPct(userTotal, minTotal, maxTotal);
  const showZeroCenter = minTotal < 0 && maxTotal > 0;
  return (
    <div className="portrait-axis">
      <div className="portrait-axis__label">{name}</div>
      <div className="portrait-axis__track">
        <span className="portrait-axis__line" />
        {showZeroCenter && <span className="portrait-axis__center" aria-hidden="true" />}
        <span className="portrait-axis__star" style={{ left: `${pct}%` }} aria-hidden="true">✦</span>
      </div>
    </div>
  );
}

function PortraitAxisVertical({ name, userTotal, minTotal, maxTotal }) {
  const pct = portraitPct(userTotal, minTotal, maxTotal);
  const showZeroCenter = minTotal < 0 && maxTotal > 0;
  return (
    <div className="portrait-vaxis">
      <div className="portrait-vaxis__track">
        <span className="portrait-vaxis__line" />
        {showZeroCenter && <span className="portrait-vaxis__center" aria-hidden="true" />}
        <span className="portrait-vaxis__star" style={{ bottom: `${pct}%` }} aria-hidden="true">✦</span>
      </div>
      <div className="portrait-vaxis__label">{name}</div>
    </div>
  );
}

function PortraitRadar({ chart }) {
  const svgRef = useRef(null);
  const labelRefs = useRef([]);
  const criterias = chart?.criterias || [];
  const N = criterias.length;

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

  if (N < 3) return null;

  const placement = chart?.label_placement === "vertices" ? "vertices" : "edges";
  const color = chart?.color || null;

  // Единый viewBox независимо от placement — это даёт одинаковый
  // отображаемый размер шрифта подписей между чартами на одной странице
  // (HTML-pixels в foreignObject интерпретируются в координатах viewBox).
  const sizeX = 460;
  const sizeY = 400;
  const cx = sizeX / 2;
  const cy = sizeY / 2;
  const R = 118;
  const apothem = R * Math.cos(Math.PI / N);
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
  const axisAnchor = (i) => (placement === "vertices" ? vertices[i] : midpoints[i]);
  const axisAngle = (i) => (placement === "vertices" ? vertexAngle(i) : sideAngle(i));
  const labelBaseDist = placement === "vertices" ? R : apothem;

  // Шаг между точками шкалы = innerR (от центра до «нуля»). Шкала имеет 5
  // «делений» — выбран средний фиксированный размер, чтобы радар одного
  // продукта выглядел как радар детальной страницы.
  const slots = 5;
  const outerR = 0.92;
  const innerR = outerR / slots;
  const frac = (c) => {
    const range = (c.max_total ?? 0) - (c.min_total ?? 0);
    if (range <= 0) return (innerR + outerR) / 2;
    const f = ((c.user_total ?? 0) - (c.min_total ?? 0)) / range;
    return innerR + Math.max(0, Math.min(1, f)) * (outerR - innerR);
  };

  const points = criterias.map((c, i) => {
    const f = frac(c);
    const anchor = axisAnchor(i);
    return { x: cx + (anchor.x - cx) * f, y: cy + (anchor.y - cy) * f };
  });

  const userPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ") + " Z";

  const ringPolygon = (f) =>
    vertices
      .map((v) => {
        const x = cx + (v.x - cx) * f;
        const y = cy + (v.y - cy) * f;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

  const accent = color || "#b58fd4";

  return (
    <div className="portrait-radar">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${sizeX} ${sizeY}`}
        className="portrait-radar__svg"
        aria-label={chart.name || "Радар"}
      >
        {Array.from({ length: slots }, (_, k) => innerR + (outerR - innerR) * (k / (slots - 1))).map((f, i, arr) => (
          <polygon
            key={`ring-${i}`}
            points={ringPolygon(f)}
            fill="none"
            stroke="var(--stone-200)"
            strokeWidth="1"
            strokeDasharray={i === arr.length - 1 ? "" : "2 3"}
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
            />
          );
        })}
        <path
          d={userPath}
          fill={accent}
          fillOpacity={0.55}
          stroke={accent}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={accent}
            stroke={accent}
            strokeWidth={1.2}
          />
        ))}
        {criterias.map((c, i) => {
          const a = axisAngle(i);
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          const lx = cx + (labelBaseDist + 14) * cos;
          const ly = cy + (labelBaseDist + 14) * sin;
          const boxW = 84;
          const boxH = 36;
          const fx = lx + cos * (boxW / 2) - boxW / 2;
          const fy = ly + sin * (boxH / 2) - boxH / 2;
          let textAlign = "center";
          if (cos > 0.25) textAlign = "left";
          else if (cos < -0.25) textAlign = "right";
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
                  fontSize: 10.5,
                }}
              >
                <div style={{ wordBreak: "normal", overflowWrap: "anywhere", hyphens: "auto" }}>
                  {String(c.name || "").replace(/\//g, "/​")}
                </div>
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

export default function ResultPage({ shared = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const { wasSkipped, updateProfile, user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderHidden, setReminderHidden] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const promise = shared ? getSharedResult(params.resultId) : getResult(params.id);
    promise
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [shared, params.id, params.resultId]);

  // products подгружаем по tastingId: в shared берём из payload, иначе из URL
  const tastingId = shared ? result?.tasting_id : params.id;
  const { productById, products } = useTasting(tastingId || null, { autoJoin: false });

  const podium = result?.podium || [];
  const criteriaBreakdown = result?.criteria_breakdown || [];
  const resultCharts = result?.charts || [];
  const topTags = result?.top_tags || [];
  const teaMatches = result?.tea_matches || [];
  const isTea = result?.type === "tea";

  const horizontalBreakdown = criteriaBreakdown.filter((c) => c.orientation !== "vertical");
  const verticalBreakdown = criteriaBreakdown.filter((c) => c.orientation === "vertical");

  // Все продукты-кандидаты на пьедестал (is_nominated=true), отсортированы
  // по баллам от большего к меньшему. Подиум — подсписок этого.
  const allCandidates = useMemo(() => {
    return products
      .filter((p) => p.is_nominated)
      .map((p) => ({ product: p, score: p.total_score ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }, [products]);

  const ratedCount = useMemo(
    () => products.filter((p) => p.is_reviewed).length,
    [products]
  );

  const podiumProducts = useMemo(
    () => podium.map((row) => ({ row, p: productById(row.id) || null })),
    [podium, productById]
  );

  const eveningLine = useMemo(() => {
    const phrases = podiumProducts
      .map(({ p }) => (p?.result_phrase || "").trim())
      .filter(Boolean);
    if (!phrases.length) return null;
    const PREFIX = "Сегодняшний вечер для вас — это история про";
    if (phrases.length === 1) return `${PREFIX} ${phrases[0]}.`;
    const head = phrases.slice(0, -1).join(", ");
    const tail = phrases[phrases.length - 1];
    return `${PREFIX} ${head} и ${tail}.`;
  }, [podiumProducts]);

  const auraColor = useMemo(() => {
    const top = podiumProducts[0]?.p;
    return top?.color || "#FFB987";
  }, [podiumProducts]);

  // Все три строки топ-3 окрашиваются цветом продукта на 1-м месте.
  const topPalette = useMemo(() => productPalette(auraColor), [auraColor]);

  const showAuthReminder = !shared && wasSkipped && !user?.phone && !reminderHidden;
  const shareUrl = result?.result_id
    ? `${window.location.origin}/r/${result.result_id}`
    : null;

  if (loading) return <div className="fullscreen-center">Считаем результат…</div>;
  if (error || !result) return <div className="fullscreen-center">Не удалось загрузить результат.</div>;

  const scrollStyle = {
    "--row-bg": topPalette.bg,
    "--row-bg-end": topPalette.bgEnd,
    "--row-border": topPalette.border,
    "--row-text": topPalette.text,
    "--row-glow": topPalette.glow,
  };

  return (
    <div className="result-scroll" style={scrollStyle}>
      <PageHeader
        back={
          fromProfile ? (
            <button
              className="icon-btn icon-btn--leading"
              onClick={() => navigate("/profile")}
            >
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
          ) : null
        }
      />

      <div className="result-head">
        <div className="result-head__icon">
          <IconSparkles size={26} stroke={1.5} />
        </div>
        <div className="result-head__thanks">
          {shared ? "Чайная Высота" : "Спасибо, что были с нами"}
        </div>
        <h1 className="result-head__title">
          {shared ? (result?.title || "Результаты дегустации") : "Дегустация завершена"}
        </h1>
      </div>

      <div className="aura-section" aria-hidden="true">
        <Aura color={auraColor} />
      </div>

      {eveningLine && <p className="evening-line">{eveningLine}</p>}

      {!shared && (
        <div className="result-section">
          <p className="result-intro">
            Вы&nbsp;попробовали и оценили <strong>{ratedCount}</strong>&nbsp;{pluralRu(ratedCount, ["сорт", "сорта", "сортов"])}, из&nbsp;них выделили в&nbsp;кандидаты на&nbsp;пьедестал <strong>{allCandidates.length}</strong>:
          </p>
          {allCandidates.length > 0 ? (
            <>
              {!isTea && (
                <div className="tier-head tier-head--candidates">
                  <span className="tier-head__col">Баллы</span>
                </div>
              )}
              <ol className="candidate-list">
              {allCandidates.map(({ product, score }) => (
                <li
                  key={product.id}
                  className="candidate-row"
                  onClick={() => navigate(`/tasting/${tastingId}/product/${product.id}?from=result`)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="candidate-row__medal" aria-hidden="true">
                    <IconMedal size={14} filled stroke={1.8} />
                  </span>
                  <div className="candidate-row__body">
                    <span className="candidate-row__title">{product.name}</span>
                  </div>
                  {!isTea && (
                    <span className="candidate-row__score tabnum">{score}</span>
                  )}
                </li>
              ))}
              </ol>
            </>
          ) : (
            <div className="candidate-list__empty">
              Вы не&nbsp;отметили ни&nbsp;одного сорта в&nbsp;кандидаты.
            </div>
          )}
        </div>
      )}

      {podium.length > 0 && (
        <div className="result-section">
          <p className="result-intro">
            {shared
              ? "Лидеры личного рейтинга:"
              : "В итоге лидерами вашего личного рейтинга стали:"}
          </p>
          <div className="podium-section">
            <div className="tier-head">
              <div className="profile-card-head__eyebrow tier-head__title">Топ-3 вкусов</div>
              {!isTea && <span className="tier-head__col">Баллы</span>}
            </div>
            <ol className="tier-card tier-card--stacked">
              {podium.map((row, i) => {
                const rowStyle = {
                  "--row-bg": topPalette.bg,
                  "--row-bg-end": topPalette.bgEnd,
                  "--row-border": topPalette.border,
                  "--row-text": topPalette.text,
                  "--row-glow": topPalette.glow,
                };
                const clickable = !shared;
                return (
                  <li
                    key={row.id}
                    style={rowStyle}
                    className={`tier-row tier-row--colored ${i === 0 ? "tier-row--winner" : ""} ${clickable ? "tier-row--clickable" : ""}`}
                    onClick={clickable ? () => navigate(`/tasting/${tastingId}/product/${row.id}?from=result`) : undefined}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                  >
                    <span className="tier-row__rank tabnum">{row.place}</span>
                    <div className="tier-row__body">
                      <div className="tier-row__title-row">
                        <span className="tier-row__title">{row.name}</span>
                        {row.number != null && <span className="tier-row__num tabnum">№{row.number}</span>}
                      </div>
                    </div>
                    {!isTea && (
                      <span className="tier-row__score tabnum">
                        {row.total_score != null ? row.total_score : "—"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      <IceCreamStats stats={result?.ice_cream_stats} />

      {(criteriaBreakdown.length > 0 || resultCharts.length > 0) && (
        <div className="portrait-section">
          <div className="profile-card-head__eyebrow">Вкусовой портрет дегустации</div>
          <p className="portrait-section__intro">
            {shared
              ? "Звезда показывает, где оценки автора расположились на шкале от минимально возможного к максимально возможному баллу по каждому критерию."
              : "Звезда показывает, где ваши оценки расположились на шкале от минимально возможного к максимально возможному баллу по каждому критерию."}
          </p>
          {verticalBreakdown.length > 0 && (
            <div className="portrait-vrow">
              {verticalBreakdown.map((c) => (
                <PortraitAxisVertical
                  key={c.id}
                  name={c.name}
                  userTotal={c.user_total}
                  minTotal={c.min_total}
                  maxTotal={c.max_total}
                />
              ))}
            </div>
          )}
          {resultCharts.map((chart) => (
            <div key={chart.id} className="portrait-chart-block">
              <div className="portrait-chart-block__title">{chart.name}</div>
              {chart.description && (
                <div className="portrait-chart-block__hint">{chart.description}</div>
              )}
              <PortraitRadar chart={chart} />
            </div>
          ))}
          {horizontalBreakdown.length > 0 && (
            <div className="portrait">
              {horizontalBreakdown.map((c) => (
                <PortraitAxis
                  key={c.id}
                  name={c.name}
                  userTotal={c.user_total}
                  minTotal={c.min_total}
                  maxTotal={c.max_total}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {topTags.length > 0 && (
        <div className="impressions-section">
          <div className="profile-card-head__eyebrow">Впечатление</div>
          <div className="tag-cloud">
            {topTags.map((t, i) => (
              <span key={t.id} className={`tag-cloud__pill tag-cloud__pill--${(i % 5) + 1}`}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {teaMatches.length > 0 && (
        <div className="matches-section">
          <div className="profile-card-head__eyebrow">Идеальный мэтч</div>
          <h2 className="profile-card-head__title">Чай нашёл свою пару</h2>
          <div className="pair-cards">
            {teaMatches.map((m) => (
              <article key={m.tea_id} className="pair-card">
                <div className="pair-card__head">
                  <span className="pair-card__eyebrow">в&nbsp;паре с&nbsp;чаем</span>
                  <div className="pair-card__tea-row">
                    {m.tea_logo && (
                      <img className="pair-card__tea-logo" src={m.tea_logo} alt="" />
                    )}
                    <span className="pair-card__tea">{m.tea_name}</span>
                  </div>
                </div>
                <ul className="pair-card__list">
                  <li
                    className={`pair-card__row ${shared ? "" : "pair-card__row--clickable"}`}
                    onClick={shared ? undefined : () => navigate(`/tasting/${tastingId}/product/${m.product_id}?from=result`)}
                    role={shared ? undefined : "button"}
                    tabIndex={shared ? undefined : 0}
                  >
                    <span className="pair-card__name">{m.product_name}</span>
                    {m.product_number != null && (
                      <span className="pair-card__num tabnum">№{m.product_number}</span>
                    )}
                  </li>
                </ul>
              </article>
            ))}
          </div>
        </div>
      )}

      {showAuthReminder && (
        <AuthReminder
          onSubmit={async (patch) => {
            await updateProfile(patch);
            setReminderHidden(true);
          }}
        />
      )}

      {shareUrl && !shared && (
        <div className="result-share">
          <button
            type="button"
            className="btn btn--primary result-share__btn"
            onClick={() => setShareOpen(true)}
          >
            <IconShare size={18} stroke={2} />
            <span>Поделиться результатом</span>
          </button>
          <div className="result-share__caption">
            Друзья откроют страницу только для просмотра — оценки останутся вашими.
          </div>
        </div>
      )}

      {shared && (
        <div className="shared-cta">
          <div className="shared-cta__eyebrow">Хотите себе такую же страницу?</div>
          <a
            className="btn btn--primary shared-cta__btn shared-cta__btn--primary"
            href="https://teatix.com/product-category/certificate/tickets"
            target="_blank"
            rel="noopener noreferrer"
          >
            Купить билет
          </a>
          <a
            className="btn shared-cta__btn shared-cta__btn--tg"
            href="https://t.me/puerbezposhady"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconTelegram size={18} />
            <span>Будь в&nbsp;курсе событий</span>
          </a>
        </div>
      )}

      <div className="result-bottom">
        {shared ? (
          <a className="text-link" href="https://www.чайная.москва/" target="_blank" rel="noopener noreferrer">
            Чайная&nbsp;Высота
          </a>
        ) : (
          <button className="text-link" onClick={() => navigate(`/tasting/${tastingId}`)}>
            Вернуться к&nbsp;дегустации
          </button>
        )}
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl || ""}
        title={result?.title || "Дегустация"}
        eveningLine={eveningLine}
      />
    </div>
  );
}
