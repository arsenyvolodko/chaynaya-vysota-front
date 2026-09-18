import { IconArrowRight, IconLeaf, IconMedal, IconShare, IconSparkles } from "./icons.jsx";

// Шаги описывают реальную механику дегустационного листа: слепая проба →
// оценки по шкалам → подиум и фраза вечера → результат, которым можно
// поделиться. Это же и продаёт вечер тем, кто ещё не был.
const STEPS = [
  {
    icon: IconLeaf,
    title: "Пробуете и сравниваете",
    text: "Чай и мороженое раскрываются в своём ритме — делитесь впечатлениями и отмечайте любимые вкусы.",
  },
  {
    icon: IconSparkles,
    title: "Ставите оценки",
    text: "Дегустационный лист открывается в телефоне: шкалы, ассоциации и короткие заметки.",
  },
  {
    icon: IconMedal,
    title: "Собираете подиум",
    text: "В конце вечера выбираете трёх фаворитов и сравниваете их с выбором стола.",
  },
  {
    icon: IconShare,
    title: "Забираете результат",
    text: "Получаете фразу вечера и карточку с итогами — ей можно поделиться.",
  },
];

export default function EveningStepsBlock({ onPickDate }) {
  return (
    <section className="steps-block">
      <div className="section-head">
        <span className="section-head__eyebrow">Как проходит вечер</span>
        <h2 className="section-head__title">Четыре шага от первой пробы до итогов</h2>
        <p className="section-head__lede">
          Ничего не нужно знать заранее — ведущий держит темп, а оценки
          собираются сами в телефоне.
        </p>
      </div>

      <ol className="steps">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li className="step" key={title}>
            <span className="step__num">{String(i + 1).padStart(2, "0")}</span>
            <span className="step__icon"><Icon size={18} stroke={1.7} /></span>
            <span className="step__title">{title}</span>
            <span className="step__text">{text}</span>
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn--primary steps-block__cta" onClick={onPickDate}>
        <span>Выбрать дату</span>
        <IconArrowRight size={18} stroke={2} />
      </button>
    </section>
  );
}
