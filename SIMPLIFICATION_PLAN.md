# Strip Comediq back to three jobs

## Context

Comediq does one thing people need: tell a comedian where they can get stage time
tonight, and get them on the list. Around that core sit a lot of half-used
features. The mic card is a wall of buttons, Perform and Laugh are 12px labels in
a bottom bar, and the hamburger menu lists things nobody opens.

Adam's framing: **simple sign on, simple mic finding, simple mic sign up.
Everything else is clouding the useful stuff.**

**The good news: most of what he asked to build already exists and is switched off.**

- **Verified check-in with a GPS geofence is built.** `check_in_mic` in
  `supabase/migrations/20260908160000_verified_mic_checkins.sql` does haversine
  distance **in SQL**, so the browser cannot lie about it, against a **150 metre
  radius, which is 492 feet**. That is the 500 feet Adam asked for. It forgives up
  to 200m of reported GPS error, runs a window of 30 minutes before to 3 hours
  after the start time, and awards a point. The UI exists too
  (`src/components/mic/WentUpToggle.tsx`), labelled "I Went Up", reachable only
  from the modal and the detail page, never from the card.
- **The signup sheet is built.** `mic_signup_events` and `mic_signups` with RLS,
  a real numbered list with join and cancel in `src/pages/MicSignup.tsx`, host
  reordering in `src/components/host/RunOfShow.tsx`. **Measured: 0 of 406 mics
  have `slotsEnabled` or `signupMethod = 'comediq_slots'`**, so none of it is
  reachable today.
- **Claiming is built**: `ClaimMicButton` plus the `mic_hosts` table with
  `is_verified`.

So this is mostly **rewiring, switching on, and deleting**.

## Decisions made

| Question | Decision |
|---|---|
| Signup timing | **Two lists.** Reserve from anywhere to get on the list; check in at the venue to confirm. No-shows drop, walk-ins move up. |
| Claim approval | **Adam approves** in the admin tab. Nothing locks until he ticks it. |
| Hiding features | **Hide from nav, keep routes working.** Nothing deleted. |
| Confirm vs check in | **Merge.** A verified check-in also stamps the mic confirmed. |
| Calendar buttons | **Cut the generic one only.** Google Calendar and iCal stay. |
| Scope | **Phase 1 strips, Phase 2 builds.** |

---

## STOP: one thing to fix before anything else

**Any signed-in user can edit any field of any mic, and there is a public page
that makes it easy.**

```sql
-- supabase/migrations/20260209032557_*.sql
CREATE POLICY "Authenticated users can update public mic info"
  ON open_mics_historical FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
```

That policy is not decorative. Postgres ORs permissive policies, so it
**subsumes** the three narrower admin and verified-host policies that also exist.
The table-level `GRANT INSERT, UPDATE, DELETE ... TO authenticated`
(`20260812002910_*.sql`) completes the path from the browser, and the 12-field
limit in `HostMicEditForm` is client-side only: a hand-rolled request can set
`active`, `status`, `creator_id`, anything.

And `/dev-view` (`src/pages/DevView.tsx`) is routed publicly with **no admin
check at all**: it imports `useAuth` but only does `if (!user) return;` on save.
It is a raw 17-column editable spreadsheet of every listing. Anyone who makes an
account can rewrite the whole sheet from a URL.

Adam asked to "lock editing features for just them and us". Today there is no
lock whatsoever. Gating `/dev-view` on `isAdmin` is a two-line change and should
ship on its own, immediately, ahead of the rest.

---

## The nonessential list

### Already dead, costing nothing but confusion

