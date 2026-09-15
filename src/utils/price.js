// «15 000» — разряды через пробел (Intl сам расставляет неразрывный узкий пробел для ru-RU).
export function formatPrice(n) {
  if (n == null) return "";
  return Math.round(n).toLocaleString("ru-RU");
}
