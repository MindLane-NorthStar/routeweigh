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
    </div>
  );
}
