# RouteWeigh — Product Audit & Implementation Roadmap
### Generated: April 5, 2026

---

## Executive Summary

RouteWeigh is a PWA that compares two multi-stop driving scenarios side-by-side, showing the real cost in time, fuel, and tolls. It occupies a **unique niche** — no existing tool lets you compare two fundamentally different multi-stop driving plans. Every competitor optimizes ONE trip. RouteWeigh answers "WHICH trip?"

**Current Status: ~70% complete, ~80% working (for features that exist)**

---

## Competitive Positioning

### RouteWeigh's Unique Differentiators (no competitor has these)
- **A/B scenario comparison** with different stops/destinations
- **AI scenario builder** from natural language ("Should I go home tonight?")
- **Pillow Premium** (cost of not sleeping at home)
- **WeighStation verdict** with delta breakdown and winner declaration
- **Clone + modify** scenarios for quick "what if" exploration

### Competitors Analyzed
1. **Google Maps** — route alternatives, real-time traffic, fuel-efficient routes
2. **Waze** — crowd-sourced gas prices, hazard alerts, planned drives
3. **Roadtrippers** — POI discovery, trip sharing, itinerary planning
4. **Furkot** — multi-day planning, budget tracking, multiple vehicles
5. **GasBuddy** — real crowd-sourced gas prices, cheapest station finder
6. **AAA TripTik** — curated POIs, road conditions, member discounts
7. **TollGuru** — exact toll-by-toll breakdown, transponder rates, vehicle class tolls
8. **Rome2Rio** — multi-modal comparison (drive vs fly vs train), CO2 emissions
9. **TollSmart** — toll point mapping, cash vs transponder rates

