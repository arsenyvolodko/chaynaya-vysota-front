// Дегустация набирается по принципу чартера: от MIN_GUESTS до MAX_GUESTS
// человек. Меньше MIN_GUESTS — есть риск переноса на другой день (но явно
// пугать этим гостя на карточке не нужно). MAX_GUESTS — мест больше нет.
export const MIN_GUESTS = 12;
export const MAX_GUESTS = 23;

// 'forming'   — гостей меньше минимума, набор идёт, но пока не гарантирован.
// 'confirmed' — минимум набран, дегустация состоится.
// 'full'      — набрано максимум, свободных мест нет.
export function getTastingCapacityStatus(guestsCount) {
  const count = guestsCount ?? 0;
  if (count >= MAX_GUESTS) return "full";
  if (count >= MIN_GUESTS) return "confirmed";
  return "forming";
}

export function seatsLeft(guestsCount) {
  return Math.max(0, MAX_GUESTS - (guestsCount ?? 0));
}
