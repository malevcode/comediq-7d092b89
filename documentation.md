# Comediq Documentation

Plain-English explanation of how the pieces fit together. If you are new here, start at the top.

---

## The Laugh tab

### What it is

`comediq.us/laugh` is the audience-facing side of the site. Comedians use the rest of the app to find open mics and book spots. The Laugh tab is for regular people who just want to go see comedy tonight.

It has two sub-tabs:

- **Find Shows** ,  a list of upcoming comedy shows
- **My Reviews** ,  reviews the logged-in user has written

### The control row

Everything you can do to the list lives in one row across the top: the two
sub-tabs, a search box, a map toggle, and a filter button. That row sits
directly under the fixed site header with nothing above it.

It used to be four stacked things: the page title and subtitle, a gap, a tall
tab bar, then a full-width "Map View" button on its own row, then a search box,
then two dropdowns on another row. That ate the top third of a phone screen and
you could barely see one show without scrolling. Now three to four show cards
fit above the fold on an iPhone.

Three changes bought that space:

- The page subtitle is gone, which shrinks the fixed header (the header
  measures its own height, so removing a line of text genuinely gives the
  space back).
- The page uses `page-content-offset-flush` instead of `page-content-offset`.
  Both clear the fixed header; the flush one skips the extra 0.75rem gap that
  pages with a heading need.
- The two dropdowns (borough and show type) moved behind the filter icon. A
  small dot on the icon tells you a filter is currently narrowing the list.

Because the tabs and the search live in the same row, the search, borough and
type state had to move up into `src/pages/Laugh.tsx`. `AudienceShows` no longer
owns them; it receives them as props and just renders the result.

### Map view

The map is a toggle, not a page. Pressing the map icon swaps the list for a map
in the same spot, and pressing it again swaps back. You stay on `/laugh` the
whole time, so your search and filters survive the trip. Tapping a pin opens a
drawer from the bottom with every show at that venue.

This mirrors how Perform already did it. Before, the button called
`navigate('/shows/map')`, which threw you onto a separate page and lost your
filters. That page (`/shows/map`) still exists and still works if you have it
bookmarked; nothing links to it any more.

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

### Taking a show off the Laugh tab (cancelling a date)

Deleting a date from the seed file does **not** delist a show that is already
live, because the seed script only ever inserts rows that are missing. To pull a
date, do both of these in `audience_shows_seed.json`:

1. Remove the date from the show's `instance_dates`, so a future run never adds it back.
2. Add `{"title": ..., "show_date": ..., "reason": ...}` to the `cancellations` list.

Merging runs the **Seed audience shows** workflow, which flips that one dated
row to `status = 'cancelled'` and `is_active = false`. Two of the four gates
above then fail and the show disappears. Only a live, dated, curated row with
that exact title and date is touched, so re-running does nothing. Anyone who
already RSVP'd keeps their RSVP and is not told: the script does not message
people.

### The four ways a show gets added

1. **The public form** at `/add-show` (`src/pages/AddShow.tsx`). Submits with `verified = false`, so an admin still has to approve it by flipping the flag in the database. There is no admin UI for this yet.
2. **A hand-written SQL migration** in `supabase/migrations/`. This is how batches of shows get seeded.
3. **Scrapers** in `scripts/scrapers/`, loaded by `scripts/ingest/ingest_to_supabase.py`. These set a `source`, so the venue must be approved.
4. **Geocoding backfill**, `npm run geocode:audience-shows`, which fills in latitude/longitude so shows appear on the map at `/shows/map`.

---

## Open mics

### Where mic data lives

Same shape as shows: the Supabase `open_mics_historical` table is the truth, and `public/mics.json` is a cache regenerated by the **Refresh mics.json** workflow (`npm run export:mics`). Never edit `mics.json` by hand, it gets overwritten.

**The table is `open_mics_historical`, and there is no table called `open_mics`.** The name is a trap: it reads like a leftover, but it is the live listings table. `apply_open_mic_updates.py` was pointed at a bare `open_mics` and every single lookup 404'd with `PGRST205`, so a whole batch silently applied nothing. If a query comes back "Could not find the table 'public.open_mics'", that is this mistake.

Two column names are traps. `hosts_organizers` is the host field, and **`changes_updates` holds the Instagram handle**, not a changelog.

A mic is hidden from the site by setting `active = false`, not by deleting it. The export filters on `active = eq.true`, so this drops it from the listings while keeping its history, ratings and comments.

### Naming a mic: the time goes first

**Convention: when a mic's name contains its start time, the time leads.**

`5 Buddha Room Hour Mic`, not `The Buddha Room 5 Hour Mic`.

The reason is that a number sitting after the venue name reads as a duration.
"The Buddha Room 5 Hour Mic" looks like a mic that runs for five hours. It is a
mic that starts at 5. Moving the time to the front removes the ambiguity
without losing any information, because a name like "6:30 Buddha Room Mic Show"
cannot be misread as a length.

The shape is:

```
<start time> <venue> <whatever the room calls it>
```

So `The Buddha Room 9:45 Mic Show` became `9:45 Buddha Room Mic Show`, and
`The Buddha Room 6:30` became `6:30 Buddha Room`.

Two related rules that come from the same problem, names that carry information
which can go out of date:

- **If a mic's start time changes, its name changes with it.** Leaving
  `5:30 Buddha Room Hour Mic` on a mic that now starts at 5:00 is a listing that
  lies. Rename in the same edit that moves the time.
- **A status label in a name has to be cleared by hand.** Nothing expires
  `*SKIPS 9/14*` or `*Resumes 8/27*`, so those names keep announcing a date
  after it has passed. `scripts/ingest/report_stale_labels.py` reads
  `public/mics.json` and prints the ones whose date is in the past. Run it
  before shipping a batch. It only reports; deciding whether a mic actually
  came back is a human call.

### How long is a mic?

**Assume 90 minutes unless the room specifically says it is a one hour mic.**

This matters most when a start time moves, because the end time has to move with
it. Changing a 6:00 to 6:30 and leaving the 7:30 end silently turns a 90 minute
mic into a 60 minute one, and nobody asked for that. Shift both.

### Variety (mixed) mics

A **variety mic** is a mixed open mic that also lets non-comedy acts (poetry,
music and so on) sign up. It is marked by setting a mic's `legacy_tag` to
`Variety`. That is the one tag column the export already carries, so nothing in
the database changes and nothing has to be migrated. The Filter menu on the
Open Mics screen has a **Mic Type** button, "Variety / mixed mics only", which
shows only those rows. The tag also shows up as the small pill on the detailed
list. The name of the constant is `VARIETY_TAG` in `src/types/openMic.ts`.

Setting it replaces the old `Pre-March 2026` text on that row. The batch note
keeps the old value. A verified mic with any `legacy_tag` still shows the
"Legacy" badge, so a brand new verified variety mic would wear that badge too.
Tagged so far: The Open Mic Downstairs (FRIGID), Easy Paradise (KGB Bar).

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

**Perform is open mics only.** The map drawer used to render a "Shows" section
above the mics, which meant audience shows appeared on the comedian side of the
app. Shows belong on Laugh. `DiscoveryFeed` no longer has a `showShows` prop and
no longer queries audience shows at all.

**Perform has a visible tab row.** It did not before: the tabs existed, but you
could only switch them by URL parameter or by whatever localStorage remembered,
so there was no way to reach them from the screen. There are now two visible
tabs, styled to match Laugh's row and sitting flush under the header:

- **Find Mics**: the existing open mics screen
- **My Mics**: everything you have marked: mics you liked, mics you saved, and
  mics you have a confirmed signup for, merged into one list with duplicates
  removed

My Mics (`src/components/mic/MyMicsTab.tsx`) invents no new database query. It
reads the same hooks the standalone `/liked` and `/saved` pages already use, plus
the existing signups hook, and filters the full mic list down to the union of
those three sets.

Two more layout traps worth knowing.

The header is **not a fixed height** ,  the title and subtitle wrap, so it ranges from about 76px on a wide screen to 124px at 320px. `PageHeader` measures itself with a `ResizeObserver` and publishes `--nav-height`; `--page-top-offset` is then `calc(var(--nav-height) + 0.75rem)`. Do not replace that with a fixed number: a number small enough to look right on a laptop tucks content under the header on a small phone, which is exactly the bug this replaced. The top ad bar lives *inside* the nav, so reinstating it grows the offset automatically.

The day tabs list every mic for that weekday, with no frequency or week-of-month narrowing. A monthly mic therefore appears on its day tab every week and its card carries the frequency label. Only the "Next" tab filters down to genuinely upcoming occurrences.

One layout trap worth knowing. In map view the map and the drawer are both `position: fixed`, so they escape whatever container they are in (which is why the map works the same on `/perform`, where the component sits inside a tab panel). The drawer's expanded height subtracts a fixed clearance for the bottom navigation, the ad strip, *and* the floating control bar at the top. Shrink that clearance and the expanded drawer covers the toggle, which strands the user in map view with no way back.

---

## Working with no signal (offline mode)

### The problem

Comediq is used on the subway. You are on the L train with no bars, you want to
check where tonight's mic is, and the site will not even load. Not because the
mic list is missing, but because the browser could not download `index.html`.

### The fix: a service worker

A service worker is a small script the browser keeps running in the background,
separate from the page. It sits between the app and the network, like a bouncer
who also happens to keep a photocopy of everything that comes through the door.
When the network is gone, it hands you the photocopy.

Ours lives at `public/sw.js` and is registered by
`src/utils/registerServiceWorker.ts` (called from `src/main.tsx`).

It keeps three separate boxes of photocopies:

| Cache | Holds | Why |
|---|---|---|
| `comediq-v1-shell` | `index.html`, the manifest, the logo | So the app can start with zero network |
| `comediq-v1-data` | `mics.json` | The actual list of 400+ mics |
| `comediq-v1-assets` | the hashed JS/CSS Vite builds, images | The code that makes the page work |

Each box uses a different rule:

- **The app shell** is *network first*. Online, you always get the newest
  `index.html`. Offline, you get the saved one.
- **`mics.json`** is *stale while revalidate*. You instantly get the saved list,
  and a fresh copy downloads quietly in the background for next time. You never
  wait on the network to see mics.
- **Assets** are *cache first*. Vite puts a hash in each filename
  (`index-BDvTmjBb.js`), so a changed file is a different filename. A cached one
  can never be out of date.

Anything that is a live read or write to Supabase (`/rest/v1/`, `/auth/v1/`,
`/functions/v1/`, `/realtime/`) is deliberately never cached. Serving someone a
stale login would be worse than serving them nothing.

### What "installed" means

`public/manifest.webmanifest` is what lets someone add Comediq to their home
screen and have it open without browser chrome. It is also the file Capacitor
and the app stores read for the app's name, colours, and icon.

### The one thing to remember

**Bump `VERSION` in `public/sw.js` when you change what gets cached.** The
version string is the name of all three caches, so changing it throws the old
ones away and starts clean. If you do not bump it and you change the caching
rules, existing visitors keep the old rules until they clear their site data.

### How you know it works

