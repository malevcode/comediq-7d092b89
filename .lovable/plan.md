

## Problem

When multiple mics share a venue, all their times get joined with `/` (e.g., `"5/6/7:30/9"`), creating extremely wide bubbles that stretch across the map. The `white-space: nowrap` CSS prevents wrapping, so the bubble just grows horizontally.

## Fix

Two changes to keep markers compact:

### 1. Cap multi-mic labels (MapLibreMap.tsx)
Instead of showing all times joined (`5/6/7:30/9`), show the count when there are 3+ mics at a venue:
- **1 mic**: show the time (e.g., `7`)
- **2 mics**: show both (e.g., `6/7:30`)
- **3+ mics**: show first time + count (e.g., `4 +3`)

This keeps every marker roughly the same compact width.

### 2. Constrain bubble width (index.css)
Add `max-width` and `overflow: hidden` / `text-overflow: ellipsis` as a safety net so even 2-mic labels can't blow out.

### Files
| File | Change |
|------|--------|
| `src/components/map/MapLibreMap.tsx` | Cap label to 2 times max, show `+N` for extras |
| `src/index.css` | Add `max-width: 72px` safety on `.maplibre-mic-pill` |

