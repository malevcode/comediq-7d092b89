

## Fix Clicks/Ad Bug + Enrich Ad Click Analytics

### Problem
1. **Clicks/Ad displays 1085.7** — the formula multiplies by 100 (leftover from a CTR percentage calc). Should just be `totalClicks / totalAds`.
2. **No visibility into WHO clicked ads** — the `ad_clicks` table already stores `user_id`, but there's no UI to browse individual clicks, see which users are clicking, or view click timelines per ad.

### Plan

#### 1. Fix the math bug
**File: `src/components/admin/ads/AdsDashboardCards.tsx`** (line 20)

Remove `* 100` from the calculation so it shows the actual average clicks per ad.

#### 2. Create a new hook to fetch detailed ad clicks
**File: `src/hooks/useBannerAds.ts`**

Add a `useAdClickDetails` hook that queries `ad_clicks` joined with `profiles` (username, headshot) so we can show who clicked and when. Query:
```
ad_clicks.select('id, ad_id, user_id, clicked_at, profiles(username, headshot_url)')
```

#### 3. Build an Ad Click Log tab in admin
**File: `src/components/admin/ads/AdClickLog.tsx`** (new)

A table/list showing recent ad clicks with:
- Ad label (joined from banner_ads or passed via props)
- User (username or "Anonymous" if null)
- Timestamp (relative, e.g. "2h ago")
- Filterable by ad and by date range

#### 4. Add per-ad click detail drawer
**File: `src/components/admin/ads/ActiveAdsList.tsx`** and **`AllAdsList.tsx`**

When clicking the click count on an ad card, open a small expandable section or dialog showing:
- Click timeline (last 30 days mini chart using recharts)
- Top clickers (usernames with click counts)
- Recent clicks list

#### 5. Add "Click Log" tab to AdsManagerTabs
**File: `src/components/admin/ads/AdsManagerTabs.tsx`**

Add a 5th tab "Click Log" that renders `<AdClickLog />`, giving admins a chronological feed of all ad interactions.

#### 6. Enhance dashboard cards
**File: `src/components/admin/ads/AdsDashboardCards.tsx`**

Add two more metrics:
- **Unique Clickers** — count of distinct `user_id` values (non-null) from `ad_clicks`
- **Today's Clicks** — clicks from today only

### Files to modify

| File | Change |
|------|--------|
| `src/components/admin/ads/AdsDashboardCards.tsx` | Fix `* 100` bug, add unique clickers + today's clicks cards |
| `src/hooks/useBannerAds.ts` | Add `useAdClickDetails` hook with user profile joins |
| `src/components/admin/ads/AdClickLog.tsx` | New — chronological click log with user info and filters |
| `src/components/admin/ads/AdsManagerTabs.tsx` | Add "Click Log" tab |
| `src/components/admin/ads/ActiveAdsList.tsx` | Expandable click details per ad |
| `src/components/admin/ads/AllAdsList.tsx` | Expandable click details per ad |

