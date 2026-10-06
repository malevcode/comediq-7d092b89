# Agent rules

- Mic pages live at `/mic/:slug` and venue pages at `/venue/:slug`, using the DB `slug` / `venue_slug` columns (set by trigger, never changed afterwards); old `/mics/:venueSlug` links redirect. Why: stable, indexable URLs.
- Day and borough filters are real paths `/open-mics/:filter` (old `?day=`/`?borough=` and `/days/*`, `/boroughs/*` redirect there). Why: each filter gets its own title, description and canonical.
- Slug, summary, title and JSON-LD logic lives only in `src/lib/seoShared.js`, shared by the app, `scripts/prerender-head.mjs` and `scripts/generate-sitemap.mjs`. Why: the pre-rendered HTML and the live app must never disagree.
- Listing pagination is `?page=N` (page size from `PAGE_SIZE`), with "Show More" as a real `rel="next"` link; canonical includes `?page=N` for N > 1. Why: crawlers can reach every mic.
- Build-time pages for mics/venues/filters come from `public/mics.json` + `public/venues.json` (written by `scripts/export-mics.mjs`, which must run before the sitemap). Why: static hosting has no server rendering.
- `last_verified_at` is the single verification date shown on cards; a trigger keeps it in step with `last_confirmed_at` and `last_verified`. Why: one trustworthy date per mic.
