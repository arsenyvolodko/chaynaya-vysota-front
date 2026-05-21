import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logomark from "../components/Logomark.jsx";
import { IconPhone } from "../components/icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatPhoneInput, isValidE164, normalizeToE164 } from "../utils/phone.js";
import { getTasting } from "../api/catalog.js";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // `?return=` берём из URL (а не router-state), чтобы переход через ссылку
  // из Telegram → внешний браузер сохранял оригинальный URL.
  const rawReturn = searchParams.get("return") || "/";
  const safeReturn = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/";
  // Если пользователь пришёл на базовый URL без tasting в адресе — после авторизации
  // ведём в личный кабинет, а не в EntryPage, которая на пустом списке дегустаций
  // показывает заглушку.
  const returnTo = safeReturn === "/" ? "/profile" : safeReturn;
  const { login, loginSkip } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Подтягиваем title дегустации из URL, чтобы заголовок страницы соответствовал
  // конкретной дегустации (например, чайной vs мороженого), а не был захардкожен.
  const tastingIdMatch = safeReturn.match(/^\/tasting\/([^/?#]+)/);
  const tastingId = tastingIdMatch ? tastingIdMatch[1] : null;
  const [tastingTitle, setTastingTitle] = useState(null);
  useEffect(() => {
    if (!tastingId) return;
    let cancelled = false;
    getTasting(tastingId)
      .then((t) => { if (!cancelled) setTastingTitle(t?.title || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tastingId]);

  const onEnter = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;
    setError(null);
    const phoneE164 = normalizeToE164(phone);
    if (!isValidE164(phoneE164)) {
      setError("Введите телефон в формате +7 ___ ___ __ __");
      return;
    }
    setSubmitting(true);
    try {
      await login({ phone: phoneE164, name: name.trim() || "Гость" });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось войти. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSkip = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await loginSkip({ name: name.trim() || "Гость" });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось войти как гость.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <form className="auth" onSubmit={onEnter}>
        <div style={{ marginBottom: 56 }}>
          <Logomark size="lg" label="Дегустация" />
        </div>

        <h1 className="title-xl">
          {tastingTitle || " "}
        </h1>
        <p className="auth__lede">
          Зарегистрируйтесь, чтобы сохранить результаты и&nbsp;вернуться к&nbsp;ним позже.
          Или продолжите как гость&nbsp;— оценки останутся только на&nbsp;этом устройстве.
        </p>

        <div className="auth__form">
          <label className="field">
            <span className="field__label">Имя</span>
            <div className="field__wrap">
              <input
                className="field__input"
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
              <span className="field__icon">
                <IconPhone size={16} />
              </span>
              <input
                className="field__input field__input--with-icon"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                type="tel"
                inputMode="tel"
                placeholder="+7 ___ ___ __ __"
                autoComplete="tel"
              />
            </div>
          </label>
        </div>

        {error && <div className="error-banner" style={{ margin: "12px 0 0" }}>{error}</div>}

        <div className="auth__spacer" />

        <div className="auth__actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onSkip} disabled={submitting}>
            Пропустить
          </button>
        </div>
      </form>
    </div>
  );
}
