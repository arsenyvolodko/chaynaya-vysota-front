import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyTastings } from "../api/catalog";

export default function EntryPage() {
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyTastings()
      .then((list) => {
        if (cancelled) return;
        const sorted = [...(list || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        const first = sorted[0];
        if (first) setTarget(`/tasting/${first.id}`);
        else setError("no_tastings");
      })
      .catch(() => !cancelled && setError("load_failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="fullscreen-center">Загрузка…</div>;
  if (target) return <Navigate to={target} replace />;
  return (
    <div className="fullscreen-center">
      {error === "no_tastings" ? (
        <div>
          У вас пока нет активных дегустаций.
          <br />
          Дождитесь приглашения от заведения или отсканируйте QR-код у стойки.
        </div>
      ) : (
        "Не удалось загрузить список дегустаций. Попробуйте позже."
      )}
    </div>
  );
}
