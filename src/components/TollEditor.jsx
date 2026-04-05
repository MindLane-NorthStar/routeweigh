import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { getAllUserTolls, setUserToll, removeUserToll } from "../utils/tollData";

export default function TollEditor() {
  const { state } = useAppContext();
  const weighpoints = state.weighpoints || [];
  const [tolls, setTolls] = useState(getAllUserTolls());
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [cost, setCost] = useState("");

  const handleAdd = () => {
    if (!fromId || !toId || fromId === toId || !cost) return;
    const amount = parseFloat(cost);
    if (isNaN(amount) || amount < 0) return;

    setUserToll(fromId, toId, amount);
    setTolls(getAllUserTolls());
    setFromId("");
    setToId("");
    setCost("");
  };

  const handleRemove = (key) => {
    const [from, to] = key.split("->");
    removeUserToll(from, to);
    setTolls(getAllUserTolls());
  };

  const getLabel = (id) => {
    const wp = weighpoints.find((w) => w.id === id);
    return wp ? `${wp.icon} ${wp.label}` : id;
  };

  const tollEntries = Object.entries(tolls);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-4 mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        🛣️ Toll Overrides
      </h3>
      <p className="text-[11px] text-gray-400 mb-3">
        Set known toll costs between locations. These override auto-detected tolls.
      </p>

      {/* Existing tolls */}
      {tollEntries.length > 0 && (
        <div className="space-y-1 mb-3">
          {tollEntries.map(([key, amount]) => {
            const [from, to] = key.split("->");
            return (
              <div key={key} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-xs">
                  {getLabel(from)} → {getLabel(to)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium text-red-600 text-xs">${amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleRemove(key)}
                    className="text-gray-300 hover:text-red-400 text-sm"
                  >✕</button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new toll */}
      {weighpoints.length >= 2 && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[100px]">
            <span className="text-[10px] text-gray-400">From</span>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="">Select...</option>
              {weighpoints.map((wp) => (
                <option key={wp.id} value={wp.id}>{wp.icon} {wp.label}</option>
              ))}
            </select>
          </div>
          <span className="text-gray-300 text-sm pb-1.5">→</span>
          <div className="flex-1 min-w-[100px]">
            <span className="text-[10px] text-gray-400">To</span>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="">Select...</option>
              {weighpoints.filter((wp) => wp.id !== fromId).map((wp) => (
                <option key={wp.id} value={wp.id}>{wp.icon} {wp.label}</option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <span className="text-[10px] text-gray-400">Toll $</span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
              placeholder="0.00"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!fromId || !toId || !cost}
            className="px-3 py-1.5 bg-scenario-a text-white text-xs rounded-lg disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      {weighpoints.length < 2 && (
        <p className="text-[11px] text-gray-400 text-center py-2">
          Add at least 2 WeighPoints to set toll costs between them.
        </p>
      )}
    </div>
  );
}