Build, serve `dist/`, load the page once, turn the network off, reload. You
should see the full mic list plus a black `OFFLINE · SHOWING SAVED MICS` strip
at the top of the screen (`src/components/OfflineBanner.tsx`, driven by
`src/hooks/useOnlineStatus.ts`). Verified on 2026-09-08: 407 mics rendered with
the network fully disabled and no page errors.

There is a second, older safety net underneath all this: `useOpenMics` also
saves the mic list to `localStorage` for 30 days
(`src/utils/micDataCache.ts`). The service worker is the belt; that is the braces.

---

## Mic check-in: proving you were actually there

### What changed

The "I Went Up" button used to be an honour system. You tapped it, a row was
written, done. You could tap it from bed. That made the data useless for
anything social or competitive, because none of it meant anything.

Now a check-in has to pass two gates.

### Gate 1: is the mic even happening? (the browser decides)

`src/utils/micCheckin.ts` reads the mic's `day` and `startTime` and works out
whether the check-in window is open. The window runs from **30 minutes before**
the listed start time to **3 hours after** it.

The tricky part is midnight. A Wednesday 11:00 PM mic is still the Wednesday mic
when it is 12:30 AM on Thursday and you have finally been called up. So the code
checks **both today and yesterday**, and takes whichever weekday matches.

If a mic's schedule is unparseable free text (`"call ahead"`), the time gate is
skipped rather than blocking someone from a mic they are genuinely standing in.

### Gate 2: are you actually at the venue? (the database decides)

This gate is in SQL on purpose. It is the `check_in_mic` function in
`supabase/migrations/20260908160000_verified_mic_checkins.sql`.

The browser sends its GPS reading. The database compares it against the
coordinates it already has for that venue in `open_mics_historical`, using
haversine distance, and decides.

**Why not do the maths in the browser?** Because anything the browser decides,
the person holding the browser can lie about. The browser could simply claim it
was near the venue. The database cannot be argued with.

The rule:

```
allowed distance = 150 metres + however much error the phone admits to (capped at 200m)
```

That second part matters. GPS in a basement bar is genuinely terrible, and a
phone that honestly reports "you are here, give or take 120 metres" should not
be punished for its honesty. The cap stops someone claiming 9,000 metres of
error and checking in from New Jersey.

### What gets written

| Column | Meaning |
|---|---|
| `latitude` / `longitude` | Where the phone said you were |
| `accuracy_meters` | How much error the phone admitted to |
| `distance_meters` | How far that actually was from the venue |
| `is_verified` | Whether it passed the distance test |

A verified check-in is worth **1 point**, awarded through the same
`award_mic_point` function that Confirm and Report already use. The unique index
on `(user_id, mic_id, checkin_date)` means one check-in per mic per day, so
tapping twice cannot farm points.

### Two deliberate holes

1. **The time gate is client-side.** `start_time` is free text typed by humans
   ("9:30 PM", "call ahead"), which is not solid enough to hard-gate on in SQL.
   The check-in timestamp is stored, so anything suspicious can be found later.
2. **A handful of mics have no coordinates** (1 of 407 as of September 2026).
   Those check-ins are accepted but stored with `is_verified = false` and earn
   no point. Geocode the mic and the problem goes away.

Direct `INSERT` into `user_mic_checkins` is no longer allowed. The RLS insert
policy was dropped, so the RPC is the only door in. Users can still read and
delete their own rows, which is what "undo my check-in" needs.

---

## Wrapping Comediq as a real app (Capacitor)

### What Capacitor is, in one paragraph

Capacitor takes the website you already built and puts it inside a real iOS and
Android app. The app is a full-screen browser with no browser chrome, plus a
bridge that lets JavaScript call native phone features. You do not rewrite
anything. `dist/` (the normal Vite build) becomes the app's contents.

That means there is exactly one codebase. A fix you ship to comediq.us is the
same fix that goes in the app.

### The pieces in this repo

| File | Job |
|---|---|
| `capacitor.config.ts` | App name, bundle id (`us.comediq.app`), and that the app's contents come from `dist/` |
| `src/utils/deviceLocation.ts` | Reads GPS. Uses the native plugin inside the app, the browser API on the web |
| `scripts/capacitor-permissions.mjs` | Writes the location permission entries into the native projects |

The native project folders, `ios/` and `android/`, are **not in the repo yet**.
They get generated once, on a Mac, by the commands below.

### First-time setup (do this once, on a Mac)

```bash
npm install
npx cap add ios          # needs Xcode
npx cap add android      # needs Android Studio
npm run cap:permissions  # writes the location permissions into both projects
```

Then commit the generated `ios/` and `android/` folders. They hold signing
config and app icons, so they belong in git. Their *build output* does not, and
`.gitignore` already excludes it.

### Every time after that

```bash
npm run cap:ios       # build the web app, copy it in, open Xcode
npm run cap:android   # same, opens Android Studio
```

`npm run cap:sync` does the build-and-copy without opening anything.

The rule to remember: **editing `src/` changes nothing in the app until you
sync.** If a change is not showing up on the device, you skipped the sync.

### Why there is a permissions script

Capacitor generates the native projects from a template that knows nothing about
what Comediq does. Location permission has to be declared per platform, in two
different files, in two different formats:

- **iOS** wants `NSLocationWhenInUseUsageDescription` in `Info.plist`, with a
  sentence explaining why. Apple shows that sentence in the permission prompt and
  rejects apps that leave it vague.
- **Android** wants `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` in
  `AndroidManifest.xml`.

Forgetting either one produces the same confusing symptom: the permission prompt
never appears and location silently fails. `npm run cap:permissions` writes both,
and is safe to run repeatedly. It only ever adds what is missing.

### How location works in each place

`readPreciseLocation()` in `src/utils/deviceLocation.ts` has two paths and one
return shape, so nothing calling it needs to care which it got:

- **Inside the app**, `Capacitor.isNativePlatform()` is true, so it goes through
  the native plugin. That asks for the real OS permission and reads real GPS.
- **In a browser**, it falls back to `navigator.geolocation`.

The check-in gate logic in `src/utils/micCheckin.ts` deliberately does **not**
import Capacitor. It is pure functions over numbers and dates, which keeps it
testable in plain Node with no browser and no phone.

### Offline in the native app

The service worker (see the offline section above) is a web mechanism. Inside
the native app it is mostly beside the point, because the app's HTML, JavaScript
and `mics.json` are **bundled into the app itself**. They load from local storage
on the device whether or not there is signal. The subway case is handled by
Capacitor for free on native, and by the service worker on the web.

One consequence worth knowing: because `mics.json` is bundled at build time, the
app ships with a snapshot of the mic list. A logged-in user still fetches live
data from Supabase when they have signal. A user with no signal sees whatever
was current when that app version was built, until they get online once.

### Before submitting to the stores

Not done yet, and worth being honest about:

- **Icons.** `public/manifest.webmanifest` currently points at one 256px logo.
  Both stores want a full icon set, and iOS wants a launch screen.
- **Apple Developer Program**, $99/year, required before anything reaches
  TestFlight or the App Store.
- **Google Play Console**, $25 one time.
- **Privacy labels.** Both stores ask what data the app collects. Comediq
  collects location (for check-in), email (for accounts), and usage analytics.
- **The rejection risk.** Apple rejects apps that are only a website in a
  wrapper. The defence is native capability the browser does not give you: the
  GPS check-in is the strongest one, offline use is second, and push
  notifications would be third once built.

---

## Premium, and the affiliate free year

### How someone becomes Premium

`create-checkout-session` opens a Stripe Checkout session in `subscription` mode
for the price in `STRIPE_PRICE_PAID`. `stripe-webhook` then decides access:

- It matches on **price id, not amount**, so a fully discounted subscription is
  still recognised as Premium.
- It grants access while the subscription is `active` or `trialing`.
- It revokes on `canceled`, `unpaid` or `incomplete_expired`. **`past_due` is
  deliberately absent**, so a failed payment keeps access during Stripe's retry
  window rather than cutting someone off on the first decline.

### The 100 affiliate comedians

The goal is a free year with no card, that turns into a paying subscription only
if they choose to continue. Two halves make that work, and both are required.

**In the code:** `payment_method_collection: 'if_required'` on the Checkout
session. Stripe only asks for a card when something is owed today. The promo
makes the first invoice $0, so those comedians never see a card field. Everyone
paying full price still owes $20, so they are still asked.

**In the Stripe dashboard**, which is not in this repo and has to be set by hand:

| Setting | Value |
| --- | --- |
| Coupon, percent off | 100 |
| Coupon, duration | Repeating, 12 months |
| Coupon, applies to | the Full Pass product |
| Promotion code, max redemptions | **100** |

`max_redemptions` is the only thing enforcing the cap. Nothing in this codebase
counts redemptions, so if that field is left blank the offer is unlimited.

### What happens at month 13

The invoice becomes $20, there is no card on file, and it fails. Stripe moves
the subscription to `past_due`, then to `unpaid` once retries are exhausted, and
the webhook revokes Premium at that point. The comedian keeps access through the
retry window and has to add a card to stay.

---

## Mic of the Month, and the Leaderboard

### The contest bar

A single static bar sits just above the bottom navigation, linking to the
public voting form. It is `src/components/MicOfTheMonthBar.tsx`.

Two things make it different from the ad strip it replaced
(`MarqueeBanner`, still in the repo but no longer rendered):

- **It does not move.** The ad strip scrolled its items as a marquee. This one
  is one fixed row with one destination.
- **Everyone sees it.** The ad strip hid itself from paying subscribers, since
  it carried ads. A community contest is not an ad, and subscribers should get
  to vote, so there is no subscription check.

It still hides on the auth screens and inside a mic signup flow, where a
floating bar would compete with the thing the page is asking you to do.

### Where the voting link lives

`src/config/micOfTheMonth.ts`, one constant:

```ts
export const MIC_OF_THE_MONTH_FORM_URL = "";
```

Paste the Google Form URL there and the bar points at it and opens in a new
tab. Leave it empty and the bar points at the leaderboard instead, and the
leaderboard's button reads "voting opens soon". The contest never advertises a
link that goes nowhere, which is the only reason the fallback exists.

### The Leaderboard

`/leaderboard` ranks open mics by **upvotes**: the up arrow on a mic card,
stored as a `like` in `user_mic_ratings`.

Counting happens in the `mic_like_counts` database view rather than in the
browser, so the page pulls one small aggregate instead of every vote row. Mic
details (name, venue, borough, day, time) come from the static `mics.json`
that the rest of the site already reads, so the only database traffic the
leaderboard causes is that one count query.

Two consequences of building it that way, both intended:

- A mic that is not on the site cannot appear on the leaderboard. Deactivated
  mics and mics still marked `pending` are absent from `mics.json`, so their
  votes are counted by the view and then dropped here.
- Mics with zero upvotes are not listed. The board shows what people voted
  for, not every mic in the city.

`/top-mics` now renders this same page. It used to be a hand-written list of
five mics frozen at `WEEK_START = '2026-07-06'`, which had been stale for
months. The route is kept so old links and shares still work.

---

## Why shows were missing from the Laugh map

