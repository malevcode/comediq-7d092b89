# SEO overhaul for open mics: slugs, real paths, crawlable pagination, structured data

## What you'll get
- Every mic gets its own page at `comediq.us/mic/<name>`, and every venue gets one at `comediq.us/venue/<name>`.
- Mic names on the open mics list become real links that Google can follow.
- Day and borough filters get their own addresses, like `/open-mics/monday` and `/open-mics/brooklyn`. Each one has its own title, description and canonical link.
- "Show More" becomes a real link (`?page=2`, `?page=3`). It still loads more mics in place for people, and Google can follow it to reach every mic.
- Each card shows a "Verified <date>" line. Each list page opens with a short summary built from live numbers, for example: "42 open mics on Monday in NYC. 18 are free, the most common price is $5, and Tuesday is the busiest night."

## Data changes
- Add `slug` (unique) and `last_verified_at` (timestamp) to mics.
- Fill in slugs for existing mics from start time, venue and mic name, adding a short suffix if two would clash. Fill in `last_verified_at` from the newest of `last_confirmed_at` and the parsed `last_verified` text.
- A database trigger creates a slug for each new mic. Slugs never change after that, so old links keep working.
- Add a `venues` table (`slug`, `name`, `address`, `borough`, `neighborhood`, `latitude`, `longitude`). Fill it from the distinct venues already in the mic data. Add a `venue_slug` link on mics. Anyone can read it, and only admins can edit it.

## New and changed pages
- `/mic/:slug`: reuses the current mic page design and looks the mic up by its slug. Old `/mics/:venueSlug` links redirect to the new address. The existing `/mic/:slug/signup` page keeps working.
- `/venue/:slug`: venue name, address, a small map, and every mic held there.
- `/open-mics/:filter`: works out whether the filter is a day (monday…sunday) or a borough (manhattan, brooklyn, queens, bronx, staten-island, plus other city slugs). Unknown filters go to the not-found page. Old `?day=` and `?borough=` links redirect to the new paths. The day/borough controls on the page now go to these paths instead of changing query parameters.
- Pagination: 24 mics per page. `?page=N` is read from the address. "Show More" is a real link with `rel="next"`, and clicking it adds the next page in place without reloading. The canonical link includes the page number from page 2 onward.

## Structured data (JSON-LD)
- Mic page: `Event` with `eventSchedule` (`Schedule`, `repeatFrequency` P1W/P2W/P1M, `byDay`, `startTime`, `endTime`), plus `location` (Place) and `offers`. Builds on `generateEventSchema` in `structuredData.ts`.
- List pages: `ItemList` of `ListItem`s, each with a mic page URL, for the mics on that page.
- Venue page: `Place`, with `PostalAddress` and `GeoCoordinates`.
- Breadcrumbs on all three.

## Making it visible in the HTML Google first receives
- Extend `scripts/prerender-head.mjs` to fetch active mics and venues at build time. It writes head tags (title, description, canonical, og:*, JSON-LD) for every `/mic/*`, `/venue/*` and `/open-mics/*` path, and the summary paragraph text, into the pre-rendered HTML.
- Regenerate `sitemap.xml` with every mic, venue, day and borough page. Use `last_verified_at` as `lastmod` for mic pages.

## Technical details
- Files: new `src/pages/MicPage.tsx` (wrapping MicDetailPage logic), `src/pages/VenuePage.tsx`, `src/pages/OpenMicsFiltered.tsx` (or a route param on `OpenMics.tsx`), `src/utils/micSummary.ts` (count / free / mode price / busiest day), `src/utils/structuredData.ts` (eventSchedule, ItemList, Place), `src/utils/linkManager.ts`, `src/utils/slugify.ts`, `src/types/openMic.ts`, `src/hooks/useOpenMics.ts` (map slug + last_verified_at), `src/components/OpenMicsDetailedList.tsx` (anchor titles, verified line), `src/App.tsx` (routes + redirects), `scripts/prerender-head.mjs`, `scripts/generate-sitemap.mjs`.
- Mic naming follows the project convention (start time first), so slugs look like `7pm-buddha-room-hour-mic`.
- Record the slug and route rules in `AGENTS.md`.
