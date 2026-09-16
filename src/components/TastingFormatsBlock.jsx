import { useState } from "react";
import { IconArrowRight, IconTicket } from "./icons.jsx";

// Блок под промо-листалкой: переключатель форматов чаепитий (чартерные /
// шеф) с тизером дегустационного листа, плюс отдельная акцентная плашка
// про абонементы (структура — заголовок + бейдж, текст, кнопка на всю
// ширину, по образцу спеки).

const FORMAT_INFO = {
  charter: {
    tab: "Чартерные дегустации",
    text: "Общий стол на несколько гостей — по расписанию, дата фиксирована заранее.",
    capacityLabel: "до 12 гостей",
    modeLabel: "общий стол",
  },
  chef: {
    tab: "Шеф-чаепития",
    text: "Приватная церемония с чайным шефом — дата и программа по договорённости.",
    capacityLabel: "2–6 гостей",
    modeLabel: "только ваша компания",
  },
};

export default function TastingFormatsBlock({ onPickDate }) {
  const [format, setFormat] = useState("charter");
  const current = FORMAT_INFO[format];

  return (
    <>
      <section className="info-block">
        <div className="info-block__intro">
          <h2 className="title-lg info-block__title">Как устроены чаепития</h2>
        </div>

        <div className="format-switch">
          <div className="schedule-tabs format-switch__tabs" role="tablist">
            {Object.entries(FORMAT_INFO).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={format === key}
                className={`schedule-tabs__tab ${format === key ? "is-on" : ""}`}
                onClick={() => setFormat(key)}
              >
                {meta.tab}
              </button>
            ))}
          </div>

          <div className="format-switch__panel" key={format}>
            <p className="format-switch__text">{current.text}</p>
            <div className="format-facts">
              <div className="format-fact">
                <span className="format-fact__label">Вместимость</span>
                <span className="format-fact__value">{current.capacityLabel}</span>
              </div>
              <div className="format-fact">
                <span className="format-fact__label">Формат встречи</span>
                <span className="format-fact__value">{current.modeLabel}</span>
              </div>
            </div>
            {onPickDate && (
              <button type="button" className="btn-outline format-switch__cta" onClick={onPickDate}>
                <span>Выбрать дату</span>
                <IconArrowRight size={15} stroke={2} />
              </button>
            )}
          </div>
        </div>

        <div className="sheet-teaser">
          <span className="eyebrow">На самой дегустации</span>
          <h3 className="sheet-teaser__title">Пробуете чай — сразу оцениваете</h3>
          <p className="sheet-teaser__text">
            Дегустационный лист открывается прямо на встрече: ставите оценку
            каждому чаю и коротко фиксируете впечатления — всё сохраняется, можно
            вернуться позже.
          </p>
        </div>
      </section>

      <div className="plank">
        <div className="plank__head">
          <h3 className="plank__title">Абонемент на чаепития</h3>
          <span className="plank__badge">
            <IconTicket size={13} stroke={2} />
            Абонемент
          </span>
        </div>
        <p className="plank__text">
          Билет на свободную дату — без привязки к конкретному дню. Берите на
          одно посещение или сразу на несколько: расходуется постепенно, как
          будет удобно вам.
        </p>
        {/* TODO: заменить на реальную ссылку/маршрут оформления абонемента */}
        <a className="plank__btn" href="https://t.me/" target="_blank" rel="noopener noreferrer">
          Оформить абонемент
          <IconArrowRight size={16} stroke={2} />
        </a>
      </div>
    </>
  );
}
