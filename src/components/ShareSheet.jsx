import { useEffect, useState } from "react";
import { IconCheck, IconCopy, IconTelegram, IconVK, IconX } from "./icons.jsx";

/**
 * Bottom-sheet с опциями шеринга. Открывается из ResultPage.
 *
 * Текст сообщения собираем из evening-line (если есть) + CTA + URL. Для VK и
 * Telegram у share.php разные параметры — нативные share-URL у каждого свои,
 * поэтому формируем отдельно. Для copy → пишем весь текст одним блоком в
 * буфер обмена через navigator.clipboard.
 */
export default function ShareSheet({ open, onClose, url, title, eveningLine }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const phrase = (eveningLine || "").replace("Сегодняшний вечер для вас", "Сегодняшний вечер для меня");
  const intro = `Я был на дегустации «${title}» в Чайной Высоте.`;
  const cta = "Давай в следующий раз вместе?";

  // Текст без URL — иначе в TG/VK ссылка дублируется (один раз в превью-карточке
  // из `url=` и второй раз в теле сообщения). Тут — только текстовая часть;
  // ссылку платформа подцепляет сама через `url=`.
  const bodyText = [intro, phrase, cta].filter(Boolean).join("\n\n");

  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(bodyText)}`;
  const vkUrl = `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(intro)}&comment=${encodeURIComponent(bodyText)}`;

  const openShare = (href) => {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose?.();
  };

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => onClose?.(), 900);
    } catch (_) {
      // fallthrough — оставим окно открытым, пользователь увидит, что не сработало
    }
  };

  return (
    <div className="share-sheet-overlay" onClick={onClose}>
      <div
        className="share-sheet"
        role="dialog"
        aria-label="Поделиться результатом"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="share-sheet__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <IconX size={20} />
        </button>
        <div className="share-sheet__title">Поделиться результатом</div>
        <div className="share-sheet__hint">
          Друзья откроют страницу в&nbsp;режиме просмотра — без возможности редактировать.
        </div>

        <div className="share-sheet__grid">
          <button
            type="button"
            className="share-tile share-tile--tg"
            onClick={() => openShare(tgUrl)}
          >
            <span className="share-tile__icon"><IconTelegram size={26} /></span>
            <span className="share-tile__label">Telegram</span>
          </button>
          <button
            type="button"
            className="share-tile share-tile--vk"
            onClick={() => openShare(vkUrl)}
          >
            <span className="share-tile__icon"><IconVK size={26} /></span>
            <span className="share-tile__label">ВКонтакте</span>
          </button>
          <button
            type="button"
            className={`share-tile share-tile--copy ${copied ? "is-copied" : ""}`}
            onClick={copy}
          >
            <span className="share-tile__icon">
              {copied ? <IconCheck size={24} stroke={2.4} /> : <IconCopy size={24} />}
            </span>
            <span className="share-tile__label">{copied ? "Скопировано" : "Копировать"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
