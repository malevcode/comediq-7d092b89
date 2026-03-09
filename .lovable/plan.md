

## Plan: Comediq-Styled Map Markers & UI Cleanup

### 1. Custom Comediq Pin Shape for Markers
Replace the pill-style markers with a location pin shape resembling the Comediq Q logo (rounded top with pointed tail at bottom). The pin will contain the time text inside.

**File: `src/index.css`**
- Replace `.maplibre-mic-pill` styles with a new `.maplibre-mic-pin` class using CSS to create a teardrop/pin shape:
  - Rounded rectangle top with `::after` pseudo-element for the pointed tail
  - Comediq Blue background with cream text
  - Same hover/live pulse animations

### 2. Time Format — Drop "p" Suffix
Since comedy mics are nighttime events, PM is assumed. Only show "a" suffix for AM times.

**File: `src/components/map/MapUtils.ts`**
- Update `formatTimeShort()` to:
  - Return `6` instead of `6p` for PM times
  - Return `11a` for AM times (keep the "a")

### 3. Remove "Transit Schedule" Text
The drawer header shows "Transit Schedule" but that feature is a future milestone.

**File: `src/components/map/MapLibreDrawer.tsx`**
- Remove the `<span>Transit Schedule</span>` from line 124
- Keep just the mic count

### 4. Update Map Component
**File: `src/components/map/MapLibreMap.tsx`**
- Change marker element class from `maplibre-mic-pill` to `maplibre-mic-pin`

### Files to Modify
| File | Change |
|------|--------|
| `src/index.css` | New `.maplibre-mic-pin` CSS for teardrop pin shape |
| `src/components/map/MapUtils.ts` | `formatTimeShort()` — omit "p", keep "a" |
| `src/components/map/MapLibreDrawer.tsx` | Remove "Transit Schedule" header text |
| `src/components/map/MapLibreMap.tsx` | Use new pin class name |

