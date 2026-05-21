import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { IconArrowRight, IconCheck, IconChevronRight, IconMedal } from "../components/icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTasting } from "../hooks/useTasting.js";
import { formatTastingDate } from "../utils/date.js";
import { initialsOf } from "../utils/initials.js";

function groupByCategory(products) {
  const groups = [];
  const byKey = new Map();
  for (const p of products) {
    const key = p.category || null;
    const mapKey = key ?? "__none__";
    if (!byKey.has(mapKey)) {
      const g = { key, items: [] };
      byKey.set(mapKey, g);
      groups.push(g);
    }
    byKey.get(mapKey).items.push(p);
  }
  let catNum = 0;
  return groups.map((g) => ({ ...g, num: g.key ? ++catNum : null }));
}

export default function MainPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasting, products, loading, error } = useTasting(id);

  const groups = useMemo(() => groupByCategory(products), [products]);
  const ratedCount = useMemo(() => products.filter((p) => p.is_reviewed).length, [products]);

  if (loading) return <div className="fullscreen-center">Загружаем дегустацию…</div>;
  if (error) return <div className="fullscreen-center">Не удалось загрузить дегустацию.</div>;
  if (!tasting) return <div className="fullscreen-center">Дегустация не найдена.</div>;

  const total = products.length;
  const pct = total ? (ratedCount / total) * 100 : 0;

  return (
    <>
    <div className="main-scroll">
      <PageHeader
        right={
          <button className="avatar" onClick={() => navigate("/profile")}>
            {initialsOf(user?.name)}
          </button>
        }
      />
      <div className="hero__date">{formatTastingDate(tasting.date) || "Сегодня"}</div>

      <div className="hero">
        <h1 className="title-xl hero__title">{tasting.title}</h1>
        {tasting.description && (
          <p className="hero__lede">{tasting.description}</p>
        )}
        <div className="progress">
          <div className="progress__head">
            <span className="progress__label">Пройдено</span>
            <span className="progress__count tabnum">
              {ratedCount} <span>/ {total}</span>
            </span>
          </div>
          <div className="progress__track">
            <div className="progress__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="blocks">
        {groups.map((g, gIdx) => {
          const done = g.items.filter((p) => p.is_reviewed).length;
          return (
            <section key={(g.key ?? "_") + ":" + gIdx}>
              {g.key && (
                <div className="block__head">
                  <div className="block__head-left">
                    <span className="block__num">{String(g.num).padStart(2, "0")}</span>
                    <h2 className="block__title">{g.key}</h2>
                  </div>
                  <span className="block__count tabnum">{done}/{g.items.length}</span>
                </div>
              )}
              <div className="block__list">
                {g.items.map((p) => (
                  <button
                    key={p.id}
                    className="card"
                    onClick={() => navigate(`/tasting/${id}/product/${p.id}`)}
                  >
                    <div className={`card__num ${p.type === "tea" && p.image ? "card__num--img" : "tabnum"}`}>
                      {p.type === "tea" && p.image ? (
                        <img
                          className="card__num-img"
                          src={p.image}
                          alt=""
                          aria-hidden="true"
                        />
                      ) : (
                        p.number != null ? `№${p.number}` : ""
                      )}
                    </div>
                    <div className="card__body">
                      <div className="card__title-row">
                        <span className="card__title">{p.name}</span>
                        {p.is_reviewed && (
                          <span className="card__check">
                            <IconCheck size={13} stroke={2.5} />
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div className="card__line">{p.description}</div>
                      )}
                    </div>
                    <div className="card__rating-slot">
                      {p.is_nominated ? (
                        <span className="card__finalist">
                          <IconMedal size={16} filled stroke={1.8} />
                        </span>
                      ) : (
                        <span className="card__chev">
                          <IconChevronRight size={16} />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <AppFooter />
      <div className="main-footer-spacer" />
    </div>

    <div className="footer">
      <button
        className="btn btn--primary"
        onClick={() => navigate(`/tasting/${id}/select-top`)}
      >
        <span>Завершить</span>
        <IconArrowRight size={18} stroke={2} />
      </button>
    </div>
    </>
  );
}
