import { useEffect, useRef, useState } from "react";

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (autocompleteRef.current || !inputRef.current) return;

    // Wait for Google Maps to load
    const tryInit = () => {
      if (!window.google?.maps?.places?.Autocomplete) return false;

      try {
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["formatted_address", "geometry"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (place?.geometry) {
            onSelect({
              address: place.formatted_address || "",
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        });

        autocompleteRef.current = ac;
        setInitialized(true);
        return true;
      } catch (e) {
        console.warn("Autocomplete init failed:", e);
        return false;
      }
    };

    if (!tryInit()) {
      // Retry every 500ms until Google loads
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 500);
      // Stop trying after 10 seconds
      setTimeout(() => clearInterval(interval), 10000);
      return () => clearInterval(interval);
    }
  }, [onSelect]);

  // Fallback geocode on blur if autocomplete didn't init
  const handleBlur = async () => {
    if (initialized || !value?.trim() || !window.google?.maps) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: value }, (results, status) => {
          if (status === "OK" && results[0]) resolve(results[0]);
          else reject(status);
        });
      });
      onSelect({
        address: result.formatted_address || value,
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      });
    } catch (e) {
      console.warn("Geocoding fallback failed:", e);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder || "Start typing an address..."}
      className={className}
    />
  );
}
