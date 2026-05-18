// Auth + Main + Detail. Uses hand-rolled CSS classes inlined in the host HTML.

const { useState, useEffect, useRef } = React;

// ─── reusable bits ─────────────────────────────────────────────────────────

function FlavorDots({ colors, size = 14, gap = 4 }) {
  return (
    <span className="dots" style={{ gap: `${gap}px` }}>
      {colors.map((c, i) =>
      <span
        key={i}
        className="dot"
        style={{ width: size, height: size, background: c }} />

      )}
    </span>);

}

function ScreenShell({ children }) {
  return <div className="screen">{children}</div>;
}

function Logomark({ size = "md", label }) {
  const px = size === "lg" ? 32 : 26;
  return (
    <div className="logomark">
      <img
        src="assets/logo.png"
        alt="Логотип"
        className="logomark__img"
        style={{ width: px, height: px }}
      />
      {label &&
      <span className="eyebrow" style={{ color: "var(--stone-500)" }}>
          {label}
        </span>
      }
    </div>);

}

const initialsOf = (name) =>
(name || "Г").
split(" ").
map((s) => s[0]).
join("").
slice(0, 2).
toUpperCase();

// ─── 1. Auth ───────────────────────────────────────────────────────────────

function AuthScreen({ go, setUser }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const enter = () => {
    setUser({ name: name.trim() || "Гость", phone });
    go("main");
  };
  const skip = () => {
    setUser({ name: "Гость", phone: "" });
    go("main");
  };

  return (
    <ScreenShell>
      <div className="auth">
        <div style={{ marginBottom: 56 }}>
          <Logomark size="lg" label="Дегустация чайного мороженого" />
        </div>

        <h1 className="title-xl">
          Выборы чайного мороженого
          <br />
          <span className="auth__hero-line">+ дюжина историй от мороженщика</span>
        </h1>
        <p className="auth__lede">
          Три сета чайного мороженого Кунгфу&nbsp;Айскрим: пломбиры и&nbsp;желато на&nbsp;красных, зелёных чаях и&nbsp;улунах, сорбэ на&nbsp;белом чае и&nbsp;улуне плюс москвито, а&nbsp;затем пломбиры и&nbsp;желато на&nbsp;пуэре.
        </p>

        <div className="auth__form">
          <label className="field">
            <span className="field__label">Имя</span>
            <div className="field__wrap">
              <input
                className="field__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как к вам обращаться" />
              
            </div>
          </label>
          <label className="field">
            <span className="field__label">Телефон</span>
            <div className="field__wrap">
              <span className="field__icon">
                <IconPhone size={16} />
              </span>
              <input
                className="field__input field__input--with-icon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="+7 ___ ___ __ __" />
              
            </div>
          </label>
        </div>

        <div className="auth__spacer" />

        <div className="auth__actions">
          <button className="btn btn--primary" onClick={enter}>
            Войти
          </button>
          <button className="btn btn--ghost" onClick={skip}>
            Пропустить
          </button>
        </div>
      </div>
    </ScreenShell>);

}

// ─── 2. Main ───────────────────────────────────────────────────────────────

