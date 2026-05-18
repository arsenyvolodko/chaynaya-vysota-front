import { useCallback, useEffect, useState } from "react";
import { getTasting, getTastingProducts, joinTasting } from "../api/catalog";

const joinedSession = new Set();

/**
 * Загружает дегустацию + продукты. На первом успешном запросе авто-вызывает join
 * (если ещё не звали в этой сессии браузера).
 */
export function useTasting(tastingId, { autoJoin = true } = {}) {
  const [tasting, setTasting] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!tastingId) return;
    setLoading(true);
    setError(null);
    try {
      if (autoJoin && !joinedSession.has(tastingId)) {
        try { await joinTasting(tastingId); } catch (_) {/* ignore — может быть аноним */}
        joinedSession.add(tastingId);
      }
      const [t, p] = await Promise.all([
        getTasting(tastingId),
        getTastingProducts(tastingId),
      ]);
      setTasting(t);
      setProducts(p);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tastingId, autoJoin]);

  useEffect(() => { load(); }, [load]);

  const productById = useCallback(
    (id) => products.find((p) => String(p.id) === String(id)) || null,
    [products]
  );

  const patchProduct = useCallback((id, patch) => {
    setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p)));
  }, []);

  return { tasting, products, loading, error, reload: load, productById, patchProduct };
}
