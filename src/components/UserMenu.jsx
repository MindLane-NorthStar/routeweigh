import { useState } from "react";

export default function UserMenu({ user, isGuest, onSignOut, onUpgrade }) {
  const [open, setOpen] = useState(false);

  if (isGuest) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Guest</span>
        <button
          onClick={onUpgrade}
          className="text-xs text-accent hover:text-accent/80 font-medium underline underline-offset-2"
        >
          Create Account
        </button>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
          {displayName[0]?.toUpperCase()}
        </span>
        <span className="hidden sm:inline text-xs">{displayName}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-body">{displayName}</p>
              <p className="text-[10px] text-dim truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { onSignOut(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
