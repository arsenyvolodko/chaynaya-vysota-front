// Личный кабинет — profile, loyalty card, dashboard, history list + detail.

const { useState: useProfileState } = React;

// ── helpers ────────────────────────────────────────────────────────────────

function formatPhone(raw) {
  const digits = (raw || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return raw || "+7 999 000-00-00";
  return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}

const profileInitials = (name) =>
  (name || "Г")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ── Mini aura (small swatch for history list cards) ────────────────────────

function MiniAura({ archetypeKey }) {
  const a = ARCHETYPES[archetypeKey] || ARCHETYPES.cozy;
  const [c1, c2, c3] = a.palette;
  return (
    <div
      className="mini-aura"
      aria-hidden="true"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${c1}, transparent 65%),
                     radial-gradient(circle at 70% 70%, ${c2}, transparent 60%),
                     radial-gradient(circle at 50% 50%, ${c3 || c1}, transparent 70%),
                     ${a.bg}`,
      }}
    />
  );
}

// ── Loyalty card (linked / unlinked) ───────────────────────────────────────

function LoyaltyCard({ linked, points, onAdd, onToggle }) {
  return (
    <div className={`loyalty ${linked ? "loyalty--linked" : "loyalty--empty"}`}>
      {/* Subtle dot pattern + tea-leaf accent */}
      <div className="loyalty__pattern" aria-hidden="true" />
      <div className="loyalty__head">
        <span className="loyalty__brand">
          <span className="loyalty__brand-dot">
            <IconLeaf size={11} stroke={2} />
          </span>
          Tea&nbsp;·&nbsp;Gelato
        </span>
        <button
          className="loyalty__demo"
          onClick={onToggle}
          aria-label="Демо: переключить состояние"
          title="Демо: переключить"
        >
          демо
        </button>
      </div>

      {linked ? (
        <div className="loyalty__body">
          <div className="loyalty__label">Ваши баллы</div>
          <div className="loyalty__points tabnum">{points.toLocaleString("ru-RU")}</div>
          <div className="loyalty__footer">
            <span className="loyalty__num tabnum">•••• 4 281</span>
            <span className="loyalty__exp">бессрочно</span>
          </div>
        </div>
      ) : (
        <div className="loyalty__body loyalty__body--empty">
          <div className="loyalty__empty-text">
            Привяжите карту лояльности — копите баллы и&nbsp;получайте подарки на&nbsp;дегустациях.
          </div>
          <button className="btn btn--primary loyalty__add" onClick={onAdd}>
            <span style={{ fontSize: 18, lineHeight: 1, marginRight: 2 }}>＋</span>
            <span>Добавить карту</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard tiles ────────────────────────────────────────────────────────

function DashTile({ icon, title, value, action, onAction }) {
  return (
    <div className="dash-tile">
      <div className="dash-tile__icon">{icon}</div>
      <div className="dash-tile__title">{title}</div>
      <div className="dash-tile__value">{value}</div>
      {action && (
        <button className="btn-outline dash-tile__action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── Slider readout (history detail) ────────────────────────────────────────

const HISTORY_SLIDER_LABELS = {
  sweetness: { label: "Сладость", l: "несладко", r: "приторно" },
  texture:   { label: "Текстура", l: "льдистая", r: "тягучая" },
  intensity: { label: "Интенсивность", l: "тонкая", r: "взрывная" },
};

function SliderReadout({ k, value }) {
  const def = HISTORY_SLIDER_LABELS[k] || { label: k, l: "", r: "" };
  return (
    <div className="readout">
      <div className="readout__head">
        <span className="readout__label">{def.label}</span>
        <span className="readout__val tabnum">{value}</span>
      </div>
      <div className="readout__track">
        <div className="readout__fill" style={{ width: `${value}%` }} />
        <div className="readout__dot" style={{ left: `${value}%` }} />
      </div>
      <div className="readout__anchors">
        <span>{def.l}</span>
        <span>{def.r}</span>
      </div>
    </div>
  );
}

// ── History detail ─────────────────────────────────────────────────────────

function HistoryDetail({ item, onBack }) {
  const archetype = ARCHETYPES[item.archetypeKey] || ARCHETYPES.cozy;

  return (
    <div className="screen">
      <div className="result-scroll">
        <div className="topbar topbar--clean">
          <div className="topbar__row">
            <button className="icon-btn icon-btn--leading" onClick={onBack}>
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
            <div className="topbar__count">{item.date}</div>
            <div style={{ width: 36 }} />
          </div>
        </div>

        <div className="detail-body" style={{ paddingTop: 18 }}>
          <h1 className="title-lg" style={{ marginTop: 4 }}>{item.title}</h1>
          <div className="hist-detail__meta">
            <span>{item.count} вкусов</span>
            <span>·</span>
            <span>{item.topEmotions.length} эмоций</span>
          </div>
        </div>

        {/* Aura */}
        <div className="result-card result-card--aura" style={{ marginTop: 20 }}>
          <div className="profile-card-head__eyebrow">Архетип вечера</div>
          <div className="aura-wrap">
            <Aura archetype={archetype} />
          </div>
          <h2 className="aura-title">{archetype.title}</h2>
          <p className="aura-desc">{archetype.description}</p>
        </div>

        {/* Sliders */}
        <div className="result-card">
          <div className="profile-card-head__eyebrow">Оценки вкуса</div>
          <h2 className="profile-card-head__title">В среднем за вечер</h2>
          <div className="readouts">
            {Object.entries(item.sliders).map(([k, v]) => (
              <SliderReadout key={k} k={k} value={v} />
            ))}
          </div>
        </div>

        {/* Emotion tags */}
        {item.topEmotions.length > 0 && (
          <div className="result-card">
            <div className="profile-card-head__eyebrow">Эмоции вечера</div>
            <div className="tags" style={{ marginTop: 12 }}>
              {item.topEmotions.map((e) => (
                <span key={e} className="tag tag--emotion-on" style={{ pointerEvents: "none" }}>
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {item.comments.length > 0 && (
          <div className="result-card">
            <div className="profile-card-head__eyebrow">Ваши комментарии</div>
            <ul className="comments">
              {item.comments.map((c, i) => (
                <li key={i} className="comments__item">
                  <div className="comments__ic">{c.ic}</div>
                  <div className="comments__text">{c.text}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ── History list ───────────────────────────────────────────────────────────

function HistoryList({ onBack, onSelect }) {
  return (
    <div className="screen">
      <div className="result-scroll" style={{ paddingTop: 0 }}>
        <div className="topbar topbar--clean">
          <div className="topbar__row">
            <button className="icon-btn icon-btn--leading" onClick={onBack}>
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
            <div className="topbar__count">{MOCK_HISTORY.length} визита</div>
            <div style={{ width: 36 }} />
          </div>
        </div>

        <div className="detail-body" style={{ paddingTop: 18 }}>
          <div className="detail-eyebrow" style={{ marginTop: 4 }}>Архив</div>
          <h1 className="title-lg" style={{ marginTop: 4 }}>Посещённые дегустации</h1>
          <p className="hist-list__lede">
            История ваших вкусовых вечеров. Откройте любой — увидите ауру, оценки и комментарии.
          </p>
        </div>

        <div className="hist-list">
          {MOCK_HISTORY.map((h) => {
            const arch = ARCHETYPES[h.archetypeKey] || ARCHETYPES.cozy;
            return (
              <button key={h.id} className="hist-row" onClick={() => onSelect(h.id)}>
                <MiniAura archetypeKey={h.archetypeKey} />
                <div className="hist-row__body">
                  <div className="hist-row__date">{h.date}</div>
                  <div className="hist-row__title">{h.title}</div>
                  <div className="hist-row__meta">
                    <span>{arch.title}</span>
                    <span className="hist-row__sep">·</span>
                    <span>{h.count} вкусов</span>
                  </div>
                </div>
                <span className="hist-row__chev">
                  <IconChevronRight size={18} />
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ── Profile main view ──────────────────────────────────────────────────────

function ProfileMain({ user, onClose, onOpenHistory }) {
  const [linked, setLinked] = useProfileState(true);
  const [copied, setCopied] = useProfileState(false);

  const copyRef = () => {
    try { navigator.clipboard?.writeText("https://tea-gelato.ru/r/x9k2"); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="screen">
      <div className="result-scroll">
        {/* Top bar */}
        <div className="topbar topbar--clean">
          <div className="topbar__row">
            <button className="icon-btn icon-btn--leading" onClick={onClose}>
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
            <div className="topbar__count">Личный кабинет</div>
            <div style={{ width: 36 }} />
          </div>
        </div>

        {/* Profile header */}
        <div className="profile-hero">
          <div className="profile-hero__avatar">{profileInitials(user.name)}</div>
          <div className="profile-hero__body">
            <div className="profile-hero__name">{user.name || "Гость"}</div>
            <div className="profile-hero__phone tabnum">{formatPhone(user.phone)}</div>
          </div>
          <button className="icon-btn profile-hero__settings" aria-label="Настройки" title="Настройки">
            <IconUser size={18} />
          </button>
        </div>

        {/* Loyalty */}
        <div className="profile-section">
          <LoyaltyCard
            linked={linked}
            points={450}
            onAdd={() => setLinked(true)}
            onToggle={() => setLinked((v) => !v)}
          />
        </div>

        {/* Dashboard grid */}
        <div className="dash-grid">
          <DashTile
            icon={
              <span className="dash-tile__icon-bg dash-tile__icon-bg--green">
                <IconBookmark size={20} stroke={1.6} />
              </span>
            }
            title="Жетоны на дегустации"
            value={
              <>
                <span className="dash-tile__val-num tabnum">2</span>
                <span className="dash-tile__val-sub">доступно</span>
              </>
            }
          />
          <DashTile
            icon={
              <span className="dash-tile__icon-bg dash-tile__icon-bg--peach">
                <IconGift size={20} stroke={1.6} />
              </span>
            }
            title="Реферальная ссылка"
            value={
              <span className="dash-tile__val-sub" style={{ marginTop: 4 }}>
                Скидка 10% другу
              </span>
            }
            action={
              copied ? (
                <>
                  <IconCheck size={13} stroke={2.5} />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <IconCopy size={13} stroke={2} />
                  <span>Скопировать</span>
                </>
              )
            }
            onAction={copyRef}
          />
        </div>

        {/* History entry */}
        <div className="profile-section">
          <button className="hist-entry" onClick={onOpenHistory}>
            <div className="hist-entry__icon">
              <IconSparkles size={20} stroke={1.6} />
            </div>
            <div className="hist-entry__body">
              <div className="hist-entry__title">Посещённые дегустации</div>
              <div className="hist-entry__sub">
                {MOCK_HISTORY.length} вечера · последний {MOCK_HISTORY[0].date.toLowerCase()}
              </div>
            </div>
            <span className="hist-entry__preview">
              {MOCK_HISTORY.slice(0, 3).map((h) => (
                <MiniAura key={h.id} archetypeKey={h.archetypeKey} />
              ))}
            </span>
            <span className="hist-entry__chev">
              <IconChevronRight size={18} />
            </span>
          </button>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ── Top-level switcher ─────────────────────────────────────────────────────

function ProfileScreen({ go, user }) {
  const [view, setView] = useProfileState("main");
  const [historyId, setHistoryId] = useProfileState(null);

  if (view === "history-detail") {
    const item = MOCK_HISTORY.find((h) => h.id === historyId) || MOCK_HISTORY[0];
    return <HistoryDetail item={item} onBack={() => setView("history")} />;
  }
  if (view === "history") {
    return (
      <HistoryList
        onBack={() => setView("main")}
        onSelect={(id) => {
          setHistoryId(id);
          setView("history-detail");
        }}
      />
    );
  }
  return (
    <ProfileMain
      user={user}
      onClose={() => go("main")}
      onOpenHistory={() => setView("history")}
    />
  );
}

Object.assign(window, { ProfileScreen });
