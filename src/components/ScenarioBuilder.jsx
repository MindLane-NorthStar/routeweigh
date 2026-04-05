import { useState, useRef, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import AddressAutocomplete from "./AddressAutocomplete";

const colorMap = { A: "scenario-a", B: "scenario-b" };
const borderMap = { A: "border-scenario-a", B: "border-scenario-b" };

// A stop can be:
// - { type: "weighpoint", id: "home_abc123" }  — saved location
// - { type: "address", address: "123 Main St", lat: 41.1, lng: -81.4 }  — ad-hoc

function normalizeStop(stop) {
  if (typeof stop === "string") {
    // Legacy format — WeighPoint ID
    return stop ? { type: "weighpoint", id: stop } : null;
  }
  return stop;
}

export default function ScenarioBuilder({ id, onClone }) {
  const { state, dispatch } = useAppContext();
  const scenario = state.scenarios[id];
  const weighpoints = state.weighpoints || [];
  const accent = colorMap[id];

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);

  // Normalize stops to new format
  const stops = (scenario.stops || []).map(normalizeStop).filter(Boolean);

  const update = (payload) =>
    dispatch({ type: "UPDATE_SCENARIO", id, payload });

  // Origin can be a WeighPoint ID or an address object
  const originData = (() => {
    if (!scenario.origin) return null;
    if (typeof scenario.origin === "object") return scenario.origin;
    return weighpoints.find((w) => w.id === scenario.origin) || null;
  })();

  const setOrigin = (value) => update({ origin: value });

  const setStop = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    update({ stops: newStops });
  };

  const addWeighPointStop = () => {
    update({ stops: [...stops, { type: "weighpoint", id: "" }] });
  };

  const addAddressStop = () => {
    update({ stops: [...stops, { type: "address", address: "", lat: 0, lng: 0 }] });
  };

  const removeStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    update({ stops: newStops });
  };

  const moveStop = (fromIndex, toIndex) => {
    const newStops = [...stops];
    const [moved] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, moved);
    update({ stops: newStops });
  };

  const saveStopAsWeighPoint = (index) => {
    const stop = stops[index];
    if (stop?.type !== "address" || !stop.address) return;

    const newWP = {
      id: stop.address.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20) + "_" + Date.now().toString(36),
      label: stop.address.split(",")[0] || "New Location",
      address: stop.address,
      lat: stop.lat || 0,
      lng: stop.lng || 0,
      icon: "📍",
      color: "#2E7D52",
    };

    dispatch({ type: "ADD_WEIGHPOINT", payload: newWP });

    // Replace the stop with the new WeighPoint reference
    const newStops = [...stops];
    newStops[index] = { type: "weighpoint", id: newWP.id };
    update({ stops: newStops });
  };

  const setDepartureTime = (departureTime) => update({ departureTime });

  // Drag handlers
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (e, index) => {
    e.preventDefault();
    if (dragItem.current !== null && dragItem.current !== index) {
      moveStop(dragItem.current, index);
    }
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const getStopLabel = (stop) => {
    if (!stop) return "";
    if (stop.type === "weighpoint") {
      const wp = weighpoints.find((w) => w.id === stop.id);
      return wp ? `${wp.icon} ${wp.label}` : "";
    }
    return stop.address || "";
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-gray-200 overflow-hidden flex-1 min-w-0">
      <div className={`h-1.5 bg-${accent}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-${accent} text-lg`}>Scenario {id}</h3>
          <button
            onClick={onClone}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 rounded-lg px-2 py-1 transition-colors"
          >
            Copy to {id === "A" ? "B" : "A"} &rarr;
          </button>
        </div>

        {/* Origin */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</span>
          <select
            value={typeof scenario.origin === "string" ? scenario.origin : ""}
            onChange={(e) => setOrigin(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${borderMap[id]} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-${accent}/30`}
          >
            <option value="">Select origin...</option>
            {weighpoints.map((wp) => (
              <option key={wp.id} value={wp.id}>{wp.icon} {wp.label}</option>
            ))}
          </select>
        </label>

        {/* Stops */}
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Stops <span className="text-gray-300 font-normal">(drag to reorder)</span>
          </span>
          <div className="mt-1 space-y-1">
            {stops.map((stop, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-lg transition-all ${
                  dragIndex === i ? "opacity-40 scale-95" : ""
                } ${dragOverIndex === i && dragIndex !== i ? "border-t-2 border-blue-400" : ""}`}
              >
                <span className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none text-sm flex-shrink-0">⠿</span>
                <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{i + 1}.</span>

                {stop?.type === "weighpoint" ? (
                  // WeighPoint dropdown
                  <select
                    value={stop.id || ""}
                    onChange={(e) => setStop(i, { type: "weighpoint", id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    <option value="">Select stop...</option>
                    {weighpoints.map((wp) => (
                      <option key={wp.id} value={wp.id}>{wp.icon} {wp.label}</option>
                    ))}
                  </select>
                ) : (
                  // Address autocomplete input
                  <div className="flex-1">
                    <AddressAutocomplete
                      value={stop?.address || ""}
                      onChange={(val) => setStop(i, { ...stop, address: val })}
                      onSelect={({ address, lat, lng }) =>
                        setStop(i, { type: "address", address, lat, lng })
                      }
                      placeholder="Type an address..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    {stop?.lat > 0 && (
                      <button
                        onClick={() => saveStopAsWeighPoint(i)}
                        className="mt-1 text-[11px] text-scenario-a hover:text-scenario-a/80 font-medium"
                        title="Save as WeighPoint"
                      >
                        💾 Save
                      </button>
                    )}
                  </div>
                )}

                {/* Move buttons */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => i > 0 && moveStop(i, i - 1)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 text-xs disabled:opacity-20 leading-none">▲</button>
                  <button onClick={() => i < stops.length - 1 && moveStop(i, i + 1)} disabled={i === stops.length - 1} className="text-gray-300 hover:text-gray-500 text-xs disabled:opacity-20 leading-none">▼</button>
                </div>
                <button onClick={() => removeStop(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors flex-shrink-0">&times;</button>
              </div>
            ))}
          </div>

          {/* Add stop buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={addWeighPointStop}
              className="flex-1 py-2 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-400 hover:text-gray-500 transition-colors"
            >
              + Saved Location
            </button>
            <button
              onClick={addAddressStop}
              className="flex-1 py-2 border-2 border-dashed border-blue-100 hover:border-blue-200 rounded-lg text-sm text-blue-400 hover:text-blue-500 transition-colors"
            >
              + Type Address
            </button>
          </div>
        </div>

        {/* Departure time */}
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Departure Time</span>
          <input
            type="datetime-local"
            value={scenario.departureTime || nowLocal()}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </label>
      </div>
    </div>
  );
}
