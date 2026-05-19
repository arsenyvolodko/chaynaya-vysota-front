import { Navigate, Route, Routes, useParams } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import DetailPage from "./pages/DetailPage.jsx";
import SelectTopPage from "./pages/SelectTopPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

// Force remount of DetailPage on productId change so stale state from the
// previous product doesn't flash above the loading state while the next fetch
// is in flight.
function KeyedDetailPage() {
  const { productId } = useParams();
  return <DetailPage key={productId} />;
}

export default function App() {
  return (
    <div className="stage">
      <div className="phone">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<RequireAuth><EntryPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/tasting/:id" element={<RequireAuth><MainPage /></RequireAuth>} />
          <Route path="/tasting/:id/product/:productId" element={<RequireAuth><KeyedDetailPage /></RequireAuth>} />
          <Route path="/tasting/:id/select-top" element={<RequireAuth><SelectTopPage /></RequireAuth>} />
          <Route path="/tasting/:id/result" element={<RequireAuth><ResultPage /></RequireAuth>} />
          <Route path="/r/:resultId" element={<ResultPage shared />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
