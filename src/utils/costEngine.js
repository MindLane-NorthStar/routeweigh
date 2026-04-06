import { getToll } from "./tollData.js";

export function calculateLegCost(leg, settings) {
  const fuelCost = (leg.distanceMiles / settings.mpg) * settings.fuelPrice;
  const tollCost = getToll(leg.from.id, leg.to.id);

  return {
    ...leg,
    fuelCost: Math.round(fuelCost * 100) / 100,
    tollCost,
    totalLegCost: Math.round((fuelCost + tollCost) * 100) / 100,
  };
}

export function calculateScenarioTotal(legs) {
  const totalMiles = legs.reduce((sum, l) => sum + l.distanceMiles, 0);
  const totalMinutes = legs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const totalFuelCost = legs.reduce((sum, l) => sum + l.fuelCost, 0);
  const totalTolls = legs.reduce((sum, l) => sum + l.tollCost, 0);
  const totalCost = totalFuelCost + totalTolls;

  return {
    legs,
    totalMiles: Math.round(totalMiles * 10) / 10,
    totalMinutes,
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
    totalTolls: Math.round(totalTolls * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

function isHome(stop) {
  if (!stop) return false;
  if (typeof stop === "string") return stop.toLowerCase() === "home";
  const label = (stop.label || stop.name || "").toLowerCase();
  return label === "home" || label.includes("home");
}

export function applyPillowPremium(scenarioA, scenarioB, settings) {
  const aEndsHome =
    isHome(scenarioA.stops[scenarioA.stops.length - 1]) ||
    (scenarioA.stops.length === 0 && isHome(scenarioA.origin));
  const bEndsHome =
    isHome(scenarioB.stops[scenarioB.stops.length - 1]) ||
    (scenarioB.stops.length === 0 && isHome(scenarioB.origin));

  return {
    aAdjusted: aEndsHome
      ? scenarioA.totalCost
      : scenarioA.totalCost + settings.pillowPremium,
    bAdjusted: bEndsHome
      ? scenarioB.totalCost
      : scenarioB.totalCost + settings.pillowPremium,
  };
}
