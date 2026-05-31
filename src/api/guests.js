import { api, setTokens, TOKEN_KEYS } from "./client";

export async function authOrRegister({ phone, name }) {
  const { data } = await api.post("/api/guests/auth/", { phone, name });
  setTokens(data);
  localStorage.removeItem(TOKEN_KEYS.skipped);
  return data;
}

export async function registerAnon({ name }) {
  const { data } = await api.post("/api/guests/register/", { name });
  setTokens(data);
  localStorage.setItem(TOKEN_KEYS.skipped, "1");
  return data;
}

// Вход по телефону. 200 → токены, 404 → телефон не зарегистрирован (ошибка
// пробрасывается, экран авторизации переключается в режим регистрации).
export async function loginByPhone({ phone }) {
  const { data } = await api.post("/api/guests/login/", { phone });
  setTokens(data);
  localStorage.removeItem(TOKEN_KEYS.skipped);
  return data;
}

// Регистрация по телефону с доп. полями. Пустые необязательные поля не шлём.
export async function registerByPhone({ phone, name, telegram, email }) {
  const body = { phone, name };
  if (telegram) body.telegram = telegram;
  if (email) body.email = email;
  const { data } = await api.post("/api/guests/register/", body);
  setTokens(data);
  localStorage.removeItem(TOKEN_KEYS.skipped);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/api/guests/me/");
  return data;
}

export async function updateMe(patch) {
  const { data } = await api.put("/api/guests/me/", patch);
  return data;
}
