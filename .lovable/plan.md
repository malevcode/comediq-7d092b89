

# Full-Featured Banner Ads Management System

## Overview
Transform the hardcoded marquee banner into a complete ad management platform with client billing, scheduling, click tracking, image support, and auto-activation/deactivation -- all manageable from the Admin Dashboard.

## What You'll Get

**For the Banner Display:**
- Each ad pill can now show a small icon/image next to the label text
- Ads are served from the database with automatic start/end date enforcement
- Every click on an ad is tracked in a dedicated analytics table

**For the Admin Dashboard:**
- A new **"Ads"** tab showing all banner ads in a management table
- Full CRUD: create, edit, delete ads
- Fields for: label, link, icon image, position (top/bottom), client name, amount paid, payment method, start date, end date, active status
- Click-through stats displayed per ad (total clicks)
- Ads auto-deactivate when their end date passes and auto-activate when their start date arrives

**First Ad - Likeable Podcast:**
- Label: "Likeable Podcast"
- Icon: The uploaded thumbs-up logo (copied to `public/images/likeable-podcast.png`)
- Link: `https://youtube.com/playlist?list=PLnHfEX5rBprYo7ASx3JK__PLnJCTvNFnx&si=lNB63gdc50CmuJJz`
- Position: top banner
- Client: Likeable Podcast
- Amount paid: $140
- Payment method: Venmo
- Duration: 1 month (Feb 12 - Mar 12, 2026)

---

## Technical Details

### 1. Database: `banner_ads` table

```text
banner_ads
-----------
id              uuid (PK, default gen_random_uuid())
label           text NOT NULL
href            text NOT NULL
external        boolean DEFAULT true
position        text ('top' or 'bottom')
sort_order      integer DEFAULT 0
is_active       boolean DEFAULT true
icon_url        text (nullable, URL to small image)
client_name     text (nullable)
amount_paid     numeric (nullable, e.g. 140.00)
payment_method  text (nullable, e.g. 'venmo', 'stripe', 'cash')
start_date      date (nullable, ad goes live on this date)
end_date        date (nullable, ad deactivates after this date)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

RLS policies:
- SELECT for everyone (anon + authenticated) so the marquee can load ads
- INSERT/UPDATE/DELETE restricted to admins (via profiles.isadmin check)

Seed data: The current 7 hardcoded ads plus the new Likeable Podcast ad (8 total).

### 2. Database: `ad_clicks` table (click tracking)

```text
ad_clicks
---------
id          uuid (PK, default gen_random_uuid())
ad_id       uuid (FK -> banner_ads.id ON DELETE CASCADE)
clicked_at  timestamptz DEFAULT now()
user_id     uuid (nullable, for logged-in users)
```

RLS policies:
- INSERT for everyone (anon can click ads)
- SELECT restricted to admins

A database view `ad_click_counts` will aggregate clicks per ad for easy admin display.

### 3. Copy Likeable Podcast image

Copy `user-uploads://image-35.png` to `public/images/likeable-podcast.png` for use as the ad icon.

### 4. New hook: `src/hooks/useBannerAds.ts`

- Fetches active ads from `banner_ads` where `is_active = true` AND `start_date <= today` AND (`end_date IS NULL` OR `end_date >= today`)
- Splits into `topAds` and `bottomAds`
- Falls back to current hardcoded ads on error
- Stale time of 5 minutes

### 5. Update `src/components/MarqueeBanner.tsx`

- Use `useBannerAds` hook instead of hardcoded arrays
- Update `AdItem` component to:
  - Show an optional small round icon image (16x16px) next to the label
  - Record a click to `ad_clicks` table on every click (fire-and-forget insert)
- Keep hardcoded arrays as fallback

### 6. New component: `src/components/admin/AdminBannerAdsManager.tsx`

A full management UI with:
- Table listing all ads (active and inactive) with columns: icon preview, label, client, position, paid amount, start/end dates, clicks, active status
- Inline edit mode (matching existing admin auto-save-on-blur pattern)
- "Add Ad" button with a form for all fields
- Delete button with confirmation
- Click count pulled from `ad_click_counts` view
- Visual indicators: green dot for active, red for expired/inactive

### 7. Update `src/pages/AdminInterface.tsx`

- Add 8th tab: **"Ads"**
- Change grid from `grid-cols-7` to `grid-cols-8`
- Import and render `AdminBannerAdsManager`

### Files Changed
- **Copy**: `user-uploads://image-35.png` -> `public/images/likeable-podcast.png`
- **New**: `supabase/migrations/[timestamp].sql` (banner_ads + ad_clicks tables, RLS, seed data)
- **New**: `src/hooks/useBannerAds.ts`
- **New**: `src/components/admin/AdminBannerAdsManager.tsx`
- **Edit**: `src/components/MarqueeBanner.tsx` (dynamic ads + click tracking + icon support)
- **Edit**: `src/pages/AdminInterface.tsx` (add Ads tab)

