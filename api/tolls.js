// Vercel serverless function — Google Routes API toll lookup
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Google API key not configured" });

  const { origin, destination, departureTime } = req.body;

  try {
    const body = {
      origin: {
        location: {
          latLng: { latitude: origin.lat, longitude: origin.lng }
        }
      },
      destination: {
        location: {
          latLng: { latitude: destination.lat, longitude: destination.lng }
        }
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      extraComputations: ["TOLLS"],
      routeModifiers: {
        vehicleInfo: {
          emissionType: "GASOLINE"
        }
      }
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
          "X-Goog-FieldMask": "routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo,routes.duration,routes.distanceMeters",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    // Extract toll info
    let tollCost = 0;
    let hasTolls = false;

    if (data.routes?.[0]?.travelAdvisory?.tollInfo) {
      const tollInfo = data.routes[0].travelAdvisory.tollInfo;
      hasTolls = true;
      if (tollInfo.estimatedPrice) {
        for (const price of tollInfo.estimatedPrice) {
          if (price.currencyCode === "USD") {
            tollCost = parseFloat(price.units || 0) + parseFloat(price.nanos || 0) / 1e9;
          }
        }
      }
    }

    // Also check per-leg tolls
    if (data.routes?.[0]?.legs) {
      for (const leg of data.routes[0].legs) {
        if (leg.travelAdvisory?.tollInfo?.estimatedPrice) {
          for (const price of leg.travelAdvisory.tollInfo.estimatedPrice) {
            if (price.currencyCode === "USD" && !hasTolls) {
              tollCost += parseFloat(price.units || 0) + parseFloat(price.nanos || 0) / 1e9;
              hasTolls = true;
            }
          }
        }
      }
    }

    return res.json({
      tollCost: Math.round(tollCost * 100) / 100,
      hasTolls,
      distanceMeters: data.routes?.[0]?.distanceMeters || 0,
      duration: data.routes?.[0]?.duration || "0s",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
