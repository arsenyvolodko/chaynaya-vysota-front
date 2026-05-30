/**
 * FreeTextPrompt — свободный текстовый ответ на промпт.
 *
 * Бек присылает промпт (name + опц. description), гость пишет произвольный текст;
 * отправляется через free_text_answers: [{prompt, text}] (пустая строка очищает).
 *
 * Контролируемый компонент. Заголовок/описание промпта рисует родитель (секция),
 * здесь — только контрол:
 *   • редактирование: textarea;
 *   • просмотр (readOnly): абзац с текстом, либо null если пусто (родитель
 *     прячет всю секцию).
 *
 * Props:
 *   value:    string
 *   onChange: (text) => void
 *   readOnly: bool
 *   placeholder: string
 */
export default function FreeTextPrompt({ value, onChange, readOnly, placeholder }) {
  if (readOnly) {
    const text = String(value ?? "").trim();
    if (!text) return null;
    return <p className="free-text__readonly">{value}</p>;
  }
  return (
    <textarea
      className="comment free-text__input"
      value={value ?? ""}
      rows={3}
      placeholder={placeholder || "Ваш ответ…"}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
