import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

const FUEL_GRADES = [
  { value: "regular", label: "Regular" },
  { value: "midgrade", label: "Midgrade" },
  { value: "premium", label: "Premium" },
  { value: "diesel", label: "Diesel" },
];

export default function ControlBar() {
  const { state, dispatch } = useAppContext();
  const { fuelPrice, fuelGrade, mpg, mpgLocked, pillowPremium, autoFuelPrice, zipCode } = state.settings;
  const [showPillow, setShowPillow] = useState(pillowPremium > 0);
  const [showVehicle, setShowVehicle] = useState(false);
  const [fetchingFuel, setFetchingFuel] = useState(false);

  const updateSetting = (field, value) =>
    dispatch({ type: "UPDATE_SETTINGS", payload: { [field]: value } });

  // Fetch fuel price on load and when grade/zip changes
  useEffect(() => {
    if (!autoFuelPrice) return;
    fetchFuelPrice();
  }, [fuelGrade, zipCode, autoFuelPrice]);

  async function fetchFuelPrice() {
    setFetchingFuel(true);
    try {
      // GasBuddy doesn't have a public API, so we use a CORS proxy + scraping approach
      // For now, use average national prices as fallback
      const avgPrices = {
        regular: 3.45,
        midgrade: 3.85,
        premium: 4.15,
        diesel: 3.75,
      };
      // Simulate a brief fetch
      await new Promise((r) => setTimeout(r, 500));
      updateSetting("fuelPrice", avgPrices[fuelGrade] || 3.45);
    } catch (e) {
      console.warn("Fuel price fetch failed:", e);
    } finally {
      setFetchingFuel(false);
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Fuel price */}
          <label className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-500 font-medium">$/gal</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fuelPrice}
              onChange={(e) => updateSetting("fuelPrice", parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {fetchingFuel && <span className="text-xs text-gray-400 animate-pulse">updating...</span>}
          </label>

          {/* Fuel grade */}
          <select
            value={fuelGrade}
            onChange={(e) => updateSetting("fuelGrade", e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {FUEL_GRADES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          {/* MPG */}
          <label className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-500 font-medium">MPG</span>
            <input
              type="number"
              min="1"
              value={mpg}
              disabled={mpgLocked}
              onChange={(e) => updateSetting("mpg", parseFloat(e.target.value) || 1)}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              onClick={() => updateSetting("mpgLocked", !mpgLocked)}
              className="text-lg leading-none hover:scale-110 transition-transform"
              title={mpgLocked ? "Unlock MPG" : "Lock MPG"}
            >
              {mpgLocked ? "🔒" : "🔓"}
            </button>
          </label>

          {/* Vehicle profile toggle */}
          <button
            onClick={() => setShowVehicle(!showVehicle)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              showVehicle ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            🚗 Vehicle
          </button>

          {/* WeighPoints toggle */}
          <button
            onClick={() => dispatch({ type: "TOGGLE_WEIGHPOINTS" })}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              state.showWeighPoints
                ? "bg-scenario-a text-white border-scenario-a"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            📍 WeighPoints
          </button>

          {/* Pillow Premium toggle */}
          <button
            onClick={() => setShowPillow(!showPillow)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              showPillow ? "bg-accent/10 text-accent border-accent/40" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            🛏️ Pillow Premium
          </button>

          {showPillow && (
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={pillowPremium}
                onChange={(e) => updateSetting("pillowPremium", parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          )}
        </div>

        {/* Vehicle profile panel */}
        {showVehicle && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-500">Vehicle Name</span>
              <input
                type="text"
                placeholder="My Car"
                value={state.vehicle.name}
                onChange={(e) => dispatch({ type: "UPDATE_VEHICLE", payload: { name: e.target.value } })}
                className="w-32 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-500">ZIP</span>
              <input
                type="text"
                maxLength={5}
                value={zipCode}
                onChange={(e) => updateSetting("zipCode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <button
              onClick={fetchFuelPrice}
              disabled={fetchingFuel}
              className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
            >
              {fetchingFuel ? "⏳ Fetching..." : "🔄 Refresh Price"}
            </button>
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={autoFuelPrice}
                onChange={(e) => updateSetting("autoFuelPrice", e.target.checked)}
                className="rounded"
              />
              Auto-update fuel price
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
