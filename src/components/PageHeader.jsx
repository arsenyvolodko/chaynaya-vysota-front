import { useNavigate } from "react-router-dom";
import Logomark from "./Logomark.jsx";

/**
 * Шапка, общая для всех внутренних страниц.
 *
 * Раскладок две:
 *  • без `back`: лого слева, `right`-слот (аватар и т.п.) справа;
 *  • с `back`:   кнопка «Назад» слева, лого справа.
 *
 * `center` — опциональный слот, абсолютно центрируется по ширине шапки
 * (например, индикатор «Шаг N» на странице сорта).
 *
 * Sticky top:0 внутри своего scroll-контейнера со шторкой-blur, чтобы шапка
 * оставалась видимой при длинном скролле.
 */
export default function PageHeader({ right, back, center, transparent }) {
  const navigate = useNavigate();

  const reversed = !!back;

  return (
    <div
      className={[
        "page-header",
        reversed ? "page-header--reversed" : "",
        transparent ? "page-header--transparent" : "",
      ].filter(Boolean).join(" ")}
    >
      {back && <div className="page-header__left">{back}</div>}
      <div className="page-header__brand">
        <button
          type="button"
          className="page-header__logo-btn"
          onClick={() => navigate("/")}
          aria-label="На главный экран"
        >
          <Logomark />
        </button>
      </div>
      {center != null && center !== false && (
        <div className="page-header__center">{center}</div>
      )}
      {right && !reversed && <div className="page-header__right">{right}</div>}
    </div>
  );
}
