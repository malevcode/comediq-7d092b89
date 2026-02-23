

# Fix Dashboard Card Overflow + Saved/Liked Mics Navigation

## Problem Summary

1. **Card overflow on mobile**: The 3-column stat grid (`grid-cols-3`) with `p-4` padding, icon boxes, `text-2xl` numbers, and two-word labels causes text to clip on narrow screens (visible in the screenshot with "Day Streak", "Saved Mics", "Liked Mics" barely fitting).

2. **Liked Mics card is not clickable**: The Saved Mics card links to `/saved`, but the Liked Mics card has no link at all.

3. **No Liked Mics page exists**: There is no `/liked` route or `LikedMics.tsx` page -- users have no way to view their liked mics in one place.

## Changes

### 1. Restructure Dashboard Stats (Home.tsx)

- Move **Day Streak** to a full-width prominent card at the top with larger text and a streak-fire visual
- Place **Saved Mics** and **Liked Mics** in a **2-column grid** below, giving each card more breathing room
- Both Saved and Liked cards are wrapped in `<Link>` components (to `/saved` and `/liked`)
- Reduce inner padding from `p-4` to `p-3`, number size from `text-2xl` to `text-xl`, and add `whitespace-nowrap` on labels to prevent wrapping

### 2. Create Liked Mics Page (new file: src/pages/LikedMics.tsx)

- Mirrors the existing `SavedMics.tsx` page structure
- Uses `useUserLikedMics()` hook to get liked mic identifiers (returns string array)
- Filters `useOpenMics()` data to show only liked mics
- Displays results with `OpenMicsDetailedList` component
- Shows empty state with a heart icon and "Browse Open Mics" CTA when no likes exist

### 3. Add Route (App.tsx)

- Import `LikedMics` page component
- Add `<Route path="/liked" element={<LikedMics />} />`

## Technical Details

| File | Action | Details |
|------|--------|---------|
| `src/components/Home.tsx` | Edit | Restructure stats grid: Day Streak full-width on top, Saved + Liked in 2-col row below with Links. Reduce padding/font sizes. |
| `src/pages/LikedMics.tsx` | Create | New page mirroring SavedMics.tsx, using `useUserLikedMics` and `useOpenMics` to filter and display liked mics |
| `src/App.tsx` | Edit | Add `/liked` route pointing to `LikedMics` component |

No database changes needed -- all required hooks and tables already exist.
