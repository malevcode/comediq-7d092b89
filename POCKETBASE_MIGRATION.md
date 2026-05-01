# Comediq PocketBase Migration — Complete Continuation Prompt

## What this project is
Comediq (comediq.us) is a React + Vite + TypeScript SPA. It currently uses
Supabase (PostgreSQL + auth) as its backend. We are migrating to PocketBase
(SQLite, self-hosted on Fly.io) because Supabase egress hit the free tier limit.

## What has already been done (DO NOT redo these)
- `pocketbase/Dockerfile` — builds PocketBase v0.22.20 on Alpine
- `pocketbase/fly.toml` — Fly.io config for ewr region, 256MB VM, 3GB volume
- `pocketbase/pb_migrations/001_initial_schema.js` — 35 collections matching
  the Supabase schema (run automatically on first PocketBase startup)
- `src/integrations/pocketbase/client.ts` — PocketBase client + pbAuth helpers
- `src/api/pb/` folder with 11 files — PocketBase versions of every API:
  openMics, audienceShows, profiles, auth, ratings, shows, showReviews,
  growthOpportunities, signups, slots, bannerAds
- `src/contexts/PocketBaseAuthContext.tsx` — drop-in replacement for AuthContext

## What still needs to be done
These are the remaining steps. Do them IN ORDER.

### STEP 1 — You do manually (takes 15 minutes)
Go to fly.io, create a free account, then run in terminal:
```
curl -L https://fly.io/install.sh | sh
cd /path/to/comediq/pocketbase
fly auth login
fly apps create comediq-pb
fly volumes create pb_data --region ewr --size 3
fly deploy
```
Then open https://comediq-pb.fly.dev/_/ and set your admin email + password.

### STEP 2 — You do manually (import data)
In Supabase Dashboard → Table Editor, export each table as CSV.
In PocketBase admin (https://comediq-pb.fly.dev/_/) → each collection → Import CSV.
Priority order: open_mics_historical, profiles, audience_shows, banner_ads,
saved_mics, user_mic_ratings, mic_verifications, venue_sources, points_ledger,
comedian_social_links, mic_hosts, weekly_top_mics, then the rest.

### STEP 3 — Code (Claude can do this)
Swap all hook files from Supabase to PocketBase.
Files to update:
- src/hooks/useOpenMics.ts → use pb.collection('open_mics_historical')
- src/hooks/useMicRatings.ts → use src/api/pb/ratings.ts
- src/hooks/useSavedMics.ts → use src/api/pb/savedMics.ts (create this file)
- src/hooks/useMicComments.ts → use pb directly
- src/hooks/useMicVerification.ts → remove Supabase edge function call, write to mic_verifications via pb
- src/hooks/useWeeklyTopMics.ts → use pb.collection('weekly_top_mics')
- src/hooks/useAnalyticsTracker.ts → use pb.collection('analytics_events')
- src/hooks/useUserSignups.ts → use src/api/pb/signups.ts fetchUserSignups
- src/hooks/useWrapped.ts → use pb directly
- src/hooks/useBannerAds.ts → use src/api/pb/bannerAds.ts
- src/hooks/useHostStatus.ts → change import from @/api/signups to @/api/pb/signups
- src/hooks/useSignupEvents.ts → change import from @/api/signups to @/api/pb/signups
- src/hooks/useAllSignupEvents.ts → change import from @/api/slots to @/api/pb/slots
- src/hooks/useGrowthOpportunities.ts → change import to @/api/pb/growthOpportunities
- src/hooks/useAudienceShows.ts → change import to @/api/pb/audienceShows
- src/hooks/useComedianProfile.ts → change import to @/api/pb/profiles

### STEP 4 — Code (Claude can do this)
Swap AuthProvider in src/App.tsx:
Change: import { AuthProvider } from "@/contexts/AuthContext"
To:     import { AuthProvider } from "@/contexts/PocketBaseAuthContext"

### STEP 5 — Code (Claude can do this)
Fix src/pages/Auth.tsx — the sign-in page still calls Supabase auth directly.
Replace with PocketBase auth calls from src/api/pb/auth.ts.
Also fix the UI: sign-in button should be blue (#1a5fb4 = Comediq blue), not orange.
Show the Comediq logo/name instead of the Supabase project URL.

### STEP 6 — You do (set env vars)
In Vercel/Netlify dashboard, add environment variable:
VITE_POCKETBASE_URL = https://comediq-pb.fly.dev

### STEP 7 — Configure Google OAuth in PocketBase
In PocketBase admin → Settings → Auth providers → Google
Add your Google OAuth client ID and secret (same ones from Supabase).

### STEP 8 — Test + go live
Run `npm run build` locally, check for TypeScript errors.
Test login, open mic listing, saving a mic, rating a mic.
Once happy, deploy to production (git push to main → Vercel auto-deploys).

## Key technical notes
- PocketBase filter syntax: `field = "value" && other >= "x"` (no .eq() chaining)
- PocketBase has no SQL views — mic_like_counts is computed with JS .filter().length
- PocketBase has no RPC — get_or_create_system_host is reimplemented in app code
- User IDs: during import, the supabase_user_id field holds the original UUID
- The pb client is at: import { pb } from '@/integrations/pocketbase/client'
- PocketBase auth store: pb.authStore.record = current user, pb.authStore.isValid = logged in

## Repo info
- Repo: malevcode/comediq-7d092b89
- Branch: main (deploy directly to main)
- Stack: React + Vite + TypeScript + Tailwind + shadcn/ui + react-query + react-leaflet
