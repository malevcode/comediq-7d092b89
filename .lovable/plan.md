

# Make Ad Pills Larger and More Visible (TrustMRR Style)

## What Changes

Update the ad pill styling in `src/components/MarqueeBanner.tsx` to match the reference:

**Current** -> **New**:
- Icon: `w-3.5 h-3.5` (14px) -> `w-5 h-5` (20px)
- Text: `text-xs` -> `text-sm`
- Padding: `px-4 py-0.5` -> `px-5 py-1.5`
- Gap: `gap-1.5` -> `gap-2`
- Border: none -> subtle `border border-[#1a5fb4]/15`
- Icon shape: keep `rounded-full` but remove cropping with `rounded-md` for square logos

Also increase the banner height from `h-7` to `h-10` on both top and bottom banners to accommodate the larger pills, and adjust the top offset and bottom nav positioning accordingly.

## Technical Details

**File**: `src/components/MarqueeBanner.tsx`

1. Update `className` in `AdItem` from:
   ```
   px-4 py-0.5 mx-3 text-xs gap-1.5
   ```
   to:
   ```
   px-5 py-1.5 mx-3 text-sm gap-2 border border-[#1a5fb4]/15
   ```

2. Update icon classes from:
   ```
   w-3.5 h-3.5 rounded-full
   ```
   to:
   ```
   w-5 h-5 rounded-md
   ```

3. Update both banner container divs from `h-7` to `h-10`

4. Update the top banner's `top-[80px]` positioning -- this stays the same but downstream components referencing the banner height may need the offset bumped from `107px` to `120px` (will check and update as needed)

