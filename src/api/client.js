import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://chaynaya-vysota.ru";

export const TOKEN_KEYS = {
  access: "cv.token.access",
  refresh: "cv.token.refresh",
  skipped: "cv.auth.skipped",
};

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.access);
}
export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.refresh);
}
export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(TOKEN_KEYS.access, access);
  if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh);
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem(TOKEN_KEYS.skipped);
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const plainAxios = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshInFlight = null;

function refreshAccess() {
  if (!refreshInFlight) {
    const refresh = getRefreshToken();
    if (!refresh) return Promise.reject(new Error("no_refresh"));
    refreshInFlight = plainAxios
      .post("/api/guests/token/refresh/", { refresh })
      .then((r) => {
        const access = r.data?.access;
        if (!access) throw new Error("no_access_in_refresh");
        localStorage.setItem(TOKEN_KEYS.access, access);
        return access;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

api.interceptors.response.use(
  (resp) => resp,
  async (err) => {
    const original = err.config;
    if (!original || original._retry) return Promise.reject(err);
    if (err.response?.status === 401 && getRefreshToken()) {
      original._retry = true;
      try {
        const access = await refreshAccess();
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (refreshErr) {
        clearTokens();
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);
