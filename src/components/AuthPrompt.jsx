import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconPhone, IconUser, IconX } from "./icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatRuPhone, isRuPhoneComplete, normalizeToE164 } from "../utils/phone.js";

// Окно-приглашение войти: всплывает, когда гость уже листает расписание.
// Форма короткая — имя и телефон, этого достаточно и для входа, и для
// регистрации (бэкенд сам решает, что делать с номером). Полная анкета с
// телеграмом и почтой живёт на отдельной странице — туда ведёт «Зарегистрироваться».
export default function AuthPrompt({ onClose }) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const portalTarget = document.querySelector(".phone") || document.body;

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose?.();
    const scheduleScroller = document.querySelector(".schedule-scroll");
    const previousOverflow = scheduleScroller?.style.overflowY || "";
    if (scheduleScroller) scheduleScroller.style.overflowY = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (scheduleScroller) scheduleScroller.style.overflowY = previousOverflow;
    };
  }, [onClose]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!name.trim()) {
      setError("Укажите имя.");
      return;
    }
    if (!isRuPhoneComplete(phone)) {
      setError("Введите телефон в формате +7 999 123-45-67");
      return;
    }

    setSubmitting(true);
    try {
      await login({ phone: normalizeToE164(phone), name: name.trim() });
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось войти. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="auth-prompt-layer">
      <button
        type="button"
        className="auth-prompt-layer__backdrop"
        onClick={onClose}
        aria-label="Закрыть приглашение"
      />
      <section className="auth-prompt" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title">
        <span className="auth-prompt__grip" aria-hidden="true" />
        <button type="button" className="auth-prompt__close" onClick={onClose} aria-label="Закрыть">
          <IconX size={17} stroke={2.2} />
        </button>

        <h2 className="auth-prompt__title" id="auth-prompt-title">Войти в аккаунт</h2>
        <p className="auth-prompt__text">
          Чтобы сохранять записи на дегустации и свои оценки.
        </p>

        <form className="auth-prompt__form" onSubmit={onSubmit}>
          <label className="auth-prompt__field">
            <div>
              <i aria-hidden="true"><IconUser size={17} /></i>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                autoComplete="given-name"
                aria-label="Имя"
              />
            </div>
          </label>

          <label className="auth-prompt__field">
            <div>
              <i aria-hidden="true"><IconPhone size={17} /></i>
              <input
                value={phone}
                onChange={(e) => setPhone(formatRuPhone(e.target.value))}
                type="tel"
                inputMode="tel"
                placeholder="+7 999 123-45-67"
                autoComplete="tel"
                aria-label="Телефон"
              />
            </div>
          </label>

          {error && <p className="auth-prompt__error">{error}</p>}

          <button type="submit" className="btn btn--primary auth-prompt__submit" disabled={submitting}>
            {submitting ? "Входим…" : "Авторизоваться"}
          </button>
        </form>
      </section>
    </div>,
    portalTarget
  );
}