The map itself was never broken. `AudienceShowsMap` plots a show from its
`latitude` and `longitude`, and every show in the database had neither, so it
showed the honest message it was written to show: "25 upcoming shows found, but
none have stored coordinates yet."

`scripts/geocode-audience-shows.mjs` existed to fill those columns and **nothing
ever ran it**. Same failure the seed workflow's own header warns about: a script
that runs only when somebody remembers to click Run is a script that does not
run.

`.github/workflows/geocode_audience_shows.yaml` now runs it three ways:

- after "Seed audience shows" finishes, so a freshly seeded batch gets
  coordinates immediately (chained on completion, not on the same push, so it
  cannot race the insert)
- every three hours, which is what catches shows added through the /add-show
  form or a scraper
- manually, with dry run defaulted on

No new secrets. The geocoder uses the free public ArcGIS endpoint and the
Supabase credentials the other workflows already use. Shows are read live from
`audience_shows`, not from a static export, so there is nothing to publish
afterwards: the map is right as soon as the job writes.

### Why a missing pin beats a wrong one

Two guards were added, because the job as written would happily invent
locations.

A show whose venue is "Venue TBA" with no address is not a place. Geocoding it
returns the centre of New York City, and the show then appears pinned to a real
spot somebody could walk to. Placeholder venue names with no address are
skipped.

ArcGIS also returns coarse matches: `Locality`, `Postal`, `Region`. Those mean
it resolved the city, not the venue, and they frequently score *higher* than the
real street match. Coarse types are now dropped before the best candidate is
chosen, so a city-centroid hit can never win. If nothing specific matches, the
show keeps null coordinates and stays off the map, which is the correct answer
for a listing people navigate by.

---

## Button text colour, and why it kept going wrong

The app is designed dark-first. Most surfaces are translucent panels over a dark
background, and components write `text-white` on them freely. Light mode then
has to undo that, so `src/index.css` carries a blunt rule:

```css
.light .text-white { color: #07111f; }
```

Every `text-white` in light mode silently becomes dark navy. That is correct for
a label on a pale translucent panel and wrong for a label on a solid blue button,
where the background stays saturated in both themes.

There was a matching bug on the dark side. The default button variant read:

```
bg-primary text-[#fff] hover:bg-primary/90 dark:text-[#000]
```

The `dark:text-[#000]` put black text on every blue primary button in dark mode.
Worse, it could not be overridden from outside: a consumer passing plain
`text-white` does not remove a `dark:` variant through twMerge, so even buttons
that explicitly asked for white text went black. The Login button in
`PageHeader` was the visible symptom.

Both sides are fixed now:

- `dark:text-[#000]` is gone from the button variant.
- A narrow exception in `index.css` keeps `text-white` white in light mode when
  it sits on a solid button fill (`bg-primary`, the blue family, and the orange,
  green and red fills used for the same kind of button). It is a more specific
  selector, so it beats the remap without touching it.

The broad `.light .text-white` remap stays. Removing it would need every
translucent panel in the app audited, and that is a much larger job than this.

If you add a new solid-fill button colour, add it to that exception list or its
label will turn navy in light mode.

---

## The mic popup: one card, two ways to read it

Tap a mic's name anywhere on the site and a sheet slides up over the page.

The layout is copied, deliberately and closely, from MicMap, a site that
republishes Comediq's mic data and credits Comediq as its source. They had
arranged the same facts better than Comediq did. The arrangement was worth
taking. The data and the colours are Comediq's.

### Reading down the sheet

1. **Top bar.** Close, a grab handle, share, and a heart that saves the mic.
2. **Pills.** The borough, in that borough's colour, then the verification badge.
3. **Title**, then one flowing grey line: `at **Venue** · address · neighborhood · Every Friday`.
4. **Audience / Performer**, a small pill switch sized to its own text.
5. **The Next card**, tinted blue. The date, the headline facts, a rule, the
   sign-up note, and the action pills, all inside the one card.
6. **Three buttons**: check in, add to calendar, get directions.
7. Then plain sections, separated by hairlines, no boxes: the facts for your
   view, UPCOMING, ABOUT THIS MIC, WHERE.
8. A footer: when it was last verified, and a link for the host to claim it.

### The Performer / Audience switch

**Performer** is the default, because most people on Comediq are comics. The
switch loads nothing new. It is the same mic, sorted differently:

| | Performer | Audience |
| --- | --- | --- |
| Under the date | `5 min sets · paid to play` | `7:30 PM - 9:00 PM · $5 cash` |
| The note in the card | how to sign up | that no ticket is needed |
| Action pills | Sign up for spots, I'm going | I'm going |
| Section title | BEFORE YOU SIGN UP | KNOW BEFORE YOU GO |
| Facts | set length, cost to play, house rules | cover, doors, house rules |

### The UPCOMING row

The next five dates this mic runs, the first one highlighted.

These are worked out, not stored, so the code only shows them when the
schedule genuinely pins them down:

- **Weekly** mics get the next five same-weekday dates.
- **"2nd Thursday of the month"** mics get the next five of those.
- **Bi-weekly** mics get *nothing*. Knowing which Tuesday is the live one needs
  a starting date, and we do not store one. Guessing is worse than silence.
- **One-off** and **custom** mics get nothing, for the same reason.

This lives in `src/utils/micOccurrences.ts`.

### Also at this venue

Under WHERE, the other mics at the same venue, six maximum, as inline links.

Many venues run several mics under one name, so a list of six identical links
would be useless. When the other mic shares this mic's name it is labelled by
when it runs (`Wed 5:00 PM`); when it has its own name, that name is used with
the day after it (`BibbleBash 2 (Fri)`).

It matches on venue name against the mic list already in the browser, so it
costs no extra database requests.

### One accent, plus a borough label

MicMap runs a single red through its whole sheet. Comediq's single colour is
blue `#1a5fb4`: the switch, the Next card, the sign-up pill, the first date
chip, every link. In dark mode links lighten to `#8ec5ff` so they stay
readable on navy.

The borough colour is a **label, not a theme**. It appears in exactly two
places: the stripe across the top of the sheet, and the pill with the borough
name in it. This matters. An earlier pass ran the borough colour through
everything, which turned every Brooklyn mic brown.

That colour table used to live inside `OpenMicsDetailedList.tsx` where only
the cards could reach it. It now lives in `src/utils/boroughColors.ts` so the
card stripe and the popup can never drift apart.

Backgrounds are cream `#f5f2eb` in light mode and navy `#0d2244` in dark.

---

## Cleaning non-NYC mics out of the public Google Sheet

The public sheet linked from the site footer (`src/components/SiteFooter.tsx`) is
a hand-kept Google Sheet, not an export of the database. That distinction matters
and it trips people up.

The database in Supabase has a `city` column and an `active` column. The export
script reads both (see `scripts/export-mics.mjs`, which asks Supabase for
`active: "eq.true"`). So in the database, "only New York mics that are active" is
a one-line filter.

The Google Sheet has neither column. Its tabs are one per weekday, and the header
row is:

```
Open Mic | Day | Start Time | Latest End Time | Venue Name | Borough |
Neighborhood | Location | Venue type | Cost | Stage time |
Sign-Up Instructions | Host(s) / Organizer | Changes/updates | Last verified |
This Month's Changes | Other Rules | Reviews | unique identifier
```

There is no city column and no active flag anywhere in it. A filter written
against those names would quietly match nothing and look like it worked.

### So what tells you a sheet row is out of town

Only the `Location` text. A row for a Los Angeles mic reads
`2106 Hyperion Ave Los Angeles CA`, and a New York one reads
`17 Essex St, New York, NY 10002, USA`. That is the whole signal.

`scripts/apps-script/archive-non-nyc-mics.gs` is a Google Apps Script that uses
it. The rule is deliberately lopsided:

- If the location names a borough, "New York", "NYC", or the `NY` state code,
  the row stays. An NYC marker always wins.
- Otherwise, the row moves only on a clear out-of-town hit: another metro name
  like Los Angeles or Burbank, or another state code like `CA`, `PA` or `SC`.
- Anything else stays.

That last point is the important one. Rows like `242 East 14th Street 10003`,
`50 Avenue B` and `Secret location` name no city and no state. They are all real
NYC mics, and defaulting to "keep" is what saves them. A script that deleted
whatever it could not confirm would take all three.

Matched rows are appended to an `Archive - Non NYC` tab before they are deleted,
with the tab they came from in the first column, so a wrong match can be pasted
back. Deletion runs bottom-up so earlier row numbers stay valid as rows are
removed.

The script has two entry points. `previewNonNycMics` only logs what it would
take. `archiveNonNycMics` does the move. Run the preview first.

### Why this is not run from CI

Nothing in this repo has write access to that spreadsheet, and the deploy
environment cannot reach Google directly. The script is pasted into the sheet's
own Apps Script editor (Extensions > Apps Script) and run from there, by the
sheet's owner. Keeping it in the repo is just so the rule lives next to the
export script it complements, rather than only in a browser tab.

---

## Signing up: no plan to choose first

`/auth` used to open on a plan comparison. Full Pass at $20 a month on the
left, Basic at $0 on the right, and a small "Sign in" button underneath. To
make a free account you first had to read two pricing cards and work out that
the quieter one was the free one.

It now opens on the actual sign-in form. Three ways in, all of them free:

1. **Continue with Google.**
2. **Get a code emailed to you.** This one both signs you in and makes the
   account, because the code is sent with `shouldCreateUser: true`. There is
   no separate "sign up" to find.
3. **Sign in with a password**, for people who already set one.

### The plans did not disappear

They moved behind a link instead of standing in the doorway.

- `/auth?plans=true` still shows the comparison, now headed "Choose your plan"
  with a "Skip for now, just sign in" button under it.
- The two upgrade buttons that deliberately link there, on the home page and
  on the credit balance, still work exactly as before.
- A small "See Full Pass" link sits at the bottom of the sign-in page.

So anyone who wants to pay still can. Nobody has to decide about it before
making an account.

### One bug worth remembering

The shared block of sign-in controls was first written as a component declared
inside the `Auth` component. React treats a component declared during render
as a brand new type every time the parent renders, so it unmounts and remounts
the whole subtree. The email input would have been destroyed and rebuilt on
every keystroke, losing focus each time, which would have made the box
impossible to type in.

The fix is that it is a plain function returning JSX, called as
`{renderAuthMethods()}`. That inlines the elements into the parent's tree, so
React reconciles them normally and the input survives. The existing `Divider`
and `TierComparison` are declared the same risky way and get away with it only
because neither holds a cursor.

---

## Where you land after signing in, and the one question we ask

A comedian tried Comediq and said: after you sign up, the first thing you
should see is the mic list. The page he got instead meant nothing to him.

So two changes.

### Signing in lands on the mic list

`/auth` used to send people to `/` when nothing said otherwise. It now sends
them to `/perform`, which is the Find Mics list.

Only the default moved. When a link carries a `next` (a mic signup page
bouncing you through sign-in, say), that destination still wins.

### One question, over the top of the mics

New accounts get a small dialog: **Are you a comedian?** Answer yes and a
slider asks how long you have been doing it, 0 to 10, where 10 means 10 or
more. Answer no and that is the end of it.

