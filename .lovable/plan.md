

## Plan: Premium Sponsor Placements to Maximize Advertiser Clicks

### The Problem
Your paying advertiser (Likeable Podcast, $140/mo) only got 21 clicks out of ~6,000 monthly visitors. The current ad placement is a tiny pill in a fast-scrolling marquee banner -- easy to miss, hard to click, and doesn't communicate value.

### Strategy: High-Visibility, Native Sponsor Placements

We'll create **4 premium placement zones** that feel native to the platform, not like ads. Each placement is tracked separately via the existing `ad_clicks` table with the `placement` column.

---

### 1. Sponsor Section on Landing Page (logged-out visitors)
A branded card between the Features and Pricing sections on the Index page. Shows the sponsor's logo (`icon_url`), description blurb (`description` column), and a CTA button (`cta_text` column). Uses `position = 'sponsor'` from `banner_ads` table.

**File**: Create `src/components/SponsorSection.tsx`, Edit `src/pages/Index.tsx`

### 2. Sponsor Link in PageHeader
A small branded link/logo next to the site title in the global header, visible on every page. Shows `icon_url` + `label` for the sponsor ad. Subtle but persistent -- every page load = an impression.

**File**: Edit `src/components/PageHeader.tsx`

### 3. Sponsor Card in Home Dashboard (logged-in users)
A sponsor card in the right column of the Home dashboard (below Quick Actions), styled as a native "Sponsored" card. Shows logo, description, and CTA.

**File**: Edit `src/components/Home.tsx`

### 4. Sponsor Card in Open Mics List (highest traffic page)
A pinned sponsor card at the top of the mic list, styled similarly to mic cards but with a "Sponsored" badge. This is where most users spend time.

**File**: Edit `src/components/OpenMicsDetailedList.tsx`

---

### Data Source
All sponsor ads come from the existing `banner_ads` table filtered by `position = 'sponsor'`. The `description`, `cta_text`, `icon_url`, `href`, and `label` columns already exist. No database changes needed.

### New Hook
Create a `useSponsorAd()` hook that fetches the active sponsor ad (`position = 'sponsor'`, `is_active = true`, within date range). Reused across all 4 placements.

### Click Tracking
Each placement calls `recordAdClick(ad.id, userId)` with a different `placement` value ('header', 'sponsors_section', 'home_dashboard', 'mic_list') so you can see which placements drive the most clicks in the admin dashboard.

### Files Summary

| File | Action |
|------|--------|
| `src/hooks/useBannerAds.ts` | Add `useSponsorAd()` hook |
| `src/components/SponsorSection.tsx` | Create -- landing page sponsor block |
| `src/components/PageHeader.tsx` | Edit -- add sponsor link in header |
| `src/components/Home.tsx` | Edit -- add sponsor card in dashboard |
| `src/components/OpenMicsDetailedList.tsx` | Edit -- add pinned sponsor card at top of list |
| `src/pages/Index.tsx` | Edit -- insert SponsorSection between Features and Pricing |

No database migrations needed -- all columns (`description`, `cta_text`, `icon_url`, `position`) already exist on `banner_ads`.

