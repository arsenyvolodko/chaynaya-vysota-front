import { IconMedal } from "./icons.jsx";

/**
 * Toggle-карточка «Взять в финал» / «В списке финалистов».
 * Управляет тем же серверным флагом, что и старая LikeButton — `is_nominated`.
 * Никакой навигации не делает — это чистый переключатель.
 */
export default function NominateToggle({ isNominated, onToggle, disabled }) {
  return (
    <button
      type="button"
      className={`nominate ${isNominated ? "nominate--on" : ""}`}
      onClick={() => { if (!disabled) onToggle(); }}
      disabled={disabled}
      aria-pressed={isNominated}
    >
      <span className="nominate__icon">
        <IconMedal size={24} stroke={1.8} filled={isNominated} />
      </span>
      <div className="nominate__body">
        <div className="nominate__title">
          {isNominated ? "В кандидатах" : "Добавить в кандидаты"}
        </div>
        <div className="nominate__subtitle">
          Добавьте сорт в кандидаты, чтобы в&nbsp;конце дегустации выбрать из&nbsp;них свой Топ-3.
        </div>
      </div>
    </button>
  );
}
