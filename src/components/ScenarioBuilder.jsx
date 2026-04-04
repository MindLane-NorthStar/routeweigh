import { useState, useRef } from "react";
import { useAppContext } from "../context/AppContext";

const colorMap = { A: "scenario-a", B: "scenario-b" };
const borderMap = { A: "border-scenario-a", B: "border-scenario-b" };

export default function ScenarioBuilder({ id, onClone }) {
  const { state, dispatch } = useAppContext();
  const scenario = state.scenarios[id];
  const weighpoints = state.weighpoints || [];
  const accent = colorMap[id];

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);

  const update = (payload) =>
    dispatch({ type: "UPDATE_SCENARIO", id, payload });

  const setOrigin = (origin) => update({ origin });

  const setStop = (index, value) => {
    const stops = [...scenario.stops];
    stops[index] = value;
    update({ stops });
  };

  const addStop = () => update({ stops: [...scenario.stops, ""] });

  const removeStop = (index) => {
    const stops = scenario.stops.filter((_, i) => i !== index);
    update({ stops });
  };

  const moveStop = (fromIndex, toIndex) => {
    const stops = [...scenario.stops];
    const [moved] = stops.splice(fromIndex, 1);
    stops.splice(toIndex, 0, moved);
    update({ stops });
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
    e.dataTransfer.dropEffect = "move";
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

  // Touch drag for mobile
  const touchStart = useRef(null);
  const handleTouchStart = (index, e) => {
    touchStart.current = { index, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (index, e) => {
    if (!touchStart.current) return;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
    const threshold = 40;
    if (Math.abs(deltaY) > threshold) {
      const direction = deltaY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(scenario.stops.length - 1, index + direction));
      if (newIndex !== index) moveStop(index, newIndex);
    }
    touchStart.current = null;
  };

  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const wpLabel = (wpId) => {
    const wp = weighpoints.find((w) => w.id === wpId);
    return wp ? `${wp.icon} ${wp.label}` : wpId;
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
            value={scenario.origin}
            onChange={(e) => setOrigin(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${borderMap[id]} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-${accent}/30`}
          >
            <option value="">Select origin...</option>
            {weighpoints.map((wp) => (
              <option key={wp.id} value={wp.id}>{wp.icon} {wp.label}</option>
            ))}
          </select>
        </label>

        {/* Stops — drag and drop */}
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Stops <span className="text-gray-300 font-normal">(drag to reorder)</span>
          </span>
          <div className="mt-1 space-y-1">
            {scenario.stops.map((stop, i) => (
              <div
                key={`${i}-${stop}`}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(i, e)}
                onTouchEnd={(e) => handleTouchEnd(i, e)}
                className={`flex items-center gap-2 rounded-lg transition-all ${
                  dragIndex === i ? "opacity-40 scale-95" : ""
                } ${dragOverIndex === i && dragIndex !== i ? "border-t-2 border-blue-400" : ""}`}
              >
                {/* Drag handle */}
                <span className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none text-sm flex-shrink-0" title="Drag to reorder">
                  ⠿
                </span>
                <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{i + 1}.</span>
                <select
                  value={stop}
                  onChange={(e) => setStop(i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">Select stop...</option>
                  {weighpoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>{wp.icon} {wp.label}</option>
                  ))}
                </select>
                {/* Move up/down buttons (mobile fallback) */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => i > 0 && moveStop(i, i - 1)}
                    disabled={i === 0}
                    className="text-gray-300 hover:text-gray-500 text-xs disabled:opacity-20 leading-none"
                    title="Move up"
                  >▲</button>
                  <button
                    onClick={() => i < scenario.stops.length - 1 && moveStop(i, i + 1)}
                    disabled={i === scenario.stops.length - 1}
                    className="text-gray-300 hover:text-gray-500 text-xs disabled:opacity-20 leading-none"
                    title="Move down"
                  >▼</button>
                </div>
                <button
                  onClick={() => removeStop(i)}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors flex-shrink-0"
                  title="Remove stop"
                >&times;</button>
              </div>
            ))}
          </div>
          <button
            onClick={addStop}
            className="mt-2 w-full py-2 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-400 hover:text-gray-500 transition-colors"
          >
            + Add Stop
          </button>
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
