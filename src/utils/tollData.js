// Toll rates — user-defined overrides + API-fetched values
// User overrides take priority over API results

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
  // Check user-defined toll first
  const key = `${fromId}->${toId}`;
  if (userTolls[key] !== undefined) return userTolls[key];
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
  // Try serverless function first (Vercel deployed)
  try {
    const response = await fetch("/api/tolls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        departureTime,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.tollCost > 0 || data.hasTolls) {
        return { tollCost: data.tollCost || 0, hasTolls: data.hasTolls || false };
      }
    }
  } catch (e) {
    // Serverless not available — try direct API call
  }

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
      console.warn("Routes API toll fetch:", response.status);
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
  } catch (e) {
    console.warn("Toll fetch failed:", e.message);
    return { tollCost: 0, hasTolls: false };
  }
}
