import { useState } from "react";
import { IconPhone, IconUser, IconX } from "./icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatRuPhone, isRuPhoneComplete, normalizeToE164 } from "../utils/phone.js";

// Окно-приглашение войти: всплывает, когда гость уже листает расписание.
// Форма короткая — имя и телефон, этого достаточно и для входа, и для
// регистрации (бэкенд сам решает, что делать с номером). Полная анкета с
// телеграмом и почтой живёт на отдельной странице — туда ведёт «Зарегистрироваться».
export default function AuthPrompt({ onClose, onRegister }) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title">
        <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
          <IconX size={17} stroke={2.2} />
        </button>

        <h3 className="modal__title" id="auth-prompt-title">Сохраним записи и оценки?</h3>
        <p className="modal__text">
          С аккаунтом место на дегустации бронируется в пару касаний, а оценки
          чаёв и итоги вечера остаются с вами.
        </p>

        <form className="modal__form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field__label">Имя</span>
            <div className="field__wrap">
              <span className="field__icon"><IconUser size={16} /></span>
              <input
                className="field__input field__input--with-icon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как к вам обращаться"
                autoComplete="given-name"
              />
            </div>
          </label>

          <label className="field">
            <span className="field__label">Телефон</span>
            <div className="field__wrap">
              <span className="field__icon"><IconPhone size={16} /></span>
              <input
                className="field__input field__input--with-icon"
                value={phone}
                onChange={(e) => setPhone(formatRuPhone(e.target.value))}
                type="tel"
                inputMode="tel"
                placeholder="+7 999 123-45-67"
                autoComplete="tel"
              />
            </div>
          </label>

          {error && <p className="modal__error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
          </button>
        </form>

        <p className="modal__switch">
          Нет аккаунта?{" "}
          <button type="button" className="modal__link" onClick={onRegister}>
            Зарегистрироваться
          </button>
        </p>

        <button type="button" className="modal__skip" onClick={onClose}>
          Пока просто посмотрю
        </button>
      </div>
    </>
  );
}
