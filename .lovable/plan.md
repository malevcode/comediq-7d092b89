

## Fixes for Map View Issues

### 1. DateToggle visibility — overlay on map
The `DateToggle` is `fixed top-[80px]` which collides with the marquee banner. Move it to float directly on the map instead, positioned as an overlay with proper z-index. Remove the fixed positioning and background bar — just place it as an absolute-positioned element inside the map container area.

**File: `src/pages/OpenMics.tsx` (~line 637)**
- Remove the fixed `div` wrapper for DateToggle
- Place DateToggle as an absolute overlay inside the map's `pt-[120px]` container, e.g. `absolute top-2 left-1/2 -translate-x-1/2 z-20`
- Reduce or remove `pt-[120px]` on the map wrapper since the toggle is now overlaid

### 2. Map centering on Dutch Kills
Two issues:
- **`NYC_CENTER` is wrong**: `[-73.935, 40.730]` is Dutch Kills/Astoria. Should be `[-73.985, 40.748]` (Midtown Manhattan) as the fallback.
- **Location only works for logged-in users**: `useUserLocation` returns `null` when not logged in. This is by design (privacy policy), so just fixing the fallback center is the main fix.
- **Race condition**: The map initializes with `useEffect([], [])` (empty deps) using `userLocation` from the closure, but `userLocation` may still be `null` at init time. The separate `flyTo` effect handles the update, so this is fine — just need the correct fallback.

**File: `src/components/map/MapLibreMap.tsx` (line 16)**
- Change `NYC_CENTER` from `[-73.935, 40.730]` to `[-73.985, 40.748]`

### 3. Drawer not in chronological order
The drawer receives mics from `mapLibreVisibleMics` (set by the map's `onVisibleMicsChange`) which has no sort order. Sort mics by start time inside `MapLibreDrawer` before rendering.

**File: `src/components/map/MapLibreDrawer.tsx`**
- Import `parseTimeToMinutes` from `./MapUtils`
- Sort `mics` by `parseTimeToMinutes(mic.startTime)` before mapping over them in the render

### 4. Show mic names, not venue names
Line 150 in `MapLibreDrawer.tsx` currently shows `{mic.venueName || mic.openMic}`. Should show `{mic.openMic}` (the mic name).

**File: `src/components/map/MapLibreDrawer.tsx` (line 150)**
- Change to `{mic.openMic}`

### 5. Transit schedule / live subway times
The MTA provides a real-time GTFS feed (General Transit Feed Specification) via their API. It's feasible but non-trivial:
- **MTA GTFS-RT API** is free, returns protobuf data for real-time arrivals
- Would need a Supabase Edge Function to proxy/parse the protobuf feed
- Need to map each venue to its nearest subway station(s)
- Display estimated travel time from user's location to venue

This is a significant feature (multi-day effort). Recommend parking it as a future milestone and focusing on the immediate fixes first.

### Summary of file changes
| File | Change |
|------|--------|
| `src/pages/OpenMics.tsx` | Move DateToggle to map overlay, reduce top padding |
| `src/components/map/MapLibreMap.tsx` | Fix `NYC_CENTER` coords to Midtown Manhattan |
| `src/components/map/MapLibreDrawer.tsx` | Sort mics chronologically, show `openMic` not `venueName` |

