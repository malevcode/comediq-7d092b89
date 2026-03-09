

## Refined Prompt for MapLibre Integration

The original prompt had several issues that likely caused errors:
1. **Missing dependency** - MapLibre GL JS isn't installed yet (only `mapbox-gl` is)
2. **Ambiguous "Switch to List" behavior** - unclear if it's a toggle or navigation
3. **No mention of the existing map infrastructure** - needs to integrate with existing patterns
4. **Points sidebar doesn't exist** - "pulse the point total in the sidebar" has no target

### Improved Prompt

```
## MapLibre Map Implementation for /open-mics

### Prerequisites
- Add `maplibre-gl` package as a dependency

### 1. Create MapLibreMap.tsx Component
Location: src/components/map/MapLibreMap.tsx

**Tile Source**: CARTO Dark Matter
URL: https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json

**Container Layout**:
- Full-width, height: calc(100vh - 107px) to account for header (80px) + marquee (27px)
- No z-index manipulation needed - just render in normal document flow

**Markers**:
- Create HTML markers (not canvas) showing start time (e.g., "6p")
- Background: hsl(213, 73%, 40%) (Royal Blue from CSS vars)
- Text: hsl(40, 33%, 94%) (Cream from CSS vars)
- Border-radius: 9999px (pill shape)
- Padding: 4px 8px
- Add pulse animation for "LIVE" mics

### 2. Create MapLibreDrawer.tsx Component
Location: src/components/map/MapLibreDrawer.tsx

**Layout**: Fixed bottom drawer, height: 40vh, draggable
**Row format**: Single-line, no gaps between items
- [Time (w-16)] | [Venue (flex-1 truncate)] | [Neighborhood (w-20)] | [Verify btn]
- Border-bottom only, hover highlight

**Verify Action**:
- Call existing RPC: supabase.rpc('verify_mic_with_points', { 
    mic_identifier, user_id_param, ip_hash_param, status_param 
  })
- On success (pointsAwarded > 0): Show toast "+2 Points" with cream background

### 3. Update OpenMics.tsx
- Add "map" as default viewMode for new MapLibre view
- Add "Switch to List" button (top-right, below header)
  - This toggles viewMode between "map" and "list"
  - NOT a navigation to a different route

### 4. Header/Nav Z-Index (already correct)
- PageHeader: z-50 (fixed, top-0)
- MarqueeBanner: z-[45] (fixed, top-[80px])
- BottomNavigation: z-50 (fixed, bottom-6)
- Map container: default stacking (no special z-index needed)
```

---

## Implementation Plan

### Files to Create
1. **src/components/map/MapLibreMap.tsx** - Main map component using CARTO Dark Matter tiles
2. **src/components/map/MapLibreDrawer.tsx** - Transit-style bottom drawer

### Files to Modify
1. **package.json** - Add `maplibre-gl` dependency
2. **src/components/map/index.ts** - Export new components
3. **src/pages/OpenMics.tsx** - Integrate MapLibre as default map view
4. **src/index.css** - Add MapLibre CSS import

### Technical Details

**CARTO Dark Matter Tiles** (free, no API key):
```typescript
const map = new maplibregl.Map({
  container: containerRef.current,
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-73.935, 40.730],
  zoom: 10
});
```

**Time Marker Pill** (HTML overlay):
```typescript
const formatTimeShort = (time: string) => {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time;
  const hour = parseInt(match[1]);
  const period = match[3].toLowerCase().charAt(0);
  return match[2] === '00' ? `${hour}${period}` : `${hour}:${match[2]}${period}`;
};
```

**Verify with Points RPC** (already exists):
```typescript
const { data } = await supabase.rpc('verify_mic_with_points', {
  mic_identifier: mic.uniqueIdentifier,
  user_id_param: user?.id || null,
  ip_hash_param: await hashIP(),
  status_param: 'verified'
});
if (data?.pointsAwarded > 0) {
  toast({ title: "+2 Points!", className: "bg-[#f5f0e6] text-[#1a5fb4]" });
}
```

### Layout Stack (top to bottom)
```
┌─────────────────────────────────┐ z-50
│  PageHeader (sticky, 80px)      │
├─────────────────────────────────┤ z-45
│  MarqueeBanner (fixed, 27px)    │
├─────────────────────────────────┤ normal
│                                 │
│  MapLibre Container             │
│  (full remaining height)        │
│                                 │
│  ┌─────────────────────────┐    │
│  │ MapLibreDrawer (40vh)   │    │ z-10 (within map)
│  └─────────────────────────┘    │
├─────────────────────────────────┤ z-50
│  BottomNavigation (fixed)       │
└─────────────────────────────────┘
```

