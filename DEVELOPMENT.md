# RouteWeigh — Development Setup Guide

## Prerequisites
- **Node.js** 18+ (`node --version`)
- **npm** 9+ (`npm --version`)
- **Git** (`git --version`)
- **VS Code** with Claude Code extension (recommended)

---

## Quick Start (from scratch or after cleanup)

### 1. Clone the repo (if starting fresh)
```bash
cd C:\Dev
git clone https://github.com/MindLane-NorthStar/routeweigh.git RouteWeigh
cd RouteWeigh
```

### 2. Install dependencies
```bash
cd C:\Dev\RouteWeigh
npm install
```
This recreates the `node_modules` folder (~100 MB). Takes about 30 seconds.

### 3. Set up environment variables
Create a `.env` file in the project root (if not present):
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_ANTHROPIC_API_KEY=
VITE_HERE_API_KEY=your_here_api_key
VITE_SUPABASE_URL=https://szqrywjdgwwymceusqem.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
**Note:** `.env` is gitignored — you need to recreate it manually after a fresh clone. Your API keys are stored in `C:\Dev\APIs.env` as backup.

### 4. Run the dev server
```bash
npm run dev
```
Opens at **http://localhost:5173**

### 5. Build for production
```bash
npm run build
```
Output goes to `dist/` folder.

---

## Project Locations

| What | Path | GitHub |
|------|------|--------|
| **RouteWeigh** | `C:\Dev\RouteWeigh` | github.com/MindLane-NorthStar/routeweigh |
| **MindLane** | `C:\Dev\MindLane\mindlane-app` | github.com/MindLane-NorthStar/MindLane-app |

---

## Deployment (Vercel)

RouteWeigh auto-deploys to **routeweigh.vercel.app** on every `git push origin main`.

### Vercel Environment Variables (set in dashboard):
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_HERE_API_KEY`
- `GOOGLE_MAPS_API_KEY` (no VITE_ prefix — for serverless functions)
- `ANTHROPIC_API_KEY` (no VITE_ prefix — for AI serverless function)

### Manual Redeploy
Vercel dashboard → RouteWeigh → Deployments → ... → Redeploy

---

## External Services

### Google Cloud Console (console.cloud.google.com)
**Project:** RouteWeigh
**APIs enabled:**
- Maps JavaScript API
- Directions API
- Geocoding API
- Places API (legacy)
- Places API (New)
- Routes API

**API Key restrictions:**
- HTTP referrers: `localhost:*`, `routeweigh.vercel.app/*`
- Restricted to the APIs above

### Supabase (supabase.com/dashboard)
**Project:** RouteWeigh
**Tables:** profiles, vehicles, weighpoints, user_settings, comparisons
**Auth:** Email/password, email confirmation disabled

### HERE Developer (platform.here.com)
**Project:** RouteWeigh
**Service:** Fuel Prices (linked but needs OAuth for full access)

### Anthropic (console.anthropic.com)
**Used for:** AI Scenario Builder (Claude Sonnet)

---

## Freeing Up Disk Space

### Safe to delete (can recreate with `npm install`):
```bash
# Delete node_modules (recreate with npm install)
rd /s /q "C:\Dev\RouteWeigh\node_modules"
rd /s /q "C:\Dev\MindLane\mindlane-app\node_modules"

# Delete old broken-path copy
rd /s /q "C:\Users\jlull\%USERPROFILE%\routeweigh"

# Delete OneDrive MindLane node_modules
rd /s /q "C:\Users\jlull\OneDrive\Documents\Claude\Projects\MindLane\mindlane-app\node_modules"
```

### Space savings:
| Location | Size | Safe to delete? |
|----------|------|----------------|
| `C:\Dev\RouteWeigh\node_modules` | ~98 MB | ✅ Yes — `npm install` restores |
| `C:\Dev\MindLane\mindlane-app\node_modules` | ~307 MB | ✅ Yes — `npm install` restores |
| `C:\Users\jlull\%USERPROFILE%\routeweigh` | ~100 MB | ✅ Yes — old copy, real project is in C:\Dev |
| `C:\Users\jlull\OneDrive\...\mindlane-app\node_modules` | ~357 MB | ✅ Yes — `npm install` restores |
| **Total recoverable** | **~862 MB** | |

### DO NOT DELETE:
- `C:\Dev\RouteWeigh\` (except node_modules)
- `C:\Dev\MindLane\` (except node_modules)
- `C:\Dev\APIs.env` (your API key backup)
- `.env` files (contain your API keys)

---

## Resuming Development After Cleanup

### RouteWeigh:
```bash
cd C:\Dev\RouteWeigh
npm install        # Recreates node_modules (~30 sec)
npm run dev        # Starts dev server at localhost:5173
```

### MindLane:
```bash
cd C:\Dev\MindLane\mindlane-app
npm install        # Recreates node_modules (~60 sec)
npx expo start    # Starts Expo dev server
```

---

## Current Roadmap Status

See `ROADMAP.md` for the full product audit and phased implementation plan.

**Next up:** Phase 1 — Critical Bugs & Data Integrity (5 items, ~1-2 hours)
