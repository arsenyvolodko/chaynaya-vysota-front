import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconSparkles } from "../components/icons.jsx";
import MarqueeTags from "../components/MarqueeTags.jsx";
import NominateToggle from "../components/NominateToggle.jsx";
import ProductVisuals from "../components/ProductVisuals.jsx";
import RankingList from "../components/RankingList.jsx";
import StepSlider from "../components/StepSlider.jsx";
import VerticalStepSlider from "../components/VerticalStepSlider.jsx";
import CriteriaChart from "../components/CriteriaChart.jsx";
import { getTastingProduct, nominate, reviewProduct } from "../api/catalog";
import { useTasting } from "../hooks/useTasting.js";

// Раскладываем продукты в порядок «категория-за-категорией», где порядок
// категорий — это порядок первого появления каждой category в исходном списке
// (он уже отсортирован бэком по ProductTasting.order). Это страхует случай,
// когда admin задал order перекрывающимися значениями внутри разных категорий —
// иначе «Дальше» прыгало бы из категории в категорию.
function flatProductsByCategory(products) {
  const groups = new Map();
  for (const p of products) {
    const key = p.category || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return Array.from(groups.values()).flat();
}

function gradeFor(criteria) {
  const grade = Array.isArray(criteria?.grade) ? criteria.grade : [];
  return grade
    .map((item) => ({ value: Number(item.value), label: String(item.label ?? item.value) }))
    .filter((s) => Number.isFinite(s.value));
}

export default function DetailPage() {
  const { id, productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnly = searchParams.get("from") === "result";

  const { products: siblingProducts } = useTasting(id, { autoJoin: false });
  const orderedSiblings = useMemo(() => flatProductsByCategory(siblingProducts), [siblingProducts]);
  const currentIdx = orderedSiblings.findIndex((p) => String(p.id) === String(productId));
  const isLast = currentIdx >= 0 && currentIdx === orderedSiblings.length - 1;
  const nextProduct = !isLast && currentIdx >= 0 ? orderedSiblings[currentIdx + 1] : null;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // local edits that we'll send to backend
  const [marks, setMarks] = useState({});         // { [criteria_id]: value }
  const [tagIds, setTagIds] = useState(new Set()); // selected taste_tags ids
  const [composition, setComposition] = useState([]); // user ranking
  const [comment, setComment] = useState("");

  const sendTimer = useRef(null);
  const scrollRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getTastingProduct(id, productId);
      setProduct(p);
      const m = {};
      (p.taste_criteria || []).forEach((c) => {
        if (c.user_grade_review != null) m[c.id] = Number(c.user_grade_review);
      });
      (p.charts || []).forEach((ch) => {
        (ch.criterias || []).forEach((c) => {
          if (c.user_grade_review != null) m[c.id] = Number(c.user_grade_review);
        });
      });
      setMarks(m);
      const ids = new Set();
      (p.taste_tags || []).forEach((t) => { if (t.marked) ids.add(t.id); });
      setTagIds(ids);
      setComposition(
        p.user_composition && p.user_composition.length
          ? p.user_composition
          : (p.composition || [])
      );
      setComment(p.global_comment || "");
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id, productId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "auto" }); }, [productId]);

  const flushReview = useCallback(async (patch) => {
    try {
      const updated = await reviewProduct(productId, patch);
      // Бек на /review/ возвращает ProductSerializer (без tea_flavor_combination,
      // category, is_nominated, podium_place), а мы изначально грузим
      // ProductInTastingSerializer. Полная замена стейта стирала бы tea-связку
      // и слайдер «Силы мэтча» из блока «С чем сочетал». Мерджим, сохраняя
      // tasting-context-поля.
      setProduct((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (_) { /* ignore */ }
  }, [productId]);

  const scheduleSend = useCallback((patch) => {
    if (readOnly) return;
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(() => flushReview(patch), 450);
  }, [flushReview, readOnly]);

  useEffect(() => () => sendTimer.current && clearTimeout(sendTimer.current), []);

  const setMark = (cid, value) => {
    const next = { ...marks };
    if (value == null) delete next[cid];
    else next[cid] = value;
    setMarks(next);
    scheduleSend({ criteria_marks: next });
  };
  const toggleTag = (tid) => {
    const next = new Set(tagIds);
    if (next.has(tid)) next.delete(tid); else next.add(tid);
    setTagIds(next);
    scheduleSend({ taste_tags: Array.from(next) });
  };
  const onRanking = (next) => {
    setComposition(next);
    scheduleSend({ composition: next });
  };
  const onCommentChange = (v) => {
    setComment(v);
    scheduleSend({ global_comment: v });
  };
  const onToggleLike = async () => {
    if (readOnly || !product) return;
    const nextVal = !product.is_nominated;
    setProduct({ ...product, is_nominated: nextVal });
    try { await nominate(id, productId, nextVal); }
    catch (_) { setProduct({ ...product, is_nominated: !nextVal }); }
  };

  const criteriaSplit = useMemo(() => {
    if (!product) return { horizontal: [], vertical: [], pairing: [] };
    const horizontal = [];
    const vertical = [];
    const pairing = [];
    (product.taste_criteria || []).forEach((c) => {
      if (c.for_tea_combination) {
        pairing.push(c);
        return;
      }
      if (c.orientation === "vertical") vertical.push(c);
      else horizontal.push(c);
    });
    return { horizontal, vertical, pairing };
  }, [product]);

  const charts = product?.charts || [];

  const pairedTea = (product?.tea_flavor_combination || [])[0] || null;
  const matchCriteria = criteriaSplit.pairing[0] || null;

  if (loading) return <div className="fullscreen-center">Загружаем…</div>;
  if (error || !product) return <div className="fullscreen-center">Не удалось загрузить продукт.</div>;

  return (
    <div ref={scrollRef} className={`detail-scroll ${readOnly ? "detail--readonly" : ""}`}>
      <PageHeader
        center={currentIdx >= 0 ? `Шаг ${currentIdx + 1}` : null}
        back={
          <button
            className="icon-btn icon-btn--leading"
            onClick={() => (readOnly ? navigate(-1) : navigate(`/tasting/${id}`))}
          >
            <IconChevronLeft size={20} />
            <span>Назад</span>
          </button>
        }
      />

      <div className="detail-body">
        {product.category && (
          <div className="detail-eyebrow">{product.category}</div>
        )}

        <div className="detail-title-row">
          {product.type === "tea" && product.image && (
            <img
              className="detail-title-img"
              src={product.image}
              alt=""
              aria-hidden="true"
            />
          )}
          <h1 className="title-lg detail-title">{product.name}</h1>
          {product.number != null && (
            <span className="detail-num">
              <span className="detail-num__label">Рецепт</span>
              <span className="detail-num__val tabnum">№{product.number}</span>
            </span>
          )}
        </div>

        {product.line && (
          <div className="detail-line">
            <span className="detail-line__rule" />
            <span className="detail-line__text">
              Линия: <em>{product.line.toLowerCase()}</em>
            </span>
          </div>
        )}

        <ProductVisuals product={product} />

        {composition.length > 0 && (
          <div className="ingredients">
            {composition.map((ing) => (
              <span key={ing} className="ingredient">{ing}</span>
            ))}
          </div>
        )}

        {product.type === "tea" && (
          product.tea_nickname ||
          product.tea_rubrucator ||
          product.tea_sort ||
          product.tea_index ||
          product.tea_price ||
          product.tea_geography ||
          product.tea_plucking_season
        ) && (
          <div className="tea-meta">
            <dl className="tea-meta__grid">
              {product.tea_rubrucator && (
                <div className="tea-meta__row">
                  <dt>Рубрикатор</dt>
                  <dd>{product.tea_rubrucator}</dd>
                </div>
              )}
              {product.tea_geography && (
                <div className="tea-meta__row">
                  <dt>География</dt>
                  <dd>{product.tea_geography}</dd>
                </div>
              )}
              {product.tea_nickname && (
                <div className="tea-meta__row tea-meta__row--nickname">
                  <dt>Ник</dt>
                  <dd>
                    <span>{product.tea_nickname}</span>
                  </dd>
                </div>
              )}
              {product.tea_sort && (
                <div className="tea-meta__row">
                  <dt>Сорт</dt>
                  <dd>{product.tea_sort}</dd>
                </div>
              )}
              {product.tea_plucking_season && (
                <div className="tea-meta__row">
                  <dt>Дата/Сезон сбора</dt>
                  <dd>{product.tea_plucking_season}</dd>
                </div>
              )}
              {product.tea_index && (
                <div className="tea-meta__row">
                  <dt>Индекс</dt>
                  <dd className="tabnum">{product.tea_index}</dd>
                </div>
              )}
              {product.tea_price != null && Number(product.tea_price) > 0 && (
                <div className="tea-meta__row">
                  <dt>{product.tea_measure_unit ? `Цена за ${product.tea_measure_unit}` : "Цена"}</dt>
                  <dd className="tabnum">{product.tea_price} ₽</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {product.description && (
          <p className="detail-desc">{product.description}</p>
        )}

        {product.interesting_fact && (
          <div className="trivia">
            <div className="trivia__head">
              <span className="trivia__icon" aria-hidden="true">
                <IconSparkles size={14} stroke={1.6} />
              </span>
              <span className="trivia__label">Интересно будет знать о&nbsp;сорте</span>
            </div>
            <p className="trivia__body">{product.interesting_fact}</p>
          </div>
        )}
      </div>

      {criteriaSplit.vertical.length > 0 && (
        <div className="detail-body section">
          <div className="section__label">Оценка вкуса</div>
          <div className="vsteps-row">
            {criteriaSplit.vertical.map((c) => (
              <VerticalStepSlider
                key={c.id}
                label={c.name}
                info={c.description}
                steps={gradeFor(c)}
                value={marks[c.id] ?? null}
                onChange={(v) => setMark(c.id, v)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}

      {charts.map((chart) => (
        <div key={chart.id} className="detail-body section">
          <div className="section__label">{chart.name}</div>
          {chart.description && (
            <div className="section__hint">{chart.description}</div>
          )}
          <CriteriaChart
            criterias={chart.criterias || []}
            marks={marks}
            onChange={(cid, v) => setMark(cid, v)}
            readOnly={readOnly}
            labelPlacement={chart.label_placement}
            color={chart.color}
          />
        </div>
      ))}

      {criteriaSplit.horizontal.length > 0 && (
        <div className="detail-body section">
          {criteriaSplit.vertical.length === 0 && (
            <div className="section__label">Оценка вкуса</div>
          )}
          <div className="step-sliders">
            {criteriaSplit.horizontal.map((c) => (
              <StepSlider
                key={c.id}
                label={c.name}
                info={c.description}
                steps={gradeFor(c)}
                value={marks[c.id] ?? null}
                onChange={(v) => setMark(c.id, v)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}

      {composition.length > 0 && (
        <div className="detail-body section">
          <div className="section__label">Расположите ингредиенты по&nbsp;яркости вкуса</div>
          <div className="section__hint">
            Потяните карточки, чтобы выстроить рейтинг ингредиентов по&nbsp;яркости вкуса.
          </div>
          <RankingList items={composition} onChange={onRanking} readOnly={readOnly} />
        </div>
      )}

      {(product.taste_tags || []).length > 0 && (
        <div className="detail-body section">
          <div className="section__label">Общее впечатление</div>
          <MarqueeTags
            tags={product.taste_tags}
            selectedIds={tagIds}
            onToggle={toggleTag}
            readOnly={readOnly}
          />
          <div className="section__hint section__hint--swipe section__hint--below">
            <span className="section__hint-swipe section__hint-swipe--left" aria-hidden="true">
              <IconChevronLeft size={11} stroke={2.2} />
            </span>
            <span>Листайте теги и&nbsp;выбирайте всё, что откликается</span>
            <span className="section__hint-swipe section__hint-swipe--right" aria-hidden="true">
              <IconChevronRight size={11} stroke={2.2} />
            </span>
          </div>
        </div>
      )}

      {(pairedTea || matchCriteria) && (
        <div className="detail-body section">
          <div className="section__label">С чем сочетал</div>
          <div className="pairing-card">
            {pairedTea && (
              <div className="paired-tea">
                <span className="paired-tea__icon">
                  {pairedTea.logo ? (
                    <img
                      src={pairedTea.logo}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover" }}
                    />
                  ) : null}
                </span>
                <div className="paired-tea__body">
                  <span className="paired-tea__label">Подобранный чай</span>
                  <span className="paired-tea__name">{pairedTea.name}</span>
                </div>
              </div>
            )}
            {pairedTea && matchCriteria && <div className="pairing-card__divider" />}
            {matchCriteria && (
              <div className="step-sliders step-sliders--single">
                <StepSlider
                  label={matchCriteria.name}
                  info={matchCriteria.description}
                  steps={gradeFor(matchCriteria)}
                  value={marks[matchCriteria.id] ?? null}
                  onChange={(v) => setMark(matchCriteria.id, v)}
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="detail-body section">
        <div className="section__label">Комментарий</div>
        <textarea
          className="comment"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={4}
          readOnly={readOnly}
          placeholder="Поделитесь своим мнением…"
        />
      </div>

      {readOnly ? (
        <div className="detail-body footer--detail">
          <div className="footer__row">
            <button className="btn btn--primary footer__next" onClick={() => navigate(-1)}>
              <IconChevronLeft size={18} stroke={2} />
              <span>Назад к&nbsp;результатам</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="detail-body footer--detail">
          <NominateToggle
            isNominated={!!product.is_nominated}
            onToggle={onToggleLike}
            disabled={readOnly}
          />
          <div className="footer__row" style={{ marginTop: 12 }}>
            <button
              className="btn btn--primary footer__next"
              onClick={() => {
                if (nextProduct) navigate(`/tasting/${id}/product/${nextProduct.id}`);
                else navigate(`/tasting/${id}`);
              }}
            >
              <span>{isLast ? "Завершить" : "Продолжить"}</span>
              <IconArrowRight size={18} stroke={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
