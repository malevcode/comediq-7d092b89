

# Transit-Style Mic List Redesign

## Overview
Rebuild the mic list from the current card-based layout into a dense, transit-schedule-inspired list with Royal Blue backgrounds, Cream text, inline expansion, and a streamlined row structure.

## Technical Details

### 1. Rewrite `OpenMicsDetailedList.tsx` — Transit Row Layout
Replace the current card component with a compact row structure:

```text
┌─────────────────────────────────────────────────────────┐
│ 6-8 PM │ Comedy Cellar │ West Village │ [+ Plan] │ [▼] │
└─────────────────────────────────────────────────────────┘
```

- **Styling**: `bg-[hsl(213,73%,40%)]` (Royal Blue) with `text-[hsl(40,33%,94%)]` (Comediq Cream)
- **Minimal padding**: `px-3 py-2`, `text-sm`, no shadows or rounded corners (or very subtle `rounded-sm`)
- **Borough indicator**: Keep left border color accent (4px)
- **Row columns**: Use flexbox with fixed-width segments:
  - Time range (compact format, e.g. "6-8 PM")
  - Venue name (truncated)
  - Neighborhood (truncated)
  - "Add to Plan" button (small, outline cream)
  - Chevron toggle (far right)

### 2. Inline Expansion Section
When row is clicked or chevron toggled, expand inline below the row:

- **Background**: Slightly lighter blue (`bg-[hsl(213,60%,50%)]`) or semi-transparent overlay
- **Content**: Sign-up instructions, cost, stage time, host info, house rules
- **6 Utility Icons** in a horizontal icon bar:
  1. **Directions** (MapPin icon → opens Apple/Google Maps)
  2. **Instagram** (link icon → opens host IG)
  3. **Share** (Send icon → native share / clipboard)
  4. **Save** (Bookmark icon → existing save logic)
  5. **Like** (Heart icon → existing like logic)
  6. **Comment** (MessageCircle → toggle comment section)
- Remove the separate `MicActionBar` component from the row; fold its functionality into the expanded section's icon bar
- Calendar buttons (Google Cal, iCal download) stay in expanded section

### 3. Map Default to Today's Mics
In `OpenMics.tsx`, the MapLibre view already uses `getFilteredMicsForDate(selectedDate)` where `selectedDate` defaults to today. This is already correct. Verify the `DateToggle` defaults to today (it does — initialized with `new Date()`).

The combined label format (`6/7:30p`) for multi-mic venues is already implemented in `MapLibreMap.tsx` lines 120-138. No changes needed.

### 4. Header / Filter Bar Overlap Fix
- `PageHeader` is already `fixed top-0 z-50`
- The list view content uses `pt-32 sm:pt-36` which should clear the header
- Ensure the search/filter bar below the header is **not fixed** (it isn't — it's in normal flow inside `max-w-7xl` container)
- If the filter bar should also be sticky, add `sticky top-[72px] z-30` to the search/filter `div` so it sticks below the header without overlapping

### Files to Modify
1. **`src/components/OpenMicsDetailedList.tsx`** — Full rewrite of `OpenMicDetailedCard` to transit row style with inline expansion containing 6 utility icons
2. **`src/index.css`** — No map pin changes needed (already small teardrop style per prior work)
3. **`src/pages/OpenMics.tsx`** — Minor: optionally make filter bar sticky below header

### Design Tokens
- Royal Blue: `hsl(213, 73%, 40%)` → `hsl(var(--comediq-blue))`
- Cream: `hsl(40, 33%, 94%)` → `hsl(var(--comediq-cream))`
- These CSS variables already exist in `index.css`

