/**
 * PhraseFill — «закончите фразу»: шаблон с пропусками, которые гость заполняет.
 *
 * Бек присылает `segments` — статические куски текста (их на 1 больше, чем
 * пропусков), между ними `blanks_count` пропусков. Рендерим:
 *   segments[0] [blank 0] segments[1] [blank 1] … segments[n]
 *
 * Режимы:
 *   • редактирование (не readOnly): каждый пропуск — инлайн-инпут с плейсхолдером
 *     «…», чтобы изначально были видны многоточия на месте пропусков.
 *   • просмотр (readOnly, «после завершения редактирования»): заполненные
 *     пропуски — слово с подчёркиванием, пустые (null/"") — скрываются (многоточий
 *     не показываем).
 *
 * Контролируемый компонент:
 *   value:    string[] — ответы по пропускам (по порядку, длина = blanks_count)
 *   onChange: (index, value) => void
 */
const ELLIPSIS = "…";

export default function PhraseFill({ phrase, value, onChange, readOnly }) {
  const n = Number(phrase?.blanks_count) || 0;
  const segments = Array.isArray(phrase?.segments) ? phrase.segments : [];
  const answers = Array.isArray(value) ? value : [];

  // Кусок текста перед i-м пропуском (или хвост при i === n).
  const seg = (i) => segments[i] ?? "";

  const renderBlank = (i) => {
    const val = answers[i] ?? "";
    if (readOnly) {
      // «после завершения редактирования»: пустые пропуски не показываем вовсе.
      if (!String(val).trim()) return null;
      return (
        <span key={`b-${i}`} className="phrase-blank phrase-blank--filled">
          {val}
        </span>
      );
    }
    return (
      <input
        key={`b-${i}`}
        type="text"
        className="phrase-blank__input"
        value={val}
        placeholder={ELLIPSIS}
        // ширина по содержимому: минимум хватает на многоточие.
        size={Math.max(3, String(val).length)}
        aria-label={`Пропуск ${i + 1}`}
        onChange={(e) => onChange?.(i, e.target.value)}
      />
    );
  };

  return (
    <div className={`phrase-fill ${readOnly ? "is-readonly" : ""}`}>
      <p className="phrase-fill__text">
        {Array.from({ length: n + 1 }, (_, i) => (
          <span key={`s-${i}`}>
            {seg(i)}
            {i < n ? renderBlank(i) : null}
          </span>
        ))}
      </p>
    </div>
  );
}
