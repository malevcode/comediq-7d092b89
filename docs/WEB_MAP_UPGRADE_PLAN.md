# Web map upgrade: make it look like the Partiful map

Goal: the mic map and the show map should look like a poster wall, not a dot
chart. Reference: Partiful's New York map (dark navy water, glowing streets,
rounded-square flyer pins, count bubbles, a big city title, an "Anytime" pill).

## What we have today (checked in the repo)

- `src/components/map/OpenMicsMapRefactored.tsx` (698 lines): Mapbox GL, stock
  `mapbox://styles/mapbox/streets-v12` (light) and `dark-v11`, plain circle layers
  from the `open-mics` source, a white popup with HTML.
- `src/components/map/AudienceShowsMap.tsx` (393 lines): same stock styles, but it
  already has clustering (`clusterRadius: 48`, `clusterMaxZoom: 13`).
- Both read stored `latitude` and `longitude` (no browser geocoding, keep it that way).
- Mics have `cover_image_url`; the new show form saves `image_url` on shows.

## What makes the Partiful map look good

1. **A custom basemap.** Deep navy land and water, brighter blue streets, muted
   green parks, almost no labels. Nothing competes with the pins.
2. **Pins are the content.** Each pin is a rounded-square thumbnail with a thin
   white edge and a soft shadow. At low zoom they overlap on purpose and read as a wall.
3. **Count bubbles** for groups ("2", "3", "4"), glowing blue dots for items
   without art.
4. **One big title** for the city, a single time filter pill, a locate button.
   Little else on screen.

## Plan (each phase is its own small PR, KISS)

1. **Basemap style.** Make one custom style in Mapbox Studio (start from
   `dark-v11`, recolor land, water, roads, parks, hide most labels). Put its URL in
   one constant shared by both maps. Light mode can keep a matching cream version.
   Needs Adam: open Mapbox Studio, or send me the style URL once it exists.
2. **Image pins.** Replace the circle layers with markers that draw the mic's
   `cover_image_url` (shows: `image_url`) as a rounded square, 44px, white edge,
   shadow. Fallback when there is no art: a colored square with the venue initials.
   Selected pin grows and moves to the front. Use `map.loadImage`/`addImage` with a
   symbol layer so 500 pins stay fast; HTML markers only for the selected one.
3. **Clustering for mics.** Copy the show map's clustering. Bubble shows the count,
   tap zooms in. Share one cluster style between both maps.
4. **Header and filters.** A big city title at the top ("NEW YORK") and one pill row:
   Day (Today, Tomorrow, a weekday), Free, Sign-up. Reuse the existing filter state
   and `micKnownToRunOn` so bi-weekly mics only show on their real nights.
5. **Pin sheet instead of popup.** Tapping a pin opens a bottom card (name, venue,
   time, price, Sign up, Directions) in place of the white HTML popup.
6. **Polish.** Smooth fly-to on select, fit bounds to filtered results, locate
   button restyled to match.

## Order and cost

Phases 1 and 2 give 80 percent of the look. Do them first, as separate PRs.
Phase 1 is mostly design work in Mapbox Studio, with a one-line code change.

## Open questions for Adam

- How many mics have a `cover_image_url`? If it is a small share, pins will mostly
  be initials, and phase 2 should also pull the venue Instagram photo.
- Do shows and mics live on one map, or stay separate (Perform vs Laugh)? Default:
  stay separate, same look.
