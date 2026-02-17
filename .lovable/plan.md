

# Landing Page Consolidation: Side-by-Side Sections

## Changes

### 1. Hero Section -- Center the tagline
**File: `src/components/Hero.tsx`**

- Change `text-left` to `text-center` on the text container
- Center the CTA buttons with `items-center` instead of `items-start`
- Keep the mascot on the right in the grid, but center all text content
- Bump up font sizes: subtitle from `text-sm sm:text-lg lg:text-2xl` to `text-base sm:text-xl lg:text-3xl`; "Comediq" heading stays large

### 2. Merge "Built for Comedians" + "Built for Comedy Fans" into one side-by-side section
**File: New combined section replacing Features + ForAudiences**

Instead of two full-width sections stacked vertically, create a single section with a 2-column layout:
- **Left column**: "Built for Comedians" heading (text-xl) + compact list of 6 comedian features (emoji + title + one-liner, no mascot images to save space)
- **Right column**: "Built for Comedy Fans" heading (text-xl) + compact list of 5 audience features (icon + title + one-liner)
- On mobile: stacks vertically but each column is much more compact than current
- Section heading sizes reduced from `text-4xl md:text-5xl` to `text-2xl md:text-3xl`
- Remove the large LaughPass pitch card from this section (it lives in Pricing below)

**Files: `src/components/Features.tsx`** -- rewrite to contain both columns
**File: `src/components/landing/ForAudiences.tsx`** -- remove (no longer imported)
**File: `src/pages/Index.tsx`** -- remove ForAudiences import, keep only Features

### 3. Compact Pricing -- side-by-side on mobile too
**File: `src/components/Pricing.tsx`**

- Change grid from `grid-cols-1 md:grid-cols-2` to `grid-cols-2` (always side-by-side)
- Reduce card padding from `p-8` to `p-4 sm:p-6`
- Reduce heading from `text-4xl md:text-5xl` to `text-2xl md:text-3xl`
- Reduce price text from `text-3xl` to `text-xl sm:text-2xl`
- Shrink feature list text and spacing
- Reduce section heading `mb-8` to `mb-4`

### 4. FeatureCard no longer needed as separate component
The merged section will use inline compact list items instead of the card component. FeatureCard.tsx stays in the codebase (other pages may use it) but Features.tsx will no longer import it.

---

## Technical Details

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/Hero.tsx` | Center tagline text and CTAs; bump subtitle font size |
| `src/components/Features.tsx` | Rewrite as 2-column "Comedians vs Fans" section with compact feature lists; smaller headings |
| `src/components/Pricing.tsx` | Always 2-col grid; reduce padding, font sizes, and spacing |
| `src/pages/Index.tsx` | Remove ForAudiences import and usage |

### No new files or database changes needed.

