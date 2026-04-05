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
      {/* Hero image */}
      <div className="relative w-full h-[340px] overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Highway stretching into the distance"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/50" />
        <div className="absolute top-[8%] left-0 right-0 text-center">
          <h1 className="font-extrabold text-[44px] tracking-[5px] leading-none">
            <span className="text-accent">ROUTE</span>
            <span className="text-white">WEIGH</span>
          </h1>
          <p className="text-[12px] tracking-[4px] text-white/80 uppercase mt-2">
            Know Before You Go
          </p>
        </div>

        {/* Explainer text over hero */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 pb-6">
          <p className="text-white/70 text-[14px] leading-[1.7] text-center max-w-[600px]">
            We all have multiple places to be and multiple ways to get there.
            RouteWeigh helps determine the smartest path. Build two multi-stop
            driving scenarios, rearrange the order, and let RouteWeigh do what
            it does best — <span className="font-bold text-white/90">WEIGH YOUR ROUTES</span> against
            each other — showing you the real difference in time and money between the two.
            Describe your situation in plain English and AI builds both scenarios.
            Every route uses Google's latest maps and live traffic data, with fuel
            costs pulled from current gas prices in your area. No guessing — just answers.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10 pb-12">
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
