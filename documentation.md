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

Two more layout traps worth knowing.

The header is **not a fixed height** — the title and subtitle wrap, so it ranges from about 76px on a wide screen to 124px at 320px. `PageHeader` measures itself with a `ResizeObserver` and publishes `--nav-height`; `--page-top-offset` is then `calc(var(--nav-height) + 0.75rem)`. Do not replace that with a fixed number: a number small enough to look right on a laptop tucks content under the header on a small phone, which is exactly the bug this replaced. The top ad bar lives *inside* the nav, so reinstating it grows the offset automatically.

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

## The four buttons at the bottom

### What changed and why

The bottom bar used to be Home, Perform, Laugh, Profile, plus an Admin tab only Adam saw. It was a solid strip glued to the bottom edge. Two problems. Perform and Laugh were two doors into what is really one question ("what comedy is near me?"), and every page in the app was visible to anybody who typed the URL, so there was no reason to make an account.

It is now four buttons in a floating rounded pill: **Home, Map, My Comedy, Profile**. Admin is a fifth button that only appears for admins.

The pill is see-through, so the page scrolls underneath it. That is on purpose, it is how phone apps look now. It also means anything else stuck to the bottom of the screen has to be moved up out of its way, which is the boring part nobody remembers. There are three such things and they all had to be re-measured: the scrolling ad marquee, the drawer on the Open Mics page, and the unlock card on the map.

### The three rules the nav follows

1. **Which button lights up** is decided by a list of route prefixes per button, not a pile of if-statements. Map owns every mic and show page, so standing on `/open-mics` still lights Map. Add a new route to a section by adding one string to its `activeWhen` list in `src/components/BottomNavigation.tsx`.
2. **Profile changes where it points.** Signed in it goes to `/profile`. Signed out it goes to `/auth`, so the button is never a dead end.
3. **The nav hides itself** on the sign-in pages, on mic signup sheets, and whenever the phone keyboard is open.

## Who you are, and what that unlocks

### The one flag that matters

There is a true/false column on your profile called `approved_comedian`. It is the only thing standing between the small map and the big one.

- **Not approved** (nobody is logged in, or you signed up and are still waiting): the map shows **live comedy shows plus the five weekly top mics**. Enough to see the city is alive and buy a ticket tonight.
- **Approved**: the map shows **every open mic**, around 500 of them, and My Comedy starts tracking your sets.

Admins are always treated as approved. That is deliberate, so it is impossible to lock yourself out of your own map.

### Nobody lost access when this shipped

New columns start out false, and false means locked. If that had been left alone, every one of the 1,500 people who use Comediq each week would have opened the app and found the mic list gone.

So the migration does two things in a row: it adds the column, then it immediately sets it to true for every profile that already existed. Only accounts created *after* that moment start out pending. This is the whole reason `update public.profiles set approved_comedian = true;` sits in `supabase/migrations/20260909120000_add_approved_comedian_flag.sql` with no `where` clause. It looks like a mistake. It is not.

### Approving somebody

Admin tab, Comedians. It lists everyone waiting, oldest first, with an Approve button. That is the whole tool.

## The Map tab

One page, `src/pages/UnifiedMap.tsx`, with a Shows / Mics toggle at the top. It is deliberately thin. It does not draw a map itself, it decides *what data to hand to* the two map components that already existed, and it remembers which toggle you picked in your browser.

Where you land depends on who you are. Comedians open on Mics because that is their job. Everybody else opens on Shows, because that is the ticket.

The audience version of the Mics view is not a different map. It is the same map handed a shorter list: all the mics, filtered down to just the ones in this week's top five. Under it sits a card explaining what is behind the door, and the card says different things depending on whether you are logged out (make an account) or logged in and waiting (you are under review).

**The rule that never changes:** pins come from `latitude` and `longitude` columns already stored in the database. The browser never looks up an address. Geocoding happens ahead of time through the scripts in `scripts/`.

## The My Comedy tab

Three stacked lists in `src/pages/MyComedy.tsx`.

1. **Tickets.** Shows you paid for. Reads `ticket_purchases` rows marked paid.
2. **Upcoming.** Mics you said you are going to. Comedians only, hidden for everybody else because it would always be empty.
3. **My history.** Three numbers across the top (sets, venues, stage time) then every set you have tracked, newest first.

Logged out, this page does not bounce you anywhere. It shows a sign-in card. A tab that redirects the moment you tap it feels broken.

The history numbers come from `useMyComedy`, which is a separate hook from the Wrapped one on purpose. Wrapped only ever looks at a single year, and My Comedy needs your whole career.

## How buying a ticket works

Five steps.

1. You tap **Buy Tickets** on a show.
2. The app calls the `create-checkout-session` function with `mode: 'ticket'` and the show id. **It does not send a price.**
3. The function looks the price up itself, in the database, on the server. This is the important step. If the browser sent the price, anybody could edit it to one cent before hitting send.
4. It writes a `ticket_purchases` row marked **pending** and sends you to Stripe.
5. Stripe finishes, tells the webhook, and the webhook flips that row to **paid**. Now it shows up in My Comedy.

Shows without a price in our database still work, they just open the venue's own ticket link in a new tab instead. Most shows are currently in that state.

### Why this lives inside the subscription function

`create-checkout-session` already ran the $20/month Full Pass billing, and putting ticket sales in the same file means the risk of breaking live billing is real. It is guarded: without `mode: 'ticket'` in the request, the function runs exactly the code it always ran, untouched. The ticket logic is an early exit that happens before the subscription path ever starts. If subscriptions ever break, that guard is the first place to look.

## Summarize

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

### Session: the bottom nav redesign and the audience view

Four buttons instead of five sections, and the app split into two audiences: people who might buy a ticket, and comedians who need the whole mic list.

The interesting decisions were not the visual ones. Gating the mic list behind a new `approved_comedian` flag meant the default value was going to silently lock out every existing weekly user, so the migration grandfathers everybody in the same breath that it creates the column. Putting ticket checkout inside the function that runs live subscription billing was a deliberate call with a real risk attached, so the ticket path is an early exit that leaves the subscription code untouched when `mode` is absent.

Driving it in a browser earned its keep again. The floating pill is see-through, which looks right and immediately exposed that the marketing footer was showing through the full-bleed map, and that three separate bottom-anchored elements were all measured against the old 60px bar. The marquee, the Open Mics drawer, and the map unlock card all had to be re-measured against the new pill.

**Still open.** The `mic_signups` table is not yet read into the Upcoming list, only `profile_open_mics` is, so mics you signed up for through a host sheet do not appear there yet. Ticket checkout has not been run against real Stripe test keys from this environment. And the Mapbox token is not available in the sandbox, so the map was verified as a layout and not as pins on tiles.
