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

/**
 * Маска российского номера для ввода: «+7 999 123-45-67».
 * Принимает любое содержимое инпута, нормализует код страны (8/7 → +7) и
 * обрезает лишние цифры — больше 10 национальных ввести нельзя.
 */
export function formatRuPhone(raw) {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits[0] === "8") digits = "7" + digits.slice(1);
  if (digits[0] !== "7") digits = "7" + digits;
  const nat = digits.slice(1, 11); // 10 цифр после кода страны
  let out = "+7";
  if (nat.length) out += " " + nat.slice(0, 3);
  if (nat.length > 3) out += " " + nat.slice(3, 6);
  if (nat.length > 6) out += "-" + nat.slice(6, 8);
  if (nat.length > 8) out += "-" + nat.slice(8, 10);
  return out;
}

/** true, если введён полный российский номер (10 национальных цифр). */
export function isRuPhoneComplete(value) {
  const digits = (value || "").replace(/\D/g, "");
  const nat = digits[0] === "7" || digits[0] === "8" ? digits.slice(1) : digits;
  return nat.length === 10;
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
