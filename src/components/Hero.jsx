import { useAppContext } from "../context/AppContext";

export default function Hero() {
  const { state } = useAppContext();

  return (
    <div className="relative w-full h-[220px] sm:h-[240px] overflow-hidden">
      <img
        src={state.heroUrl}
        alt="Highway hero"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center 30%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/45" />

      {/* Title — top of image over sky */}
      <div className="absolute top-[10%] left-0 right-0 text-center">
        <h1 className="font-extrabold text-[36px] sm:text-[44px] tracking-[5px] leading-none">
          <span className="text-accent">ROUTE</span>
          <span className="text-white">WEIGH</span>
        </h1>
        <p className="text-[11px] tracking-[4px] text-white/85 uppercase mt-2">
          Know Before You Go
        </p>
      </div>

      {/* Explainer at bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center px-5 pb-3">
        <p className="text-white/60 text-[11px] leading-[1.5] text-center max-w-[420px]">
          Two routes. Real traffic. Real fuel costs. Build your scenarios below or tell the AI what you need.
        </p>
      </div>
    </div>
  );
}
