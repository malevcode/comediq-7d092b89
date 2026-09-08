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

### Adding shows: the seed file

The everyday way to add shows is `scripts/ingest/audience_shows_seed.json`. Add an entry, merge it, then run the **Seed audience shows** workflow in GitHub Actions. It has a "dry run" checkbox that defaults to on, so an accidental click previews rather than writes; untick it to actually upload.

The script behind it (`scripts/ingest/seed_audience_shows.py`) looks each show up before inserting it, so running it twice adds nothing the second time. It reuses the same Supabase credentials the scraper already uses, so there is nothing new to configure.

One limitation: the workflow talks to Supabase over PostgREST, which can insert rows but cannot change the shape of a table. If a show has no confirmed start time, the `show_time` column has to be nullable first. When it is not, that show is reported as BLOCKED with the exact SQL to run, every other show still uploads, and re-running the job afterwards picks up the stragglers.

The SQL migrations in `supabase/migrations/` remain the historical record of what was added and when. They are not applied automatically by anything in this repo.

### The four ways a show gets added

1. **The public form** at `/add-show` (`src/pages/AddShow.tsx`). Submits with `verified = false`, so an admin still has to approve it by flipping the flag in the database. There is no admin UI for this yet.
2. **A hand-written SQL migration** in `supabase/migrations/`. This is how batches of shows get seeded.
3. **Scrapers** in `scripts/scrapers/`, loaded by `scripts/ingest/ingest_to_supabase.py`. These set a `source`, so the venue must be approved.
4. **Geocoding backfill**, `npm run geocode:audience-shows`, which fills in latitude/longitude so shows appear on the map at `/shows/map`.

---

## Open mics

### Where mic data lives

Same shape as shows: the Supabase `open_mics` table is the truth, and `public/mics.json` is a cache regenerated by the **Refresh mics.json** workflow (`npm run export:mics`). Never edit `mics.json` by hand, it gets overwritten.

Two column names are traps. `hosts_organizers` is the host field, and **`changes_updates` holds the Instagram handle**, not a changelog.

A mic is hidden from the site by setting `active = false`, not by deleting it. The export filters on `active = eq.true`, so this drops it from the listings while keeping its history, ratings and comments.

### Applying a batch of host updates

Host responses normally get processed into mic edits automatically. When that job does not run, the batch goes into `scripts/ingest/open_mic_updates.json` by hand and ships through the **Apply open mic updates** workflow (dry run defaults to on).

The file has three sections: `edits` (matched by `unique_identifier`, so each change targets one known row), `removals`, and `new_mics`. Every entry carries a `note` with the host's original wording, so anyone reviewing can check the change against what was actually said.

A venue's weekly cancellations calendar goes in `sign_up_instructions` as a full `https://` URL, not in `signup_url`. `signup_url` is written by the submit forms but no display component ever reads it, whereas `sign_up_instructions` is rendered through `makeLinksClickable` in both the mic list and the detail modal, so a URL there becomes a real link comics can tap.

After applying: run **Refresh mics.json**, then `npm run geocode:open-mics` if any mic changed venue. Edits that change `location` deliberately null out the geocoding fields so the geocoder picks them up.

---

## The Open Mics screen: list and map

`/open-mics` and `/perform` are the same component (`src/pages/OpenMics.tsx`); Perform renders it with an `embedded` prop that only controls the page header and padding.

The screen has two layouts, chosen by a `viewMode` state:

- **List** (the default on every load) is the tabbed day-by-day list.
- **Map** is a full-bleed map with a scroll-up drawer of cards grouped by daypart, built from `src/components/discovery/*`.

A toggle button in the filter bar switches between them. The same button is rendered in the map's floating bar, defined once in the component so the two cannot drift apart. The choice is not remembered: every fresh load starts on the list.

One layout trap worth knowing. In map view the map and the drawer are both `position: fixed`, so they escape whatever container they are in (which is why the map works the same on `/perform`, where the component sits inside a tab panel). The drawer's expanded height subtracts a fixed clearance for the bottom navigation, the ad strip, *and* the floating control bar at the top. Shrink that clearance and the expanded drawer covers the toggle, which strands the user in map view with no way back.

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

### Session: rolling back the Open Mics redesign

A merged PR (#106) had replaced the standalone `/open-mics` screen with a map-first, bottom-sheet design that wasn't wanted, and it could not be undone through Lovable's version history.

It turned out to be an easy undo. The redesign never deleted the old screen; it wrapped it in a ternary keyed on the `embedded` prop, which is why `/perform` still looked normal while `/open-mics` did not. Deleting the ternary restored `OpenMics.tsx` byte-for-byte to its previous state. A full merge revert would have been worse, since it would have deleted files the Laugh tab now depends on.

That PR had also quietly stubbed out `useMicStatus`, hardcoding every mic to "unverified" and making `updateStatus` do nothing. Nothing renders its consumer today, so it was dead code rather than visible breakage, but it was restored.

The lesson worth keeping: because Lovable publishes the newest commit on `main`, rolling *forward* with a new commit is how you undo something. Do not go looking for a rollback button.

### Session: making the shows uploadable

The shows from the September batch were written as a SQL migration, and nothing in this repo runs migrations, so they never reached the database. Fixed by moving the show data into `scripts/ingest/audience_shows_seed.json` and adding a manual GitHub Actions workflow that uploads it using credentials the repo already had. The JSON was generated from the migration's own output, then verified to produce byte-identical rows.

### Session: the manual open mic batch

A backlog of host responses that the automatic processor missed, applied by hand. 15 edits, 2 removals and 2 new mics, each matched to a real record by id rather than by name.

Three things worth remembering. First, the mic named "PaulZach" is a Grisly Pear Midtown slot, so a name-based scan of the Midtown schedule looks like it is missing a 5:45 Tuesday when it is not. Testing against a full copy of the real 407 mics caught that before it created a duplicate. Second, the Secret Mic host answered a numbered list 1-5 with no questions attached, and it turned out to map cleanly onto the five records in day order. Third, "Feelings Wheelies" was never the mic's name, just the Instagram handle, which is a good reminder that the handle column and the name column drift apart.

Left alone deliberately: a note moving a mic from Brooklyn to a Manhattan address, where the host handle did not match the record. Changing a borough on a guess is worse than leaving it stale.

### Session: map view as a toggle

The Map View dropdown inside the list was replaced with a toggle that swaps the whole page to the map-first layout from the reverted redesign. Keeping those components on disk during that rollback rather than deleting them turned this from a rebuild into a re-wire.

The branch is now keyed on `viewMode` instead of `embedded`, which is what made the original redesign change `/open-mics` silently while leaving `/perform` alone. Now both routes behave the same and the user picks.

Driving it in a real browser caught a bug a diff review would not have: with the drawer expanded, it covered the floating bar containing the toggle, so clicking back to list view was impossible. Measuring the actual boxes (bar 132-192, drawer starting at 136) gave the exact clearance needed rather than a guessed constant.

**Still open.** No cron job regenerates recurring instances, so The Girl Show is hand-seeded through March 2027. No admin UI for verifying submitted shows, still a manual database edit. And `npm run lint` is broken on this repo for an unrelated reason: an eslint / typescript-eslint version mismatch that fails on a clean checkout too.
