
# Fix: Ad Icon Overflowing the Pill Boundary

## Problem
The Likeable Podcast icon (16x16px via `w-4 h-4`) is taller than the pill's content area. The pill uses `py-0.5` (2px top/bottom padding) with `text-xs` line height, so the 16px icon pokes out above and below.

## Solution
Two small tweaks in `src/components/MarqueeBanner.tsx`:

1. **Shrink the icon** from `w-4 h-4` (16px) to `w-3.5 h-3.5` (14px) so it better fits the text line height
2. **Add `flex-shrink-0`** to the icon so it doesn't get squished in the flex layout

This keeps the icon visible and proportional without changing the overall pill size or spacing.

## Technical Details

**File**: `src/components/MarqueeBanner.tsx`, line 24

Change the icon class from:
```
w-4 h-4 rounded-full object-cover
```
to:
```
w-3.5 h-3.5 rounded-full object-cover flex-shrink-0
```
