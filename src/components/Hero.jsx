import { useAppContext } from "../context/AppContext";

export default function Hero() {
  const { state } = useAppContext();

  return (
    <div className="relative w-full h-[260px] overflow-hidden">
      <img
        src={state.heroUrl}
        alt="Highway hero"
        className="w-full h-full object-cover"
      />
      {/* Top gradient for title legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

      {/* Title — upper 30% over sky */}
      <div className="absolute top-[8%] left-0 right-0 text-center">
        <h1 className="font-extrabold text-[44px] tracking-[5px] leading-none">
          <span className="text-accent">ROUTE</span>
          <span className="text-white">WEIGH</span>
        </h1>
        <p className="text-[12px] tracking-[4px] text-white/85 uppercase mt-2">
          Know Before You Go
        </p>
      </div>

      {/* Explainer at bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center px-5 pb-4">
        <p className="text-white/65 text-[11px] sm:text-[12px] leading-[1.6] text-center max-w-[450px]">
          Two routes. Real traffic. Real fuel costs. Build your scenarios below or tell the AI what you need.
        </p>
      </div>
    </div>
  );
}
