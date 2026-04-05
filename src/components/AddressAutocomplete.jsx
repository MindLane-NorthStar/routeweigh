import { useState } from "react";

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className }) {
  const [geocoding, setGeocoding] = useState(false);

  const handleBlur = async () => {
    if (!value?.trim() || !window.google?.maps) return;

    setGeocoding(true);
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
      console.warn("Geocoding failed:", e);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder || "Type address, tap away to confirm"}
        className={className}
      />
      {geocoding && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 animate-pulse">
          📍
        </span>
      )}
    </div>
  );
}
