// Toll rates — user-defined overrides + API-fetched values
// User overrides > known tolls > API results

import { isTurnpikeLeg } from "./routeRules";

// Known toll amounts for common routes (E-ZPass rates)
const KNOWN_TOLLS = {
  // Ohio Turnpike I-80 E-ZPass passenger vehicle rates
  // These apply when isTurnpikeLeg returns true
  turnpike_default: 1.75,
};

function loadUserTolls() {
  try {
    const saved = localStorage.getItem("routeweigh_tolls");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveUserTolls(tolls) {
  localStorage.setItem("routeweigh_tolls", JSON.stringify(tolls));
}

const userTolls = loadUserTolls();

export function getToll(fromId, toId) {
  // 1. Check user-defined toll first
  const key = `${fromId}->${toId}`;
  if (userTolls[key] !== undefined) return userTolls[key];

  // 2. Check known turnpike toll
  if (isTurnpikeLeg(fromId, toId)) return KNOWN_TOLLS.turnpike_default;

  return 0; // Will be replaced by API result at runtime
}

export function setUserToll(fromId, toId, cost) {
  const key = `${fromId}->${toId}`;
  userTolls[key] = cost;
  saveUserTolls(userTolls);
}

export function removeUserToll(fromId, toId) {
  const key = `${fromId}->${toId}`;
  delete userTolls[key];
  saveUserTolls(userTolls);
}

export function getAllUserTolls() {
  return { ...userTolls };
}

// Fetch toll from Google Routes API
export async function fetchTollFromAPI(origin, destination, departureTime) {
  // Skip serverless — use client-side Routes API directly
  // (Vercel serverless needs separate env var setup)

  // Fallback: call Routes API directly (works for local dev)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { tollCost: 0, hasTolls: false };

  try {
    const body = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      extraComputations: ["TOLLS"],
      routeModifiers: { vehicleInfo: { emissionType: "GASOLINE" } },
    };

    if (departureTime) {
      body.departureTime = new Date(departureTime).toISOString();
    }

    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.travelAdvisory.tollInfo",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return { tollCost: 0, hasTolls: false };
    }

    const data = await response.json();
    let tollCost = 0;
    let hasTolls = false;

    const tollInfo = data.routes?.[0]?.travelAdvisory?.tollInfo;
    if (tollInfo?.estimatedPrice) {
      hasTolls = true;
      for (const price of tollInfo.estimatedPrice) {
        if (price.currencyCode === "USD") {
          tollCost = parseFloat(price.units || 0) + parseFloat(price.nanos || 0) / 1e9;
        }
      }
    }

    return { tollCost: Math.round(tollCost * 100) / 100, hasTolls };
  } catch {
    return { tollCost: 0, hasTolls: false };
  }
}
