import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTastings } from "../api/catalog.js";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLogout,
  IconPencil,
  IconPlus,
  IconX,
} from "../components/icons.jsx";
import { formatTastingDate } from "../utils/date.js";
import { initialsOf } from "../utils/initials.js";
import { formatPhone, formatPhoneInput, isValidE164, normalizeToE164 } from "../utils/phone.js";

function EditableName({ user, updateProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const original = user?.name?.trim() || "";

  const start = () => {
    setDraft(original);
    setError(null);
    setEditing(true);
  };
  const cancel = () => { setEditing(false); setError(null); };
  const save = async () => {
    const name = draft.trim();
    if (!name) { setError("Имя не может быть пустым"); return; }
    if (name === original) { setEditing(false); return; }
    setSubmitting(true);
    setError(null);
    try {
      await updateProfile({ name });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };

  if (editing) {
    return (
      <div className="inline-edit inline-edit--name">
        <input
          autoFocus
          className="inline-edit__input inline-edit__input--name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={submitting}
          placeholder="Ваше имя"
          maxLength={150}
        />
        <button
          type="button"
          className="inline-edit__action inline-edit__action--save"
          onClick={save}
          disabled={submitting}
          aria-label="Сохранить"
          title="Сохранить"
        >
          <IconCheck size={14} stroke={2.4} />
        </button>
        <button
          type="button"
          className="inline-edit__action"
          onClick={cancel}
          disabled={submitting}
          aria-label="Отмена"
          title="Отмена"
        >
          <IconX size={13} stroke={2.2} />
        </button>
        {error && <div className="inline-edit__error">{error}</div>}
      </div>
    );
  }

  return (
    <button type="button" className="profile-hero__name-btn" onClick={start} aria-label="Изменить имя">
      <span className="profile-hero__name">{original || "Гость"}</span>
      <span className="profile-hero__name-edit">
        <IconPencil size={13} stroke={1.6} />
      </span>
    </button>
  );
}

function EditablePhone({ user, updateProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = !user?.phone;

  const start = () => { setDraft(""); setError(null); setEditing(true); };
  const cancel = () => { setEditing(false); setError(null); };
  const save = async () => {
    const phone = normalizeToE164(draft);
    if (!isValidE164(phone)) {
      setError("Введите номер в формате +7 ___ ___ __ __");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateProfile({ phone });
      setEditing(false);
    } catch (err) {
      if (err.response?.status === 409) setError("Этот номер уже используется");
      else setError(err.response?.data?.detail || "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };

  if (user?.phone) {
    return <div className="profile-hero__phone tabnum">{formatPhone(user.phone)}</div>;
  }

  if (editing) {
    return (
      <div className="inline-edit inline-edit--phone">
        <input
          autoFocus
          className="inline-edit__input inline-edit__input--phone tabnum"
          value={draft}
          onChange={(e) => setDraft(formatPhoneInput(e.target.value))}
          onKeyDown={onKeyDown}
          disabled={submitting}
          type="tel"
          inputMode="tel"
          placeholder="+7 ___ ___ __ __"
        />
        <button
          type="button"
          className="inline-edit__action inline-edit__action--save"
          onClick={save}
          disabled={submitting}
          aria-label="Сохранить"
          title="Сохранить"
        >
          <IconCheck size={14} stroke={2.4} />
        </button>
        <button
          type="button"
          className="inline-edit__action"
          onClick={cancel}
          disabled={submitting}
          aria-label="Отмена"
          title="Отмена"
        >
          <IconX size={13} stroke={2.2} />
        </button>
        {error && <div className="inline-edit__error">{error}</div>}
      </div>
    );
  }

  if (canEdit) {
    return (
      <button type="button" className="profile-hero__phone-add" onClick={start}>
        <IconPlus size={13} stroke={2.2} />
        <span>Добавить телефон</span>
      </button>
    );
  }
  return null;
}

function TastingCard({ tasting, onClick }) {
  return (
    <button type="button" className="tasting-card" onClick={onClick}>
      <div className="tasting-card__body">
        <div className="tasting-card__date">{formatTastingDate(tasting.date)}</div>
        <div className="tasting-card__title">{tasting.title}</div>
      </div>
      <span className="tasting-card__chev">
        <IconChevronRight size={16} />
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  const [tastings, setTastings] = useState([]);
  const [tastingsLoading, setTastingsLoading] = useState(true);
  const [tastingsError, setTastingsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setTastingsLoading(true);
    getMyTastings()
      .then((list) => {
        if (cancelled) return;
        const sorted = [...(list || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTastings(sorted);
      })
      .catch((e) => !cancelled && setTastingsError(e))
      .finally(() => !cancelled && setTastingsLoading(false));
    return () => { cancelled = true; };
  }, []);

  const onLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="result-scroll" style={{ background: "white" }}>
      <div className="topbar topbar--clean">
        <div className="topbar__row">
          <button className="icon-btn icon-btn--leading" onClick={() => navigate(-1)}>
            <IconChevronLeft size={20} />
            <span>Назад</span>
          </button>
          <div className="topbar__count">Личный кабинет</div>
          <span className="topbar__spacer" />
        </div>
      </div>

      <div className="profile-hero">
        <div className="profile-hero__avatar">{initialsOf(user?.name)}</div>
        <div className="profile-hero__body">
          <EditableName user={user} updateProfile={updateProfile} />
          <div className="profile-hero__phone-slot">
            <EditablePhone user={user} updateProfile={updateProfile} />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-card-head__eyebrow profile-section__heading">
          Посещённые дегустации
        </div>
        {tastingsLoading ? (
          <div className="profile-hist__status">Загружаем…</div>
        ) : tastingsError ? (
          <div className="error-banner" style={{ margin: 0 }}>
            Не удалось загрузить список дегустаций.
          </div>
        ) : tastings.length === 0 ? (
          <div className="profile-hist__empty">
            Вы ещё не&nbsp;участвовали в&nbsp;дегустациях. Дождитесь приглашения от&nbsp;заведения.
          </div>
        ) : (
          <div className="tasting-list">
            {tastings.map((t) => (
              <TastingCard
                key={t.id}
                tasting={t}
                onClick={() => navigate(`/tasting/${t.id}/result`)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="profile-section" style={{ marginTop: 28, paddingBottom: 24 }}>
        <button
          className="btn btn-outline"
          onClick={onLogout}
          style={{ width: "100%", padding: "12px 16px" }}
        >
          <IconLogout size={16} stroke={1.8} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
