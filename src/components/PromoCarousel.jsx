import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconChevronRight, IconLeaf, IconTicket } from "./icons.jsx";
import { formatTastingDateShort, formatTastingTime } from "../utils/date.js";

// Промо-листалка на странице расписания — 2/3 экрана, три смысловых экрана:
// ближайшая дегустация (переход к ней), шеф-чаепития (якорь ниже на этой же
// странице) и пьючерсы/лучерсы (внешняя ссылка на teatix.com). Экран
// «ближайшая дегустация» — единственный без своей кнопки: кликабельна вся
// карточка. Карточки уже трека — справа виден край соседней, слева всегда
// остаётся отступ (см. scroll-padding в CSS), чтобы понятно было, что
// листалку можно листать дальше.
export default function PromoCarousel({ nearestTasting, onOpenNearest, onOpenChefTeas }) {
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  slideRefs.current = [];
  const [active, setActive] = useState(0);
  const slideCount = nearestTasting ? 3 : 2;

  const registerSlide = (el) => {
    if (el) slideRefs.current.push(el);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const trackLeft = el.getBoundingClientRect().left;
      let bestIdx = 0;
      let bestDist = Infinity;
      slideRefs.current.forEach((slideEl, i) => {
        const dist = Math.abs(slideEl.getBoundingClientRect().left - trackLeft);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActive((prev) => (prev === bestIdx ? prev : bestIdx));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i) => {
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div className="promo-carousel">
      <div className="promo-carousel__track" ref={trackRef}>
        {nearestTasting && (
          <button
            type="button"
            className={`promo-carousel__cell promo-slide promo-slide--event ${nearestTasting.cover_url ? "promo-slide--photo" : ""}`}
            ref={registerSlide}
            onClick={() => onOpenNearest?.(nearestTasting)}
          >
            {nearestTasting.cover_url && (
              <img className="promo-slide__photo" src={nearestTasting.cover_url} alt="" />
            )}
            <span className="promo-slide__event-body">
              <span className="promo-slide__eyebrow">Совсем скоро</span>
              <span className="promo-slide__title promo-slide__title--event">{nearestTasting.title}</span>
              <span className="promo-slide__event-row">
                <span className="promo-slide__event-when">
                  {formatTastingDateShort(nearestTasting.date)}
                  {nearestTasting.date && `, ${formatTastingTime(nearestTasting.date)}`}
                </span>
                {/* Не <button>: слайд сам кнопка, вложенная кнопка невалидна. */}
                <span className="promo-slide__event-cta">
                  Я приду!
                  <IconChevronRight size={15} stroke={2.2} />
                </span>
              </span>
            </span>
          </button>
        )}

        <div className="promo-carousel__cell promo-slide promo-slide--chef" ref={registerSlide}>
          <span className="promo-slide__eyebrow">Шеф-чаепития</span>
          <IconLeaf className="promo-slide__mark" size={26} stroke={1.3} />
          <span className="promo-slide__title">Чаепитие без спешки</span>
          <p className="promo-slide__text">
            Приватная церемония с чайным шефом в тихой комнате «Чайной высоты» —
            для двоих или небольшой компании.
          </p>
          <button type="button" className="promo-slide__cta" onClick={onOpenChefTeas}>
            К шеф-чаепитиям
            <IconArrowRight size={16} stroke={2} />
          </button>
        </div>

        <div className="promo-carousel__cell promo-slide promo-slide--futures" ref={registerSlide}>
          <span className="promo-slide__eyebrow">Пьючерсы и лучерсы</span>
          <IconTicket className="promo-slide__mark" size={26} stroke={1.3} />
          <span className="promo-slide__title">Чай на будущее</span>
          <p className="promo-slide__text">
            Предоплаченные сертификаты на чай, мороженое и чаепития. Активируете
            сейчас или отложите — и получите больше, чем вложили.
          </p>
          <a
            className="promo-slide__cta"
            href="https://teatix.com/product/futurestea"
            target="_blank"
            rel="noopener noreferrer"
          >
            Узнать больше
            <IconArrowRight size={16} stroke={2} />
          </a>
        </div>
      </div>

      {slideCount > 1 && (
        <div className="promo-carousel__dots">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`promo-carousel__dot ${active === i ? "is-on" : ""}`}
              aria-label={`Экран ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