| Thing | Evidence |
|---|---|
| **Wrapped / Year in Review** | 11 files, ~1,200 lines, **no route at all**. Unreachable. |
| **Job board** | 11 files. `/job-board` and `/job-board/create` both redirect to `/growth`; the pages are orphans. One live thread: `types/jobBoard.ts` feeds the Profile "Work" tab, so do not delete the types. |
| `/track-sets` | Banner literally reads **"Demo Only, data entered here will not be saved permanently"**. |
| `/mic-signup` | Linked from `Profile.tsx:446`, **no route registered**. Lands on 404. |
| `/top-mics` | Duplicate alias of `/leaderboard`. |
| MOTD nominations | `useMotdNominations` has both queries `enabled: false`. Already off, but "Nominate for Mic of the Day" still renders on every card. |
| Orphan components | `Pricing`, `MarqueeBanner`, `WaitlistForm`, `VerificationBadge`, `AddShowForm`, `ShowForm`, `ShowList`, `DiscoveryShowCard`, `ManageSignups`, `PlaylistSelectorDropdown`. |

### Hide from nav now, keep the route

| Thing | Size | Note |
|---|---|---|
| **Carouseler / comic strip** (`/strip`) | **1 file, 26 lines**, an iframe to `strip.comediq.us` | Already a separate product. Cleanest possible extraction. |
| **Growth** (`/growth`) | ~9 files | Linked **twice** in the hamburger and twice from the dashboard. |
| **Playlists** | ~10 files | Not in either nav already; reachable via Profile. |
| **Leaderboard** | ~9 files | Two routes, two hamburger entries, **plus a fixed bar above the bottom nav on every page**. |
| **Slots browse page** (`/slots`) | ~8 files | Keep the signup plumbing, it is Phase 2. Hide the browse page. |
| **Advertise**, **Shows map**, **Dev view** | 3 routes | Not linked from any nav today anyway. |

### Keep

`/open-mics`, `/mics/:venueSlug`, `/mic/:slug/signup`, `/auth`, `/profile`,
`/saved`, `/liked`, `/add-mic`, the SEO landing pages, `/host-dashboard`, admin.

### On the mic card

Cut: **Nominate for Mic of the Day**, **Add to Calendar**, **Claim Mic of the Day**
(returns `null` for everyone who is not already a verified host). Demote **Edit Mic
Details** from a full-width button to a text link.

Worth knowing: "Add to Calendar" is **not a calendar**. It inserts into
`profile_open_mics` and toasts "Added to Schedule". That is the mic-history
tracking Adam wants to keep, so check-in has to take over that job rather than
simply removing it.

---

## Phase 1: strip and rewire

1. **Gate `/dev-view` on `isAdmin`.** Ship first, alone.
2. **One nav config.** New `src/config/navigation.ts` holding the primary list.
   Trim `src/components/HamburgerMenu.tsx` (arrays at L14-38, which currently
   list Leaderboard and Growth twice each) and
   `src/components/BottomNavigation.tsx` (array at L19-28). Routes in `App.tsx`
   stay untouched.
3. **Make Perform and Laugh prominent.** The bottom bar is 24px icons and 12px
   labels across five items. Drop Admin into the hamburger, and give Perform and
   Laugh visibly larger targets than Home and Profile. The "Find mics" button on
   the signed-in dashboard already shipped.
4. **Strip the card** per the list above, in
   `src/components/OpenMicsDetailedList.tsx`. Removing Add to Calendar also
   removes `handleAddToCalendar` (L609-627) and the `onAddToCalendar` prop.
5. **Confirm becomes Check in.** Move `WentUpToggle` into
   `src/components/mic/MicActionBar.tsx` in place of the Confirm button, relabel
   it "Check in", and add one line to `check_in_mic` so a **verified** check-in
   also sets `open_mics_historical.last_confirmed_at`. That preserves the
   freshness signal across 406 listings while deleting a button.

## Phase 2: claim, lock, sign up

6. **Claim approval queue.** Today claiming is a **dead end**: the claim inserts
   `mic_hosts` with `is_verified = false` and says "pending admin verification",
   but **nothing in the admin UI reads `mic_hosts` at all**, and there is no
   `GRANT UPDATE ON public.mic_hosts`, so even an admin cannot flip the flag from
   the app. Verification is only possible today through the Supabase dashboard.
   Nobody is verified, which is why `CreateEventForm`, `RunOfShow`,
   `MicCoverUpload` and `ClaimMicOfDayButton` are all unreachable.

   So this step is three things, not one: an **approve RPC** (security definer,
   admin-gated, the way `admin_deactivate_flagged_mic` already works, rather than
   adding a blanket UPDATE grant), a **new admin tab** shaped like
   `src/components/admin/AdminMicFlagsPanel.tsx`, and showing whether the
   claimant's Instagram matches the mic's listed host so a decision takes a second.

   **Clean the queue first.** `get_or_create_system_host`
   (`supabase/migrations/20260805001000_*.sql`) inserts an unverified `mic_hosts`
   row for **whoever happens to be signed in** when a signup sheet needs an event.
   Those people never clicked Claim and will show up as pending claims.

