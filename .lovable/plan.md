# Crawlable mic, venue and listing pages

## What you will get
- Every mic gets its own page at `/mic/<name>` and every venue at `/venue/<name>`.
- On the open mics list, each mic name is a real link to its page.
- Day and borough pages get their own addresses: `/open-mics/monday`, `/open-mics/brooklyn`, each with its own title, description and self-pointing canonical.
- "Show More" becomes a real link (`?page=2`) that search engines can follow, while still loading in place for visitors.
- Each card shows "Verified <date>".
- Each listing page opens with a live summary, e.g. "142 open mics in Brooklyn. 61 are free, the most common price is $5, and Tuesday is the busiest night."
- Structured data: Event (with weekly schedule) on mic pages, ItemList on listing pages, Place on venue pages.

## Database changes
- Add to mics: `slug` (unique), `venue_slug`, `last_verified_at`.
- Fill slugs for all existing mics (start-time-first names already make them unique; duplicates get `-2`, `-3`).
- Backfill `last_verified_at` from `last_confirmed_at`, falling back to the old `last_verified` text where it parses as a date.
- A trigger sets the slug on new mics and updates `last_verified_at` when a mic is confirmed.
- Add the new columns to the static mic file used for signed-out visitors.

## Pages and links
- New mic page at `/mic/:slug` (reuses the current mic detail design). The old `/mics/:venueSlug` address sends visitors to the new one. `/mic/:slug/signup` stays as it is.
- New venue page at `/venue/:slug`: venue info, map, and every mic held there.
- `/open-mics/:filter` works out whether the value is a day or a borough. Old `?day=` / `?borough=` links send visitors to the new path.
- Filter chips on the open mics page switch addresses instead of changing query text.

## Search engine visibility
- Titles, descriptions, canonicals and structured data on every new page.
- Add all day, borough, mic and venue pages to the sitemap, and to the pre-rendered page heads so the tags are in the first HTML response. Mic and venue lists come from the database when the site is built.

## Technical details
- Slug format: `slugify(open_mic)`; venue slug `slugify(venue_name + neighborhood)`.
- Pagination: `<a href="?page=N">` with an onClick that loads more in place; page N shows the first N×pageSize mics and adds rel prev/next links.
- The summary is calculated from the currently filtered mic list (the most common value of `cost`, and the day with the most mics).
- JSON-LD builders live in `src/utils/structuredData.ts`; eventSchedule uses `repeatFrequency: P1W`, `byDay`, `startTime`, plus `P2W`/monthly where frequency allows.
- The sitemap and prerender scripts get mic and venue slugs from the Supabase REST API using the anon key.