It is a dialog rather than a page on purpose. The mic list is already loaded
behind it, so answering costs no navigation and nobody gets parked on a form.

Where the answers go:

| Answer | Column on `profiles` |
| --- | --- |
| Not asked yet | `is_comedian` is `NULL` |
| Yes | `is_comedian` true, `years_performing` 0 to 10 |
| No | `is_comedian` false |

`years_performing` already existed and already shows on comedian cards and the
profile editor, so the slider fills a field the app was using.

**The prompt is driven entirely by `is_comedian` being NULL.** Answer it once,
either way, and it never comes back. "Not now" hides it for the browser
session only, so it asks again next visit.

### Two things worth knowing

**The migration has to be applied.** The column arrives in
`supabase/migrations/20260925000000_profiles_is_comedian.sql`. No new RLS is
needed, because "Users can update their own profile (except admin status)"
already covers a column that is not `isadmin`.

**The app survives that migration being late.** Asking Postgres for a column
it does not have fails the whole row, and that row also carries `isadmin`,
`subscription_plan` and `credits_balance`. Without a guard, shipping this
before the migration would have silently stripped admin rights and downgraded
every subscriber. So `fetchProfileAccess` in `AuthContext.tsx` retries without
`is_comedian` when the first select errors, and reports the answer as already
given. One request normally, two only while the database is behind, and the
worst case is the prompt staying hidden instead of everyone losing their plan.

### A stray slider thumb, fixed

`src/components/ui/slider.tsx` hardcoded two thumbs. That is right for the
cost range filter in `MicFilters`, which passes two values, and wrong for any
single-value slider: a second thumb sat parked at the minimum. It now renders
one thumb per value, so both work.

### The old onboarding page is gone

`src/pages/Onboarding.tsx` asked a three-way role question and wrote to
`user_onboarding_responses`. It could never be reached: `needsOnboarding` was
hardcoded `false`, so the page bounced every visitor on arrival. Making that
flag mean something would have exposed a stale flow that asks different
questions and never sets `is_comedian`, leaving the new prompt nagging
forever. The page and its route were removed.

---

## Signing up: a bare door, then one questionnaire

There are two screens and they do different jobs.

### The door: `/auth`

**Continue with Google**, or an email box and *Send me a code*. That is the
whole page. No name, no role, no sliders.

The emailed code runs with `shouldCreateUser`, so the one box both makes an
account and signs an existing one back in. There is no separate signup to
find.

Anything more here is a reason to leave. Someone who has not decided to join
yet should not be looking at a wall of questions.

### The questionnaire: a dialog on the first signed-in load

Once there is an account, one dialog asks everything, then never comes back.

It lives here rather than on the door for two reasons. Signing in with Google
never touches the signup form, so anyone arriving that way was skipping every
question. And the questions only make sense once someone has actually joined.

The name box and the Comedian / Audience choice show first. **Nothing else
appears until they pick**, so the dialog opens short.

| Picks | Then asked | Lands on |
| --- | --- | --- |
| Comedian | Instagram, years doing comedy 0 to 10+, weekly mic spend $0 to $150+, affiliate opt-in | `/perform` |
| Audience | Comedy shows a year, 0 to 20+ | `/laugh` |

Affiliate reads: *I will post one Comediq story a month, to be considered for
shows and bookings.* Off by default.

Audience members are never asked for Instagram, years or spend. They have no
answer to give, and reaching comedians is the point of collecting a handle.

### What makes it appear, exactly once

`profiles.is_comedian` being NULL. Nothing else.

Answer it, either way, and the column is no longer NULL, so a returning user
signs in and goes straight into the site. Closing the dialog without
answering hides it for that browser session only.

Each path writes only its own columns, so `shows_seen_per_year` stays NULL for
every comedian and `years_performing` stays NULL for every audience member.
NULL means never asked, which is not a zero somebody gave.

### Where the answers live

| Answer | Column |
| --- | --- |
| Name | `profiles.stage_name` |
| Comedian or audience | `profiles.is_comedian` |
| Instagram | `comedian_social_links`, `platform: 'instagram'` |
| Years doing comedy | `profiles.years_performing` |
| Weekly mic spend | `profiles.weekly_mic_spend_usd` |
| Affiliate opt-in | `profiles.affiliate_interested` |
| Shows seen a year | `profiles.shows_seen_per_year` |

The write is an upsert, not an update. AuthContext creates the profile row in
its own effect, and an update against a row that does not exist yet matches
nothing and reports no error, so the answers would vanish and the Instagram
row would fail its foreign key.

### Why the input fields have no icon box

An input inside a `<form>` gets its background forced by a global rule in
`index.css`:

```css
form :where(input:not([type="checkbox"])…) {
  border-width: 0 !important;
  background-color: rgb(255 255 255 / 0.1) !important;
}
```

The fields used to be a flex row: a wrapper painted `bg-white/10` with an icon
sitting in it, then the input beside it. Both layers painted the same
translucent white, so the input area stacked to roughly 0.19 while the icon
gutter stayed at 0.10. The result was a visible darker square under the icon,
on a field that should read as one surface.

`bg-transparent` on the input could not fix it, because that global rule wins
on `!important`.

So there is no gutter any more. The wrapper is transparent and carries only
the border and the focus ring. The input paints the whole width. The icon is
positioned absolutely on top of it with `pointer-events-none`, so clicking it
still lands in the input.

Sampling real pixels across a field now gives `28,34,42` the whole way, give
or take one unit at the rounded corners.

The same shape is used on the door's email box and on the name and Instagram
boxes in the onboarding dialog. The dialog's inputs are not inside a `<form>`,
so nothing forces their background; `bg-white/10` on the input gives the same
value either way, which is why one set of classes covers both.

### Three migrations, none optional

| File | Columns |
| --- | --- |
| `20260925000000_profiles_is_comedian.sql` | `is_comedian` |
| `20260925120000_profiles_weekly_mic_spend.sql` | `weekly_mic_spend_usd` |
| `20260925180000_signup_audience_and_affiliate.sql` | `shows_seen_per_year`, `affiliate_interested` |

None needs new RLS: "Users can update their own profile (except admin
status)" already covers any column that is not `isadmin`.

**Until `is_comedian` exists the dialog never appears at all.**
`fetchProfileAccess` in `AuthContext.tsx` retries without the column and
reports it as answered, which is deliberate: a missing column fails the whole
row, and that row also carries `isadmin`, `subscription_plan` and
`credits_balance`, so without the guard a late migration would strip admin
rights and downgrade every subscriber. The cost is that the failure is silent.

---

## How time-block signup works

Comediq already had one way to sign up for an open mic: a single numbered
list, first come first served (there is also a lottery and a bucket-draw
mode for the same list). This is a second, different way to sign up, called
time-block mode, and only one pilot mic uses it so far.

**What a slot is.** Instead of one long list, the night is cut into named
time blocks, like 7:00pm, 7:10pm, 7:20pm. Each block has room for a few
people. You are not number 14 in a line, you are "in the 7:10 block."

**What happens when you press Sign up.** The page asks the database, right
then, "is there still room in this block?" If yes, you are added and the
button changes to "You're in" with a "Cancel my spot" option. If someone
else took the last spot a half second before you, you get a clear "that
slot is full" message instead of both of you thinking you have the spot.
Nothing is decided in the browser, the database itself checks and locks the
spot, which is what makes this safe even if two people tap Sign up on the
same block at the exact same time.

**What the host sees.** The mic's claimed host (and Comediq admins) can open
a plain table: which block, which comedian, in order. Nobody else can see
that table, not even other logged-in comedians.

**Where the data lives.** Everything reuses the tables the original list
mode already had:

- `mic_hosts` gets one new column, `slug`, a stable link like
  `/mic-slots/chuckles-mon` that a host can share. Only hosts who turn on
  time-block mode get a slug; every other host row is exactly as private as
  before.
- `mic_signup_events` (one row per night) gets new columns for time-block
  mode only: `slot_minutes` (how long each block is), `spots_per_slot`,
  `slot_count` (how many blocks), `min_signups` (stored, not enforced yet),
  `signup_rules` (the text shown above the blocks), and the mic and venue
  name written directly onto the row. That last part is deliberate: the
  signup page never has to look up the mic in the big 400-plus row mics
  table, it only ever reads this one event.
- `mic_signups` (one row per person per night) gets one new column,
  `slot_start`, which block they picked. The legacy list mode leaves this
  blank and is not touched by any of this.
- Two database functions do the real work: `get_time_block_slot_counts`
  (how many spots are left in each block, no names, safe for anyone to
  call) and `signup_for_mic_slot` (the one that actually takes a spot,
  locks the row, and checks capacity before it lets the insert through). A
  third, `get_mic_slot_host_view`, is the only way to read names, and it
  checks the caller is that mic's verified host or an admin before it
  returns anything.

**Not built yet.** A host screen for opening next week's signup sheet (right
now that is a manual database insert), payments, texts or emails to hosts,
the Wednesday auto-open of unfilled slots, auto-cancelling a mic under its
minimum signups, and the cancelled-mic story card. `min_signups` is stored
so a later phase can use it, nothing reads it yet.

---

## Summarize

### Session: nav lives in the app, not the website

`BottomNavigation.tsx` now returns `null` unless
`Capacitor.isNativePlatform()` is true, same check `deviceLocation.ts`
already used to split native from web. The floating pill nav (Home,
Perform, Laugh, Profile, Search) only renders inside the Capacitor app
shell; the website no longer shows any nav bar.

### Session: time-block mic signup (pilot)

**What shipped.** A second signup mode, time-block, alongside the existing
first-come list. New page at `/mic-slots/:hostSlug` (`MicSlotSignup.tsx`):
shows the next date, the host's rules text, and a list of named time blocks
with spots left, a Sign up button, and Cancel my spot if you already have
one. A host/admin-only panel on the same page lists who is signed up for
each block. Logged-out visitors go through the existing `/auth?next=`
flow and land back on the same page.

**Why a new page instead of extending `MicSignup.tsx`.** That file is the
working, live, numbered-list signup sheet. Time-block mode is a different
shape (named blocks with their own capacity, not one ordered line), so it
got its own page and its own small API module
(`src/api/micSlotSignup.ts`), and the legacy page was not touched.

**Database.** One migration,
`20261019120000_mic_signup_time_blocks.sql`, entirely additive: a new
`time_block` value on the existing `signup_mode` enum, new nullable columns
on `mic_signup_events`, `mic_hosts` and `mic_signups` (see "How time-block
signup works" above), one new RLS policy (host rows become readable once
they have a public `slug`, every other host row is unaffected), and three
new Postgres functions (`get_time_block_slot_counts`,
`signup_for_mic_slot`, `get_mic_slot_host_view`). Nothing existing was
altered. Not yet run against the database, by design, Adam runs migrations
by hand.

**Points.** Reused the existing one-line `awardPoints('mic_signup', ...)`
call, same as the legacy signup flow. No ledger changes.

