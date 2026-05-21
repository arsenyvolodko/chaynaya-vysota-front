import Logomark from "./Logomark.jsx";

/**
 * Бренд-футер, общий для всех страниц приложения. Сидит в потоке внизу
 * скролла (не fixed/sticky) — спокойно уезжает за край вместе с контентом.
 */
export default function AppFooter() {
  return (
    <div className="app-footer" role="contentinfo">
      <Logomark />
      <span className="app-footer__text">дегустация ЧАЙКОДИНГ</span>
    </div>
  );
}
