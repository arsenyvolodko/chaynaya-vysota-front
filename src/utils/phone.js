const PHONE_RE = /^\+[1-9]\d{6,14}$/;

export function isValidE164(value) {
  if (!value) return false;
  return PHONE_RE.test(value.trim());
}

/**
 * Преобразует «то, что пользователь вводит» в строку с обязательным `+`.
 * Если ввод не начинается с `+`, автоматически дописываем `+7`:
 *   '99912' → '+799912'
 *   '79991234567' → '+79991234567' (лидирующая 7 трактуется как код страны)
 *   '89991234567' → '+79991234567' (лидирующая 8 → 7)
 *   '+12025550100' → '+12025550100' (если уже есть `+`, не трогаем)
 *   '' → ''
 */
export function formatPhoneInput(raw) {
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const rest = (digits[0] === "7" || digits[0] === "8") ? digits.slice(1) : digits;
  return "+7" + rest;
}

export function formatPhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 10) {
    return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }
  return raw || "";
}

export function normalizeToE164(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) return "+7" + digits;
  if (raw && raw.startsWith("+")) return "+" + digits;
  return digits ? "+" + digits : "";
}
