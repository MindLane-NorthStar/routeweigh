import { useState, useCallback, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { getWaypoints, isTurnpikeLeg } from "../utils/routeRules";
import { getToll } from "../utils/tollData";

export function useDirections() {
  const { state } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const serviceRef = useRef(null);

  const waitForMaps = useCallback(() => {
    return new Promise((resolve) => {
      if (window.google?.maps) {
        resolve();
        return;
      }
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      // Timeout after 10 seconds
      setTimeout(() => { clearInterval(check); resolve(); }, 10000);
    });
  }, []);

  const getService = useCallback(async () => {
    await waitForMaps();
    if (!serviceRef.current && window.google?.maps) {
      serviceRef.current = new window.google.maps.DirectionsService();
    }
    return serviceRef.current;
  }, [waitForMaps]);

  const fetchLeg = useCallback(
    async (from, to, departureTime) => {
      const service = await getService();
      if (!service) {
        throw new Error("Google Maps not loaded");
      }
      return new Promise((resolve, reject) => {

        const waypoints = getWaypoints(from.id, to.id);
        const request = {
          origin: new window.google.maps.LatLng(from.lat, from.lng),
          destination: new window.google.maps.LatLng(to.lat, to.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        };

        if (waypoints.length > 0) {
          request.waypoints = waypoints.map((w) => ({
            location: new window.google.maps.LatLng(w.lat, w.lng),
            stopover: false,
          }));
        }

        if (departureTime) {
          request.drivingOptions = {
            departureTime: new Date(departureTime),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
          };
        }

        service.route(request, (result, status) => {
          if (status === "OK") {
            const leg = result.routes[0].legs[0];
            const distanceMiles = leg.distance.value / 1609.34;
            const durationMinutes = Math.round(
              (leg.duration_in_traffic?.value || leg.duration.value) / 60
            );
            resolve({
              from,
              to,
              distanceMiles: Math.round(distanceMiles * 10) / 10,
              durationMinutes,
              polyline: result.routes[0].overview_polyline,
              directionsResult: result,
              isTurnpike: isTurnpikeLeg(from.id, to.id),
              tollCost: getToll(from.id, to.id),
            });
          } else {
            reject(new Error(`Directions failed: ${status}`));
          }
        });
      });
    },
    [getService]
  );

  const calculateRoute = useCallback(
    async (scenario) => {
      setLoading(true);
      setError(null);

      // Read weighpoints fresh from state each time
      const currentWeighpoints = state.weighpoints || [];
      const getWP = (id) => currentWeighpoints.find((w) => w.id === id);

      // Resolve a stop (WeighPoint ID, object with type, or legacy string) to a location
      function resolveLocation(stop) {
        if (!stop) return null;
        // Legacy string format — WeighPoint ID
        if (typeof stop === "string") return getWP(stop);
        // New object format
        if (stop.type === "weighpoint") return getWP(stop.id);
        if (stop.type === "address" && stop.lat && stop.lng) {
          return { id: "adhoc", label: stop.address?.split(",")[0] || "Stop", address: stop.address, lat: stop.lat, lng: stop.lng, icon: "📍", color: "#999" };
        }
        return null;
      }

      try {
        const origin = resolveLocation(scenario.origin) || getWP(scenario.origin);
        if (!origin) throw new Error("Origin not found");

        // Build the chain: origin → stop1 → stop2 → ... → lastStop
        const chain = [origin];
        for (const stop of scenario.stops) {
          const wp = resolveLocation(stop);
          if (wp) chain.push(wp);
        }

        if (chain.length < 2) {
          throw new Error("Need at least one stop");
        }

        // Calculate each leg
        const legs = [];
        for (let i = 0; i < chain.length - 1; i++) {
          const leg = await fetchLeg(
            chain[i],
            chain[i + 1],
            i === 0 ? scenario.departureTime : null
          );
          legs.push(leg);
        }

        setLoading(false);
        return legs;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        return null;
      }
    },
    [fetchLeg, state.weighpoints]
  );

  return { calculateRoute, loading, error };
}
