import { useState } from "react";
import { useAppContext } from "../context/AppContext";

export default function Hero() {
  const { state, dispatch } = useAppContext();
  const [showInput, setShowInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const handleChangePhoto = () => {
    if (showInput && urlDraft.trim()) {
      dispatch({ type: "SET_HERO_URL", payload: urlDraft.trim() });
      setUrlDraft("");
    }
    setShowInput(!showInput);
  };

  return (
    <div className="relative w-full h-[260px] overflow-hidden">
      <img
        src={state.heroUrl}
        alt="Highway hero"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />

      {/* Title — positioned in upper portion over sky */}
      <div className="absolute top-[15%] left-0 right-0 text-center">
        <h1 className="font-extrabold text-[44px] tracking-[5px] leading-none">
          <span className="text-accent">ROUTE</span>
          <span className="text-white">WEIGH</span>
        </h1>
        <p className="text-[12px] tracking-[4px] text-white/80 uppercase mt-2">
          Know Before You Go
        </p>
      </div>

      {/* Change Photo button */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {showInput && (
          <input
            type="text"
            placeholder="Paste image URL..."
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePhoto()}
            className="px-2 py-1 text-xs rounded bg-black/60 text-white border border-white/30 placeholder-white/50 w-48 focus:outline-none focus:border-white/60"
          />
        )}
        <button
          onClick={handleChangePhoto}
          className="px-2 py-1 text-xs rounded bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          {showInput ? "Save" : "\u{1F4F7} Change Photo"}
        </button>
      </div>
    </div>
  );
}
