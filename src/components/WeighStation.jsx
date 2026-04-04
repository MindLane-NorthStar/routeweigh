import { applyPillowPremium } from "../utils/costEngine";

function DeltaRow({ label, valueA, valueB, unit, format = "number" }) {
  const diff = valueA - valueB;
  if (Math.abs(diff) < 0.01) {
    return (
      <div className="flex justify-between items-center py-1 text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">Even</span>
      </div>
    );
  }
  const winner = diff > 0 ? "B" : "A";
  const loser = diff > 0 ? "A" : "B";
  const amount = Math.abs(diff);

  let displayAmount;
  if (format === "time") {
    const h = Math.floor(amount / 60);
    const m = Math.round(amount % 60);
    displayAmount = h > 0 ? `${h}h ${m}m` : `${m}m`;
  } else if (format === "money") {
    displayAmount = `$${amount.toFixed(2)}`;
  } else {
    displayAmount = `${amount.toFixed(1)} ${unit}`;
  }

  return (
    <div className="flex justify-between items-center py-1 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">
        {loser} pays <span className="font-bold text-amber-400">{displayAmount}</span> more
      </span>
    </div>
  );
}

export default function WeighStation({ totalA, totalB, scenarioA, scenarioB, settings }) {
  if (!totalA || !totalB) return null;

  const costDiff = totalA.totalCost - totalB.totalCost;
  const timeDiff = totalA.totalMinutes - totalB.totalMinutes;
  const distDiff = totalA.totalMiles - totalB.totalMiles;

  const costWinner = costDiff > 0.01 ? "B" : costDiff < -0.01 ? "A" : "tie";
  const timeWinner = timeDiff > 0 ? "B" : timeDiff < 0 ? "A" : "tie";

  // Pillow Premium
  const { aAdjusted, bAdjusted } = applyPillowPremium(
    { ...scenarioA, totalCost: totalA.totalCost },
    { ...scenarioB, totalCost: totalB.totalCost },
    settings
  );
  const adjustedWinner = aAdjusted < bAdjusted ? "A" : bAdjusted < aAdjusted ? "B" : "tie";
  const hasPillow = settings.pillowPremium > 0;
  const finalWinner = hasPillow ? adjustedWinner : costWinner;

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg my-6" id="weighstation">
      {/* Header */}
      <div className="bg-gray-800 px-5 py-3 flex items-center gap-3">
        <span className="text-2xl">⚖️</span>
        <div>
          <h2 className="text-amber-400 font-extrabold tracking-wider text-sm">WEIGHSTATION</h2>
          <p className="text-gray-400 text-xs">Route Comparison Report</p>
        </div>
      </div>

      {/* Scale Visual */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-700">
        <div className={`p-4 text-center ${finalWinner === "A" ? "bg-scenario-a/10" : ""}`}>
          <p className="text-gray-400 text-xs mb-1">Scenario A</p>
          <p className="text-white font-extrabold text-xl">${totalA.totalCost.toFixed(2)}</p>
          <p className="text-gray-500 text-xs mt-1">
            {Math.floor(totalA.totalMinutes / 60)}h {totalA.totalMinutes % 60}m · {totalA.totalMiles} mi
          </p>
          {finalWinner === "A" && (
            <span className="inline-block mt-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              ✓ LIGHTER
            </span>
          )}
        </div>
        <div className={`p-4 text-center border-l border-gray-700 ${finalWinner === "B" ? "bg-scenario-b/10" : ""}`}>
          <p className="text-gray-400 text-xs mb-1">Scenario B</p>
          <p className="text-white font-extrabold text-xl">${totalB.totalCost.toFixed(2)}</p>
          <p className="text-gray-500 text-xs mt-1">
            {Math.floor(totalB.totalMinutes / 60)}h {totalB.totalMinutes % 60}m · {totalB.totalMiles} mi
          </p>
          {finalWinner === "B" && (
            <span className="inline-block mt-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              ✓ LIGHTER
            </span>
          )}
        </div>
      </div>

      {/* Dashed divider */}
      <div className="border-t border-dashed border-gray-600 mx-4" />

      {/* Delta Breakdown */}
      <div className="px-5 py-3">
        <DeltaRow label="Distance" valueA={totalA.totalMiles} valueB={totalB.totalMiles} unit="mi" />
        <DeltaRow label="Drive Time" valueA={totalA.totalMinutes} valueB={totalB.totalMinutes} format="time" />
        <DeltaRow label="Fuel + Tolls" valueA={totalA.totalCost} valueB={totalB.totalCost} format="money" />
        {hasPillow && (
          <DeltaRow label="Adjusted (w/ Pillow)" valueA={aAdjusted} valueB={bAdjusted} format="money" />
        )}
      </div>

      {/* Verdict */}
      <div className="bg-gray-800 px-5 py-4 text-center">
        {finalWinner === "tie" ? (
          <p className="text-amber-400 font-extrabold text-lg">It's a wash.</p>
        ) : (
          <>
            <p className="text-amber-400 font-extrabold text-lg">
              Scenario {finalWinner} wins.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {finalWinner === costWinner
                ? `Saves $${Math.abs(costDiff).toFixed(2)} in fuel & tolls`
                : `Cheaper after Pillow Premium adjustment`}
              {timeWinner === finalWinner && ` and ${Math.abs(timeDiff)} minutes`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
