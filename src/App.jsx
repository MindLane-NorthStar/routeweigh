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
import AuthScreen from "./components/AuthScreen";
import UserMenu from "./components/UserMenu";
import { useDirections } from "./hooks/useDirections";
import { calculateLegCost, calculateScenarioTotal } from "./utils/costEngine";

function AppContent() {
  const { state, dispatch } = useAppContext();
  const { calculateRoute, loading, error } = useDirections();
  const [legsA, setLegsA] = useState(null);
  const [legsB, setLegsB] = useState(null);
  const [totalA, setTotalA] = useState(null);
  const [totalB, setTotalB] = useState(null);
  const [calculated, setCalculated] = useState(false);
  const weighStationRef = useRef(null);

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
      <ControlBar />
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <WeighPoints />
        <p className="text-center text-gray-400 text-[13px] my-3">
          Two routes. Real traffic. Real fuel costs. Build your scenarios below or tell the AI what you need.
        </p>
        <AiAssistant />
        <ScenarioPair />

        <div className="flex justify-center my-6">
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
    <AppProvider>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        {/* User menu floats top-right */}
        <div className="fixed top-3 right-3 z-[60]">
          <UserMenu
            user={auth.user}
            isGuest={auth.isGuest}
            onSignOut={auth.signOut}
            onUpgrade={auth.upgradeFromGuest}
          />
        </div>
        <AppContent />
      </APIProvider>
    </AppProvider>
  );
}

export default App;