### Where RouteWeigh Falls Short
- Fuel prices are hardcoded (every competitor uses real prices)
- No share/export results
- No arrival time estimates
- No "avoid tolls" toggle
- No trip history UI (saves but can't view)
- No route alternatives per leg
- Silent sync failures

---

## Critical Bugs

### 1. Pillow Premium Logic Bug
**File:** `costEngine.js:33-38`
**Issue:** `scenarioA.stops[...] === "home"` — compares stops as strings, but stops are now objects `{type: "weighpoint", id: "home_abc"}`. Never triggers for new users.
**Impact:** Users never get pillow premium adjustment.

### 2. AI Scenario Builder Doesn't Validate WeighPoints
**File:** `aiParser.js`, `AiAssistant.jsx`
**Issue:** Claude can return WeighPoint IDs that don't exist → "Origin not found" crash.

### 3. Map Shows No User WeighPoints
**File:** `RouteMap.jsx:81`
**Issue:** Reads from `DEFAULT_WEIGHPOINTS` (empty array), not user's actual saved WeighPoints.

### 4. Map Center Hardcoded to Ohio
**File:** `RouteMap.jsx:113`
**Issue:** `{ lat: 41.22, lng: -81.7 }` — useless for non-Ohio users.

### 5. API Key Exposed
**Issue:** HERE API key in `.env` committed to public repo. Anthropic API fallback could expose key in browser.

### 6. Fuel Prices Are Fake
**File:** `useFuelPrice.js`
**Issue:** UI suggests real-time fetch but returns hardcoded national averages.

---

## Gap Analysis

| Category | Gap | Severity |
|----------|-----|----------|
| **Data Accuracy** | Fuel prices are fake (hardcoded) | 🔴 Critical |
| **Data Accuracy** | Toll detection inconsistent, silent failures | 🟠 High |
| **Core Bug** | Pillow Premium broken for new users | 🔴 Critical |
| **Core Bug** | AI returns invalid WeighPoint IDs → crash | 🔴 Critical |
| **Core Bug** | Map shows no user WeighPoints, center hardcoded | 🟠 High |
| **UX** | No arrival time estimates per stop | 🟠 High |
| **UX** | No share/export results | 🟠 High |
| **UX** | No "avoid tolls" route preference | 🟡 Medium |
| **UX** | No trip history view (saves but can't view) | 🟡 Medium |
| **UX** | No round-trip toggle | 🟡 Medium |
| **Intelligence** | No time-value-of-money calculation | 🟡 Medium |
| **Intelligence** | No CO2 emissions comparison | 🟢 Low |
| **Intelligence** | No departure time sensitivity analysis | 🟢 Low |
| **Security** | HERE API key exposed in repo | 🔴 Critical |
| **Mobile** | Some layout overflow on small screens | 🟡 Medium |

---

## Phased Implementation Plan

### Phase 1: Critical Bugs & Data Integrity
*Fix before sharing with anyone else*

| # | Item | What | Why | Effort |
|---|------|------|-----|--------|
| 1 | Fix Pillow Premium | Update `costEngine.applyPillowPremium()` to handle object-format stops | Broken for all new users | Small |
| 2 | Fix AI validation | Validate WeighPoint IDs returned by Claude before dispatching | Prevents crashes | Small |
| 3 | Fix map WeighPoints | Show user's actual WeighPoints on map, dynamic center | Map is useless without this | Small |
| 4 | Remove exposed API keys | Remove HERE key from client, remove Anthropic fallback | Security vulnerability | Small |
| 5 | Add sync error notifications | Show toast when cloud sync fails | Users lose data silently | Small |

**Estimated effort: 1-2 hours**

---

### Phase 2: Data Accuracy (Competitive Parity)
*Makes cost calculations credible*

| # | Item | What | Why | Effort |
|---|------|------|-----|--------|
| 6 | Real fuel prices | Integrate EIA API (free, government data) for regional prices by grade | Biggest credibility gap | Medium |
| 7 | Arrival time display | Show "Arrive at 9:47 PM" for each stop based on departure + cumulative time | Every competitor has this | Small |
| 8 | Avoid tolls toggle | Add `avoidTolls` option to Directions API request | Common user question | Small |
| 9 | Toll detail improvement | Show toll amount per leg (not just total), warn when toll data unavailable | Users need transparency | Small |

**Estimated effort: 3-4 hours**

---

### Phase 3: Differentiators (Best-in-Class)
*Features no competitor has*

| # | Item | What | Why | Effort |
|---|------|------|-----|--------|
| 10 | Share results | Generate shareable link or screenshot of WeighStation verdict | Drives word-of-mouth growth | Medium |
| 11 | Time value of money | Let users set hourly rate, factor into comparison | Natural evolution of Pillow Premium | Small |
| 12 | CO2 emissions | Show lbs CO2 per scenario (404g/mile EPA average) | Environmental angle, easy calc | Small |
| 13 | Trip history view | UI to browse/re-run saved comparisons | Data exists, no way to see it | Medium |
| 14 | Departure time sensitivity | Run same comparison at 3 departure times, show how results change | Unique insight, high value | Medium |

**Estimated effort: 4-6 hours**

---

### Phase 4: Polish & Growth
*Post-launch improvements*

| # | Item | What | Why | Effort |
|---|------|------|-----|--------|
| 15 | Multiple vehicle profiles | Save 2-3 vehicles, quick switch | Supports "take the truck or sedan?" | Medium |
| 16 | Round-trip toggle | One-tap add return leg to scenario | Common need | Small |
| 17 | Route alternatives per leg | Show 2-3 route options for each leg | Matches Google Maps | Medium |
| 18 | Wear-and-tear cost | Configurable $/mile for depreciation, maintenance | More complete cost picture | Small |
| 19 | Password reset flow | Supabase password reset email | Table stakes for auth | Small |
| 20 | Accessibility audit | ARIA labels, keyboard nav, focus management | Right thing to do | Medium |

**Estimated effort: 6-8 hours**

---

## Feature Ideas (Future / Stretch)

- **Calendar integration** — pull departure constraints from Google Calendar
- **Native mobile app** — wrap PWA in Capacitor for push notifications
- **AI follow-up questions** — "If you left 30 min earlier, you'd save $2.40"
- **Gas station finder** — show cheapest gas along the winning route
- **Weather integration** — factor in weather delays or safety concerns
- **Recurring comparison templates** — save common comparisons, re-run with one tap
- **Driving hour limits** — alert when a scenario exceeds safe driving duration
- **Multi-modal comparison** — driving vs. flying for longer trips

---

## Technical Debt

- `routeRules.js` — always returns empty/false, effectively dead code
- `api/tolls.js` — serverless function returns 403, bypassed by client-side call
- `DEFAULT_WEIGHPOINTS` in `weighpoints.js` — empty array, imported but unused
- `VITE_HERE_API_KEY` — in `.env` but never used in code
- Multiple hardcoded values (map center, fuel prices, Ohio coordinates)
- No TypeScript (all JSX/JS)
- No test coverage

---

## Hardcoded Values to Address

| Value | Location | Purpose |
|-------|----------|---------|
| `41.22, -81.7` | RouteMap.jsx | Map center (Ohio) |
| `41.1137, -81.4785` | ControlBar.jsx | Fallback geocode location |
| `3.45, 3.85, 4.15, 3.15, 2.85, 3.75` | useFuelPrice.js | Fuel prices by grade |
| `claude-sonnet-4-20250514` | aiParser.js | AI model |
| `50` | App.jsx | Max history entries |
| `1000ms` | AppContext.jsx | Sync debounce |

---

## Notes

- **Approach:** Phase by phase, get approval before proceeding
- **Priority:** Intelligence > Data accuracy > UX polish > Cosmetics
- **Rule:** "A thinking app that looks average still changes how people work. A beautiful app that doesn't think is a screensaver."
