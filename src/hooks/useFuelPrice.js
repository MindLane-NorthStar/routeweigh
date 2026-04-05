import { useState, useCallback } from "react";

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

// HERE fuel type IDs
// See: https://developer.here.com/documentation/fuel-prices/dev_guide/topics/resource-type-fuel-type.html
const FUEL_TYPE_MAP = {
  regular: "3",         // Regular unleaded
  midgrade: "21",       // Midgrade
  premium: "4",         // Premium
  e88: "41",            // Super E15 / Unleaded 88
  e85: "25",            // E85
  diesel: "2",          // Diesel
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

  const fetchPrice = useCallback(async (lat, lng, fuelGrade = "regular", radius = 8046) => {
    if (!HERE_API_KEY) {
      setError("HERE API key not configured");
      return getFallbackPrice(fuelGrade);
    }

    setLoading(true);
    setError(null);

    try {
      const fuelType = FUEL_TYPE_MAP[fuelGrade] || "3";

      // HERE Fuel Prices API
      const params = new URLSearchParams({
        apiKey: HERE_API_KEY,
        prox: `${lat},${lng},${radius}`,
        fueltype: fuelType,
        maxresults: "15",
      });

      const response = await fetch(
        `https://fuel-v2.cc.api.here.com/fuel/stations.json?${params}`
      );

      if (!response.ok) {
        // Try alternative endpoint format
        const altParams = new URLSearchParams({
          apiKey: HERE_API_KEY,
          at: `${lat},${lng}`,
          fuelType: fuelType,
          limit: 15,
        });

        const altResponse = await fetch(
          `https://fuel.api.here.com/fuel/stations?${altParams}`
        );

        if (!altResponse.ok) {
          throw new Error(`HERE Fuel API: ${altResponse.status}`);
        }

        const altData = await altResponse.json();
        return processFuelData(altData, fuelGrade);
      }

      const data = await response.json();
      return processFuelData(data, fuelGrade);
    } catch (err) {
      console.warn("HERE Fuel API failed, using fallback prices:", err.message);
      setError(err.message);
      return getFallbackPrice(fuelGrade);
    } finally {
      setLoading(false);
    }
  }, []);

  function processFuelData(data, fuelGrade) {
    // Handle different response formats from HERE
    const rawStations = data.stations || data.items || data.results || [];

    if (rawStations.length === 0) {
      return getFallbackPrice(fuelGrade);
    }

    const prices = [];
    const stationList = [];

    rawStations.forEach((station) => {
      // Try different price field locations
      const fuels = station.fuels || station.fuelOptions || station.fuelPrices || [];
      let stationPrice = null;

      if (Array.isArray(fuels)) {
        fuels.forEach((fuel) => {
          const price = fuel.price || fuel.amount || fuel.value;
          if (price && typeof price === "number" && price > 0 && price < 10) {
            stationPrice = price;
          } else if (price && typeof price === "object" && price.value) {
            stationPrice = price.value;
          }
        });
      }

      // Some responses have price directly on station
      if (!stationPrice && station.price) {
        stationPrice = typeof station.price === "number" ? station.price : station.price.value;
      }

      if (stationPrice && stationPrice > 0 && stationPrice < 10) {
        prices.push(stationPrice);
        stationList.push({
          name: station.name || station.brand || station.stationName || "Station",
          address: station.address?.label || station.vicinity || station.formattedAddress || "",
          price: stationPrice,
          currency: "USD",
          lat: station.position?.lat || station.lat || 0,
          lng: station.position?.lng || station.lng || 0,
        });
      }
    });

    if (prices.length === 0) {
      return getFallbackPrice(fuelGrade);
    }

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

function getFallbackPrice(grade) {
  const fallback = {
    regular: 3.45,
    midgrade: 3.85,
    premium: 4.15,
    e88: 3.15,
    e85: 2.85,
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
