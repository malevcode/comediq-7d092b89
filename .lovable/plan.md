

# Fix Overflow, Alignment, and Polish Issues

## Problems Identified

1. **Pricing cards overflow on mobile** -- `p-8` padding is too large for a 2-col mobile grid, causing text like "$0/month" and "$29/month" to clip. Buttons are too small and misaligned.
2. **Features "Soon" badge causes horizontal scroll** -- The `flex items-center gap-2` layout with the badge overflows its column, creating a right-scroll on the entire page.
3. **Waitlist form Row 3 misalignment** -- The Select dropdown height doesn't match the Input heights, creating visual inconsistency.
4. **Page-level horizontal overflow** -- Content exceeding viewport width causes a horizontal scrollbar.

## Changes

### 1. Fix page-level horizontal overflow
**File: `src/pages/Index.tsx`**

- Add `overflow-x-hidden` to the outer container to prevent any child from causing horizontal scroll.

### 2. Fix Pricing cards -- reduce padding, shrink text, fix buttons
**File: `src/components/Pricing.tsx`**

- Reduce card padding from `p-8` to `p-3 sm:p-6`
- Shrink price text from `text-3xl` to `text-lg sm:text-2xl`
- Shrink subtitle text and add `text-xs sm:text-sm`
- Shrink feature list items to `text-xs sm:text-sm` with tighter spacing (`space-y-1.5`)
- Reduce checkmark margin from `mr-3` to `mr-1.5`
- Shrink pill badges to `px-2 py-1 text-xs`
- Make buttons `text-xs sm:text-sm px-2 sm:px-6 py-2` so they fit within the card
- Reduce section heading from `text-4xl md:text-5xl` to `text-2xl md:text-3xl`
- Reduce section subtitle to `text-sm sm:text-lg`
- Reduce heading `mb-6` to `mb-2` and `mb-8` to `mb-4`

### 3. Fix Features "Soon" badge overflow
**File: `src/components/Features.tsx`**

- Change the title+badge row from `flex items-center gap-2` to `flex items-center gap-1 flex-wrap` so the badge wraps to the next line on narrow screens instead of overflowing
- Reduce feature title from `text-sm` to `text-xs sm:text-sm`
- Reduce description to `text-[10px] sm:text-xs`
- Reduce icon/emoji gap from `gap-3` to `gap-2`
- Reduce heading from `text-xl md:text-2xl` to `text-base md:text-xl`

### 4. Fix Waitlist form alignment
**File: `src/components/WaitlistForm.tsx`**

- Add `h-10` to the SelectTrigger to match Input height
- Ensure all three Row 3 items have consistent label sizing with `text-xs sm:text-sm` and truncation via `truncate` on labels

---

## Technical Details

### Files to Edit

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add `overflow-x-hidden` to prevent horizontal scroll |
| `src/components/Pricing.tsx` | Reduce all padding, font sizes, badge sizes, button sizes for mobile |
| `src/components/Features.tsx` | Add `flex-wrap` to title+badge row; reduce font sizes and gaps |
| `src/components/WaitlistForm.tsx` | Fix SelectTrigger height to match inputs; truncate long labels |

### No new files or database changes needed.

