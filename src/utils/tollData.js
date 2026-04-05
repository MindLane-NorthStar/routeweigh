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

// Fetch toll from Google Routes API via serverless function
export async function fetchTollFromAPI(origin, destination, departureTime) {
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

    if (!response.ok) return { tollCost: 0, hasTolls: false };

    const data = await response.json();
    return {
      tollCost: data.tollCost || 0,
      hasTolls: data.hasTolls || false,
    };
  } catch (e) {
    console.warn("Toll API fetch failed:", e.message);
    return { tollCost: 0, hasTolls: false };
  }
}
