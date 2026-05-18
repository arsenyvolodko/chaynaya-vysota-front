import { useLocation, useNavigate } from "react-router-dom";
import Logomark from "./Logomark.jsx";

/**
 * Шапка, общая для всех внутренних страниц.
 *
 * Раскладок две:
 *  • без `back`: лого+«Контакты» слева, `right`-слот (аватар и т.п.) справа;
 *  • с `back`:   кнопка «Назад» слева, лого+«Контакты» справа.
 *
 * Sticky top:0 внутри своего scroll-контейнера со шторкой-blur, чтобы шапка
 * оставалась видимой при длинном скролле.
 */
export default function PageHeader({ right, back, transparent }) {
  const navigate = useNavigate();
  const location = useLocation();
  const onContacts = location.pathname === "/contacts";

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
        {!onContacts && (
          <button
            type="button"
            className="page-header__contacts"
            onClick={() => navigate("/contacts")}
          >
            Контакты
          </button>
        )}
      </div>
      {right && !reversed && <div className="page-header__right">{right}</div>}
    </div>
  );
}
