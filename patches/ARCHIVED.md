# Archived: 0001-Storytime-style-map-bubbles-sized-by-importance-over.patch

Archived 2026-11-22. Do not apply.

This patch is an earlier take on the map bubbles. It no longer matches the
approved design in `docs/design/storytime-redesign-v3/`:

- It draws **one bubble per mic, stacked** at a venue. The v3 spec's map rules
  call for **one round bubble per venue**, sized by importance.
- It shows **every mic at the venue, including ones that already ended**. The
  v3 spec hides ended events: the preview lists only what has not ended,
  "Happening now" first, then "Next".

The live behaviour now comes from `src/utils/venues.ts` (grouping and the
now/next/ended maths, shared with the mobile app) and the bubble layers in
`src/components/map/OpenMicsMapRefactored.tsx`.

The file is kept for history, per the project rule that nothing is deleted.
