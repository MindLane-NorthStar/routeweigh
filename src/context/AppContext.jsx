import { createContext, useContext, useReducer, useEffect } from "react";
import { DEFAULT_WEIGHPOINTS } from "../data/weighpoints";

const AppContext = createContext();

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallback;
}

const defaultSettings = {
  fuelPrice: 3.45,
  fuelGrade: "regular", // regular, midgrade, premium, diesel
  mpg: 26,
  mpgLocked: false,
  pillowPremium: 0,
  vehicleName: "",
  autoFuelPrice: true, // auto-fetch from GasBuddy
  zipCode: "44221", // for fuel price lookup
};

const defaultVehicle = {
  name: "My Vehicle",
  mpg: 26,
  fuelGrade: "regular",
};

function loadWeighPoints() {
  const saved = loadFromStorage("routeweigh_weighpoints", null);
  if (saved && saved.length > 0) return saved;
  // First-time users get defaults — they can delete/modify later
  return DEFAULT_WEIGHPOINTS;
}

const initialState = {
  settings: { ...defaultSettings, ...loadFromStorage("routeweigh_settings", null) },
  vehicle: { ...defaultVehicle, ...loadFromStorage("routeweigh_vehicle", null) },
  heroUrl: loadFromStorage("routeweigh_heroUrl", null) || "/hero.jpg",
  showWeighPoints: false,
  weighpoints: loadWeighPoints(),
  scenarios: {
    A: { id: "A", origin: "", stops: [], departureTime: "" },
    B: { id: "B", origin: "", stops: [], departureTime: "" },
  },
  results: { A: null, B: null },
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
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("routeweigh_settings", JSON.stringify(state.settings));
  }, [state.settings]);

  // Persist vehicle
  useEffect(() => {
    localStorage.setItem("routeweigh_vehicle", JSON.stringify(state.vehicle));
  }, [state.vehicle]);

  // Persist hero URL
  useEffect(() => {
    localStorage.setItem("routeweigh_heroUrl", JSON.stringify(state.heroUrl));
  }, [state.heroUrl]);

  // Persist weighpoints
  useEffect(() => {
    localStorage.setItem("routeweigh_weighpoints", JSON.stringify(state.weighpoints));
  }, [state.weighpoints]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
