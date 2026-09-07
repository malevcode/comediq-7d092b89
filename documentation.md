# Comediq Documentation

Plain-English explanation of how the pieces fit together. If you are new here, start at the top.

---

## The Laugh tab

### What it is

`comediq.us/laugh` is the audience-facing side of the site. Comedians use the rest of the app to find open mics and book spots. The Laugh tab is for regular people who just want to go see comedy tonight.

It has two sub-tabs:

- **Find Shows** — a list of upcoming comedy shows
- **My Reviews** — reviews the logged-in user has written

### How a show gets from a database row onto your screen

Think of it like a relay race with four runners.

1. **The table.** Every show lives as one row in a Postgres table called `audience_shows`, hosted on Supabase. One row = one specific show on one specific night.
2. **The fetcher.** `src/api/audienceShows.ts` asks the database for shows. It does not ask for all of them. It filters (see "The four gates" below).
3. **The card.** `src/components/shows/AudienceShowCard.tsx` draws each show as a little card: title, venue, date, time, price, Instagram, buttons.
4. **The modal.** Tap a card and `src/components/shows/AudienceShowDetailModal.tsx` opens the full detail view: address, description, lineup, host, ticket link.

```
audience_shows table  →  fetchAudienceShows()  →  AudienceShowCard  →  AudienceShowDetailModal
   (Supabase)             src/api/                (the list)            (tap to open)
```

### The four gates a show must pass to be visible

A show can exist in the database and still never appear on the site. It has to get past all four:

| Gate | Meaning | If you forget |
|---|---|---|
| `verified = true` | A human checked this show is real | Show is invisible |
| `status = 'active'` and `is_active = true` | Not cancelled, not retired | Show is invisible |
| `is_recurring = false` | This is a real dated show, not a repeating "template" | Show is invisible |
| `source IS NULL` (or an approved partner) | See below | Show is invisible |

**The `source` gate is the one that bites people.** `source` records where a show came from. `NULL` means "a human added this to Comediq directly." Any other value means "a scraper pulled this from someone else's website," and those only show up if that venue has opted in via the `venue_sources` table. If you set `source` to some random string like `'user'`, your show silently disappears forever. It is enforced twice, in the fetch query and again in the database's row-level security policy, so you cannot sneak past it.

### Repeating shows: templates and instances

Some shows happen every week or every month. Comediq does **not** compute those dates on the fly. Instead it stores two kinds of rows:

- **The template.** `is_recurring = true`, plus `recurrence_pattern` ("weekly" or "monthly") and `recurrence_day` ("sunday"). This row is a recipe. It is never displayed.
- **The instances.** One row per actual date, with `is_recurring = false` and `parent_show_id` pointing back at the template. These are what people see.

So "The Girl Show, first Sunday of every month" is stored as 1 template + 6 dated instances (Oct 4, Nov 1, Dec 6, Jan 3, Feb 7, Mar 7).

**Important limitation:** nothing generates new instances automatically. There is no cron job. The old generator (`supabase/migrations/20260211011416_*.sql`) was a one-time script and only understands *weekly*. Monthly dates are typed in by hand. When The Girl Show runs out of dates in March 2027, someone has to add more.

### Shows with missing information

Hosts often send a date and nothing else: "next show is Oct 3." That leaves no venue and no start time.

The rule is: **a listing must always give the user somewhere to go.** Every show needs an Instagram handle or a ticket link, minimum. That way if the venue is unknown, a user can still tap through and find out.

To make this honest rather than fake:

- `show_time` is **nullable**. When it is empty the card shows "Time TBA" instead of a made-up 8:00 PM. Handled by `src/utils/formatShowTime.ts`.
- `venue_name` is still required, so unknown venues literally say "Venue TBA."
- The Instagram handle is shown right on the card as a tappable chip, not buried in the modal. Handled by `src/utils/instagramUrl.ts`, which copes with `@handle`, bare `handle`, or a full instagram.com URL.

### Money

`is_paid = true` plus `price_cents` turns on a Stripe checkout button and **Comediq collects the money**. Do not set this for a show unless there is an actual payout agreement with that host.

For everyone else, leave `is_paid = false` and put the cover charge in the free-text `ticket_price` field, for example `"$20 + 2 drink minimum"`. It renders as a badge. Ticket links go in `external_ticket_url` and send people to the host's own Eventbrite.

There is no separate column for drink minimums or cover charge. They live in `ticket_price` and `description`.

### The four ways a show gets added

1. **The public form** at `/add-show` (`src/pages/AddShow.tsx`). Submits with `verified = false`, so an admin still has to approve it by flipping the flag in the database. There is no admin UI for this yet.
2. **A hand-written SQL migration** in `supabase/migrations/`. This is how batches of shows get seeded.
3. **Scrapers** in `scripts/scrapers/`, loaded by `scripts/ingest/ingest_to_supabase.py`. These set a `source`, so the venue must be approved.
4. **Geocoding backfill**, `npm run geocode:audience-shows`, which fills in latitude/longitude so shows appear on the map at `/shows/map`.

---

## Summarize

### Session: September 2026, adding host-submitted shows to the Laugh tab

**What we were given.** Eight NYC comedy shows collected from Instagram DMs and flyers, in wildly different states of completeness. Some had full flyers with addresses and prices. Two were just a handle and a date.

**What we found.** Three of the eight had dates that had already passed (Zofia's Hideout Aug 27, Love & Laughs Sep 5, Flop House EV Sep 3). Two more had no venue and no time. And the database required a start time on every show, which meant listing an incomplete show would have forced us to invent one.

**What we decided.** Publish everything with a future date. Never invent data. Require every listing to carry an Instagram handle or a link so the user always has a next step. Do not route any host's door money through Comediq's Stripe.

**What we built.**

- Made `show_time` nullable so "Time TBA" is a real, honest state.
- Seeded 11 rows: 4 one-off shows, 1 monthly template for The Girl Show, and 6 dated instances of it. 10 of these are visible listings.
- Extracted one shared `formatShowTime` helper, replacing three near-identical copies scattered across the card, the modal, and the discovery card.
- Added a tappable Instagram chip to the show card, so the handle is visible without opening the modal.
- Made the submit form require an Instagram handle or a ticket link.

**The bug we found along the way.** The public submit form was setting `source: 'user'`. Because both the fetch query and the security policy only allow `source IS NULL`, **every show a host had ever submitted through the form was invisible**, even after being marked verified. One-word fix, but it meant the self-serve path had never actually worked.

**What we deliberately did not do.** No shows with past dates were listed at all, not even as placeholders. Three of them exist only as outreach messages in `HOST_OUTREACH.md`, waiting on hosts to send a future date.

**Still open.** No cron job regenerates recurring instances, so The Girl Show is hand-seeded through March 2027. No admin UI for verifying submitted shows, still a manual database edit. And `npm run lint` is broken on this repo for an unrelated reason: an eslint / typescript-eslint version mismatch that fails on a clean checkout too.