function MainScreen({ go, user, tastings, selectIceCream }) {
  const ratedCount = ICE_CREAMS.filter((ic) => tastings[ic.id]?.touched).length;
  // TEMP: always active for easier testing. Revert to `ratedCount === ICE_CREAMS.length` later.
  const allRated = true;

  return (
    <ScreenShell>
      <div className="main-scroll">
        <div className="app-header">
          <Logomark label="Сегодня" />
          <button className="avatar" onClick={() => go("profile")}>
            {initialsOf(user.name)}
          </button>
        </div>

        <div className="hero">
          <h1 className="title-xl hero__title">
            Выборы чайного мороженого
            <span className="hero__title-flourish" aria-hidden="true">✦</span>
            <br />
            <span className="hero__title-accent">+ дюжина историй от&nbsp;мороженщика</span>
          </h1>
          <p className="hero__lede">
            Три сета Кунгфу&nbsp;Айскрим: пломбиры и&nbsp;желато на&nbsp;красных, зелёных чаях и&nbsp;улунах, сорбэ на&nbsp;белом чае и&nbsp;улуне плюс москвито, и&nbsp;пломбиры с&nbsp;желато на&nbsp;пуэре. Оцените каждое мороженое — карта останется у&nbsp;вас.
          </p>
          <Progress tastings={tastings} />
        </div>

        <div className="blocks">
          {BLOCKS.map((block, blockIdx) => {
            const items = ICE_CREAMS.filter((ic) => ic.block === block.id);
            const done = items.filter((ic) => tastings[ic.id]?.touched).length;
            return (
              <section key={block.id}>
                <div className="block__head">
                  <div className="block__head-left">
                    <span className="block__num">0{blockIdx + 1}</span>
                    <h2 className="block__title">{block.title}</h2>
                  </div>
                </div>
                <div className="block__meta">
                  <span className="block__sub">{block.subtitle}</span>
                  <span className="block__count tabnum">
                    {done}/{items.length}
                  </span>
                </div>
                <div className="block__list">
                  {items.map((ic) => {
                    const t = tastings[ic.id];
                    return (
                      <button
                        key={ic.id}
                        className="card"
                        onClick={() => selectIceCream(ic.id)}>
                        
                        <div className="card__num tabnum">№{ic.num}</div>
                        <div className="card__body">
                          <div className="card__title-row">
                            <span className="card__title">{ic.title}</span>
                            {t?.touched &&
                            <span className="card__check">
                                <IconCheck size={13} stroke={2.5} />
                              </span>
                            }
                          </div>
                          <div className="card__line">{ic.short}</div>
                        </div>
                        <div className="card__rating-slot">
                          {t?.liked ?
                          <span className="card__like">
                              <IconHeart size={16} filled stroke={2} />
                            </span> :

                          <span className="card__chev">
                              <IconChevronRight size={16} />
                            </span>
                          }
                        </div>
                      </button>);

                  })}
                </div>
              </section>);

          })}
        </div>

        <div className="main-footer-spacer" />
      </div>

      <div className="footer">
        {!allRated &&
        <div className="footer__hint">
            Оцените все {ICE_CREAMS.length}&nbsp;вкусов — ещё&nbsp;{ICE_CREAMS.length - ratedCount}
          </div>
        }
        <button
          className="btn btn--primary"
          disabled={!allRated}
          onClick={() => allRated && go("select-top")}>
          
          <span>Завершить</span>
          {allRated && <IconArrowRight size={18} stroke={2} />}
        </button>
      </div>
    </ScreenShell>);

}

function Progress({ tastings }) {
  const done = ICE_CREAMS.filter((ic) => tastings[ic.id]?.touched).length;
  const total = ICE_CREAMS.length;
  const pct = done / total * 100;
  return (
    <div className="progress">
      <div className="progress__head">
        <span className="progress__label">Пройдено</span>
        <span className="progress__count tabnum">
          {done} <span>/ {total}</span>
        </span>
      </div>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>);

}

// ─── 3. Detail ─────────────────────────────────────────────────────────────

// 3 large icon-circles under the description: ice-cream colour, tea, type.
// First slot has no label; others carry a short caption.

