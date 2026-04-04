export default function ResultsPanel({ id, legs, total, color }) {
  if (!legs || legs.length === 0) return null;

  const colorClass = id === "A" ? "border-scenario-a" : "border-scenario-b";
  const label = id === "A" ? "Scenario A" : "Scenario B";

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden`}>
      <div className={`border-l-4 ${colorClass} p-4`}>
        <h3 className="font-bold text-sm tracking-wide text-gray-800 mb-3">{label}</h3>

        {/* Per-leg breakdown */}
        <div className="space-y-2">
          {legs.map((leg, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{leg.from.icon}</span>
                <span className="text-gray-400">→</span>
                <span className="text-base">{leg.to.icon}</span>
                <span className="text-gray-500 text-xs truncate">
                  {leg.from.label} → {leg.to.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                <span>{leg.distanceMiles} mi</span>
                <span>{leg.durationMinutes} min</span>
                <span className="font-medium">${leg.fuelCost?.toFixed(2)}</span>
                {leg.tollCost > 0 && (
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    +${leg.tollCost.toFixed(2)} toll
                  </span>
                )}
                {leg.isTurnpike && (
                  <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    I-80
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        {total && (
          <div className="mt-3 pt-3 border-t-2 border-gray-200 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400 text-xs">Distance</span>
              <p className="font-bold">{total.totalMiles} mi</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Drive Time</span>
              <p className="font-bold">
                {Math.floor(total.totalMinutes / 60)}h {total.totalMinutes % 60}m
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Fuel</span>
              <p className="font-bold">${total.totalFuelCost.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Tolls</span>
              <p className="font-bold">${total.totalTolls.toFixed(2)}</p>
            </div>
            <div className="col-span-2 mt-1 pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-xs">Total Cost</span>
              <p className="font-extrabold text-lg">${total.totalCost.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
