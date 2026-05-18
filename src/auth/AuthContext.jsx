import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authOrRegister, getMe, registerAnon, updateMe } from "../api/guests";
import { clearTokens, getAccessToken, TOKEN_KEYS } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const wasSkipped = useRef(localStorage.getItem(TOKEN_KEYS.skipped) === "1");

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch (_) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    const onLogout = () => {
      setUser(null);
      wasSkipped.current = false;
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [refreshUser]);

  const login = useCallback(async ({ phone, name }) => {
    await authOrRegister({ phone, name });
    wasSkipped.current = false;
    return refreshUser();
  }, [refreshUser]);

  const loginSkip = useCallback(async ({ name }) => {
    await registerAnon({ name });
    wasSkipped.current = true;
    return refreshUser();
  }, [refreshUser]);

  const updateProfile = useCallback(async (patch) => {
    const next = await updateMe(patch);
    setUser(next);
    if (next.phone) {
      wasSkipped.current = false;
      localStorage.removeItem(TOKEN_KEYS.skipped);
    }
    return next;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    wasSkipped.current = false;
  }, []);

  const value = useMemo(() => ({
    user, loading, login, loginSkip, logout, updateProfile, refreshUser,
    isAuthenticated: !!getAccessToken(),
    wasSkipped: wasSkipped.current,
  }), [user, loading, login, loginSkip, logout, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
