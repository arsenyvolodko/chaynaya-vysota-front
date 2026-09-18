import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconArrowRight, IconMapPin, IconX } from "./icons.jsx";

export default function MapChoiceSheet({ name, address, yandexUrl: exactYandexUrl, twoGisUrl: exactTwoGisUrl, onClose }) {
  const query = [name, address].filter(Boolean).join(", ");
  const encoded = encodeURIComponent(query);
  const yandexUrl = exactYandexUrl || `https://yandex.ru/maps/?text=${encoded}`;
  const twoGisUrl = exactTwoGisUrl || `https://2gis.ru/moscow/search/${encoded}`;
  const portalTarget = document.querySelector(".phone") || document.body;

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="map-choice-layer">
      <button type="button" className="map-choice-layer__backdrop" onClick={onClose} aria-label="Закрыть выбор карты" />
      <section className="map-choice" role="dialog" aria-modal="true" aria-labelledby="map-choice-title">
        <span className="map-choice__grip" aria-hidden="true" />
        <button type="button" className="map-choice__close" onClick={onClose} aria-label="Закрыть">
          <IconX size={18} stroke={2} />
        </button>
        <span className="map-choice__icon"><IconMapPin size={21} stroke={1.8} /></span>
        <h2 id="map-choice-title">Открыть место</h2>
        <p><strong>{name}</strong>{address && <small>{address}</small>}</p>
        <div className="map-choice__links">
          <a href={yandexUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            <span className="map-choice__brand map-choice__brand--ya">Я</span>
            <span><strong>Яндекс Карты</strong><small>Маршрут и время в пути</small></span>
            <IconArrowRight size={17} stroke={2} />
          </a>
          <a href={twoGisUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            <span className="map-choice__brand map-choice__brand--gis">2</span>
            <span><strong>2ГИС</strong><small>Открыть карточку места</small></span>
            <IconArrowRight size={17} stroke={2} />
          </a>
        </div>
      </section>
    </div>,
    portalTarget
  );
}
