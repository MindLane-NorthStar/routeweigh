import { createContext, useContext, useReducer, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  loadAllUserData,
  replaceAllWeighPoints,
  saveSettings,
  saveVehicle,
} from "../lib/sync";

const AppContext = createContext();

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallback;
}

const defaultSettings = {
  fuelPrice: 0,
  fuelGrade: "regular",
  mpg: 0,
  mpgLocked: false,
  pillowPremium: 0,
  vehicleName: "",
  autoFuelPrice: false,
  zipCode: "",
};

const defaultVehicle = {
  name: "",
  mpg: 0,
  fuelGrade: "regular",
};

function loadWeighPoints() {
  const saved = loadFromStorage("routeweigh_weighpoints", null);
  if (saved && saved.length > 0) return saved;
  return []; // Start empty — user adds their own
}

const initialState = {
  settings: { ...defaultSettings, ...loadFromStorage("routeweigh_settings", null) },
  vehicle: { ...defaultVehicle, ...loadFromStorage("routeweigh_vehicle", null) },
  heroUrl: loadFromStorage("routeweigh_heroUrl", null) || "/hero.jpg",
  showWeighPoints: false,
  weighpoints: loadWeighPoints(),
  showTolls: false,
  scenarios: {
    A: { id: "A", origin: "", stops: [], departureTime: "" },
    B: { id: "B", origin: "", stops: [], departureTime: "" },
  },
  results: { A: null, B: null },
  userId: null, // Set when user logs in
  syncing: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "UPDATE_VEHICLE":
      return { ...state, vehicle: { ...state.vehicle, ...action.payload } };
    case "SET_HERO_URL":
      return { ...state, heroUrl: action.payload };
    case "TOGGLE_WEIGHPOINTS":
      return { ...state, showWeighPoints: !state.showWeighPoints };
    case "TOGGLE_TOLLS":
      return { ...state, showTolls: !state.showTolls };

    // WeighPoint CRUD
    case "ADD_WEIGHPOINT":
      return { ...state, weighpoints: [...state.weighpoints, action.payload] };
    case "UPDATE_WEIGHPOINT":
      return {
        ...state,
        weighpoints: state.weighpoints.map((wp) =>
          wp.id === action.payload.id ? { ...wp, ...action.payload } : wp
        ),
      };
    case "REMOVE_WEIGHPOINT":
      return {
        ...state,
        weighpoints: state.weighpoints.filter((wp) => wp.id !== action.payload),
      };
    case "RESET_WEIGHPOINTS":
      return { ...state, weighpoints: [] };
    case "SET_WEIGHPOINTS":
      return { ...state, weighpoints: action.payload };

    // Scenarios
    case "UPDATE_SCENARIO":
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [action.id]: { ...state.scenarios[action.id], ...action.payload },
        },
      };
    case "SET_RESULTS":
      return {
        ...state,
        results: { ...state.results, [action.id]: action.payload },
      };

    // Auth
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "SET_SYNCING":
      return { ...state, syncing: action.payload };

    // Bulk load from cloud
    case "LOAD_USER_DATA":
      return {
        ...state,
        weighpoints: action.payload.weighpoints || state.weighpoints,
        settings: action.payload.settings
          ? { ...state.settings, ...action.payload.settings }
          : state.settings,
        vehicle: action.payload.vehicle
          ? { ...state.vehicle, ...action.payload.vehicle }
          : state.vehicle,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist to localStorage (always, for offline support)
  useEffect(() => {
    localStorage.setItem("routeweigh_settings", JSON.stringify(state.settings));
  }, [state.settings]);

  useEffect(() => {
    localStorage.setItem("routeweigh_vehicle", JSON.stringify(state.vehicle));
  }, [state.vehicle]);

  useEffect(() => {
    localStorage.setItem("routeweigh_heroUrl", JSON.stringify(state.heroUrl));
  }, [state.heroUrl]);

  useEffect(() => {
    localStorage.setItem("routeweigh_weighpoints", JSON.stringify(state.weighpoints));
  }, [state.weighpoints]);

  // Cloud sync: check for logged-in user on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch({ type: "SET_USER_ID", payload: session.user.id });
        // Load user data from cloud
        loadUserDataFromCloud(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        dispatch({ type: "SET_USER_ID", payload: session.user.id });
        loadUserDataFromCloud(session.user.id);
      } else {
        dispatch({ type: "SET_USER_ID", payload: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserDataFromCloud(userId) {
    dispatch({ type: "SET_SYNCING", payload: true });
    try {
      const data = await loadAllUserData(userId);
      dispatch({ type: "LOAD_USER_DATA", payload: data });
    } catch (e) {
      console.warn("Failed to load cloud data:", e.message);
    } finally {
      dispatch({ type: "SET_SYNCING", payload: false });
    }
  }

  // Cloud sync: save weighpoints when they change (debounced)
  useEffect(() => {
    if (!state.userId) return;
    const timer = setTimeout(() => {
      replaceAllWeighPoints(state.userId, state.weighpoints).catch((e) =>
        console.warn("Failed to sync weighpoints:", e.message)
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.weighpoints, state.userId]);

  // Cloud sync: save settings when they change (debounced)
  useEffect(() => {
    if (!state.userId) return;
    const timer = setTimeout(() => {
      saveSettings(state.userId, state.settings).catch((e) =>
        console.warn("Failed to sync settings:", e.message)
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.settings, state.userId]);

  // Cloud sync: save vehicle when it changes (debounced)
  useEffect(() => {
    if (!state.userId) return;
    const timer = setTimeout(() => {
      saveVehicle(state.userId, state.vehicle).catch((e) =>
        console.warn("Failed to sync vehicle:", e.message)
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.vehicle, state.userId]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