**Egress.** The signup page makes four small, scoped reads (host row by
slug, one event row, a counts-only RPC, the viewer's own signup row) and
never touches `open_mics_historical` or the full mics list. Estimated
under 1KB per page view; see the session's PR description for the
calculated breakdown, since the real number could not be measured until
the migration runs.

**Pilot only.** No existing mic had `signup_enabled` or `slots_enabled`
changed. Exactly one mic, set up by hand with a separate SQL script, uses
time-block mode so far.

**Not built.** Host UI to open next week's event (manual SQL for now),
payments, host texts or emails, Wednesday auto-open, auto-cancel under
`min_signups`, cancellation story cards. All deliberately deferred to a
later phase.

**Verified.** `tsc -b` and `npm run build` both clean.

### Session: steady icons on mic cards

The action row under every mic (`src/components/mic/MicActionBar.tsx`) is now
three slots: votes on the left, Register in the middle (only when the mic has
a signup link), and Instagram, map, confirm, report and share fixed on the
right. A mic with no Instagram gets a blank spacer in that spot, so the icons
sit in exactly the same place on every card.

### Session: Perform tabs only for signed-in users

The Find Mics / My Mics tab row on /perform (`src/pages/Perform.tsx`) now
only shows when someone is signed in. Signed-out visitors always land on
Find Mics, even if My Mics was the last tab they opened. For signed-in users
the tab row gets a thin 6px gap under the header so it no longer touches it.

### Session: website stops asking for location

The map on the homepage and /open-mics used to pop a "use your current
location?" prompt as soon as it loaded. Now `LocationService` in
`src/components/map/LocationService.ts` just answers "Union Square,
Manhattan" on the website, so no prompt ever shows. The native app still
reads real GPS. The "I went up" check-in (`src/utils/deviceLocation.ts`)
still asks for real location when someone taps it, because faking that
would let anyone check in from home.

### Session: centered hero on tablet widths

Between 640px and 767px wide the hero photo drops below the text, which left
the text hugging the left edge with empty space on the right. In that range
only, the hero text, mascot row, buttons and links are now centered. Phones
(under 640px) and desktop (768px and up, photo on the right) are unchanged.

### Session: Mic of the Month reskinned, no logic changes

**What shipped.** Pure visual pass on `/leaderboard` to match
`MotmMobile.dc.html`: flat rows separated by a top border instead of glass
cards, big accent colored rank numbers for the top 3, square icon vote
buttons (cream when voted) instead of a small pill, and stat chips (votes
so far, mics ranked) in place of the single colored instruction banner.

**Left alone on purpose.** The vote mutation, rank calculation, the
search-to-vote-on-an-unranked-mic flow, and the practice vote, none of
that changed. Also skipped the handoff's "You voted for N" chip, since
counting a user's own votes across the board is new logic, not a reskin.

**Removed.** The per-row borough color-coded left border. Visual only, not
part of the voting logic, and not in the handoff's plain row design.

**Verified.** `tsc` and `npm run build` both clean.

### Session: one Home for everyone

**What shipped.** `Index.tsx` now always renders `Landing.tsx`, signed in or
not, matching screens/Mobile.dc.html, which has no separate signed-in
layout. Deleted `src/components/Home.tsx` (the old dashboard: streaks,
borough analytics, next 7 days, quick actions, growth opportunities) and
the `/home` route, which now redirects to `/`.

**Not a data loss.** Every number on that dashboard came from Supabase and
from a Profile tab link (`?tab=saved`, `?tab=liked`, `?tab=signups`,
`?tab=playlists`) that still works exactly as before. The dashboard was a
second place to see that data, not the only place it lived.

**Also.** Landing's header now hides Log in once a user is signed in, adds
a `+ Listing` pill to the desktop nav to match Main.dc.html, and its mobile
menu is the same shared `HamburgerMenu` every other page uses instead of a
second, simpler dropdown it used to carry on its own.

**Verified.** `tsc` and `npm run build` both clean. Bundle size dropped
about 58kb from removing Home.tsx's recharts analytics code.

### Session: Laugh redesigned to match the comedy club handoff

**What shipped.** `AudienceShows` now features the next upcoming show in a
big photo hero (`FeaturedShowHero.tsx`) with Next up, RSVP, Tix, LaughPass
and Share, then groups the rest of the list by month under a plain header.
Reused the existing RSVP, ticket purchase and LaughPass logic (the last two
already honest "coming soon" toasts) instead of writing a second copy.

**Left alone on purpose.** `AudienceShowCard`'s own row layout. The handoff
shows a day/date/month block per row; the existing card already carries the
date, venue and every real action, so a full rebuild was not worth the
regression risk under "smallest change per file."

**Verified.** `tsc` and `npm run build` both clean.

### Session: Perform redesigned to match the comedy club handoff

**What shipped.** `MicActionBar` now shows like and dislike as two separate
counts (hidden at zero, not a combined score pill), added a host Instagram
button, and restyled the sign-up link into an accent colored Register pill.
Replaced three separate calendar actions (schedule, Google Calendar link,
download iCal) with one Add to calendar button opening a new bottom sheet,
`CalendarSheet.tsx` (Google, Apple, Other .ics), backed by a shared
`src/utils/micCalendar.ts` instead of a second copy of the date math. Day
tabs now show the date number under each day (Thu 15, Fri 16).

**Also.** `MicMiniMap` is now a lazy import behind Suspense, only requested
once someone taps Show map. Mapbox itself still ships in the main bundle
regardless, `src/components/map/index.ts` imports it statically for other
screens, that is a separate, bigger fix.

**Left alone on purpose.** The mic row's two column layout. The handoff shows
a strict time-first column; the existing row already surfaces time, name,
venue, stage time, cost and verified status, and reworking a 679 line
component's geometry was more regression risk than the gap was worth.

**Verified.** `tsc` and `npm run build` both clean.

### Session: mascot in the hero, one shared header logo

The homepage hero now puts the cartoon mascot (`public/landing/character.png`)
to the right of the big "Comediq" title. Every header (landing nav, landing
footer, and `PageHeader` on pages like /open-mics) now uses one component,
`src/components/Wordmark.tsx`: cream Q logo plus "Comediq" in wide Archivo
(110%). Change the logo there and it changes everywhere.

### Session: the seam under the email icon

**What it was.** The icon sat in its own flex cell on a `bg-white/10` wrapper,
and the input beside it painted `bg-white/10` again on top. Two translucent
layers where there should have been one, so the icon's cell read as a darker
square against the rest of the field.

**Why the obvious fix did not work.** `index.css` forces the background of any
input inside a `<form>` with `!important`, so `bg-transparent` on the input
was ignored.

**The fix.** No gutter. The wrapper is transparent and holds only the border
and focus ring, the input paints the full width, and the icon is absolutely
positioned over it with `pointer-events-none`.

**Verified by sampling pixels, not by looking.** Screenshotted the field,
decoded it in the page with a canvas, and read 24 points across a row clear of
the placeholder text: `28,34,42` all the way, with a one-unit drift only at
the rounded corners.

**Also.** The affiliate checkbox was a native control, which paints a pale
square on navy when unchecked. Swapped to the app's own `Checkbox`, and
re-ran the signup flow to confirm `affiliate_interested: true` still reaches
the database.

### Session: moving the questions to after the door

**The feedback.** The signup page opened on a role picker, a name box, two
sliders and a checkbox. Intimidating for someone who has not joined yet.

**What shipped.** `/auth` is now Google plus an email box, nothing else. Every
question moved into one dialog that appears on the first signed-in load and
never again.

**This also closed a hole.** Signing in with Google never passed through the
signup form, so anyone arriving that way answered nothing at all. Both routes
land in the same dialog now, because the trigger is `profiles.is_comedian`
being NULL rather than anything about how they signed in.

**The dialog opens short.** Name and the Comedian / Audience choice only.
Everything else is hidden until they pick, so nobody sees sliders they will
not be asked about.

**Deleted.** The sessionStorage stash that carried answers from the pre-auth
form through code verification. The account exists before any question is
asked now, so there is nothing to hold.

**Verified.** Four cases driven in a browser against a stubbed Supabase: the
signed-out door has one input, no sliders and no role buttons; a new comedian
writes name, is_comedian, years, spend, affiliate and an Instagram row and
lands on /perform; a new audience member writes only name, is_comedian and
shows_seen_per_year with no social row and lands on /laugh; and a user whose
is_comedian is already set sees no dialog at all.

### Session: splitting signup into comedian and audience

**Why.** The first cut asked every new account how many years they had been
doing comedy and what they spend on open mics. An audience member has no
answer to either, and their Instagram is of no use to us.

**What shipped.** The form opens on a Comedian / Audience choice, defaulting
to Comedian, and swaps its fields. Comedians get Instagram, two sliders and an
affiliate opt-in. Audience members get one slider, shows seen a year. Each
path writes only its own columns and lands on the page that suits it,
`/perform` for comedians and `/laugh` for audience.

**The affiliate opt-in** is a checkbox reading "I will post one Comediq story
a month, to be considered for shows and bookings", stored on
`profiles.affiliate_interested`.

**Verified.** Drove a browser through both paths against a stubbed Supabase
and read the request bodies. The audience path sends no Instagram row at all
and no `years_performing`, `weekly_mic_spend_usd` or `affiliate_interested`;
the comedian path sends all four plus the social link. Both at phone and
desktop widths. `npx tsc -b` and `npm run build` clean.

**Still needs applying.** All three signup migrations are on main and none has
reached the database. Until they do, the answers are dropped silently, by
design, because the guard that keeps a late migration from wrecking admin and
subscription state also swallows the error.

### Session: landing on the mics, and asking who is a comedian

**Why.** A comedian's feedback after trying the site: the first thing you see
after signing up should be the mic list.

**What shipped.** `/auth` now defaults to `/perform` instead of `/`, honouring
an explicit `next` as before. And a one-question dialog over that page asks
whether you are a comedian, with a 0 to 10+ slider if you are. Answers land on
`profiles.is_comedian` and the existing `profiles.years_performing`.

**The guard that mattered most.** The new column is read in the same select
that carries `isadmin`, `subscription_plan` and `credits_balance`. Postgres
fails the whole row for one unknown column, so shipping the code before the
migration would have stripped admin rights and downgraded every subscriber.
`fetchProfileAccess` retries without the column and treats the question as
answered, so the only casualty is a hidden prompt. Proved by stubbing a 42703
error and checking a premium account still rendered `subscriber-layout`.

**Two bugs found on the way.** The shared `Slider` hardcoded two thumbs, so
every single-value slider had a stray one parked at zero; it now renders one
per value, which keeps the two-thumb cost filter working. And making
`needsOnboarding` real would have un-buried `pages/Onboarding.tsx`, a
three-way role form that bounced every visitor while the flag was hardcoded
false and that never sets `is_comedian`; it was removed.

**Verified.** `npx tsc -b`, a production build, and a browser driven against a
stubbed Supabase across three profile states (never asked, already answered,
column missing) plus both redirect cases. Checked the slider reads "Just
started", "2 years" and "10+ years" at its ends, and that the dialog renders
dark on dark.

**Needs applying.** `supabase/migrations/20260925000000_profiles_is_comedian.sql`
has to reach the database before the prompt can appear.

### Session: taking the paywall out of the front door

**What shipped.** `/auth` lands on the sign-in form instead of a $20 vs $0
plan comparison. Google, an emailed code, or a password, all free, with the
code path creating the account on the spot. The plan comparison still lives at
`/auth?plans=true`, which is where the home page and credit balance upgrade
buttons already pointed, so the paid path is untouched.

**Also.** The Google and password buttons were styled for a light card and
rendered grey-on-grey in dark mode. They were only on `/auth/sign-in` before,
which few people saw. They are the front door now, so they got dark variants.

**The bug caught before it shipped.** The shared sign-in controls were first
written as a component declared inside `Auth`. React remounts a
render-declared component's whole subtree on every parent render, so the email
input would have lost focus on every keystroke. Rewritten as a plain render
function. Verified by driving a real browser: typed sixteen characters and
asserted the input was still `document.activeElement`.

**Verified.** `npx tsc -b`, a production build, and Playwright runs over
`/auth`, `/auth?plans=true` and `/auth/sign-in` in both themes, checking the
headings, the buttons on each, and that the plan cards appear only where they
should.

### Session: the mic popup, rebuilt

**What shipped.** `MicDetailModal.tsx` rewritten as a mobile sheet copying
MicMap's layout: a Performer / Audience switch, a Next card holding the date,
the sign-up note and the action pills together, three check-in / calendar /
directions buttons, hairline-separated fact sections, an upcoming-dates row,
and cross-links to other mics at the venue. Same props, so `OpenMics.tsx` and
`Profile.tsx` were not touched.

**The first attempt was an interpretation, not a copy.** It kept Comediq's
habit of wrapping every section in its own bordered card, made the switch a
full-width 50/50 grid, and promoted "I'm going" to a large standalone button.
The result read as generic. The fix was to copy the structure literally:
sections separated by hairlines rather than boxed, the switch sized to its own
text, the action pills demoted into the Next card, facts as icon plus bold
line plus quiet sub-line, and the three buttons carrying their full two-line
labels.

**Nothing new had to be built.** GPS check-in, the signup route, ratings, the
calendar builders and the mic list all already existed and were simply buried.
The one new piece is `micOccurrences.ts`, about eighty lines of date maths.

**Two rules that kept it honest.** The upcoming-dates row only appears for
schedules the data pins down, so bi-weekly mics get no strip rather than a
plausible wrong one. And the borough colour is confined to the top stripe and
its pill, after a pass that ran it through every element and turned Brooklyn
mics brown.

**Verified.** `npx tsc -b` (the real typecheck, not `--noEmit`), a production
build, and screenshots of both views in both themes against live `mics.json`,
including a Brooklyn mic to prove the accent split holds. The occurrence maths
was checked separately against known 2026 dates, including month boundaries
and "last weekday of the month".

**Note.** `npx eslint` is broken repo-wide, on untouched files too: a version
mismatch between ESLint 9.39 and the TypeScript plugin's
`no-unused-expressions` rule. Not caused by this change, but lint is not
currently a usable check.

### Session: Mic of the Month contest and the upvote leaderboard

**What shipped.** A static bottom bar linking to the public voting form, and a
real `/leaderboard` ranking mics by upvotes, replacing the frozen Top Mics
list. "Top Mics" in the hamburger menu is now "Leaderboard".

**The metric is upvotes, not uploads.** The first reading of the request was
file uploads per mic, which would have meant a new table, a storage bucket and
moderation. It is the up arrow already on every mic card, which was already
being collected and already aggregated by the `mic_like_counts` view. The
build went from weeks to hours on that one clarification.

**A check that was checking nothing.** `npx tsc --noEmit` had been the
typecheck all session. The root `tsconfig.json` uses project references with
`"files": []`, so that command compiles zero files and always passes. The
correct command here is `npx tsc -b`. This was caught by an undefined `Trophy`
icon that the passing typecheck ignored and that `vite build` also ignored,
since esbuild transpiles without checking types. It would have crashed the
hamburger menu on every page in production.

**Still open.** The voting form URL is not set, so the bar falls back to the
leaderboard. Anonymous read access to `mic_like_counts` was not verifiable
from the repo, because the RLS policies on `user_mic_ratings` were created in
the Supabase dashboard rather than in a migration. If the leaderboard is empty
when signed out but populated when signed in, that is the cause.

### Session: recovering from the Lovable sync, then the UI cleanup

**The part that had to come first.** A commit on `main` called "Added mic data
to database" (912acc1) was a merge of a Lovable branch that had forked from an
older point, before PRs #114 through #124. The merge resolved every conflict in
favour of the stale Lovable side, so it quietly reverted 2,684 lines of shipped
work. Nothing about the commit message said so.

What it had undone, all of it now restored:

| Thing | What the merge did |
| --- | --- |
| `TABLE` in the mic apply script | Reset to `open_mics`, a table that does not exist, so every mic batch was a silent no-op |
| LaughPass copy | Reverted to the old "$40/mo, 4 free weeknight tix" |
| Affiliate promo | Lost its skip-card-collection path |
| Malev & Friends | Dropped from the audience shows seed |
| Offline mode | Deleted (`sw.js`, service worker registration, offline banner, web manifest) |
| Capacitor app wrapper | Deleted (`capacitor.config.ts`, permissions script, dependencies) |
| Mic check-in | Deleted (`micCheckin.ts`, `deviceLocation.ts`, its migration, most of `WentUpToggle`) |
| `documentation.md` | Cut from 645 lines to 184 |

**How it was fixed.** Reverting the merge against its first parent brought all
of it back in one commit, with no conflicts. The two edits Lovable actually
meant to make were then re-applied on top: the `/add-mic` route pointing at the
existing `AddMic` page, and dropping `MarqueeBanner` from the app shell.

**Worth knowing for next time.** A Lovable branch that forked before recent PRs
will clobber them on merge, and the commit message will not mention it. Check
the merge base before trusting a Lovable sync.

**Then the UI work.** Five changes:

1. **Laugh tab header condensed.** Tabs, search, map toggle and filters collapsed
   into one row flush under the site header. Measured at iPhone width (390px):
   four show cards now sit fully above the bottom navigation with a fifth
   peeking, against roughly one before.
2. **Perform got a visible tab row** (it had none) plus a new **My Mics** tab
   showing liked, saved and confirmed mics, and the same flush top padding.
3. **Perform is mics only.** The "Shows" section is gone from the mic feed.
4. **Laugh's map is an inline toggle** with a pin drawer, matching Perform,
   instead of navigating to a separate page.
5. **Blue buttons are white-on-blue in both themes**, fixing both the dark-mode
   `dark:text-[#000]` bug and the light-mode `.light .text-white` remap that
   nobody had noticed.

**How it was checked.** Both themes, at 390x844, in a real browser with the
shows API stubbed: card counts and element positions measured rather than eyeballed,
computed button colours read back from the DOM, and the map toggle driven by
clicking it to confirm it does not leave the page. Typecheck and production
build both clean. ESLint is broken repo-wide on an unrelated
`@typescript-eslint` version mismatch, which predates this work.

### Session: wrapping Comediq in Capacitor

**Where this picked up.** The previous session shipped offline mode and
GPS-verified check-in (PR #114, merged). This one adds the native shell that
turns comediq.us into an actual iOS and Android app.

**What shipped.** Capacitor 7 (`@capacitor/core`, `@capacitor/cli`,
`@capacitor/geolocation`), a deliberately minimal `capacitor.config.ts`, a
`deviceLocation.ts` module that reads GPS natively inside the app and through
the browser API on the web, three npm scripts, and a permissions script that
writes the iOS and Android location entries so nobody has to remember two
different file formats.

**One decision worth recording.** The first version of `capacitor.config.ts`
overrode the iOS and Android URL schemes to force `https://localhost`, on the
theory that a secure context was needed for geolocation. That reasoning was
wrong: on native, location comes from the plugin calling CoreLocation and the
Android location services directly, not from the web geolocation API, so the
scheme is irrelevant to it. Overriding a default that cannot be tested from CI
is a bad trade, so the override came out. The config is now defaults plus a
background colour.

**A structural choice.** `readPreciseLocation` moved out of `micCheckin.ts` into
its own `deviceLocation.ts`. That keeps `micCheckin.ts` free of any Capacitor
import, so the window and proximity logic stays pure functions over numbers and
dates, testable in plain Node with no browser and no phone. Everything native
lives behind one small module.

**How we knew it worked.** The permissions script was run against realistic
Capacitor-generated `Info.plist` and `AndroidManifest.xml` templates: both came
out valid (parsed back with `plistlib` and `ElementTree`), existing keys
survived, and a second run correctly changed nothing. The Capacitor web
geolocation path was driven in real Chromium with the browser's location spoofed
to a real venue from `mics.json`: 8 assertions covering platform detection, the
reading itself, accuracy passthrough, the proximity verdict at the venue, 55m
away and 5km away, and a denied permission producing a readable message. The
offline test from last session was re-run against the new build and still shows
all 407 mics with the network cut. `tsc --noEmit` and `vite build` pass clean.

**What is NOT done, stated plainly.** The `ios/` and `android/` folders do not
exist yet and cannot be generated here: they need Xcode and Android Studio on a
Mac. Nothing in this PR has ever been compiled into an actual app binary or run
on a real device. It is the wiring, verified as far as a Linux CI box can verify
it, and the first `npx cap add ios` is the moment that claim gets tested for
real. Icons, the Apple Developer Program enrolment, and push notifications all
remain ahead.

**Still outstanding from last session.** The check-in migration
(`supabase/migrations/20260908160000_verified_mic_checkins.sql`) has not been
applied to the live database yet. Until it is, `check_in_mic` does not exist and
the check-in button fails with an error toast. Nothing else is affected.
### Session: the second September host-update batch

A second round of host replies arrived after the manual batch was staged. The
useful part of this session was working out how little was actually left to do.

**Most of it was already staged.** `scripts/ingest/open_mic_updates.json` already
covered Sick Hat, Chewsday, Energizer Honeys, Freddy's, both Comedy in Harlem
mics, the Secret Mic answers, Oddball Matt, Feelings Anonymous, Partea Lab,
Thursdays at the Rib, Buddha, Comedy Mob, Girl Dinner and the Grisly Pear
rename. Re-deriving those would have produced duplicate edits fighting the
existing ones, so the batch was diffed against the live export first. Only three
things were genuinely missing: the Eiffel Tower time, the Social Club address,
and damonmillard1's two mics.

**The batch is staged, not applied.** `mics.json` still shows the old values, and
"Apply open mic updates" is `workflow_dispatch` only. Nothing reaches the
database until someone runs it. That is easy to misread as "already done".

**Migrations are the wrong tool here and this was the second time that bit.**
The first pass of this work was written as a SQL migration, and nothing in this
repo applies migrations, which is the same reason the September shows never
landed. It was thrown away and rewritten as entries in the JSON batch. If a
change needs to reach the open mics table, it goes through
`open_mic_updates.json` and the workflow, which is the only path holding a
service-role key.

**Two mics were staged as `status = 'pending'`** rather than guessed at.
damonmillard1 gave times, prices and signup rules but never named a venue, and
the export filters `status = neq.pending`, so those rows sit in the database
invisible until someone fills the venue in. Inventing an address would have been
worse than leaving them hidden.

**Left alone on purpose.** West Side Comedy Club's "no 2 5 or 7 this week" maps
cleanly onto their ten rows, but those are one-week skips rather than closures
and the week had already passed, so a dated note would have been stale on
arrival. Golden Pen was reported cancelled on 7/5 for a Friday 6pm slot, but the
only Golden Pen record is Sunday 5pm and was verified 8/4, a month after the
report, so it stays. bjhealy23's "not running until September or October" never
named a mic, and it is now September.

**Laughing Buddha dropped three slots.** The Saturday 3:00 PM and Saturday 11:30 PM
mics at The Buddha Room, plus the 9:45 PM Buddha mic at Rodney's, are deactivated
rather than deleted. Worth noting there is also a Saturday 9:45 PM mic at The Buddha
Room that stays active: "the 9:45" is ambiguous across that host's 41 listings, and
the one being dropped is the Rodney's slot, not the Saturday one.

**Still open.** Sick Hat and Partea Lab are carrying their final dates in their
display names rather than an end date the system understands. After 10/7 and
9/10 respectively, each needs a `removals` entry in the next batch. Nothing
schedules that.

### Session: offline mode and real mic check-in

**Where we started.** Adam asked what progress had been made toward putting
Comediq in the Apple App Store and Google Play. Honest answer: none. A search of
the codebase, the git history across all 40+ branches, and every pull request
turned up no Capacitor, no React Native, no PWA manifest, no service worker, no
store metadata. The only app-store-adjacent thing that existed was
`AppWaitlistSection.tsx`, an email capture form on the landing page that says
"Coming Soon" and writes to an `App_waitlist` table. So this was a start, not a
continuation.

**The three decisions.** Wrap the existing site in Capacitor rather than rewrite
it natively. Gate check-ins on GPS radius *and* a time window rather than trusting
the honour system. Do offline first, because being usable on the subway is the
thing that makes the app worth installing at all.

**What shipped.**

1. *Offline mode.* A hand-rolled service worker (`public/sw.js`) plus a web
   manifest, an `OfflineBanner`, and a `useOnlineStatus` hook. Three caches with
   three different strategies, described in the section above. No build plugin
   and no new dependency: the whole thing is about 120 lines of plain JavaScript
   that any future reader can follow top to bottom.
2. *Verified check-in.* `WentUpToggle` went from a one-tap honour-system toggle
   to a two-gate check: the browser decides whether the mic is running, and the
   `check_in_mic` database function decides whether you are standing at it. New
   columns on `user_mic_checkins` record the reading, the claimed accuracy, the
   real distance, and the verdict. The direct insert policy was dropped so the
   function is the only way in.

**How we knew it worked.** The offline path was driven in a real headless
Chromium: load once online, cut the network, reload. All 407 mics rendered from
cache with no page errors. The check-in gate logic got 22 assertions covering
midnight rollover, wrong days, couch check-ins, and sloppy GPS. The SQL was run
against a throwaway PostgreSQL 16 instance and exercised through eight cases,
including the one where someone claims 9,000 metres of GPS error to check in from
five kilometres away. It gets turned down.

**Known gaps, listed so nobody is surprised.** `npm run lint` is broken on `main`
and was already broken before this work: ESLint 9.39 and the installed
`typescript-eslint` plugin disagree about the shape of the `no-unused-expressions`
rule. It is a dependency version mismatch, not a code problem, and fixing it was
out of scope here. Separately, the manifest currently points at a single 256px
icon; the stores will want a proper 512px set with maskable variants before
submission.

**What is still ahead for the stores.** Capacitor itself is not installed yet.
The remaining work is: add `@capacitor/core` and the iOS and Android platforms,
swap the web geolocation call for the native one, add push notifications, produce
the icon and splash sets, and enrol in the Apple Developer Program. The offline
and check-in work done here is the substance that makes the wrapper worth
reviewing, since Apple rejects webview wrappers that offer nothing a browser
already does.

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

### Session: pruning the public mic sheet down to New York

The ask was to strip every row from the public Google Sheet that was not a New
York mic with `Active = TRUE`. Reading the sheet first turned up the catch: it
has no `city` column and no `Active` column. Those are Supabase column names,
and the sheet is kept by hand. Filtering on them would have matched nothing.

What the sheet does have is a `Location` column, so the filter was rewritten
against that. Checked against the live sheet, it flags 22 out-of-town rows:
nineteen around Los Angeles, plus Burbank, Rancho Cucamonga and Riverside in
California, one in Isle of Palms SC and one in Irwin PA. It leaves every row
carrying an NYC marker alone, and it also leaves the rows that name no city at
all, which are NYC mics that would otherwise have been lost.

Added `scripts/apps-script/archive-non-nyc-mics.gs`, which moves matched rows to
an `Archive - Non NYC` tab instead of deleting them outright, and has a
preview-only mode. It is run from the sheet's own Apps Script editor, because
nothing in this repo can write to that spreadsheet.

The `Active = TRUE` half of the request has no equivalent in the sheet and was
left alone rather than guessed at. The nearest thing the sheet has is the
`Last verified` column, which is free text.

### Session: variety mic tag, filter, and KGB room details

Adam asked for a "Variety" tag for mixed open mics, a filter for them, and the
Red Room detail on Easy Paradise. A new database column was the obvious design
and the wrong one here: nothing in this repo applies migrations, and the export
selects columns by name, so a column that does not exist yet would break the
nightly export. The tag lives in `legacy_tag` instead, the filter is one button
in `MicFilters.tsx`, and the three data changes are entries in the batch.

Easy Paradise now starts its details with "Held in the Red Room, on the 3rd
floor of KGB Bar." in `other_rules`, with the old text kept. The street address
was not touched, so no geocoding fields were cleared.

Not tagged: `Mixed mic!The Joy of Ranting` at the Windjammer. Its name says it
is mixed, but Adam did not list it.

### Session: the + button, "add a mic" for everyone

**What broke.** Tapping + and saving a mic showed an error about
`open_mics_historical`. The page wrote straight into that table, so it only
worked if the table's permission rules happened to line up for whoever was
logged in. Signed-out visitors have an insert rule but were never given the
actual permission to insert, and signed-in users had to pass a stricter check.

**The fix, in kid terms.** Instead of every visitor trying the front door of the
table, there is now a staff member at a desk: a database function called
`add_open_mic`. Anyone can hand them the form. They check the basics (name,
venue, day, start time), stamp the trusted parts themselves (status `trial`,
who added it, when), and put the mic in the table. Visitors cannot pick those
trusted parts.

**Showing it right away.** Signed-out visitors read a saved copy of the list
(`mics.json`) that only refreshes a couple of minutes after a change. Now the
list also asks the database for mics added in the last 30 days and merges them
in, so a new mic shows up for everyone immediately. The page also drops the new
mic into its own list and switches to the NEW tab, which sits between NEXT and
SUN.

**One manual step.** Nothing in this repo applies migrations. Run
`supabase/migrations/20261014120000_add_open_mic_rpc.sql` in the Supabase SQL
editor or the + button will keep failing.

### Session: bi-weekly mics hide on their off week

A bi-weekly mic runs every other week, but the site had no way to know which
week. It showed the mic every week. Now a bi-weekly mic can carry an "anchor",
any one date it runs, written at the end of its `frequency_custom_text` like
`anchor 2026-10-21`. The site counts in two-week steps from that date. On a day
tab (and in NEXT) the mic is hidden in the off week. No anchor means the old
behavior: always shown.

**The detail window shows the on-weeks too.** A bi-weekly mic with an anchor now
lists its next dates in the detail window (for example Oct 22, Nov 5, Nov 19),
and "Add to calendar" lands on a real on-week instead of today. Without an
anchor it still shows no dates, because guessing would be wrong half the time.

Anchors are set for 3 Sheets Comedy (anchor 10/21, it is off the week of 10/12)
and Thursdays at the Rib (anchor 10/8). Other bi-weekly mics still show every
week until someone tells us a date they ran. To add one, put `anchor YYYY-MM-DD`
in that mic's `frequency_custom_text` in `scripts/ingest/open_mic_updates.json`.

### Session: Brooklyn Improv and bi-weekly dates in the detail window

The Mic (`@themicattheimprov`) was listed at UCB in the East Village but runs at
the Brooklyn Improv in Williamsburg, 64 N 9th St. Its old pin was a generic
"New York" point near City Hall, so every location field was wrong. The geocoding
fields are nulled; **nothing in CI geocodes open mics, so `npm run
geocode:open-mics` still has to be run** to give it a real pin.

The bi-weekly anchor work from the previous session had also appended a second
batch entry for the same mic (Thursdays at the Rib). That breaks the one entry
per row rule, so the two were merged into one. Bi-weekly mics with an anchor now
show their upcoming on-weeks in the detail window.

### Session: new logged-out homepage

**What changed.** Signed-out visitors now see a redesign built from Adam's
Claude Design PDF (blue page, cream headlines, real photos). Signed-in users
still see the old `Home` screen. The new page lives in
`src/components/landing/` (`Landing.tsx` and `landing.css`). `Index.tsx` just
picks which one to show.

**How it works, in kid terms.** Think of the page as a stack of sections:
a top bar, the big "Comediq" intro, three numbers, tonight's mics, two big
doors (watch or perform), photos, a hosts box, and a waitlist button.

- **Tonight's mics are real.** The list is built from the same mic data the
  rest of the site uses. It keeps only mics that run today (it knows about
  monthly mics and bi-weekly anchors), sorts by start time, and hides ones that
  already started more than 30 minutes ago. The chips filter it: Free, and
  Beginner friendly (same venue list as the Beginner Friendly page). Tapping a
  row opens that mic's page. The little map loads later so the page paints fast.
- **Every button goes somewhere.** Perform, Laugh, Mic of the Month (the
  leaderboard or the voting form), For hosts (scrolls down), Log in, Browse
  shows, Find a mic, "See all N mics", Privacy, and the Instagram links.
  "Join the app waitlist" opens the existing waitlist form in a popup.
- **Pictures** were cut out of the PDF into `public/landing/`. They are
  screenshots of the design, so swap in the original photos when you have them.
- **Fonts**: Archivo (headlines) and Instrument Sans (body), loaded in
  `index.html`. They are the closest free match to the PDF, not the exact fonts.
- The old `Hero`, `Features`, `SponsorSection` and `ShowTNPromo` components are
  no longer used on the homepage. They were left in place, not deleted.
- The stats (1,250+, 500+, 4 scenes) are copied from the design, not computed.

### Session: Malev & Friends cancelled on Oct 24 and Oct 31

Both dates were removed from the show's `instance_dates` and listed under
`cancellations`, and the seed script learned how to cancel (see "Taking a show
off the Laugh tab"). It was tested against an in-memory fake of the table, not
the real database: a dry run changes nothing, a real run cancels exactly those
two dated rows and leaves a different show on the same date alone, and a second
run does nothing.

### Session: the "Find mics" button is back on the logged-in home

**What happened.** The logged-in home page used to have a one-tap button to the
mics. On Oct 3 an automatic "Reverted to commit..." from the Lovable bot rolled
`Home.tsx` back and deleted it. It was not part of anyone's recent edits, and
the later "put our work back" pass did not restore it.

**The fix.** A round blue button with the Comediq logo now floats at the bottom
right of the logged-in home page, just above the orange Mic of the Month bar.
One tap goes to `/perform`. It lives in `src/components/home/FindMicsButton.tsx`
and is added once at the top of `Home.tsx`. It hides itself when the phone
keyboard is open, like the other bottom bars.

**Watch out.** Lovable's "Revert" button rolls back whole commits and can
silently delete unrelated work, which is how this disappeared. Prefer a normal
git revert of the one bad change.

### Session: choose the dates when adding a bi-weekly, pop-up or custom mic

**The problem.** A host who picks Bi-Weekly, Custom or One-Off in the + add-a-mic
card never said which weeks or days. So the site could not tell people the mic
was off this week, and people showed up to the wrong week.

**The fix, in kid terms.** The card now asks. Pick the day first, then a small
calendar opens where only that weekday can be tapped.

- **Bi-Weekly:** tap the next date it happens. The card shows "Shows on: Oct 21,
  Nov 4, Nov 18..." so the host can see what the site will do. The site counts
  every two weeks from that date.
- **One-Off (Pop-Up):** tap the day, or several days.
- **Custom:** tap up to 12 dates, plus an optional short note like "1st and 3rd
  Thursday".

**How it is stored (no database change).** The dates are written at the end of
the mic's `frequency_custom_text`: `anchor 2026-10-21` for bi-weekly, and
`dates 2026-10-21,2026-11-04` for pop-up and custom. Helpers in
`src/utils/micOccurrences.ts` read them (`parseDateList`, `stripScheduleTags`).
The notes are capped at 60 characters so 12 dates always fit in the 200 limit.

**What the site does with them.** The Next tab, the day tabs (Wed and so on) and
the new homepage's "Tonight" list only show the mic on those dates. The mic
detail window shows the real next dates. Mics with no dates (older ones) behave
as before, so nothing already on the site disappears.

**Not done yet.** The older `/add-mic` page and the host request form still have
the old free-text box. The 1st and 3rd or 2nd and 4th week pattern is covered
by picking dates, not by a one-tap preset.

### Session: headshot upload failing

**What users saw.** After picking a photo on the profile page, the upload failed.
The message only said "Failed to upload headshot", and the browser console only
said "Headshot upload error" with no reason, so nobody could tell why.

**What we changed.**
- The reason is now shown. The toast and the console say which step failed
  (the photo upload to storage, or saving the link on the profile) and the
  exact error. If it fails again, the message points at the cause.
- The photo is shrunk first. Big phone photos (often 5 MB or more) are resized
  to at most 1024 pixels and saved as a JPEG, in the browser, before upload. If
  the browser cannot read the file (some HEIC photos), the original is uploaded.
- The file is always stored at `<user id>/headshot.jpg`, with a version added to
  the link so a new photo shows up right away instead of the old cached one.
- Upload and "save to profile" now happen as one step, so a half-finished
  upload cannot look like a full success.
- Wrong file types and files over 15 MB are rejected with a plain message.

**Still unknown.** If it keeps failing, the new message will say whether it is
storage (a rule on the `headshots` bucket) or the profile save (a rule on the
`profiles` table). Those rules live in Supabase, not in this repo's code.

### Session: one add-a-mic form, Laugh + in the toolbar, copy cleanups

**One form for adding a mic.** There used to be two very different forms: the
small card that opens from the green + on the Perform tab, and a long page
behind "Create a listing" in the menu. Now there is one. The "Create a listing"
page (`/add-mic`) shows the same small card with the same questions, so it fits
on one screen. Both save through one shared helper, `src/hooks/useAddMic.ts`
(the `add_open_mic` database function, the audit row, and putting the new mic on
screen straight away). After saving from the listing page you land on the Perform
tab with NEW open. The old long form is gone, so there is only one place to
change when a question changes.

**Laugh + moved.** The orange floating + on the Laugh tab is now a green + in the
top row, next to the filter button, in the same spot and style as the Perform +.
It still opens the add-a-show page (signed-out people go to log in first).

**Copy and cleanup.** "Questions or new mics?" is now "Questions or collabs? DM
@comediq.us", because we want people to add mics themselves. The "Try it, this
one does not count" practice mic on the Mic of the Month page is removed.

**Not changed.** The add-a-show form (`/add-show`) is a different kind of
listing and keeps its own questions.

### Session: simpler sign-up questions on the add-a-mic card

The card had two overlapping sign-up questions: a text box ("bucket pull, list,
etc.") and an "In-Person / Online / Comediq Slots / Other" dropdown. Now:

- **One box:** the hint says "[paste link here] or bucket or in person list".
  If the host pastes a link, the mic is saved as an online sign-up with that
  link. If they type words, it is saved as an in-person sign-up. No more second
  "https://..." box to fill in.
- **Lineup order dropdown** replaces the In-Person dropdown: Bucket / random,
  List in order of arrival, or Host chooses. It is optional. There is no new
  database column: the choice is added to the sign-up text as "Lineup: Bucket /
  random", so it shows wherever the sign-up instructions already show.
- The old dropdown also offered "Comediq Slots!". That option is gone from this
  card (it was already rarely the right answer for a new mic).

This card is shared by the + on the Perform tab and the Create a listing page,
so both changed at once.

### Session: glass bottom nav is back on the website, with a lava-lamp slide

**What happened.** The floating glass pill at the bottom (Home / Perform / Laugh /
Profile, plus the round search button) was added in the Oct 16 redesign. On
Oct 19 a commit ("Hide bottom nav on web, keep it native-app only") made it show
only inside the phone app, so on the website it vanished. It is back on the
website now. To hide it on the web again, put back the one line
`if (!Capacitor.isNativePlatform()) return null;` at the top of
`src/components/BottomNavigation.tsx`.

**The lava-lamp animation.** The highlight behind the selected button used to
jump from one button to the next. Now it is one soft blob that slides over:

- It uses a springy curve, so it slightly overshoots the button and settles back.
- It stretches wide and thin in the middle of the trip, then relaxes
  (the `lava-squish` animation in `src/index.css`).
- A blurred blue glow follows a split second behind it, which is the "lava" part.
- People who turn on "reduce motion" in their phone settings get no animation.

**The + buttons.** On a laptop the Laugh + sits in the top row with search, map
and filter, next to the Perform + style. Both are the same green + .

### Session: the new add-a-show form

**What changed.** `/add-show` (Create a listing, then A show, and the green + on the
Laugh tab) used to be a long form that asked for a weekday. It is now one
condensed card, like the add-a-mic card. Files: `src/components/EditableShowCard.tsx`
(the card), `src/pages/AddShow.tsx` (saves it), `submitShowListing` in
`src/api/audienceShows.ts`, `src/utils/showRecurrence.ts` (the date maths).

**What it asks.** Show name, venue, a **real calendar date** (not a weekday), start
time, doors time (optional), price, Instagram, ticket link, show type, a short
description, a picture, and whether the show repeats. No lineup order or stage
time, those are for open mics. A show still needs an Instagram or a ticket link.

**Repeating shows.** "One time only", every week, every 2 weeks, or every month
(same weekday and position, so a 1st Sunday show stays on the 1st Sunday). It
saves the way the Repeating shows section above describes: one hidden template
plus dated rows. It creates the next 8 weeks, 6 biweekly shows or 6 months up
front. Nothing creates more later, so a repeating show runs out of dates.

**The picture.** Shrunk in the browser (`src/utils/prepareImage.ts`) and uploaded to
the signed-in user's own folder of the public `headshots` bucket, because that
is the one place every signed-in user is already allowed to upload.

**LaughPass free ticket.** A checkbox: "Offer LaughPass members a free ticket", plus
how many free tickets per show. This is only **recorded** for now
(`laughpass_free_ticket`, `laughpass_ticket_limit`). LaughPass has no claim
flow yet, so nothing on the public site mentions it, on purpose, so we never
promise audiences a ticket that cannot be claimed.

**Confirm 1 day before.** A required checkbox: the host promises to confirm the
show is still on the day before each show (`confirm_active_agreed`). **The
reminders are not built yet.** Nothing emails the host, and nothing hides an
unconfirmed show. That needs a scheduled job and an email, and is the next piece
of work. `last_confirmed_active_at` is waiting for it.

**Needs one SQL step.** `supabase/migrations/20261021120000_show_listing_fields.sql`
adds the four new columns. Nothing in this repo applies migrations, so run it in
the Supabase SQL editor first. Until it is run, submitting a show tells the
person "Show listings are being set up" instead of saving.

**Still reviewed first.** New shows are saved unverified, so an admin approves them
before they appear on the Laugh tab. For a repeating show that means each dated
row. We do not ask the database to return the new row, because an unverified row
cannot be read by the person who submitted it, so asking for it back would fail.

### Session: day-before confirmation texts for mic hosts (built, not live)

**The idea.** The day before a mic, text its host "is it still on?". A YES marks the
mic confirmed and the card shows the date it was last confirmed (the "Verified
<date>" label already on every card). Full plan: `docs/HOST_TEXT_CONFIRMATION_PLAN.md`.

**What exists now, in kid terms.**
1. **The sign-up.** On the Host Dashboard a verified host sees a card to add their
   phone number and tick a consent box. Only verified hosts can, because their
   YES changes what the public sees. The number goes in a private table and is never
   put on the website's mic data.
2. **The mailman.** Every day around noon a GitHub job looks at tomorrow, finds the
   mics running then (it understands weekly, bi-weekly anchors, monthly and listed
   dates), and works out who to text. Weekly mics only get one text a month.
   Right now it only **prints** who it would text. It sends nothing, and writes
   nothing, until real texting is switched on.
3. **The answers.** A database function turns YES, NO or STOP into the right
   action: YES sets the confirmed date, STOP stops all texts.

**What is missing.** A texting company (the provider is not chosen), and the web
address the provider sends replies to. Until both exist, no text goes out and no
reply is read. The plan file has the go-live checklist.

**Safety.** The daily job is dry-run unless the GitHub variable `HOST_TEXTS_LIVE`
is `true`. It never texts someone who said STOP, never texts the same mic and
number twice for one date, and never texts about a mic whose dates it is only
guessing.

## Session: nav bar shine removed

- The bottom nav's selected button no longer has a glow or shadow behind it. It is
  just the cream pill that slides (the lava lamp motion is unchanged).
- Next: ShowTN "Next shows" menu (show of the night, this week, this month). It lives
  in a separate site, so it needs a read-only way to get shows from our database.

## Session: vote bar text and mascot side

- The bottom contest bar is now plain text, not a link: "Vote! by hitting like on good mics 👍".
- Home hero: on phones the mascot sits left of "NYC's comedy platform Comediq"; on desktop (md and up) it sits to the right.
