

# Hero Layout: Mascot on Top + Header Subtitle Update

## Changes

### 1. Flip Hero to mascot-on-top, vertical layout
**File: `src/components/Hero.tsx`**

- Replace the current side-by-side grid with a single centered column layout
- Order: "NYC's Comedy Platform" label -> mascot image (centered, prominent) -> "Comediq" heading -> tagline -> CTA buttons
- The mascot becomes the visual focal point, sized generously (w-40 sm:w-56 lg:w-72)
- Text and CTAs sit below, centered, with large readable font sizes
- Remove the side-by-side grid entirely

### 2. Update header subtitle
**File: `src/pages/Index.tsx`**

- Change `subtitle="Your comedy journey starts here"` to `subtitle="Comedy Starts Here"`

---

## Technical Details

| File | Changes |
|------|---------|
| `src/components/Hero.tsx` | Replace grid layout with vertical stack: NYC label -> mascot -> heading -> tagline -> CTAs, all centered |
| `src/pages/Index.tsx` | Change PageHeader subtitle to "Comedy Starts Here" |

No new files or database changes needed.

