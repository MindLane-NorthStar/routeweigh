import { useEffect, useRef } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { DEFAULT_WEIGHPOINTS } from "../data/weighpoints";

const MAP_STYLES = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

function RouteRenderer({ legs, color, dashed = false }) {
  const map = useMap();
  const renderersRef = useRef([]);

  useEffect(() => {
    // Clear old renderers
    renderersRef.current.forEach((r) => r.setMap(null));
    renderersRef.current = [];

    if (!map || !legs || legs.length === 0) return;

    legs.forEach((leg) => {
      if (leg.directionsResult) {
        const renderer = new window.google.maps.DirectionsRenderer({
          map,
          directions: leg.directionsResult,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: color,
            strokeWeight: 5,
            strokeOpacity: dashed ? 0 : 0.85,
            ...(dashed
              ? {
                  strokeOpacity: 0,
                  icons: [
                    {
                      icon: {
                        path: "M 0,-1 0,1",
                        strokeOpacity: 0.85,
                        strokeColor: color,
                        scale: 4,
                      },
                      offset: "0",
                      repeat: "16px",
                    },
                  ],
                }
              : {}),
          },
        });
        renderersRef.current.push(renderer);
      }
    });

    // Auto-fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    legs.forEach((leg) => {
      bounds.extend(new window.google.maps.LatLng(leg.from.lat, leg.from.lng));
      bounds.extend(new window.google.maps.LatLng(leg.to.lat, leg.to.lng));
    });
    map.fitBounds(bounds, { padding: 40 });

    return () => {
      renderersRef.current.forEach((r) => r.setMap(null));
      renderersRef.current = [];
    };
  }, [map, legs, color, dashed]);

  return null;
}

function WeighPointMarkers() {
  const map = useMap();
  const markersRef = useRef([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!map) return;

    DEFAULT_WEIGHPOINTS.forEach((wp) => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: wp.lat, lng: wp.lng },
        label: {
          text: wp.icon,
          fontSize: "20px",
        },
        title: wp.label,
      });

      const info = new window.google.maps.InfoWindow({
        content: `<div style="font-family:DM Sans,sans-serif;padding:4px;">
          <strong>${wp.icon} ${wp.label}</strong><br/>
          <span style="color:#6B7280;font-size:12px;">${wp.address}</span>
        </div>`,
      });

      marker.addListener("click", () => info.open(map, marker));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map]);

  return null;
}

export default function RouteMap({ legsA, legsB }) {
  const center = { lat: 41.22, lng: -81.7 }; // Center of Ohio locations

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-200 my-6">
      <div className="h-[350px] md:h-[450px]">
        <Map
          defaultCenter={center}
          defaultZoom={10}
          mapId="routeweigh-map"
          gestureHandling="cooperative"
          disableDefaultUI={false}
          styles={MAP_STYLES}
        >
          <WeighPointMarkers />
          {legsA && <RouteRenderer legs={legsA} color="#16785A" />}
          {legsB && <RouteRenderer legs={legsB} color="#B8860B" dashed />}
        </Map>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-scenario-a rounded" /> Scenario A
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 border-t-2 border-dashed border-scenario-b" /> Scenario B
        </span>
      </div>
    </div>
  );
}
