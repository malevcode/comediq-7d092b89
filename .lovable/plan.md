

## Fix: Map Controls Hidden Under Ad Banner

The MapLibre navigation controls (`+`/`-` zoom) and the Recenter button are positioned at `top-2` / `top-left`, which overlaps with the marquee ad banner that sits at `top-[80px]`.

Since the map container itself starts below the header+marquee (at ~107px from viewport top), the controls inside the map just need more internal top padding to clear any overlap from the banner's bottom edge.

### Changes

**1. `src/components/map/MapLibreMap.tsx`**
- Move the `NavigationControl` position from `'top-left'` to `'top-left'` but add CSS padding to the map's top-left control container via `.maplibregl-ctrl-top-left { top: 48px }` — or simply switch the control to a position that clears the banner.

**2. `src/index.css`**
- Add a rule to push MapLibre's built-in control container down:
```css
.maplibregl-ctrl-top-left {
  top: 12px !important;
}
.maplibregl-ctrl-top-right {
  top: 12px !important;
}
```

This gives the `+`/`-` buttons enough breathing room below any overlapping elements. Since the map container already accounts for the header height via `calc(100vh - 107px)`, the controls just need a small internal offset (~12px) to be fully visible and tappable.

No structural or z-index changes needed — just internal map control padding.

