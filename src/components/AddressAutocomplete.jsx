import { useEffect, useRef, useState } from "react";

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className }) {
  const containerRef = useRef(null);
  const elementRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!containerRef.current || elementRef.current) return;

    // Try the new PlaceAutocompleteElement API
    if (window.google?.maps?.places?.PlaceAutocompleteElement) {
      try {
        const autocomplete = new window.google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: "us" },
          types: ["address"],
        });

        // Style the element to match our app
        autocomplete.style.width = "100%";
        autocomplete.style.fontSize = "14px";
        autocomplete.style.setProperty("--gmpac-color-surface", "#ffffff");
        autocomplete.style.setProperty("--gmpac-color-on-surface", "#1F2937");
        autocomplete.style.setProperty("--gmpac-color-on-surface-variant", "#6B7280");
        autocomplete.style.setProperty("--gmpac-color-outline", "#D1D5DB");
        autocomplete.style.setProperty("--gmpac-color-primary", "#16785A");
        autocomplete.style.borderRadius = "8px";
        autocomplete.style.border = "1px solid #D1D5DB";
        autocomplete.style.background = "#ffffff";

        autocomplete.addEventListener("gmp-select", async (e) => {
          const place = e.place;
          await place.fetchFields({ fields: ["formattedAddress", "location"] });

          if (place.location) {
            onSelect({
              address: place.formattedAddress || "",
              lat: place.location.lat(),
              lng: place.location.lng(),
            });
          }
        });

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(autocomplete);
        elementRef.current = autocomplete;
        return;
      } catch (e) {
        console.warn("PlaceAutocompleteElement failed:", e);
      }
    }

    // Fallback to legacy Autocomplete if available
    if (window.google?.maps?.places?.Autocomplete) {
      setFallback(true);
      return;
    }

    // No Places API available — use plain input
    setFallback(true);
  }, [onSelect]);

  // If using new API, render a container div
  if (!fallback) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ minHeight: "40px" }}
      />
    );
  }

  // Fallback — plain text input with manual geocoding on blur
  return (
    <FallbackInput
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={placeholder}
      className={className}
    />
  );
}

function FallbackInput({ value, onChange, onSelect, placeholder, className }) {
  const handleBlur = async () => {
    if (!value?.trim() || !window.google?.maps) return;

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
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder || "Type an address, press Tab to geocode"}
      className={className}
    />
  );
}
