import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconMedal, IconSparkles } from "../components/icons.jsx";
import { getResult } from "../api/catalog";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTasting } from "../hooks/useTasting.js";
import { productPalette } from "../utils/color.js";
import { formatPhoneInput, isValidE164, normalizeToE164 } from "../utils/phone.js";

function vibrant(hex) {
  if (!hex) return "#FFB987";
  return hex;
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

function PortraitAxis({ name, userTotal, minTotal, maxTotal }) {
  const range = maxTotal - minTotal;
  const pct = range > 0
    ? Math.max(2, Math.min(98, ((userTotal - minTotal) / range) * 100))
    : 50;
  return (
    <div className="portrait-axis">
      <div className="portrait-axis__label">{name}</div>
      <div className="portrait-axis__track">
        <span className="portrait-axis__line" />
        <span className="portrait-axis__center" aria-hidden="true" />
        <span className="portrait-axis__star" style={{ left: `${pct}%` }} aria-hidden="true">✦</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wasSkipped, updateProfile, user } = useAuth();
  const { tasting, productById, products } = useTasting(id, { autoJoin: false });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderHidden, setReminderHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getResult(id)
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const podium = result?.podium || [];
  const favorites = result?.favorites || [];
  const criteriaBreakdown = result?.criteria_breakdown || [];
  const topTags = result?.top_tags || [];
  const teaMatches = result?.tea_matches || [];

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
    if (phrases.length === 1) return `${PREFIX} ${phrases[0]}.`;
    const head = phrases.slice(0, -1).join(", ");
    const tail = phrases[phrases.length - 1];
    return `${PREFIX} ${head} и ${tail}.`;
  }, [podiumProducts]);

  const auraColor = useMemo(() => {
    const top = podiumProducts[0]?.p;
    return top?.color || "#FFB987";
  }, [podiumProducts]);

  // Все три строки топ-3 окрашиваются цветом продукта на 1-м месте.
  const topPalette = useMemo(() => productPalette(auraColor), [auraColor]);

  const showAuthReminder = wasSkipped && !user?.phone && !reminderHidden;

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
      <div className="result-head">
        <div className="result-head__icon">
          <IconSparkles size={26} stroke={1.5} />
        </div>
        <div className="result-head__thanks">Спасибо, что были с&nbsp;нами</div>
        <h1 className="result-head__title">Дегустация завершена</h1>
        {tasting?.result_description && (
          <p className="result-head__sub result-head__sub--justify">
            {tasting.result_description}
          </p>
        )}
      </div>

      <div className="aura-section" aria-hidden="true">
        <Aura color={auraColor} />
      </div>

      {eveningLine ? (
        <p className="evening-line">{eveningLine}</p>
      ) : (
        <p className="evening-line evening-line--empty">
          Отметьте сердечком вкусы, которые понравились — здесь появится фраза о вашем вечере.
        </p>
      )}

      {podium.length > 0 && (
        <div className="podium-section">
          <div className="tier-head">
            <div className="profile-card-head__eyebrow tier-head__title">Топ-3 вкусов</div>
            <span className="tier-head__col">Баллы</span>
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
              return (
                <li
                  key={row.id}
                  style={rowStyle}
                  className={`tier-row tier-row--colored ${i === 0 ? "tier-row--winner" : ""} tier-row--clickable`}
                  onClick={() => navigate(`/tasting/${id}/product/${row.id}?from=result`)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="tier-row__rank tabnum">{row.place}</span>
                  <div className="tier-row__body">
                    <div className="tier-row__title-row">
                      <span className="tier-row__title">{row.name}</span>
                      {row.number != null && <span className="tier-row__num tabnum">№{row.number}</span>}
                    </div>
                  </div>
                  <span className="tier-row__score tabnum">
                    {row.total_score != null ? row.total_score : "—"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="favs-section">
          <div className="tier-head">
            <div className="profile-card-head__eyebrow tier-head__title">Также вы&nbsp;оценили</div>
          </div>
          <ol className="tier-card">
            {favorites.map((row) => {
              const product = productById(row.id);
              const score = product?.total_score;
              return (
                <li
                  key={row.id}
                  className="tier-row tier-row--clickable"
                  onClick={() => navigate(`/tasting/${id}/product/${row.id}?from=result`)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="tier-row__finalist" aria-label="Финалист">
                    <IconMedal size={14} filled stroke={1.8} />
                  </span>
                  <div className="tier-row__body">
                    <div className="tier-row__title-row">
                      <span className="tier-row__title">{row.name}</span>
                    </div>
                  </div>
                  <span className="tier-row__score tabnum">
                    {score != null ? score : "—"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {criteriaBreakdown.length > 0 && (
        <div className="portrait-section">
          <div className="profile-card-head__eyebrow">Вкусовой портрет дегустации</div>
          <p className="portrait-section__intro">
            Звезда показывает, где ваши оценки расположились на&nbsp;шкале от&nbsp;минимально возможного к&nbsp;максимально возможному баллу по&nbsp;каждому критерию.
          </p>
          <div className="portrait">
            {criteriaBreakdown.map((c) => (
              <PortraitAxis
                key={c.id}
                name={c.name}
                userTotal={c.user_total}
                minTotal={c.min_total}
                maxTotal={c.max_total}
              />
            ))}
          </div>
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
                  {m.tea_logo && (
                    <img className="pair-card__tea-logo" src={m.tea_logo} alt="" />
                  )}
                  <span className="pair-card__eyebrow">в&nbsp;паре с&nbsp;чаем</span>
                  <span className="pair-card__tea">{m.tea_name}</span>
                </div>
                <ul className="pair-card__list">
                  <li
                    className="pair-card__row pair-card__row--clickable"
                    onClick={() => navigate(`/tasting/${id}/product/${m.product_id}?from=result`)}
                    role="button"
                    tabIndex={0}
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

      <div className="result-bottom">
        <button className="text-link" onClick={() => navigate(`/tasting/${id}`)}>
          Вернуться к&nbsp;дегустации
        </button>
      </div>
    </div>
  );
}
