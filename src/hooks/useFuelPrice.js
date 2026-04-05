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

// Google Places fuelOptions type mapping
const GOOGLE_FUEL_MAP = {
  regular: "REGULAR_UNLEADED",
  midgrade: "MIDGRADE",
  premium: "PREMIUM",
  e88: "E15",       // Google doesn't list E15/E88 — we'll estimate from regular
  e85: "E85",
  diesel: "DIESEL",
};

export function useFuelPrice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);

  const fetchPrice = useCallback(async (lat, lng, fuelGrade = "regular") => {
    setLoading(true);
    setError(null);

    try {
      // Use Google Places Nearby Search for gas stations
      if (!window.google?.maps?.places) {
        throw new Error("Google Places not loaded");
      }

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      const results = await new Promise((resolve, reject) => {
        service.nearbySearch(
          {
            location: { lat, lng },
            radius: 8000, // 5 miles
            type: "gas_station",
          },
          (results, status) => {
            if (status === "OK") resolve(results);
            else reject(new Error(`Places API: ${status}`));
          }
        );
      });

      // Get details with fuel prices for top results
      const stationPrices = [];
      const targetFuelType = GOOGLE_FUEL_MAP[fuelGrade];

      for (const place of results.slice(0, 8)) {
        try {
          const details = await new Promise((resolve, reject) => {
            service.getDetails(
              {
                placeId: place.place_id,
                fields: ["name", "formatted_address", "fuel_options", "geometry"],
              },
              (result, status) => {
                if (status === "OK") resolve(result);
                else reject(status);
              }
            );
          });

          if (details.fuel_options?.fuelPrices) {
            for (const fuel of details.fuel_options.fuelPrices) {
              if (fuel.type === targetFuelType && fuel.price) {
                stationPrices.push({
                  name: details.name || "Station",
                  address: details.formatted_address || "",
                  price: fuel.price.units + fuel.price.nanos / 1e9,
                  lat: details.geometry?.location?.lat() || 0,
                  lng: details.geometry?.location?.lng() || 0,
                });
              }
            }
          }
        } catch (e) {
          // Skip stations without fuel data
        }
      }

      if (stationPrices.length > 0) {
        stationPrices.sort((a, b) => a.price - b.price);
        setStations(stationPrices);

        const avgPrice = stationPrices.reduce((s, p) => s + p.price, 0) / stationPrices.length;

        return {
          average: Math.round(avgPrice * 100) / 100,
          cheapest: Math.round(stationPrices[0].price * 100) / 100,
          stationCount: stationPrices.length,
          cheapestStation: stationPrices[0],
        };
      }

      // No Google fuel data — use fallback
      return getFallbackPrice(fuelGrade);
    } catch (err) {
      console.warn("Fuel price fetch failed, using fallback:", err.message);
      setError(err.message);
      return getFallbackPrice(fuelGrade);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPrice, loading, error, stations };
}

function getFallbackPrice(grade) {
  // National average prices (updated periodically)
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
