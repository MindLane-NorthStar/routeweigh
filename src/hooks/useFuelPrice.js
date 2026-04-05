import { useState, useCallback } from "react";

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

// HERE fuel type mapping
// https://developer.here.com/documentation/fuel-prices/dev_guide/topics/resource-type-fuel-type.html
const FUEL_TYPE_MAP = {
  regular: "regular",      // Regular unleaded
  midgrade: "midgrade",    // Midgrade
  premium: "premium",      // Premium
  e88: "super_e15",        // Super E15 = Unleaded 88 / E88
  e85: "e85",              // E85 (flex fuel)
  diesel: "diesel",        // Diesel
};

const FUEL_LABELS = {
  regular: "Regular",
  midgrade: "Midgrade",
  premium: "Premium",
  e88: "Unleaded 88 (E88)",
  e85: "E85",
  diesel: "Diesel",
};

export { FUEL_LABELS };

export function useFuelPrice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);

  const fetchPrice = useCallback(async (lat, lng, fuelGrade = "regular", radius = 5000) => {
    if (!HERE_API_KEY) {
      setError("HERE API key not configured");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // HERE Fuel Prices API — search for fuel stations near a location
      const fuelType = FUEL_TYPE_MAP[fuelGrade] || "regular";

      const params = new URLSearchParams({
        apiKey: HERE_API_KEY,
        in: `circle:${lat},${lng};r=${radius}`,
        fuelType: fuelType,
      });

      // HERE Browse API — search for fuel stations nearby
      const browseParams = new URLSearchParams({
        apiKey: HERE_API_KEY,
        at: `${lat},${lng}`,
        categories: "700-7600-0116", // Petrol/gas station category
        limit: 15,
      });

      const response = await fetch(
        `https://browse.search.hereapi.com/v1/browse?${browseParams}`
      );

      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status}`);
      }

      const data = await response.json();

      // HERE Browse returns stations, check for fuel prices in results
      if (data.items && data.items.length > 0) {
        // Use the Discover API for fuel prices at specific stations
        const discoverParams = new URLSearchParams({
          apiKey: HERE_API_KEY,
          at: `${lat},${lng}`,
          q: "gas station",
          limit: 10,
        });

        const discoverResponse = await fetch(
          `https://discover.search.hereapi.com/v1/discover?${discoverParams}`
        );

        if (discoverResponse.ok) {
          const discoverData = await discoverResponse.json();
          const result = processFuelData(discoverData, fuelGrade);
          if (result && !result.isFallback) return result;
        }
      }

      // If no pricing data available, use fallback
      return getFallbackPrice(fuelGrade);
    } catch (err) {
      console.warn("HERE Fuel API failed, using fallback prices:", err.message);
      setError(err.message);
      // Return fallback average prices
      return getFallbackPrice(fuelGrade);
    } finally {
      setLoading(false);
    }
  }, []);

  function processFuelData(data, fuelGrade) {
    const items = data.items || data.stations || [];

    if (items.length === 0) {
      return getFallbackPrice(fuelGrade);
    }

    // Extract prices from stations
    const prices = [];
    const stationList = [];

    items.forEach((station) => {
      const fuelOptions = station.fuelOptions || station.fuels || [];
      fuelOptions.forEach((fuel) => {
        if (fuel.price && fuel.price.value) {
          prices.push(fuel.price.value);
          stationList.push({
            name: station.name || station.brand || "Unknown",
            address: station.address?.label || "",
            price: fuel.price.value,
            currency: fuel.price.currency || "USD",
            lastUpdated: fuel.lastUpdated || station.lastUpdated || "",
          });
        }
      });
    });

    if (prices.length === 0) {
      return getFallbackPrice(fuelGrade);
    }

    // Sort by price
    stationList.sort((a, b) => a.price - b.price);
    setStations(stationList);

    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const cheapest = Math.min(...prices);

    return {
      average: Math.round(avgPrice * 100) / 100,
      cheapest: Math.round(cheapest * 100) / 100,
      stationCount: stationList.length,
      cheapestStation: stationList[0] || null,
    };
  }

  return { fetchPrice, loading, error, stations };
}

// Fallback prices when API is unavailable
function getFallbackPrice(grade) {
  const fallback = {
    regular: 3.45,
    midgrade: 3.85,
    premium: 4.15,
    e88: 3.15,      // Typically 15-25 cents cheaper than regular
    e85: 2.85,      // Typically 20-30% cheaper than regular
    diesel: 3.75,
  };

  return {
    average: fallback[grade] || 3.45,
    cheapest: fallback[grade] || 3.45,
    stationCount: 0,
    cheapestStation: null,
    isFallback: true,
  };
}
