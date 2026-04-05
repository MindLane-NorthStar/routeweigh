import { useState } from "react";

export default function AuthScreen({ onSignIn, onSignUp, onGuest }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Email and password required");
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await onSignUp(email, password, name || undefined);
      } else {
        await onSignIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-bg">
      {/* Hero image — same as main app */}
      <div className="relative w-full h-[260px] overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Highway stretching into the distance"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
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

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-10 pb-12">
        {/* Explainer card */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-5 mb-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            We all have multiple places to be and multiple ways to get there.
            <span className="font-semibold text-gray-800"> RouteWeigh helps determine the smartest path.</span>
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mt-3">
            Build two multi-stop scenarios, rearrange the order, and let RouteWeigh do what it does best — weighing
            your routes against each other and showing you the real cost in time and money between the two.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              ✨ AI-powered
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
              🗺️ Live traffic
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              ⛽ Real gas prices
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mt-3">
            Skip the dropdowns and just tell RouteWeigh what you need in plain English — like
            <span className="italic text-gray-500"> "I'm at Mom's and need to be at work by 7am, should I go home tonight?"</span>
            {" "}Routes are calculated using Google's latest maps and live traffic data, and fuel costs are based on
            current gas prices in your area — so your numbers are always real, never guesswork.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-body mb-4">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />

            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
              className="text-xs text-muted hover:text-body transition-colors"
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Guest option */}
        <div className="mt-4 text-center">
          <button
            onClick={onGuest}
            className="text-sm text-muted hover:text-body transition-colors underline underline-offset-2"
          >
            Continue as Guest
          </button>
          <p className="text-[10px] text-dim mt-1">
            Data saved locally only — won't sync across devices
          </p>
        </div>
      </div>
    </div>
  );
}
