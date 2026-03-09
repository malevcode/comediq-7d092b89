

## Three Fixes for the Map View

### 1. Increase control padding (top nav still hidden)
Bump `.maplibregl-ctrl-top-left` / `.maplibregl-ctrl-top-right` from `12px` to `48px` in `src/index.css`. This gives enough clearance below the DateToggle and any banner overlap.

### 2. Lower the default drawer height
In `src/components/map/MapLibreDrawer.tsx`, change the initial `drawerHeight` state from `40` to `25` (vh). This gives ~15% more visible map area by default while still showing ~4-5 mic rows.

### 3. Center map on user's actual location
The map currently hardcodes `[-73.935, 40.730]` (Dutch Kills, Astoria) as center. Fix:

- **`MapLibreMap.tsx`**: Accept an optional `userLocation` prop. After the map initializes, if `userLocation` is provided, call `map.setCenter(userLocation)`.
- **`OpenMics.tsx`**: Import the existing `useUserLocation` hook and pass `userLocation` to `MapLibreMap`. The hook already handles caching, auth gating, and background refresh — no new logic needed.
- Keep `NYC_CENTER` as the fallback for logged-out or denied-permission users.

### Files to modify
- `src/index.css` — bump control top offset to 48px
- `src/components/map/MapLibreDrawer.tsx` — default height 40→25vh
- `src/components/map/MapLibreMap.tsx` — add `userLocation` prop, fly to it on load
- `src/pages/OpenMics.tsx` — wire `useUserLocation` into `MapLibreMap`

