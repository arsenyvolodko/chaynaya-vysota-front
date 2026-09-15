const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const MONTHS_NOM = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const MONTHS_ABBR = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

const WEEKDAYS_NOM = [
  "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота",
];

export function formatTastingDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

// «20 сентября, 15:00» — дата + время для карточек расписания.
export function formatTastingDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${formatTastingDate(iso)}, ${formatTastingTime(iso)}`;
}

// «15:00» — только время (для карточек, где дата и время — раздельные акценты).
export function formatTastingTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// «20 сентября» — дата без года, короче, чем formatTastingDate.
export function formatTastingDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

// «17.09» — компактный числовой формат для плотных списков/карточек.
export function formatTastingDateDots(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

// «Сентябрь 2026» — заголовок группы месяца в списке расписания.
export function formatMonthYear(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

// «Понедельник, 14 сентября» — для карточки-бейджа даты на превью-странице дегустации.
export function formatWeekdayDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${WEEKDAYS_NOM[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

// «СЕН» — короткое название месяца для бейджа-«календарика».
export function formatMonthAbbr(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return MONTHS_ABBR[d.getMonth()];
}

// «14» — число месяца для бейджа-«календарика».
export function formatDayNumber(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return String(d.getDate());
}
