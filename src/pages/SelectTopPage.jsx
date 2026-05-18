import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconArrowRight, IconChevronLeft, IconHeart } from "../components/icons.jsx";
import { setPodium } from "../api/catalog";
import { useTasting } from "../hooks/useTasting.js";

export default function SelectTopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useTasting(id, { autoJoin: false });

  const liked = useMemo(() => products.filter((p) => p.is_nominated && !p.podium_place), [products]);
  const alreadyPodium = useMemo(() => {
    const out = { 1: null, 2: null, 3: null };
    products.forEach((p) => {
      if (p.podium_place && out[p.podium_place] == null) out[p.podium_place] = p.id;
    });
    return out;
  }, [products]);

  const maxPick = Math.min(3, liked.length + Object.values(alreadyPodium).filter(Boolean).length);
  const [picks, setPicks] = useState(() =>
    Object.values(alreadyPodium).filter(Boolean).slice(0, maxPick)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (pid) => {
    setPicks((prev) => {
      if (prev.includes(pid)) return prev.filter((x) => x !== pid);
      if (prev.length >= 3) return [...prev.slice(1), pid];
      return [...prev, pid];
    });
  };

  const ready = picks.length === maxPick && picks.length > 0;

  const confirm = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = { first: null, second: null, third: null };
      picks.forEach((pid, idx) => {
        if (idx === 0) body.first = pid;
        else if (idx === 1) body.second = pid;
        else if (idx === 2) body.third = pid;
      });
      await setPodium(id, body);
      navigate(`/tasting/${id}/result`);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сохранить выбор.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="fullscreen-center">Загружаем…</div>;

  const candidates = [
    ...products.filter((p) => p.podium_place),
    ...liked,
  ];

  return (
    <>
    <div className="main-scroll">
      <div className="topbar topbar--clean">
        <div className="topbar__row">
          <button className="icon-btn icon-btn--leading" onClick={() => navigate(-1)}>
            <IconChevronLeft size={20} />
            <span>Назад</span>
          </button>
          <span className="topbar__spacer" />
          <span className="topbar__spacer" />
        </div>
      </div>

      <div className="hero">
        <div className="hero__eyebrow">Финальный шаг</div>
        <h1 className="title-xl">Кандидаты на&nbsp;пьедестал</h1>
        <p className="hero__lede">
          Вы&nbsp;отметили эти вкусы лайком во&nbsp;время дегустации.
          Теперь выберите из&nbsp;них три самых любимых.
        </p>
      </div>

      <div className="candidates">
        {candidates.length === 0 ? (
          <div className="candidates__empty">
            Вы&nbsp;не&nbsp;отметили ни&nbsp;одного вкуса лайком. Вернитесь к&nbsp;карточкам и&nbsp;поставьте сердечко тем, что вам понравились.
          </div>
        ) : (
          candidates.map((p) => {
            const idx = picks.indexOf(p.id);
            const on = idx >= 0;
            return (
              <button
                key={p.id}
                type="button"
                className={`candidate ${on ? "candidate--on" : ""}`}
                onClick={() => toggle(p.id)}
                aria-pressed={on}
              >
                <span className={`candidate__mark ${on ? "candidate__mark--on" : ""}`}>
                  {on ? (
                    <span className="candidate__rank tabnum">{idx + 1}</span>
                  ) : (
                    <IconHeart size={14} filled stroke={2} />
                  )}
                </span>
                <div className="candidate__body">
                  <div className="candidate__title-row">
                    <span className="candidate__title">{p.name}</span>
                    {p.number != null && <span className="candidate__num tabnum">№{p.number}</span>}
                  </div>
                  {p.description && (
                    <div className="candidate__line">{p.description}</div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-footer-spacer" />
    </div>

    <div className="footer">
      <div className="footer__hint">
        {candidates.length === 0
          ? "Сначала отметьте лайком хотя бы один вкус."
          : ready
            ? maxPick === 3 ? "Готово — три фаворита выбраны." : `Готово — выбрано ${maxPick} из ${maxPick}.`
            : `Выбрано ${picks.length} из ${maxPick}`}
      </div>
      <button
        className="btn btn--primary"
        disabled={!ready || submitting}
        onClick={confirm}
      >
        <span>{submitting ? "Сохраняем…" : "Узнать результат"}</span>
        {ready && !submitting && <IconArrowRight size={18} stroke={2} />}
      </button>
    </div>
    </>
  );
}
