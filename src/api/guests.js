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

export async function getMe() {
  const { data } = await api.get("/api/guests/me/");
  return data;
}

export async function updateMe(patch) {
  const { data } = await api.put("/api/guests/me/", patch);
  return data;
}
