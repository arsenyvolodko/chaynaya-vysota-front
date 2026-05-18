// Root app — owns state, switches screens.

const { useState, useCallback } = React;

function App() {
  // Pre-seed so the result screen can be demoed without filling 13 cards by
  // hand. Comment these defaults out once real auth/state is wired up.
  const [screen, setScreen] = useState("main");
  const [user, setUser] = useState({ name: "Анна", phone: "+7 999 123 45 67" });
  const [selectedId, setSelectedId] = useState(null);
  // Which screen the user came from when opening detail. Determines whether
  // detail is editable (`main`) or read-only review (`result`).
  const [detailFrom, setDetailFrom] = useState("main");
  // Guest-picked top-3 (from the candidates screen). When set, ResultScreen
  // pins the podium to these ids and pushes other liked flavours below.
  const [pinnedTop3, setPinnedTop3] = useState(null);

  // tastings: { [iceCreamId]: { flavor, match, impressions, liked, comment, touched } }
  const [tastings, setTastings] = useState(SEED_TASTINGS);

  const go = useCallback((s) => setScreen(s), []);

  const selectIceCream = useCallback((id) => {
    setSelectedId(id);
    setDetailFrom("main");
    setScreen("detail");
  }, []);

  const reviewIceCream = useCallback((id) => {
    setSelectedId(id);
    setDetailFrom("result");
    setScreen("detail");
  }, []);

  const backFromDetail = useCallback(() => setScreen(detailFrom), [detailFrom]);

  // Detail screen calls this to advance through the array by index.
  window.__selectIceCreamByIndex = (i) => {
    const ic = ICE_CREAMS[i];
    if (ic) setSelectedId(ic.id);
  };

  const updateTasting = useCallback((id, patch) => {
    setTastings((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  const reset = useCallback(() => {
    setTastings({});
    setSelectedId(null);
    setPinnedTop3(null);
    setScreen("main");
  }, []);

  const selectedIdx = selectedId ? ICE_CREAMS.findIndex((ic) => ic.id === selectedId) : -1;
  const selected = selectedIdx >= 0 ? ICE_CREAMS[selectedIdx] : null;

  return (
    <React.Fragment>
      {screen === "auth" && <AuthScreen go={go} setUser={setUser} />}
      {screen === "main" && (
        <MainScreen
          go={go}
          user={user}
          tastings={tastings}
          selectIceCream={selectIceCream}
        />
      )}
      {screen === "detail" && selected && (
        <DetailScreen
          key={selected.id}
          go={go}
          back={backFromDetail}
          readOnly={detailFrom === "result"}
          iceCream={selected}
          idx={selectedIdx}
          total={ICE_CREAMS.length}
          tasting={tastings[selected.id]}
          updateTasting={(patch) => updateTasting(selected.id, patch)}
        />
      )}
      {screen === "profile" && <ProfileScreen go={go} user={user} />}
      {screen === "select-top" && (
        <SelectTopScreen
          go={go}
          tastings={tastings}
          onConfirm={(ids) => {
            setPinnedTop3(ids);
            setScreen("result");
          }}
        />
      )}
      {screen === "result" && (
        <ResultScreen
          go={go}
          tastings={tastings}
          user={user}
          setUser={setUser}
          reset={reset}
          reviewIceCream={reviewIceCream}
          pinnedTop3={pinnedTop3}
        />
      )}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
