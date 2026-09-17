import { IconCheck, IconIceCream, IconLeaf } from "./icons.jsx";
import { formatTastingDateDots } from "../utils/date.js";
import { getTastingCapacityStatus, seatsLeft } from "../utils/tastingCapacity.js";
import { formatPrice } from "../utils/price.js";

const TAG_META = {
  tea: { label: "Чай", icon: IconLeaf, tone: "tea" },
  ice_cream: { label: "Джелато", icon: IconIceCream, tone: "ice-cream" },
};

// Гостей меньше минимума — нейтральное «Идёт набор», без чисел (не хотим
// заранее тревожить риском переноса). Минимум набран — конкретика по местам,
// это же снимает вопрос «а идёт ли ещё запись».
function getStatusMeta(guestsCount) {
  const key = getTastingCapacityStatus(guestsCount);
  if (key === "forming") {
    return { key, tone: "accent", label: "Идёт набор" };
  }
  if (key === "confirmed") {
    const left = seatsLeft(guestsCount);
    return { key, tone: "confirmed", label: `Свободно ${left} ${plural(left, "место", "места", "мест")}` };
  }
  return { key, tone: "full", label: "Мест нет" };
}

// Русская плюрализация: one — «1, 21, 31…», few — «2–4, 22–24…», many — остальное.
function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

function TagIcon({ tag, chip }) {
  const meta = TAG_META[tag];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={chip ? "schedule-card__tag-chip" : `schedule-card__tag-icon schedule-card__tag-icon--${meta.tone}`}
      title={meta.label}
      aria-label={meta.label}
    >
      <Icon size={chip ? 13 : 15} stroke={1.8} />
    </span>
  );
}

// Есть фото — показываем его, нет — прежняя иконка-заглушка.
function Cover({ tasting, isIceCream, compact, children }) {
  const compactClass = compact ? "schedule-card__cover--compact" : "";

  if (tasting.cover_url) {
    return (
      <div className={`schedule-card__cover schedule-card__cover--photo ${compactClass}`}>
        <img className="schedule-card__img" src={tasting.cover_url} alt="" loading="lazy" />
        {children}
      </div>
    );
  }

  const toneClass = isIceCream ? "schedule-card__cover--ice-cream" : "schedule-card__cover--tea";
  const size = compact ? 26 : 56;
  return (
    <div className={`schedule-card__cover ${toneClass} ${compactClass}`}>
      {isIceCream ? <IconIceCream size={size} stroke={1.2} /> : <IconLeaf size={size} stroke={1.2} />}
      <span className="schedule-card__cover-label">фото</span>
      {children}
    </div>
  );
}

function PriceTag({ tasting }) {
  return (
    <span className="schedule-card__price">
      {tasting.price_to ? (
        <>
          {formatPrice(tasting.price_from)}–{formatPrice(tasting.price_to)} ₽
        </>
      ) : (
        <>от <span className="tabnum">{formatPrice(tasting.price_from)}</span> ₽</>
      )}
    </span>
  );
}

export default function TastingScheduleCard({ tasting, past, onOpen, waitlisted, onJoinWaitlist }) {
  // Прошедшие не показывают вместимость/цену вовсе (см. ниже) — статус мест
  // им попросту не нужен, поэтому и не считаем его для прошедших.
  const hasCapacity = !past && tasting.guests_count != null;
  const status = hasCapacity ? getStatusMeta(tasting.guests_count) : null;
  const full = status?.key === "full";
  const isIceCream = tasting.cover === "ice_cream";
  const dateLabel = tasting.date
    ? formatTastingDateDots(tasting.date)
    : tasting.dateLabel || null;

  // Мест нет и это предстоящая — вся карточка кликом ставит в лист ожидания
  // (кнопка внутри — просто акцентная подпись, а не отдельный контрол).
  const isWaitlistCta = full && !past;

  const handleClick = () => {
    if (isWaitlistCta) {
      if (!waitlisted) onJoinWaitlist?.(tasting.id);
    } else {
      onOpen?.(tasting);
    }
  };

  const bottomStatus = hasCapacity ? (
    full ? (
      waitlisted ? (
        <span className="schedule-card__status schedule-card__status--joined">
          <IconCheck size={12} stroke={2.4} />
          Вы в листе ожидания
        </span>
      ) : (
        <span className="schedule-card__waitlist-btn">Лист ожидания</span>
      )
    ) : (
      <span className={`schedule-card__status schedule-card__status--${status.tone}`}>
        <span className="schedule-card__status-dot" />
        {status.label}
      </span>
    )
  ) : (
    !past && tasting.note && <span className="schedule-card__status schedule-card__status--neutral">{tasting.note}</span>
  );

  // Компактная строка (как «мест нет») — теперь и для всех прошедших, не
  // только для случая без мест: фото маленьким квадратом слева, дата/теги
  // строкой сверху. У прошедших внизу нет ни статуса мест, ни цены — они не
  // актуальны для того, что уже случилось, — и карточка не притушена
  // (кликабельна как обычно, в отличие от «нет мест» у предстоящих).
  if (past || full) {
    return (
      <button
        type="button"
        className={`schedule-card schedule-card--compact ${full && !past ? "schedule-card--full" : ""}`}
        onClick={handleClick}
        disabled={isWaitlistCta && waitlisted}
      >
        <div className="schedule-card__main">
          <div className="schedule-card__top">
            <span className="schedule-card__date">{dateLabel}</span>
            <div className="schedule-card__tags">
              {(tasting.tags || []).map((t) => <TagIcon key={t} tag={t} />)}
            </div>
          </div>

          <div className="schedule-card__title">{tasting.title}</div>
          {tasting.description && (
            <p className="schedule-card__desc">{tasting.description}</p>
          )}

          {!past && (
            <div className="schedule-card__bottom">
              <span className="schedule-card__bottom-left">
                {bottomStatus}
                {full && <span className="schedule-card__full-label">Мест нет</span>}
              </span>
              <PriceTag tasting={tasting} />
            </div>
          )}
        </div>

        <Cover tasting={tasting} isIceCream={isIceCream} compact />
      </button>
    );
  }

  // Обычная карточка — большая, фото на 2/3 высоты, дата/теги поверх фото.
  return (
    <button type="button" className="schedule-card" onClick={handleClick}>
      <Cover tasting={tasting} isIceCream={isIceCream}>
        <div className="schedule-card__cover-overlay">
          <span className="schedule-card__date">{dateLabel}</span>
          <div className="schedule-card__tags">
            {(tasting.tags || []).map((t) => <TagIcon key={t} tag={t} chip />)}
          </div>
        </div>
      </Cover>

      <div className="schedule-card__main">
        <div className="schedule-card__title">{tasting.title}</div>
        {tasting.description && (
          <p className="schedule-card__desc">{tasting.description}</p>
        )}

        <div className="schedule-card__bottom">
          {bottomStatus}
          <PriceTag tasting={tasting} />
        </div>
      </div>
    </button>
  );
}
