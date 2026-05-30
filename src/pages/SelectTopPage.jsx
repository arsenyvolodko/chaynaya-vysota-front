import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import {
  IconArrowRight,
  IconChevronLeft,
  IconGrip,
  IconMedal,
} from "../components/icons.jsx";
import { setPodium } from "../api/catalog";
import { useTasting } from "../hooks/useTasting.js";
import { medalStyle } from "../utils/medal.js";
import RankingList from "../components/RankingList.jsx";

/**
 * Кандидаты-на-пьедестал: пользователь перетягивает финалистов (карточки из
 * пула снизу) на 3 слота подиума сверху. Пока 3 слота не заняты, переход
 * дальше заблокирован.
 *
 * Drag-логика на Pointer Events: pointer captured на source-элементе, ghost-
 * клон следует за пальцем через transform-ref (без re-render каждый кадр).
 * На pointerup hit-test по getBoundingClientRect слотов и пула.
 */
export default function SelectTopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasting, products, loading } = useTasting(id, { autoJoin: false });

  // show_podium_candidates=true → классический отбор 3 кандидатов в топ. Если
  // флаг false — кандидатов нет, ранжируем ВСЕ продукты дегустации единым списком.
  const rankingMode = !!tasting && !tasting.show_podium_candidates;

  const [pool, setPool] = useState([]);
  const [top3, setTop3] = useState([null, null, null]);
  const [ranking, setRanking] = useState([]); // режим rankingMode: все продукты по порядку
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Заполняем при первой загрузке продуктов.
  const initedRef = useRef(false);
  useEffect(() => {
    if (loading || initedRef.current) return;
    if (!products.length) return;

    if (rankingMode) {
      // Начальный порядок: уже выставленный podium_place (1..N), затем
      // неотранжированные — в исходном порядке ProductTasting.order.
      const sorted = products
        .map((p, i) => ({ p, i, place: p.podium_place == null ? Infinity : p.podium_place }))
        .sort((a, b) => a.place - b.place || a.i - b.i)
        .map((x) => x.p);
      setRanking(sorted);
      initedRef.current = true;
      return;
    }

    const slots = [null, null, null];
    const rest = [];
    products.forEach((p) => {
      if (!p.is_nominated) return;
      if (p.podium_place && p.podium_place >= 1 && p.podium_place <= 3 && !slots[p.podium_place - 1]) {
        slots[p.podium_place - 1] = p;
      } else {
        rest.push(p);
      }
    });
    setTop3(slots);
    setPool(rest);
    initedRef.current = true;
  }, [loading, products, rankingMode]);

  // --- Drag state ---
  const slotRefs = useRef([null, null, null]);
  const poolRef = useRef(null);
  const ghostRef = useRef(null);
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null); // только для рендера ghost
  const [hoverSlot, setHoverSlot] = useState(null);

  const updateGhost = (clientX, clientY) => {
    const s = dragRef.current;
    const el = ghostRef.current;
    if (!s || !el) return;
    el.style.transform = `translate3d(${clientX - s.offsetX}px, ${clientY - s.offsetY}px, 0)`;
  };

  const detectHoverSlot = (clientX, clientY) => {
    for (let i = 0; i < 3; i++) {
      const slotEl = slotRefs.current[i];
      if (!slotEl) continue;
      const r = slotEl.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return i;
      }
    }
    return null;
  };

  const detectPool = (clientX, clientY) => {
    const el = poolRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  };

  const startDrag = (product, fromZone, fromIdx) => (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget;
    try { target.setPointerCapture(e.pointerId); } catch (_) {}
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      product,
      fromZone,
      fromIdx,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setDrag({ product });
    // Ghost rendered via state — позиционируем сразу после монтирования.
    requestAnimationFrame(() => updateGhost(e.clientX, e.clientY));
  };

  const moveDrag = (e) => {
    const s = dragRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    updateGhost(e.clientX, e.clientY);
    setHoverSlot(detectHoverSlot(e.clientX, e.clientY));
  };

  const endDrag = (e) => {
    const s = dragRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const target = e.currentTarget;
    try { target.releasePointerCapture(e.pointerId); } catch (_) {}

    const droppedIdx = detectHoverSlot(e.clientX, e.clientY);
    const droppedToPool = droppedIdx == null && detectPool(e.clientX, e.clientY);

    if (droppedIdx != null) {
      // Помещаем в слот droppedIdx.
      setTop3((prev) => {
        const next = [...prev];
        const occupant = next[droppedIdx];
        if (s.fromZone === "top3") {
          next[s.fromIdx] = occupant && occupant.id !== s.product.id ? occupant : null;
        }
        next[droppedIdx] = s.product;
        return next;
      });
      setPool((prev) => {
        let next = prev;
        if (s.fromZone === "pool") {
          next = next.filter((p) => p.id !== s.product.id);
        }
        if (s.fromZone === "top3") {
          // Если в целевом слоте был кто-то — он улетит в пул только если мы
          // не возвращаем его в src-слот через top3-логику выше. Логика выше
          // уже положила occupant обратно в src-слот, ничего в пул не уходит.
        } else {
          // fromZone === "pool": если в droppedIdx что-то было — пушим в пул.
          // top3 setter уже перетёр слот, нужно отдельно знать occupant.
        }
        // Сделаем чисто: пересоберём pool через текущий top3 = переустановим
        // ниже отдельным эффектом? — проще обработать occupant явно тут.
        return next;
      });
      // Если перетянули из пула — добавим вытесненного в пул отдельным проходом.
      if (s.fromZone === "pool") {
        const occupant = top3[droppedIdx];
        if (occupant && occupant.id !== s.product.id) {
          setPool((prev) => [...prev, occupant]);
        }
      }
    } else if (droppedToPool && s.fromZone === "top3") {
      // Вернули из топ-3 обратно в пул.
      setTop3((prev) => {
        const next = [...prev];
        next[s.fromIdx] = null;
        return next;
      });
      setPool((prev) => [...prev, s.product]);
    }
    // else — отпустили вне зон → no-op, элемент остаётся на своём месте.

    dragRef.current = null;
    setDrag(null);
    setHoverSlot(null);
  };

  const ready = top3.every(Boolean);
  const remaining = 3 - top3.filter(Boolean).length;

  const confirmRanking = async () => {
    if (submitting || !ranking.length) return;
    setSubmitting(true);
    setError(null);
    try {
      await setPodium(id, { ranking: ranking.map((p) => p.id) });
      navigate(`/tasting/${id}/result`);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сохранить рейтинг.");
    } finally {
      setSubmitting(false);
    }
  };

  // Строка рейтинга продукта: медаль для топ-3, иначе номер места.
  const renderRankRow = (p, i) => (
    <>
      <span
        className={`ranking__rank ${i < 3 ? "ranking__rank--medal" : ""}`}
        style={i < 3 ? medalStyle(i) : undefined}
      >
        {i < 3 ? <IconMedal size={15} filled stroke={1.8} /> : <span className="tabnum">{i + 1}</span>}
      </span>
      <span className="ranking__body">
        <span className="ranking__name">{p.name}</span>
        {p.number != null && <span className="ranking__num tabnum">№{p.number}</span>}
      </span>
    </>
  );

  const confirm = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await setPodium(id, {
        first: top3[0]?.id ?? null,
        second: top3[1]?.id ?? null,
        third: top3[2]?.id ?? null,
      });
      navigate(`/tasting/${id}/result`);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сохранить выбор.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="fullscreen-center">Загружаем…</div>;
  }

  // Режим ранжирования всех продуктов (show_podium_candidates).
  if (rankingMode) {
    return (
      <div className="main-scroll">
        <PageHeader
          back={
            <button className="icon-btn icon-btn--leading" onClick={() => navigate(-1)}>
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
          }
        />

        <div className="hero">
          <div className="hero__eyebrow">Финальный шаг</div>
          <h1 className="title-xl">Ваш рейтинг</h1>
          <p className="hero__lede">
            Расставьте все блюда по&nbsp;местам — от&nbsp;любимого к&nbsp;наименее
            понравившемуся. Первые три места отмечены медалями.
          </p>
        </div>

        <div className="rank-all">
          <RankingList
            items={ranking}
            onChange={setRanking}
            getKey={(p) => p.id}
            renderItem={renderRankRow}
          />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="select-top-actions">
          <div className="select-top-actions__hint">
            Перетаскивайте карточки за&nbsp;«ручку», чтобы изменить порядок.
          </div>
          <button
            className="btn btn--primary"
            disabled={submitting || !ranking.length}
            onClick={confirmRanking}
          >
            <span>{submitting ? "Сохраняем…" : "Узнать результат"}</span>
            {!submitting && <IconArrowRight size={18} stroke={2} />}
          </button>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <>
      <div className="main-scroll">
        <PageHeader
          back={
            <button className="icon-btn icon-btn--leading" onClick={() => navigate(-1)}>
              <IconChevronLeft size={20} />
              <span>Назад</span>
            </button>
          }
        />

        <div className="hero">
          <div className="hero__eyebrow">Финальный шаг</div>
          <h1 className="title-xl">Кандидаты на&nbsp;пьедестал</h1>
          <p className="hero__lede">
            Перетащите трёх кандидатов из&nbsp;списка ниже на&nbsp;пьедестал.
            Карточки победителей можно менять местами и&nbsp;возвращать обратно в&nbsp;общий список.
          </p>
        </div>

        <div className="podium-slots">
          {top3.map((p, i) => (
            <div
              key={i}
              ref={(el) => { slotRefs.current[i] = el; }}
              style={medalStyle(i)}
              className={[
                "podium-slot",
                `podium-slot--rank-${i + 1}`,
                p ? "podium-slot--filled" : "podium-slot--empty",
                hoverSlot === i ? "podium-slot--hover" : "",
              ].filter(Boolean).join(" ")}
            >
              <span className="podium-slot__rank tabnum">{i + 1}</span>
              {p ? (
                <div
                  className="podium-slot__item"
                  onPointerDown={startDrag(p, "top3", i)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  style={dragRef.current?.product?.id === p.id ? { opacity: 0.3 } : undefined}
                >
                  <span className="podium-slot__icon">
                    <IconMedal size={14} filled stroke={1.8} />
                  </span>
                  <div className="podium-slot__body">
                    <div className="podium-slot__title-row">
                      <span className="podium-slot__title">{p.name}</span>
                      {p.number != null && (
                        <span className="podium-slot__num tabnum">№{p.number}</span>
                      )}
                    </div>
                  </div>
                  <span className="podium-slot__grip">
                    <IconGrip size={16} />
                  </span>
                </div>
              ) : (
                <div className="podium-slot__placeholder">
                  <span className="podium-slot__placeholder-icon" aria-hidden="true">
                    <IconMedal size={14} stroke={1.5} />
                  </span>
                  <span>Перетащите сюда</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pool-section" ref={poolRef}>
          <div className="profile-card-head__eyebrow pool-section__heading">
            Финалисты
          </div>
          {pool.length === 0 ? (
            <div className="pool__empty">Все ваши финалисты — на&nbsp;пьедестале.</div>
          ) : (
            <ul className="pool-list">
              {pool.map((p, i) => (
                <li
                  key={p.id}
                  className="pool-item"
                  onPointerDown={startDrag(p, "pool", i)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  style={dragRef.current?.product?.id === p.id ? { opacity: 0.3 } : undefined}
                >
                  <span className="pool-item__icon">
                    <IconMedal size={14} filled stroke={1.8} />
                  </span>
                  <div className="pool-item__body">
                    <div className="pool-item__title-row">
                      <span className="pool-item__title">{p.name}</span>
                      {p.number != null && (
                        <span className="pool-item__num tabnum">№{p.number}</span>
                      )}
                    </div>
                  </div>
                  <span className="pool-item__grip">
                    <IconGrip size={16} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="select-top-actions">
          <div className="select-top-actions__hint">
            {ready
              ? "Готово — три фаворита на пьедестале."
              : remaining > 0
                ? `Перетащите ещё ${remaining} на пьедестал`
                : "Выберите хотя бы один фаворит на странице дегустации."}
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
        <AppFooter />
      </div>

      {drag && drag.product && (
        <div
          ref={ghostRef}
          className="drag-ghost"
          style={{ width: dragRef.current?.width ?? "auto" }}
        >
          <span className="drag-ghost__icon">
            <IconMedal size={14} filled stroke={1.8} />
          </span>
          <span className="drag-ghost__title">{drag.product.name}</span>
          {drag.product.number != null && (
            <span className="drag-ghost__num tabnum">№{drag.product.number}</span>
          )}
        </div>
      )}
    </>
  );
}
