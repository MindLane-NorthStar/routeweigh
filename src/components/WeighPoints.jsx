import { useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import AddressAutocomplete from "./AddressAutocomplete";

const ICONS = ["🏠", "🏢", "🏡", "🏘️", "🏫", "🏥", "⛪", "🏪", "🎯", "📍"];
const COLORS = ["#2E7D52", "#D97706", "#B8860B", "#16785A", "#DC2626", "#7C3AED", "#0891B2", "#BE185D", "#4F46E5", "#059669"];

function generateId(label) {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString(36);
}

export default function WeighPoints() {
  const { state, dispatch } = useAppContext();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ label: "", address: "", icon: "📍", color: "#2E7D52", lat: 0, lng: 0 });

  if (!state.showWeighPoints) return null;

  const weighpoints = state.weighpoints || [];

  const handleAdd = async () => {
    if (!form.label.trim() || !form.address.trim()) return;

    // Use lat/lng from autocomplete, or geocode as fallback
    let lat = form.lat || 0;
    let lng = form.lng || 0;

    if (lat === 0 && lng === 0 && window.google?.maps) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: form.address }, (results, status) => {
            if (status === "OK" && results[0]) resolve(results[0]);
            else reject(status);
          });
        });
        lat = result.geometry.location.lat();
        lng = result.geometry.location.lng();
      } catch (e) {
        console.warn("Geocoding failed:", e);
      }
    }

    const newWP = {
      id: generateId(form.label),
      label: form.label.trim(),
      address: form.address.trim(),
      lat,
      lng,
      icon: form.icon,
      color: form.color,
    };

    dispatch({ type: "ADD_WEIGHPOINT", payload: newWP });
    setForm({ label: "", address: "", icon: "📍", color: "#2E7D52" });
    setAdding(false);
  };

  const handleUpdate = () => {
    if (!form.label.trim()) return;
    dispatch({ type: "UPDATE_WEIGHPOINT", payload: { id: editId, ...form } });
    setEditId(null);
    setForm({ label: "", address: "", icon: "📍", color: "#2E7D52" });
  };

  const handleDelete = (id) => {
    if (confirm(`Remove this WeighPoint?`)) {
      dispatch({ type: "REMOVE_WEIGHPOINT", payload: id });
    }
  };

  const startEdit = (wp) => {
    setEditId(wp.id);
    setForm({ label: wp.label, address: wp.address, icon: wp.icon, color: wp.color });
    setAdding(false);
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          📍 Your WeighPoints
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            className="text-xs bg-scenario-a text-white px-3 py-1 rounded-lg hover:bg-scenario-a/90 transition-colors"
          >
            + Add Location
          </button>
          {weighpoints.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear all WeighPoints? This cannot be undone.")) dispatch({ type: "RESET_WEIGHPOINTS" }); }}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Existing WeighPoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {weighpoints.map((wp) => (
          <div
            key={wp.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
          >
            <span
              className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: wp.color + "15" }}
            >
              {wp.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm" style={{ color: wp.color }}>{wp.label}</div>
              <div className="text-xs text-gray-400 truncate">{wp.address}</div>
              {wp.lat === 0 && wp.lng === 0 && (
                <div className="text-[10px] text-amber-500 mt-0.5">⚠ Needs geocoding</div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(wp)} className="text-xs text-gray-400 hover:text-blue-500" title="Edit">✏️</button>
              <button onClick={() => handleDelete(wp.id)} className="text-xs text-gray-400 hover:text-red-500" title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {weighpoints.length === 0 && !adding && (
        <p className="text-center text-gray-400 text-sm py-6">
          No WeighPoints yet. Add your frequent locations to get started.
        </p>
      )}

      {/* Add/Edit form */}
      {(adding || editId) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {editId ? "Edit WeighPoint" : "New WeighPoint"}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Label (e.g. Home, Work, Gym)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-scenario-a/30"
            />
            <AddressAutocomplete
              value={form.address}
              onChange={(val) => setForm({ ...form, address: val })}
              onSelect={({ address, lat, lng }) => setForm({ ...form, address, lat, lng })}
              placeholder="Start typing an address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-scenario-a/30"
            />
            <div className="flex gap-3">
              <div>
                <span className="text-xs text-gray-500">Icon</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-8 h-8 text-lg rounded-lg border transition-colors ${
                        form.icon === icon ? "border-scenario-a bg-scenario-a/10" : "border-gray-200"
                      }`}
                    >{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Color</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        form.color === c ? "border-gray-800 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={editId ? handleUpdate : handleAdd}
                className="bg-scenario-a text-white text-sm px-4 py-2 rounded-lg hover:bg-scenario-a/90"
              >
                {editId ? "Save Changes" : "Add WeighPoint"}
              </button>
              <button
                onClick={() => { setAdding(false); setEditId(null); setForm({ label: "", address: "", icon: "📍", color: "#2E7D52" }); }}
                className="text-gray-400 text-sm px-3 py-2 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