7. **Lock editing.** The verified-host policy already exists
   (`20251226213036_*.sql`), it is just **shadowed**: Postgres ORs permissive
   policies, so the February `USING (true)` policy subsumes it. The fix is to
   **drop** `"Authenticated users can update public mic info"` and replace it with
   one that allows any signed-in user **only while the mic has no verified host**.
   That keeps community editing on the ~400 unclaimed mics and hands a claimed mic
   to its host plus admins.

   Two cautions. `mic_hosts` has `UNIQUE(user_id, mic_id)` only, so nothing stops
   two different people claiming the same mic or two rows both being verified;
   the approve RPC should enforce one verified host per mic. And `mic_hosts`
   admin policies check the legacy `profiles.isadmin` only, not
   `user_roles.role`, unlike everything newer.
8. **Switch the signup sheet on** for claimed mics by setting `signupMethod =
   'comediq_slots'`. Two fixes it needs first: the public sheet orders by
   `created_at` and ignores the `signup_order` the host writes in `RunOfShow`,
   and `spots_remaining` is never decremented (recomputed client-side).
9. **Reserve plus check-in.** A reservation puts you on the list from anywhere.
   Checking in at the venue flips your row to confirmed. Show "You are #3". Let
   the host drop no-shows so walk-ins move up.

---

## Verification

**Before anything:** confirm against the live database whether
`20260908160000_verified_mic_checkins.sql` was ever applied. `documentation.md`
records it as outstanding, which would mean `check_in_mic` does not exist and the
check-in button errors. It joins four other unapplied migrations already stacked
up. Phase 1 step 5 is blocked until it runs.

**Phase 1**, on the built bundle at 390px and 1200px:

1. Signed out and signed in: hamburger shows only the kept items, no duplicates.
2. Perform and Laugh targets measurably larger than Home and Profile.
3. An expanded card: no Nominate, no Add to Calendar, no Claim Mic of the Day,
   Edit is a text link. Panel height measured before and after.
4. `/dev-view` as a non-admin: refused. As an admin: still works.
5. Check in from the card inside the window: succeeds, writes
   `user_mic_checkins` with `is_verified = true`, and stamps `last_confirmed_at`.
6. Check in from 2km away: refused with the distance message.
7. `npx tsc -b` and `npm run build` clean. Note `npx tsc --noEmit` compiles zero
   files here because the root `tsconfig.json` uses `"files": []`.

**Phase 2:**

8. Claim a mic as a normal user: nothing locks, a pending row appears in admin.
9. Approve it: the host can edit, a second non-admin user cannot, Adam still can.
10. Reserve from home, then check in at the venue: position shown, row flips to
    confirmed, a no-show drop moves the next person up.

**Known gaps, none blocking but worth knowing:**

- **9 of 406 mics have no coordinates**, so check-in there records
  `is_verified = false` and earns no point. The docs say this was 1 of 407 in
  September, so it is getting worse. Geocoding those 9 is a small separate job.
- **`is_current_user_admin()` and the `user_admin` table exist in the live
  database but in no migration in this repo.** Half the admin policies depend on
  them. A rebuild from migrations alone would not reproduce production. Worth
  capturing in a migration while touching permissions anyway.
- **Generated Supabase types are stale.** `src/integrations/supabase/types.ts`
  lists `user_mic_checkins` without `latitude`, `longitude`, `accuracy_meters`,
  `distance_meters` or `is_verified`, which is why every call site casts
  `(supabase as any)`. Regenerate before building on it.
