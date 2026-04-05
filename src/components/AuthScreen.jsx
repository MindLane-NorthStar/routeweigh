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
    <div className="min-h-screen bg-sky-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-widest">
            <span className="text-accent">ROUTE</span>
            <span className="text-body">WEIGH</span>
          </h1>
          <p className="text-xs tracking-[4px] text-muted mt-1 uppercase">
            Know Before You Go
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
