

# Landing Page Polish: Mobile-First Layout Fixes

## Changes

### 1. Hero Section -- Compact Side-by-Side Layout
**File: `src/components/Hero.tsx`**

- On mobile, put mascot image (smaller, ~w-28) on the right and text+CTAs on the left in a single row using `grid grid-cols-[1fr_auto]` so both are visible without stacking
- On desktop (lg), keep the current 2-column layout but tighten spacing
- Remove the entire "footer with links" block (Google Sheet link, @malevcomedy, AI disclaimer) -- this moves to the site footer
- Reduce bottom padding from `pb-16` to `pb-8`

### 2. Move Origin Story to Site Footer
**File: `src/components/SiteFooter.tsx`**

- Add a new section above the copyright block containing:
  - "Started as a Google Sheet tracking all of NYC's open mics, still publicly editable here"
  - Link to "View Open Mics Data"
  - "Made by @malevcomedy"
  - "ComediQ is not an AI comedy writer..." disclaimer
- Styled as small gray text, matching existing footer aesthetics

### 3. Remove "5 NYC Boroughs" from Social Proof Bar
**File: `src/pages/Index.tsx`**

- Remove the third stat ("5 / NYC boroughs") and its divider from the social proof bar
- Keep only "1,250+ comedians visit weekly" and "500+ open mics tracked"
- Reduce padding from `py-4` to `py-3`

### 4. Popular Open Mics -- Compact Grid
**File: `src/pages/Index.tsx`**

- Change from `md:grid-cols-3` with large cards to a tighter layout:
  - Mobile: 2 columns, small cards
  - Desktop: 5 columns in a single row
- Show top 5 instead of 6
- Shrink card padding from `p-6` to `p-3`
- Reduce text sizes: title to `text-sm font-bold`, venue to `text-xs`
- Cut section padding from `py-16` to `py-10`
- Remove the subtitle paragraph "Check out these comedian favorites"

### 5. Waitlist Form -- Condensed Rows
**File: `src/components/WaitlistForm.tsx`**

- Row 1: Name + Email (2 columns on all screens)
- Row 2: Phone + Instagram (2 columns on all screens)
- Row 3: Years in comedy + Open mics/month + $ spent/month (3 columns, same as current bottom row)
- Reduce section padding from `py-20` to `py-12`
- Reduce heading margin from `mb-12` to `mb-6`
- Reduce form padding from `p-8` to `p-5`
- Tighten form `space-y-6` to `space-y-4`

### 6. Tighten Whitespace in Other Sections
- **Features** (`src/components/Features.tsx`): Reduce `py-20` to `py-12`, heading `mb-12` to `mb-8`
- **ForAudiences** (`src/components/landing/ForAudiences.tsx`): Reduce `py-20` to `py-12`, heading `mb-12` to `mb-8`
- **Pricing** (`src/components/Pricing.tsx`): Reduce `py-20` to `py-12`, heading `mb-12` to `mb-8`

---

## Technical Details

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/Hero.tsx` | Side-by-side layout on mobile (mascot right, text left); remove origin story block; reduce padding |
| `src/components/SiteFooter.tsx` | Add origin story, Google Sheet link, @malevcomedy, and AI disclaimer above the copyright |
| `src/pages/Index.tsx` | Remove "5 boroughs" stat; compact Popular Mics to 2-col mobile / 5-col desktop with smaller cards; show 5 mics |
| `src/components/WaitlistForm.tsx` | Condense to 3 rows (Name+Email, Phone+IG, Comedy questions); reduce all padding/margins |
| `src/components/Features.tsx` | Reduce section padding |
| `src/components/landing/ForAudiences.tsx` | Reduce section padding |
| `src/components/Pricing.tsx` | Reduce section padding |

### No new files or database changes needed.
