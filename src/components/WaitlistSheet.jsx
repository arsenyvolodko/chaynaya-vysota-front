import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconClock, IconX } from "./icons.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistSheet({ tasting, initialName = "", initialEmail = "", onClose, onConfirm }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState({ name: false, email: false });
  const portalTarget = document.querySelector(".phone") || document.body;

  const nameValid = Boolean(name.trim());
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const canSubmit = nameValid && emailValid;

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true });
    if (!canSubmit) return;
    onConfirm?.({ name: name.trim(), email: email.trim() });
  };

  return createPortal(
    <div className="waitlist-layer">
      <button
        type="button"
        className="waitlist-layer__backdrop"
        onClick={onClose}
        aria-label="Закрыть форму листа ожидания"
      />
      <section className="waitlist-sheet" role="dialog" aria-modal="true" aria-labelledby="waitlist-title">
        <span className="waitlist-sheet__grip" aria-hidden="true" />
        <button type="button" className="waitlist-sheet__close" onClick={onClose} aria-label="Закрыть">
          <IconX size={18} stroke={2} />
        </button>

        <span className="waitlist-sheet__icon" aria-hidden="true">
          <IconClock size={20} stroke={1.8} />
        </span>
        <span className="waitlist-sheet__eyebrow">Лист ожидания</span>
        <h2 id="waitlist-title">Сообщим, если место освободится</h2>
        <p className="waitlist-sheet__event">{tasting?.title}</p>
        <p className="waitlist-sheet__text">Оставьте контакты — приглашение придёт на указанную почту.</p>

        <form className="waitlist-sheet__form" onSubmit={submit} noValidate>
          <label className={`checkout-field ${touched.name && !nameValid ? "has-error" : ""}`}>
            <span>Имя <b className="waitlist-sheet__required">*</b></span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
              placeholder="Как к вам обращаться"
              autoComplete="name"
              autoFocus
              required
            />
            {touched.name && !nameValid && <small>Укажите имя</small>}
          </label>

          <label className={`checkout-field ${touched.email && !emailValid ? "has-error" : ""}`}>
            <span>Почта <b className="waitlist-sheet__required">*</b></span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            {touched.email && !emailValid && <small>Введите корректную почту</small>}
          </label>

          <button type="submit" className="btn btn--primary waitlist-sheet__submit" disabled={!canSubmit}>
            Добавиться в лист ожидания
          </button>
        </form>
      </section>
    </div>,
    portalTarget
  );
}
