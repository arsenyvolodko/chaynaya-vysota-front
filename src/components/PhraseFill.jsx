import { useEffect, useState } from "react";
import { IconCheck, IconPencil } from "./icons.jsx";

/**
 * PhraseFill — «закончите фразу»: шаблон с пропусками, которые гость заполняет.
 *
 * `segments` — статические куски текста (их на 1 больше, чем пропусков), между
 * ними blanks_count пропусков. Рендерим: seg0 [blank0] seg1 [blank1] … segN.
 *
 * Два режима с переключателем:
 *   • редактирование — инлайн-инпуты с «…» + кнопка «Готово» (галочка);
 *   • просмотр — собранная фраза без незаполненных пропусков; висячие запятые/
 *     союзы вокруг пропущенных слов убираются. Кнопка «Изменить» (карандаш).
 * Изначально (если текст ещё не трогали) карточка открывается в режиме
 * редактирования. В readOnly (страница результата) — всегда просмотр без кнопок.
 *
 * Контролируемый: value: string[]; onChange(index, value).
 */
const ELLIPSIS = "…";

// Опции для первого пропуска — он всегда раскрывающийся список (степень
// выраженности), а не свободный ввод.
const GRADE_OPTIONS = [
  "не обнаружены",
  "слабо выражены",
  "хорошо заметны",
  "ярко выражены",
  "доминируют",
];

// Собирает фразу из заполненных пропусков, выкидывая пустые вместе с висячими
// разделителями (запятая/«и»/«или») с одной из сторон.
function buildFilledText(segments, answers, n) {
  const MARK = "￿";
  const parts = [];
  for (let i = 0; i < n + 1; i++) {
    parts.push(segments[i] ?? "");
    if (i < n) {
      const v = String(answers[i] ?? "").trim();
      parts.push(v || MARK);
    }
  }
  let s = parts.join("");
  // вводная «, в частности: » перед пустым пропуском — убираем целиком
  s = s.replace(/,?\s*в\s+частности\s*:?\s*￿/gi, MARK);
  // разделитель + пустой пропуск
  s = s.replace(/\s*[,;:]\s*￿/g, "");
  s = s.replace(/\s+(?:и|или)\s+￿/gi, "");
  // пустой пропуск + разделитель
  s = s.replace(/￿\s*[,;:]\s*/g, "");
  s = s.replace(/￿\s+(?:и|или)\s+/gi, " ");
  // оставшиеся пустые пропуски
  s = s.replace(/\s*￿\s*/g, " ");
  // косметика: пробелы, пробел перед пунктуацией, дубли запятых, висячая запятая
  s = s.replace(/\s{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1");
  s = s.replace(/,\s*\./g, ".").replace(/,(?:\s*,)+/g, ",");
  s = s.replace(/[,;:]\s*$/g, "");
  return s.trim();
}

export default function PhraseFill({ phrase, value, onChange, readOnly }) {
  const n = Number(phrase?.blanks_count) || 0;
  const segments = Array.isArray(phrase?.segments) ? phrase.segments : [];
  const answers = Array.isArray(value) ? value : [];
  const anyFilled = answers.some((a) => String(a ?? "").trim());

  // Не трогали текст → открываем сразу на редактирование.
  const [editing, setEditing] = useState(() => !readOnly && !anyFilled);
  const isEditing = !readOnly && editing;

  // Первый пропуск — степень выраженности; по умолчанию «не обнаружены».
  // Проставляем дефолт в состояние, если пусто (чтобы он попал в сохранение).
  useEffect(() => {
    if (!readOnly && n > 0 && !String(answers[0] ?? "").trim()) {
      onChange?.(0, GRADE_OPTIONS[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrase?.id]);

  const seg = (i) => segments[i] ?? "";

  if (isEditing) {
    return (
      <div className="phrase-fill phrase-fill--edit">
        <p className="phrase-fill__text">
          {Array.from({ length: n + 1 }, (_, i) => (
            <span key={`s-${i}`}>
              {seg(i)}
              {i < n && (
                i === 0 ? (
                  // Первый пропуск — всегда выпадающий список (степень выраженности).
                  <span
                    className="phrase-blank phrase-blank--select"
                    data-value={answers[i] || GRADE_OPTIONS[0]}
                  >
                    <select
                      className="phrase-blank__select"
                      value={answers[i] || GRADE_OPTIONS[0]}
                      aria-label={`Пропуск ${i + 1}`}
                      onChange={(e) => onChange?.(i, e.target.value)}
                    >
                      {GRADE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </span>
                ) : (
                  // inline-grid авто-рост: невидимый «зеркальный» текст в ::after
                  // задаёт ширину ячейки, инпут её заполняет → текст влезает целиком.
                  <span className="phrase-blank" data-value={answers[i] ?? ""}>
                    <input
                      type="text"
                      className="phrase-blank__input"
                      value={answers[i] ?? ""}
                      placeholder={ELLIPSIS}
                      // size=1 → инпут не навязывает дефолтную ширину (≈20 символов);
                      // ширину ячейки задаёт зеркальный текст в ::after.
                      size={1}
                      aria-label={`Пропуск ${i + 1}`}
                      onChange={(e) => onChange?.(i, e.target.value)}
                    />
                  </span>
                )
              )}
            </span>
          ))}
          <button
            type="button"
            className="phrase-fill__icon-btn phrase-fill__icon-btn--done"
            onClick={() => setEditing(false)}
            aria-label="Готово"
            title="Готово"
          >
            <IconCheck size={14} stroke={2.6} />
          </button>
        </p>
      </div>
    );
  }

  const editBtn = !readOnly && (
    <button
      type="button"
      className="phrase-fill__icon-btn"
      onClick={() => setEditing(true)}
      aria-label="Изменить"
      title="Изменить"
    >
      <IconPencil size={13} stroke={1.9} />
    </button>
  );

  // Просмотр на странице сорта (не readOnly) при наличии пропусков: первый
  // пропуск остаётся живым списком, остальное — собранный текст.
  if (!readOnly && n > 0) {
    const grade = answers[0] || GRADE_OPTIONS[0];
    const suffix = buildFilledText(segments.slice(1), answers.slice(1), n - 1);
    return (
      <div className="phrase-fill phrase-fill--view">
        <p className="phrase-fill__text phrase-fill__text--view">
          {seg(0)}
          <span className="phrase-blank phrase-blank--select" data-value={grade}>
            <select
              className="phrase-blank__select"
              value={grade}
              aria-label="Пропуск 1"
              onChange={(e) => onChange?.(0, e.target.value)}
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </span>
          {suffix}
          {editBtn}
        </p>
      </div>
    );
  }

  // readOnly (страница результата) или фраза без пропусков → плоский текст.
  const text = buildFilledText(segments, answers, n);

  return (
    <div className="phrase-fill phrase-fill--view">
      <p className="phrase-fill__text phrase-fill__text--view">
        {text ? (
          <span>{text}</span>
        ) : !readOnly ? (
          <span className="phrase-fill__empty">Фраза ещё не заполнена</span>
        ) : null}
        {editBtn}
      </p>
    </div>
  );
}
