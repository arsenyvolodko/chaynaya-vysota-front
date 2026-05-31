import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logomark from "../components/Logomark.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { IconPhone, IconTelegram } from "../components/icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatRuPhone, isRuPhoneComplete, normalizeToE164 } from "../utils/phone.js";
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
  const { loginPhone, register, loginSkip } = useAuth();
  const [phone, setPhone] = useState("");
  // 'login' — только телефон; после 404 переключаемся в 'register' и показываем
  // поля имени / telegram / почты.
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("@");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isRegister = mode === "register";

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

  // Телеграм всегда с ведущим «@»: если пользователь его стёр — возвращаем.
  const onTelegramChange = (raw) => {
    const v = raw.replace(/^@*/, "");
    setTelegram("@" + v);
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;
    setError(null);

    if (!isRuPhoneComplete(phone)) {
      setError("Введите телефон в формате +7 999 123-45-67");
      return;
    }
    const phoneE164 = normalizeToE164(phone);

    // Шаг регистрации (после 404).
    if (isRegister) {
      if (!name.trim()) {
        setError("Укажите имя.");
        return;
      }
      setSubmitting(true);
      try {
        const tg = telegram.trim();
        await register({
          phone: phoneE164,
          name: name.trim(),
          telegram: tg && tg !== "@" ? tg : undefined,
          email: email.trim() || undefined,
        });
        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(err.response?.data?.detail || "Не удалось зарегистрироваться. Попробуйте ещё раз.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Шаг входа по телефону.
    setSubmitting(true);
    try {
      await loginPhone({ phone: phoneE164 });
      navigate(returnTo, { replace: true });
    } catch (err) {
      if (err.response?.status === 404) {
        // Телефон не зарегистрирован — раскрываем форму регистрации.
        setMode("register");
        setError(null);
      } else {
        setError(err.response?.data?.detail || "Не удалось войти. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSkip = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await loginSkip({ name: "Гость" });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось войти как гость.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <form className="auth" onSubmit={onSubmit}>
        <div style={{ marginBottom: 56 }}>
          <Logomark size="lg" label="Дегустация" />
        </div>

        <h1 className="title-xl">
          {tastingTitle || " "}
        </h1>
        <p className="auth__lede">
          {isRegister
            ? "Телефон не найден — заполните данные, чтобы зарегистрироваться и сохранять результаты."
            : "Введите телефон, чтобы сохранить результаты и вернуться к ним позже. Или продолжите как гость — оценки останутся только на этом устройстве."}
        </p>

        <div className="auth__form">
          <label className="field">
            <span className="field__label">Телефон</span>
            <div className="field__wrap">
              <span className="field__icon">
                <IconPhone size={16} />
              </span>
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

          {isRegister && (
            <>
              <label className="field">
                <span className="field__label">Имя*</span>
                <div className="field__wrap">
                  <input
                    className="field__input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Как к вам обращаться"
                    autoComplete="given-name"
                    autoFocus
                  />
                </div>
              </label>
              <label className="field">
                <span className="field__label">Telegram</span>
                <div className="field__wrap">
                  <span className="field__icon">
                    <IconTelegram size={16} />
                  </span>
                  <input
                    className="field__input field__input--with-icon"
                    value={telegram}
                    onChange={(e) => onTelegramChange(e.target.value)}
                    placeholder="@username"
                    autoComplete="off"
                  />
                </div>
              </label>
              <label className="field">
                <span className="field__label">Почта</span>
                <div className="field__wrap">
                  <input
                    className="field__input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>
            </>
          )}
        </div>

        {error && <div className="error-banner" style={{ margin: "12px 0 0" }}>{error}</div>}

        <div className="auth__spacer" />

        <div className="auth__actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {isRegister
              ? (submitting ? "Регистрируем…" : "Зарегистрироваться")
              : (submitting ? "Продолжаем…" : "Продолжить")}
          </button>
          {!isRegister && (
            <button type="button" className="btn btn--ghost" onClick={onSkip} disabled={submitting}>
              Пропустить
            </button>
          )}
        </div>
        <AppFooter />
      </form>
    </div>
  );
}
