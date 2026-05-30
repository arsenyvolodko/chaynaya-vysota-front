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
import TastePlot from "../components/TastePlot.jsx";
import PhraseFill from "../components/PhraseFill.jsx";
import FreeTextPrompt from "../components/FreeTextPrompt.jsx";
import PhotoStrip from "../components/PhotoStrip.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { clearPlotMarks, getTastingProduct, nominate, reviewProduct } from "../api/catalog";
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

  const { tasting, products: siblingProducts } = useTasting(id, { autoJoin: false });
  // show_podium_candidates=true → классический отбор кандидатов: кнопка «в
  // кандидаты» в карточке есть. Если флаг false — кандидатов нет, гость в конце
  // ранжирует все блюда, и кнопки в карточке быть не должно. Дефолт на время
  // загрузки tasting — режим кандидатов (кнопку не прячем зря).
  const rankingMode = !!tasting && !tasting.show_podium_candidates;
  const orderedSiblings = useMemo(() => flatProductsByCategory(siblingProducts), [siblingProducts]);
  const currentIdx = orderedSiblings.findIndex((p) => String(p.id) === String(productId));
  const isLast = currentIdx >= 0 && currentIdx === orderedSiblings.length - 1;
  const nextProduct = !isLast && currentIdx >= 0 ? orderedSiblings[currentIdx + 1] : null;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // local edits that we'll send to backend
  const [marks, setMarks] = useState({});         // одномерные: { [criteria_id]: value }
  const [plotMarks, setPlotMarks] = useState({});  // plot-точки: { [criteria_id]: { [x]: mark } }
  const [phraseAnswers, setPhraseAnswers] = useState({}); // фразы: { [phrase_id]: string[] }
  const [freeTexts, setFreeTexts] = useState({}); // свободный текст: { [prompt_id]: string }
  const [tagIds, setTagIds] = useState(new Set()); // selected taste_tags ids
  const [composition, setComposition] = useState([]); // user ranking
  const [comment, setComment] = useState("");

  const sendTimer = useRef(null);
  const pendingRef = useRef({});  // накопленный патч ревью между дебаунс-флашами
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
      // plot-критерии: user_grade_review — список точек [{x, mark}].
      const pm = {};
      (p.plots || []).forEach((pl) => {
        (pl.criterias || []).forEach((c) => {
          const pts = Array.isArray(c.user_grade_review) ? c.user_grade_review : [];
          if (!pts.length) return;
          const byX = {};
          pts.forEach((pt) => { byX[pt.x] = Number(pt.mark); });
          pm[c.id] = byX;
        });
      });
      setPlotMarks(pm);
      // фразы с пропусками: держим массив длиной blanks_count, "" для пустых.
      const pa = {};
      (p.phrases || []).forEach((ph) => {
        const len = Number(ph.blanks_count) || 0;
        const ua = Array.isArray(ph.user_answers) ? ph.user_answers : [];
        pa[ph.id] = Array.from({ length: len }, (_, i) => ua[i] ?? "");
      });
      setPhraseAnswers(pa);
      // свободный текст по промптам.
      const ft = {};
      (p.free_text_prompts || []).forEach((pr) => {
        ft[pr.id] = pr.user_text ?? "";
      });
      setFreeTexts(ft);
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
      const updated = await reviewProduct(id, productId, patch);
      // Бек на /review/ возвращает обновлённую карточку (ProductInTastingSerializer);
      // мерджим в стейт, сохраняя поля, которые ручка могла не вернуть.
      setProduct((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (_) { /* ignore */ }
  }, [id, productId]);

  // Накопительный дебаунс: патчи мерджатся в pendingRef, чтобы быстрые правки
  // разных полей (слайдер + plot + тег) не затирали друг друга одним таймером.
  const scheduleSend = useCallback((patch) => {
    if (readOnly) return;
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(() => {
      const body = pendingRef.current;
      pendingRef.current = {};
      flushReview(body);
    }, 450);
  }, [flushReview, readOnly]);

  useEffect(() => () => sendTimer.current && clearTimeout(sendTimer.current), []);

  const setMark = (cid, value) => {
    const next = { ...marks };
    if (value == null) delete next[cid];
    else next[cid] = value;
    setMarks(next);
    scheduleSend({ criteria_marks: next });
  };

  // plot_marks — плоский снапшот всех точек всех plot-критериев: бек делает
  // апсёрт по (criteria, x), поэтому слать полный набор безопасно и идемпотентно.
  const buildPlotMarks = (pm) => {
    const out = [];
    Object.entries(pm).forEach(([cid, byX]) => {
      Object.entries(byX).forEach(([x, mark]) => {
        out.push({ criteria: Number(cid), x: Number(x), mark: Number(mark) });
      });
    });
    return out;
  };
  const setPlotMark = (cid, x, mark) => {
    const next = { ...plotMarks, [cid]: { ...(plotMarks[cid] || {}), [x]: mark } };
    setPlotMarks(next);
    scheduleSend({ plot_marks: buildPlotMarks(next) });
  };
  // Очистить все точки конкретного plot. Бек удаляет оценки по критериям чарта
  // (DELETE .../charts/{plot.id}/marks) и возвращает обновлённую карточку.
  const clearPlot = async (plot) => {
    const ids = (plot?.criterias || []).map((c) => c.id);
    if (!ids.length) return;
    // Оптимистично чистим локально.
    const next = { ...plotMarks };
    ids.forEach((id) => { delete next[id]; });
    setPlotMarks(next);
    // Не дать отложенному флашу вернуть очищенные точки (апсёрт по снапшоту).
    if (pendingRef.current.plot_marks) {
      pendingRef.current = { ...pendingRef.current, plot_marks: buildPlotMarks(next) };
    }
    try {
      const updated = await clearPlotMarks(id, productId, plot.id);
      setProduct((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (_) { /* локально уже очищено */ }
  };

  // phrase_answers — снапшот всех фраз: [{phrase, answers}], answers длиной
  // blanks_count (пустые пропуски шлём "" — длина обязана совпадать с blanks_count).
  const buildPhraseAnswers = (pa) =>
    Object.entries(pa).map(([phrase, answers]) => ({
      phrase: Number(phrase),
      answers: Array.isArray(answers) ? answers : [],
    }));
  const setPhraseAnswer = (phraseId, idx, val) => {
    const cur = phraseAnswers[phraseId] || [];
    const next = { ...phraseAnswers, [phraseId]: cur.map((a, i) => (i === idx ? val : a)) };
    setPhraseAnswers(next);
    scheduleSend({ phrase_answers: buildPhraseAnswers(next) });
  };

  // free_text_answers — снапшот всех промптов: [{prompt, text}] (пустая строка очищает).
  const buildFreeTextAnswers = (ft) =>
    Object.entries(ft).map(([prompt, text]) => ({ prompt: Number(prompt), text: text ?? "" }));
  const setFreeText = (promptId, text) => {
    const next = { ...freeTexts, [promptId]: text };
    setFreeTexts(next);
    scheduleSend({ free_text_answers: buildFreeTextAnswers(next) });
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

  // Средства оценки раскладываются по taste_block. Бек присылает у каждого
  // автономного критерия / чарта / плота / фразы / свободного текста поля
  // taste_block (id или null) и order, а также упорядоченный список разделов
  // taste_blocks: [{id, name}].
  //   • taste_block === null  → рисуем в легаси-секциях (обратная совместимость).
  //   • taste_block ∈ taste_blocks → рисуем внутри соответствующего раздела.
  //   • taste_block не из списка → НЕ рисуем вовсе.
  // Если taste_blocks пуст — остаются только null-элементы (как было раньше).
  // Критерии «с чем сочетал» (for_tea_combination) — отдельная секция, в блоки
  // их не раскладываем.
  const evalGroups = useMemo(() => {
    const emptyGroup = { criteria: [], charts: [], plots: [], phrases: [], freeTexts: [] };
    if (!product) return { nullGroup: emptyGroup, blocks: [] };

    const allCriteria = Array.isArray(product.taste_criteria) ? product.taste_criteria : [];
    const allCharts = Array.isArray(product.charts) ? product.charts : [];
    const allPlots = Array.isArray(product.plots) ? product.plots : [];
    const allPhrases = Array.isArray(product.phrases) ? product.phrases : [];
    const allFreeTexts = Array.isArray(product.free_text_prompts) ? product.free_text_prompts : [];
    const blockList = Array.isArray(product.taste_blocks) ? product.taste_blocks : [];

    const blockOf = (el) => (el?.taste_block == null ? null : el.taste_block);

    const groupFor = (blockId) => ({
      criteria: allCriteria.filter((c) => !c.for_tea_combination && blockOf(c) === blockId),
      charts: allCharts.filter((ch) => blockOf(ch) === blockId),
      plots: allPlots.filter((pl) => blockOf(pl) === blockId),
      phrases: allPhrases.filter((ph) => blockOf(ph) === blockId),
      freeTexts: allFreeTexts.filter((pr) => blockOf(pr) === blockId),
    });

    return {
      nullGroup: groupFor(null),
      blocks: blockList.map((b) => ({ block: b, group: groupFor(b.id) })),
    };
  }, [product]);

  const pairedTea = (product?.tea_flavor_combination || [])[0] || null;
  const matchCriteria =
    (product?.taste_criteria || []).find((c) => c.for_tea_combination) || null;

  // Рендер-хелперы средств оценки — переиспользуются и в легаси-секциях, и
  // внутри секций taste_block.
  const renderVerticalGroup = (crits) => (
    <div className="vsteps-row">
      {crits.map((c) => (
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
  );
  const renderHorizontalGroup = (crits) => (
    <div className="step-sliders">
      {crits.map((c) => (
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
  );
  const renderChart = (chart) => (
    <CriteriaChart
      criterias={chart.criterias || []}
      marks={marks}
      onChange={(cid, v) => setMark(cid, v)}
      readOnly={readOnly}
      labelPlacement={chart.label_placement}
      color={chart.color}
    />
  );
  const renderPlot = (plot) => (
    <TastePlot
      plot={plot}
      value={plotMarks}
      onChange={(cid, x, mark) => setPlotMark(cid, x, mark)}
      onClear={() => clearPlot(plot)}
      readOnly={readOnly}
    />
  );
  const renderPhrase = (phrase) => (
    <PhraseFill
      phrase={phrase}
      value={phraseAnswers[phrase.id]}
      onChange={(idx, v) => setPhraseAnswer(phrase.id, idx, v)}
      readOnly={readOnly}
    />
  );
  // В readOnly промпт без ответа скрываем целиком (вместе с заголовком секции).
  const freeTextVisible = (pr) => !readOnly || String(freeTexts[pr.id] ?? "").trim().length > 0;
  const renderFreeText = (pr) => (
    <FreeTextPrompt
      value={freeTexts[pr.id]}
      onChange={(t) => setFreeText(pr.id, t)}
      readOnly={readOnly}
    />
  );

  // Сквозной порядок: мёржим все типы средств оценки одного блока в общий список
  // по полю order и склеиваем подряд идущие вертикальные / горизонтальные шкалы
  // в один ряд (чтобы вертикальные слайдеры стояли «бок о бок», как раньше).
  const ordOf = (el) => (Number.isFinite(Number(el?.order)) ? Number(el.order) : 0);
  const buildUnits = (group) => {
    const items = [
      ...group.criteria.map((item) => ({ type: "criteria", item })),
      ...group.charts.map((item) => ({ type: "chart", item })),
      ...group.plots.map((item) => ({ type: "plot", item })),
      ...group.phrases.map((item) => ({ type: "phrase", item })),
      ...group.freeTexts.filter(freeTextVisible).map((item) => ({ type: "freeText", item })),
    ]
      .map((x, i) => ({ ...x, i }))
      .sort((a, b) => ordOf(a.item) - ordOf(b.item) || a.i - b.i);

    const units = [];
    let run = null; // объединяем подряд идущие критерии одной ориентации
    for (const it of items) {
      if (it.type === "criteria") {
        const kind = it.item.orientation === "vertical" ? "vrun" : "hrun";
        if (run && run.kind === kind) {
          run.items.push(it.item);
        } else {
          run = { kind, items: [it.item] };
          units.push(run);
        }
      } else {
        run = null;
        units.push({ kind: it.type, item: it.item });
      }
    }
    return units;
  };

  // Контрол юнита без обёртки-секции (для использования внутри секции блока).
  const renderUnitControl = (unit) => {
    switch (unit.kind) {
      case "vrun": return renderVerticalGroup(unit.items);
      case "hrun": return renderHorizontalGroup(unit.items);
      case "chart": return renderChart(unit.item);
      case "plot": return renderPlot(unit.item);
      case "phrase": return renderPhrase(unit.item);
      case "freeText": return renderFreeText(unit.item);
      default: return null;
    }
  };
  const unitKey = (unit, idx) =>
    unit.item ? `${unit.kind}-${unit.item.id}` : `${unit.kind}-${idx}`;
  // Под-заголовок юнита внутри секции блока (у шкал заголовка нет — он на самих шкалах).
  const unitSubLabel = (unit) => {
    switch (unit.kind) {
      case "chart":
      case "plot": return unit.item.name || null;
      case "phrase": return unit.item.name || null;
      case "freeText": return unit.item.name || null;
      default: return null;
    }
  };

  // Теги «Общее впечатление». Где показывать решает show_tags на блоках:
  //   • блоков нет           → отдельной секцией (как раньше);
  //   • есть блок(и) show_tags → внутри такого блока;
  //   • блоки есть, но ни в одном show_tags → не показываем нигде.
  const hasTags = (product?.taste_tags || []).length > 0;
  const hasBlocks = Array.isArray(product?.taste_blocks) && product.taste_blocks.length > 0;
  const renderTags = () => (
    <>
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
    </>
  );

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

        {/* Фото без блока — под описанием продукта. */}
        {(product.photos || []).length > 0 && <PhotoStrip photos={product.photos} />}
      </div>

      {/* Легаси: элементы без taste_block. Упорядочены сквозным order, каждый
          юнит — своя секция-карточка (исторический вид). */}
      {(() => {
        const units = buildUnits(evalGroups.nullGroup);
        let criteriaLabelShown = false;
        return units.map((unit, idx) => {
          if (unit.kind === "vrun" || unit.kind === "hrun") {
            const showLabel = !criteriaLabelShown;
            criteriaLabelShown = true;
            return (
              <div key={unitKey(unit, idx)} className="detail-body section">
                {showLabel && <div className="section__label">Оценка вкуса</div>}
                {renderUnitControl(unit)}
              </div>
            );
          }
          const item = unit.item;
          const label =
            unit.kind === "phrase"
              ? item.name || "Закончите фразу"
              : unit.kind === "freeText"
                ? item.name || "Ваш ответ"
                : item.name;
          return (
            <div key={unitKey(unit, idx)} className="detail-body section">
              {label && <div className="section__label">{label}</div>}
              {item.description && <div className="section__hint">{item.description}</div>}
              {renderUnitControl(unit)}
            </div>
          );
        });
      })()}

      {/* Секции taste_block — после всей инфо о продукте и легаси-шкал. Внутри
          секции все типы средств оценки идут единым списком по order. */}
      {evalGroups.blocks.map(({ block, group }) => {
        const units = buildUnits(group);
        const showTagsHere = !!block.show_tags && hasTags;
        const blockPhotos = block.photos || [];
        if (!units.length && !showTagsHere && !blockPhotos.length) return null;
        return (
          <div key={`block-${block.id}`} className="detail-body section section--block">
            <div className="taste-block-head">
              <div className="taste-block-head__eyebrow">Раздел оценки</div>
              <h2 className="taste-block-head__title">{block.name}</h2>
            </div>
            {/* Фото блока — сразу под названием раздела. */}
            {blockPhotos.length > 0 && <PhotoStrip photos={blockPhotos} />}
            {units.map((unit, idx) => {
              if (unit.kind === "vrun" || unit.kind === "hrun") {
                return <div key={unitKey(unit, idx)}>{renderUnitControl(unit)}</div>;
              }
              const subLabel = unitSubLabel(unit);
              return (
                <div key={unitKey(unit, idx)} className="block-sub">
                  {subLabel && <div className="block-sub__label">{subLabel}</div>}
                  {unit.item.description && (
                    <div className="section__hint">{unit.item.description}</div>
                  )}
                  {renderUnitControl(unit)}
                </div>
              );
            })}
            {showTagsHere && (
              <div className="block-sub">
                <div className="block-sub__label">Общее впечатление</div>
                {renderTags()}
              </div>
            )}
          </div>
        );
      })}

      {composition.length > 0 && (
        <div className="detail-body section">
          <div className="section__label">Расположите ингредиенты по&nbsp;яркости вкуса</div>
          <div className="section__hint">
            Потяните карточки, чтобы выстроить рейтинг ингредиентов по&nbsp;яркости вкуса.
          </div>
          <RankingList items={composition} onChange={onRanking} readOnly={readOnly} />
        </div>
      )}

      {/* Без блоков теги показываем отдельной секцией (как раньше). С блоками
          они уходят внутрь блока(ов) с show_tags. */}
      {!hasBlocks && hasTags && (
        <div className="detail-body section">
          <div className="section__label">Общее впечатление</div>
          {renderTags()}
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
          {!rankingMode && (
            <NominateToggle
              isNominated={!!product.is_nominated}
              onToggle={onToggleLike}
              disabled={readOnly}
            />
          )}
          <div className="footer__row" style={{ marginTop: rankingMode ? 0 : 12 }}>
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
      <AppFooter />
    </div>
  );
}
