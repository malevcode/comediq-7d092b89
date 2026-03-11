

## Problems Identified

1. **Cryptic grouped labels** ("4 +3", "5 +2") — users can't tell what venue or which mics these represent. Grouping mics by venue into one bubble was a bad UX call.
2. **Markers drift on zoom** — the marker anchor defaults to center of the element, but the visual pointer (the `▽` arrow) is at the bottom. So when zooming, markers appear to shift away from their actual location.
3. **Clicking a bubble doesn't connect to the drawer** — tapping a map bubble opens the detail modal but doesn't scroll to or highlight the mic in the drawer list below.

## Plan

### 1. One bubble per mic (stop venue grouping)
**File: `src/components/map/MapLibreMap.tsx`**

Remove the `locationGroups` grouping logic entirely. Instead, iterate over all geocoded mics individually. Each marker shows just the mic's time (e.g., `7`, `6:30`). This eliminates all confusing "+N" labels.

```
// Before: group by venue, build combined labels
// After: one marker per mic, label = formatTimeShort(mic.startTime)
```

### 2. Fix marker anchor point
**File: `src/components/map/MapLibreMap.tsx`**

Set the marker `anchor` to `'bottom'` so the tip of the arrow CSS pseudo-element sits exactly on the mic's coordinates. This prevents visual drift on zoom.

```typescript
new maplibregl.Marker({ element: el, anchor: 'bottom' })
```

### 3. Connect map bubble tap → drawer highlight + scroll
**Files: `src/components/map/MapLibreMap.tsx`, `src/components/map/MapLibreDrawer.tsx`, `src/pages/OpenMics.tsx`**

- Add a `selectedMicId` prop to `MapLibreDrawer`
- When a map bubble is clicked, pass that mic's ID to the drawer
- In the drawer, auto-scroll to that mic's row and highlight it with a distinct background
- The drawer row click still opens the detail modal as before

### 4. Remove "Transit Schedule" text
**File: `src/components/map/MapLibreDrawer.tsx`** (line 124)

Remove the `<span>Transit Schedule</span>` — this feature isn't ready yet.

### Files to modify

| File | Change |
|------|--------|
| `src/components/map/MapLibreMap.tsx` | Remove venue grouping, one marker per mic, set `anchor: 'bottom'` |
| `src/components/map/MapLibreDrawer.tsx` | Add `selectedMicId` prop, auto-scroll + highlight selected row, remove "Transit Schedule" |
| `src/pages/OpenMics.tsx` | Track `selectedMicId` state, pass to drawer when map bubble tapped |

