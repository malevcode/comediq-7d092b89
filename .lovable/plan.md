

## Fix Top Mics Page - Compact Mobile Layout

### Problems
1. Title "🔥 Top Mics This Week" and subtitle are rendered inside the fixed PageHeader nav bar, bloating the header
2. Cards are too large with excessive padding and spacing -- 5 cards can't fit on one mobile screen
3. SponsorCard adds extra scroll below the list

### Changes

**File: `src/pages/TopMics.tsx`** -- Full rewrite of the page layout:

1. **Strip title/subtitle from PageHeader** -- render `<PageHeader />` with no props so we get the standard clean nav bar (hamburger + logo + sign in)
2. **Inline a compact title** -- small `h1` with the fire emoji + "Top Mics This Week" and a one-line subtitle, using tight spacing (`text-lg`, `mt-1 text-xs`)
3. **Shrink cards** -- reduce padding from `p-4` to `p-2.5`, rank circle from `h-10 w-10` to `h-8 w-8 text-sm`, metadata to `text-[11px]`, gap from `gap-4` to `gap-3`, list spacing from `space-y-3` to `space-y-2`
4. **Move SponsorCard inline** -- reduce top margin from `mt-6` to `mt-3` so it tucks in tighter
5. **Reduce container bottom padding** from `pb-24` to `pb-20`

This makes all 5 cards + sponsor fit on a single mobile viewport (~777px) without scrolling.