function DetailScreen({ go, back, readOnly, iceCream, idx, total, tasting, updateTasting }) {
  const t = tasting || {};
  const last = idx === total - 1;
  const [saved, setSaved] = useState(!!t.saved);

  const flavorIdx = (key) => {
    const v = t.flavor?.[key];
    if (v != null) return v;
    return FLAVOR_SLIDER_DEFS.find((d) => d.key === key)?.defaultIdx ?? 0;
  };
  const setFlavor = (key, i) =>
    updateTasting({
      flavor: { ...(t.flavor || {}), [key]: i },
      touched: true,
    });

  const matchIdx = t.match != null ? t.match : MATCH_SLIDER_DEF.defaultIdx;
  const setMatch = (i) => updateTasting({ match: i, touched: true });

  const toggleImpression = (tag) => {
    const cur = new Set(t.impressions || []);
    cur.has(tag) ? cur.delete(tag) : cur.add(tag);
    updateTasting({ impressions: Array.from(cur), touched: true });
  };

  const toggleLike = () =>
    updateTasting({ liked: !t.liked, touched: true });

  const setComment = (v) => updateTasting({ comment: v, touched: true });

  // Ingredient ranking — initialised from the ice cream's ingredients,
  // persisted in the tasting record.
  const ranking = t.ranking && t.ranking.length === iceCream.ingredients.length
    ? t.ranking
    : iceCream.ingredients;

  const setRanking = (next) => updateTasting({ ranking: next, touched: true });

  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [iceCream.id]);

  const goNext = () => {
    if (last) {
      go("main");
    } else {
      window.__selectIceCreamByIndex?.(idx + 1);
    }
  };

  return (
    <ScreenShell>
      <div
        ref={scrollRef}
        className={`detail-scroll ${readOnly ? "detail--readonly" : ""}`}
      >
        <div className="topbar">
          <div className="topbar__row">
            <button
              className="icon-btn icon-btn--leading"
              onClick={() => (back ? back() : go("main"))}>
              
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
            <div className="topbar__count tabnum">
              {idx + 1} <span>/ {total}</span>
            </div>
            <span className="topbar__spacer" aria-hidden="true" />
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-eyebrow">{BLOCKS[iceCream.block].title}</div>

          <div className="detail-title-row">
            <h1 className="title-lg detail-title">{iceCream.title}</h1>
            <span className="detail-num tabnum">№{iceCream.num}</span>
          </div>

          <div className="detail-line">
            <span className="detail-line__rule" />
            <span className="detail-line__text">
              Линия: <em>{iceCream.line.replace(/^Линия:?\s*/i, "").toLowerCase()}</em>
            </span>
          </div>

          {/* compact axis row: ice-cream colour, tea, ice-cream type */}
          <div className="axes axes--compact">
            <div className="axis">
              <div className="axis__plain">
                <ColorSwatch color={iceCream.color} size={44} />
              </div>
              <div className="axis__label axis__label--empty">&nbsp;</div>
            </div>
            <div className="axis">
              <div className="axis__plain">
                <TeaGlyph tea={iceCream.tea} size={40} />
              </div>
              <div className="axis__label">{TEA_LABEL[iceCream.tea] || iceCream.tea}</div>
            </div>
            <div className="axis">
              <div className="axis__plain">
                <TypeGlyph type={iceCream.format} size={40} />
              </div>
              <div className="axis__label">{iceCream.format}</div>
            </div>
          </div>

          <div className="ingredients">
            {iceCream.ingredients.map((ing) =>
            <span key={ing} className="ingredient">
                {ing}
              </span>
            )}
          </div>

          <p className="detail-desc">{iceCream.description}</p>

          {iceCream.secret && (
            <div className="trivia">
              <div className="trivia__head">
                <span className="trivia__icon" aria-hidden="true">
                  <IconSparkles size={14} stroke={1.6} />
                </span>
                <span className="trivia__label">Интересно будет знать о&nbsp;сорте</span>
              </div>
              <p className="trivia__body">{iceCream.secret}</p>
            </div>
          )}
        </div>

        {/* flavour evaluation — 4 custom step sliders */}
        <div className="detail-body section">
          <div className="section__label">Оценка вкуса</div>
          <div className="step-sliders">
            {FLAVOR_SLIDER_DEFS.map((def) => (
              <StepSlider
                key={def.key}
                label={def.label}
                info={def.info}
                steps={def.steps}
                value={flavorIdx(def.key)}
                onChange={(i) => setFlavor(def.key, i)}
              />
            ))}
          </div>
        </div>

        {/* ingredient ranking — between flavor sliders and impression chips */}
        <div className="detail-body section">
          <div className="section__label">
            Расположите ингредиенты по&nbsp;яркости вкуса
          </div>
          <div className="section__hint">
            От наиболее ярко выраженного к&nbsp;наименее.
          </div>
          <RankingList items={ranking} onChange={setRanking} />
        </div>

        {/* overall impression — weighted chips, single active color */}
        <div className="detail-body section">
          <div className="section__label">Общее впечатление</div>
          <div className="section__hint">
            Выберите всё, что откликается.
          </div>
          <div className="tags">
            {IMPRESSION_TAGS.map(({ tag }) => {
              const on = (t.impressions || []).includes(tag);
              return (
                <button
                  key={tag}
                  className={`tag tag--impr ${on ? "tag--impr-on" : ""}`}
                  onClick={() => toggleImpression(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* tea pairing — paired tea + match-strength slider, unified in a card */}
        <div className="detail-body section">
          <div className="section__label">С чем сочетал</div>
          <div className="pairing-card">
            <div className="paired-tea">
              <span className="paired-tea__icon">
                <TeaGlyph tea={iceCream.tea} size={28} />
              </span>
              <div className="paired-tea__body">
                <span className="paired-tea__label">Подобранный чай</span>
                <span className="paired-tea__name">{iceCream.pairedTea}</span>
              </div>
            </div>
            <div className="pairing-card__divider" />
            <div className="step-sliders step-sliders--single">
              <StepSlider
                label={MATCH_SLIDER_DEF.label}
                info={MATCH_SLIDER_DEF.info}
                steps={MATCH_SLIDER_DEF.steps}
                value={matchIdx}
                onChange={setMatch}
              />
            </div>
          </div>
        </div>

        {/* free-form comment */}
        <div className="detail-body section">
          <div className="section__label">Комментарий</div>
          <textarea
            className="comment"
            value={t.comment || ""}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            readOnly={readOnly}
            placeholder="Поделитесь своим мнением…" />
          
        </div>

        {readOnly ? (
          <div className="detail-body footer--detail">
            <div className="footer__row">
              <button
                className="btn btn--primary footer__next"
                onClick={() => (back ? back() : go("main"))}
              >
                <IconChevronLeft size={18} stroke={2} />
                <span>Назад к&nbsp;результатам</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-body footer--detail">
            {idx === 0 && (
              <div className="footer__hint footer__hint--detail">
                Понравился вкус? Поставьте лайк, чтобы он&nbsp;поборолся за&nbsp;место в&nbsp;топ-3 на&nbsp;Пьедестале.
              </div>
            )}
            <div className="footer__row">
              <LikeButton liked={!!t.liked} onToggle={toggleLike} />
              <button className="btn btn--primary footer__next" onClick={goNext}>
                <span>Дальше</span>
                <IconArrowRight size={18} stroke={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </ScreenShell>);

}

// ─── Step slider ───────────────────────────────────────────────────────────
// Discrete clickable dots connected by a track. Each step's label is shown
// directly on the scale, alternating above/below the track so long labels
// have room. Supports drag + tap + clicking labels.

function StepSlider({ label, info, steps, value, onChange }) {
  const n = steps.length;
  const idx = value == null ? Math.floor((n - 1) / 2) : value;
  const ratio = n === 1 ? 0.5 : idx / (n - 1);

  const trackRef = useRef(null);
  const draggingRef = useRef(false);

  const idxFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return idx;
    const rect = el.getBoundingClientRect();
    // The dots span from rect.left + 11 to rect.right - 11 (padding)
    const inner = Math.max(1, rect.width - 22);
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - 11) / inner));
    return Math.round(ratio * (n - 1));
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    const next = idxFromClientX(e.clientX);
    if (next !== idx) onChange(next);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const next = idxFromClientX(e.clientX);
    if (next !== idx) onChange(next);
  };
  const onPointerUp = (e) => {
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const labelStyle = (i) => {
    const ratio = n === 1 ? 0.5 : i / (n - 1);
    // Dot centers sit at 25px on the left edge and (100% - 25px) on the
    // right (track padding 11px + half of 28px step width = 25px). All
    // intermediate dots interpolate linearly between those centers, so
    // middle labels need that same formula to line up exactly under
    // their dot. Edge labels anchor to the dot's left/right edge so
    // their text doesn't overflow.
    let transform = "translateX(-50%)";
    let textAlign = "center";
    if (i === 0) { transform = "translateX(0)"; textAlign = "left"; }
    else if (i === n - 1) { transform = "translateX(-100%)"; textAlign = "right"; }
    return {
      left: `calc(25px + (100% - 50px) * ${ratio})`,
      transform,
      textAlign,
    };
  };

  // All step labels below the track when there are few enough that they
  // fit. For 5+ steps (notably the 6-step "Сила мэтча"), fall back to
  // alternating above/below so labels never overlap.
  const alternate = n >= 5;
  const aboveSteps = alternate
    ? steps.map((s, i) => ({ s, i })).filter(({ i }) => i % 2 === 1)
    : [];
  const belowSteps = alternate
    ? steps.map((s, i) => ({ s, i })).filter(({ i }) => i % 2 === 0)
    : steps.map((s, i) => ({ s, i }));

  const renderLabel = ({ s, i }) => (
    <button
      key={i}
      type="button"
      className={`step-slider__label ${i === idx ? "step-slider__label--on" : ""}`}
      style={labelStyle(i)}
      onClick={(e) => { e.stopPropagation(); onChange(i); }}
    >
      {s.label}
    </button>
  );

  return (
    <div className="step-slider">
      <div className="step-slider__head">
        <span className="step-slider__name">{label}</span>
        {info && <InfoTip text={info} />}
      </div>

      <div className="step-slider__rail-wrap">
        {alternate && (
          <div className="step-slider__labels step-slider__labels--top">
            {aboveSteps.map(renderLabel)}
          </div>
        )}

        <div
          ref={trackRef}
          className="step-picker__track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={idx}
          aria-valuetext={steps[idx].label}
        >
          <div className="step-picker__rail" />
          <div className="step-picker__fill" style={{ width: `calc((100% - 22px) * ${ratio})` }} />
          <div className="step-picker__steps">
            {steps.map((s, i) => {
              const state = i === idx ? "is-current" : i < idx ? "is-past" : "";
              return (
                <button
                  key={i}
                  type="button"
                  className={`step-picker__step ${state}`}
                  aria-label={s.label}
                  onClick={(e) => { e.stopPropagation(); onChange(i); }}
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

// ─── Generic info tip (small "i" with popover) ─────────────────────────
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    // Capture phase so we catch the event before any child handlers can
    // stopPropagation. Listen on both pointer and click for touch + mouse.
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onDown, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onDown, true);
    };
  }, [open]);

  return (
    <span className={`info-tip ${open ? "is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className={`info-tip__btn ${open ? "is-on" : ""}`}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-label="Подсказка"
        aria-expanded={open}
      >
        <IconInfo size={13} stroke={2} />
      </button>
      {open && (
        <div className="info-tip__pop" role="tooltip">
          <span className="info-tip__arrow" aria-hidden="true" />
          {text}
        </div>
      )}
    </span>
  );
}

// ─── Like button ────────────────────────────────────────────────────────
// Heart-only round button with a spark-burst animation on like. Used in
// the detail footer alongside the primary "Дальше" action.

function LikeButton({ liked, onToggle }) {
  const [burstId, setBurstId] = useState(0);

  const handleLike = () => {
    if (!liked) setBurstId((id) => id + 1);
    onToggle();
  };

  const SPARKS = 10;

  return (
    <button
      className={`like-btn like-btn--lg ${liked ? "like-btn--on" : ""}`}
      onClick={handleLike}
      aria-pressed={liked}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
    >
      <span className="like-btn__heart">
        <IconHeart size={26} filled={liked} stroke={2} />
      </span>
      {burstId > 0 && (
        <span className="like-spark-burst" key={burstId} aria-hidden="true">
          {Array.from({ length: SPARKS }).map((_, i) => {
            const ang = (i / SPARKS) * 360 + (i % 2 ? 8 : -8);
            const dist = 30 + (i % 3) * 6;
            const cls = i % 3 === 0 ? "like-spark like-spark--alt" : "like-spark";
            return (
              <span
                key={i}
                className={cls}
                style={{ "--ang": `${ang}deg`, "--dist": `${dist}px` }}
              />
            );
          })}
        </span>
      )}
    </button>
  );
}

// ─── 4. Profile (kept; surfaced from avatar tap) ───────────────────────────
// The full ProfileScreen now lives in profile.jsx. This file no longer
// exports it.

// ─── Ranking list ──────────────────────────────────────────────────────────
// Drag-to-reorder. Uses Pointer Events so it works on both mouse and touch.
// The grip handle on the right is the drag target.

function RankingList({ items, onChange }) {
  const listRef = useRef(null);
  const stateRef = useRef(null); // { idx, pointerId, startY, offsetY, itemH, itemEl }
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const onPointerDown = (i) => (e) => {
    e.preventDefault();
    const itemEl = e.currentTarget.closest(".ranking__item");
    itemEl.setPointerCapture(e.pointerId);
    const rect = itemEl.getBoundingClientRect();
    stateRef.current = {
      idx: i,
      pointerId: e.pointerId,
      startY: e.clientY,
      offsetY: 0,
      itemH: rect.height,
      itemEl,
    };
    rerender();
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    e.preventDefault();

    const offsetY = e.clientY - s.startY;
    s.offsetY = offsetY;

    const list = listRef.current;
    const itemEls = list.children;
    const draggedRect = itemEls[s.idx].getBoundingClientRect();
    const draggedCenter = draggedRect.top + draggedRect.height / 2 + offsetY;

    let newIdx = s.idx;
    for (let j = 0; j < itemEls.length; j++) {
      if (j === s.idx) continue;
      const r = itemEls[j].getBoundingClientRect();
      const c = r.top + r.height / 2;
      if (j < s.idx && draggedCenter < c) { newIdx = j; break; }
      if (j > s.idx && draggedCenter > c) { newIdx = j; }
    }

    if (newIdx !== s.idx) {
      const next = items.slice();
      const [moved] = next.splice(s.idx, 1);
      next.splice(newIdx, 0, moved);
      onChange(next);
      s.idx = newIdx;
      s.startY = e.clientY;
      s.offsetY = 0;
    }
    rerender();
  };

  const onPointerUp = (e) => {
    const s = stateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    try { s.itemEl.releasePointerCapture(e.pointerId); } catch (_) {}
    stateRef.current = null;
    rerender();
  };

  const s = stateRef.current;

  return (
    <ul
      ref={listRef}
      className="ranking"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {items.map((item, i) => {
        const isDragging = s && s.idx === i;
        return (
          <li
            key={item}
            className={`ranking__item ${isDragging ? "ranking__item--dragging" : ""}`}
            style={
              isDragging
                ? { transform: `translateY(${s.offsetY}px)`, zIndex: 10, transition: "none" }
                : undefined
            }
          >
            <span className="ranking__rank tabnum">{i + 1}</span>
            <span className="ranking__name">{item}</span>
            <span
              className="ranking__grip"
              onPointerDown={onPointerDown(i)}
              aria-label="Перетащить"
            >
              <IconGrip size={16} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Candidates screen — guest hand-picks their top-3 from likes ─────

function SelectTopScreen({ go, tastings, onConfirm }) {
  const liked = ICE_CREAMS.filter((ic) => tastings[ic.id]?.liked);
  const maxPick = Math.min(3, liked.length);
  // If the guest liked 3 or fewer, pre-select them all (spec edge case).
  const [picks, setPicks] = useState(() =>
    liked.length <= 3 ? liked.map((ic) => ic.id) : []
  );

  const toggle = (id) => {
    setPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        // Gently bump the oldest pick out and append the new one.
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const ready = picks.length === maxPick && picks.length > 0;

  return (
    <ScreenShell>
      <div className="main-scroll">
        <div className="topbar topbar--clean">
          <div className="topbar__row">
            <button
              className="icon-btn icon-btn--leading"
              onClick={() => go("main")}
            >
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
            <span className="topbar__spacer" aria-hidden="true" />
            <span className="topbar__spacer" aria-hidden="true" />
          </div>
        </div>

        <div className="hero">
          <div className="hero__eyebrow">Финальный шаг</div>
          <h1 className="title-xl">Кандидаты на&nbsp;пьедестал</h1>
          <p className="hero__lede">
            Вы&nbsp;отметили эти вкусы лайком во&nbsp;время дегустации. Теперь выберите из&nbsp;них три самых любимых, чтобы сформировать ваш итоговый профиль.
          </p>
        </div>

        <div className="candidates">
          {liked.length === 0 ? (
            <div className="candidates__empty">
              Вы&nbsp;не&nbsp;отметили ни&nbsp;одного вкуса лайком. Вернитесь к&nbsp;карточкам и&nbsp;поставьте сердечко тем, что вам понравились.
            </div>
          ) : (
            liked.map((ic) => {
              const idx = picks.indexOf(ic.id);
              const on = idx >= 0;
              return (
                <button
                  key={ic.id}
                  type="button"
                  className={`candidate ${on ? "candidate--on" : ""}`}
                  onClick={() => toggle(ic.id)}
                  aria-pressed={on}
                >
                  <span
                    className={`candidate__mark ${on ? "candidate__mark--on" : ""}`}
                    aria-hidden="true"
                  >
                    {on ? (
                      <span className="candidate__rank tabnum">{idx + 1}</span>
                    ) : (
                      <IconHeart size={14} filled stroke={2} />
                    )}
                  </span>
                  <div className="candidate__body">
                    <div className="candidate__title-row">
                      <span className="candidate__title">{ic.title}</span>
                      <span className="candidate__num tabnum">№{ic.num}</span>
                    </div>
                    <div className="candidate__line">{ic.short}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="main-footer-spacer" />
      </div>

      <div className="footer">
        <div className="footer__hint">
          {liked.length === 0
            ? "Сначала добавьте в кандидаты хотя бы один сорт."
            : ready
              ? maxPick === 3
                ? "Готово — три фаворита выбраны."
                : `Готово — выбрано ${maxPick} из ${maxPick}.`
              : `Выбрано ${picks.length} из ${maxPick}`}
        </div>
        <button
          className="btn btn--primary"
          disabled={!ready}
          onClick={() => ready && onConfirm(picks)}
        >
          <span>Узнать результат</span>
          {ready && <IconArrowRight size={18} stroke={2} />}
        </button>
      </div>
    </ScreenShell>
  );
}

Object.assign(window, { AuthScreen, MainScreen, DetailScreen, SelectTopScreen });