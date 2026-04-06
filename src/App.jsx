import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { AppProvider, useAppContext } from "./context/AppContext";
import { useAuth } from "./hooks/useAuth";
import Hero from "./components/Hero";
import ControlBar from "./components/ControlBar";
import WeighPoints from "./components/WeighPoints";
import ScenarioPair from "./components/ScenarioPair";
import RouteMap from "./components/RouteMap";
import ResultsPanel from "./components/ResultsPanel";
import WeighStation from "./components/WeighStation";
import AiAssistant from "./components/AiAssistant";
import TollEditor from "./components/TollEditor";
import AuthScreen from "./components/AuthScreen";
import { useDirections } from "./hooks/useDirections";
import { calculateLegCost, calculateScenarioTotal } from "./utils/costEngine";
import { saveComparison } from "./lib/sync";
import { ToastProvider } from "./components/Toast";

function AppContent({ auth }) {
  const { state, dispatch } = useAppContext();
  const { calculateRoute, loading, error } = useDirections();
  const [legsA, setLegsA] = useState(null);
  const [legsB, setLegsB] = useState(null);
  const [totalA, setTotalA] = useState(null);
  const [totalB, setTotalB] = useState(null);
  const [calculated, setCalculated] = useState(false);
  const [saved, setSaved] = useState(false);
  const weighStationRef = useRef(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const clearAll = useCallback(() => {
    setLegsA(null);
    setLegsB(null);
    setTotalA(null);
    setTotalB(null);
    setCalculated(false);
    setSaved(false);
    dispatch({ type: "UPDATE_SCENARIO", id: "A", payload: { origin: "", stops: [], departureTime: "" } });
    dispatch({ type: "UPDATE_SCENARIO", id: "B", payload: { origin: "", stops: [], departureTime: "" } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dispatch]);

  const handleSave = useCallback(async () => {
    if (!totalA && !totalB) return;

    // Save to localStorage always
    const entry = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      scenarioA: state.scenarios.A,
      scenarioB: state.scenarios.B,
      totalA,
      totalB,
      winner: totalA && totalB
        ? (totalA.totalCost < totalB.totalCost ? "A" : totalB.totalCost < totalA.totalCost ? "B" : "tie")
        : null,
    };

    const history = JSON.parse(localStorage.getItem("routeweigh_history") || "[]");
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem("routeweigh_history", JSON.stringify(history));

    // Save to Supabase if logged in
    if (state.userId) {
      try {
        await saveComparison(
          state.userId,
          state.scenarios.A,
          state.scenarios.B,
          totalA,
          totalB,
          entry.winner
        );
      } catch (e) {
        console.warn("Cloud save failed:", e.message);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [totalA, totalB, state.scenarios, state.userId]);

  const scenarioA = state.scenarios.A;
  const scenarioB = state.scenarios.B;

  const runComparison = useCallback(async () => {
    if (scenarioA.stops.length === 0 && scenarioB.stops.length === 0) return;

    setCalculated(false);

    const [rawLegsA, rawLegsB] = await Promise.all([
      scenarioA.stops.length > 0 ? calculateRoute(scenarioA) : null,
      scenarioB.stops.length > 0 ? calculateRoute(scenarioB) : null,
    ]);

    if (rawLegsA) {
      const costedA = rawLegsA.map((leg) => calculateLegCost(leg, state.settings));
      setLegsA(costedA);
      setTotalA(calculateScenarioTotal(costedA));
    }

    if (rawLegsB) {
      const costedB = rawLegsB.map((leg) => calculateLegCost(leg, state.settings));
      setLegsB(costedB);
      setTotalB(calculateScenarioTotal(costedB));
    }

    setCalculated(true);
  }, [scenarioA, scenarioB, state.settings, calculateRoute]);

  useEffect(() => {
    if (calculated && totalA && totalB && weighStationRef.current) {
      setTimeout(() => {
        weighStationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [calculated, totalA, totalB]);

  return (
    <div className="min-h-screen bg-sky-bg">
      <Hero />
      <ControlBar auth={auth} />
      <main className="max-w-4xl mx-auto px-4 pt-3 pb-12">
        <WeighPoints />
        {state.showTolls && <TollEditor />}
        <AiAssistant />
        <ScenarioPair />

        <div className="flex justify-center gap-3 my-6">
          <button
            onClick={runComparison}
            disabled={loading || (scenarioA.stops.length === 0 && scenarioB.stops.length === 0)}
            className="bg-gray-900 text-white font-bold text-sm tracking-wider px-8 py-3 rounded-xl
              hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed
              shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Calculating...
              </span>
            ) : (
              "⚖️ WEIGH ROUTES"
            )}
          </button>
          {(legsA || legsB || scenarioA.stops.length > 0 || scenarioB.stops.length > 0) && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-gray-600 border border-gray-300 hover:border-gray-400 px-4 py-3 rounded-xl transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4 text-center">
            {error}
          </div>
        )}

        {(legsA || legsB) && <RouteMap legsA={legsA} legsB={legsB} />}

        {(legsA || legsB) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {legsA && <ResultsPanel id="A" legs={legsA} total={totalA} />}
            {legsB && <ResultsPanel id="B" legs={legsB} total={totalB} />}
          </div>
        )}

        <div ref={weighStationRef}>
          <WeighStation
            totalA={totalA}
            totalB={totalB}
            scenarioA={scenarioA}
            scenarioB={scenarioB}
            settings={state.settings}
          />
        </div>

        {/* Save + Clear after results */}
        {totalA && totalB && (
          <div className="flex flex-col items-center gap-3 mt-4 mb-8">
            <div className="flex gap-3">
              {auth?.isAuthenticated && (
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`text-sm font-medium px-6 py-2.5 rounded-xl transition-all ${
                    saved
                      ? "bg-green-100 text-green-600 border border-green-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-accent hover:text-accent shadow-sm"
                  }`}
                >
                  {saved ? "✓ Saved!" : "💾 Save RouteWeigh"}
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-sm text-gray-400 hover:text-gray-600 border border-gray-300 hover:border-gray-400 px-4 py-2.5 rounded-xl transition-colors"
              >
                🔄 New Comparison
              </button>
            </div>
            {auth?.isGuest && (
              <p className="text-[11px] text-gray-400">
                <button onClick={auth.upgradeFromGuest} className="text-accent hover:underline">Create an account</button> to save your RouteWeighs
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const auth = useAuth();

  // Show loading spinner while checking auth
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-sky-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-gray-300 border-t-gray-800 rounded-full" />
      </div>
    );
  }

  // Show auth screen if not logged in and not guest
  if (!auth.isAuthenticated && !auth.isGuest) {
    return (
      <AuthScreen
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        onGuest={auth.continueAsGuest}
      />
    );
  }

  return (
    <ToastProvider>
      <AppProvider>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
          <AppContent auth={auth} />
        </APIProvider>
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
