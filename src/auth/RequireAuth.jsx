import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="stage">
        <div className="phone"><div className="fullscreen-center">Загрузка…</div></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    // Прокидываем исходный URL через query-string `?return=`. В отличие от
    // router-state, query живёт прямо в URL → переживает переход из
    // Telegram in-app browser в системный (где state.from теряется).
    const target = location.pathname + location.search + location.hash;
    const isSafe = target.startsWith("/") && !target.startsWith("//");
    const ret = isSafe && target !== "/auth" ? target : "/";
    return <Navigate to={`/auth?return=${encodeURIComponent(ret)}`} replace />;
  }
  return children;
}
