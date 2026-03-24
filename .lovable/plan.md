

## Fix: Mic Detail Page Layout

The mic detail page (`/mics/:venueSlug`) is missing the standard `pt-28` top padding that all other pages use to clear the fixed header and marquee banner. This causes the mic title to be clipped/hidden behind the marquee.

### Change

**File: `src/pages/MicDetailPage.tsx`** (line 89)

Change:
```tsx
<div className="min-h-screen pb-20">
```
To:
```tsx
<div className="min-h-screen pb-20 pt-28">
```

This single change aligns the mic detail page with the established layout convention used across all other pages (Home, Open Mics, Growth, etc.).

