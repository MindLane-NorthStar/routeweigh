import { useState, useCallback } from "react";

const FUEL_LABELS = {
  regular: "Regular",
  midgrade: "Midgrade",
  premium: "Premium",
  e88: "Unleaded 88 (E88)",
  e85: "E85",
  diesel: "Diesel",
};

export { FUEL_LABELS };

// National average prices — updated manually or via future API integration
const AVG_PRICES = {
  regular: 3.45,
  midgrade: 3.85,
  premium: 4.15,
  e88: 3.15,
  e85: 2.85,
  diesel: 3.75,
};

export function useFuelPrice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrice = useCallback(async (lat, lng, fuelGrade = "regular") => {
    setLoading(true);
    setError(null);

    try {
      // Use average prices for now
      // Future: integrate HERE Fuel Prices API with OAuth or EIA API
      const price = AVG_PRICES[fuelGrade] || AVG_PRICES.regular;

      setLoading(false);
      return {
        average: price,
        cheapest: price,
        stationCount: 0,
        cheapestStation: null,
        isFallback: true,
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return {
        average: AVG_PRICES[fuelGrade] || 3.45,
        cheapest: AVG_PRICES[fuelGrade] || 3.45,
        stationCount: 0,
        cheapestStation: null,
        isFallback: true,
      };
    }
  }, []);

  return { fetchPrice, loading, error };
}
