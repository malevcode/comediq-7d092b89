# Replace slotted.co inside Comediq

## Context

Ten of Comediq's 406 mics run their signup on slotted.co. Slotted is the tool
independent NYC hosts actually share, so winning these is the demonstration other
hosts see.

**The pitch list, grouped by who to message:**

| Host | Mics | Their slotted sheets |
|---|---|---|
| `@industryroom` | Broadway 3, Broadway 3 Mic, Broadway 5, Broadway 5 Mic | `/gig-mic`, `/wednesdaymic` |
| `@laramieflick` | BibbleBash, BibbleBash 2 | `/bubblebath-mic` |
| `@fabulousdinamarie` | Broadway 4 | `/gig-mic` |
| `@adhdcomedyshow` | ADHD Comedy | `/adhdcomedy` |
| `@tys.jokes` | Not Booked Mic | no URL in the listing |
| none listed | The High Key Weekend | `/z3qfl8eh` |

**Start at Broadway Comedy Club.** Five of the ten mics run there, across two
handles (`@industryroom` and `@fabulousdinamarie`) sharing two sheets. One venue
conversation moves half the list.

Measured across all 406 mics, other signup links point at
`laughingbuddhacomedy.com` (69) and `punchup.live` (19), but those are not
targets: Laughing Buddha runs its own rooms on its own site, and punchup here is
essentially one venue. Slotted is the only switchable third-party tool at scale.

**Where the data lives: Supabase, for now.** The egress worry turned out to be
aimed at the wrong table.

| | measured |
|---|---|
| one signup row | 262 bytes |
| 200 mics running full lists every week | **39 MB per year** stored |
| 100,000 signup-sheet views per month | 375 MB egress, about 7% of the free tier |
| **one mic-list load** | **440 KB**, the same as 115 signup sheets |

Signup history is a rounding error; the mic list is the bill. So this ships on the
Supabase tables that already exist, with a row-count check, and moves to a
Cloudflare Worker only if the data ever proves otherwise. Moving now would mean
rewriting a working sheet, bridging Supabase JWTs into a Worker, and hand-rolling
every permission RLS does today.

## What slotted actually does

Taken from the four screenshots, since slotted.co is blocked from this sandbox.

| # | Feature | Detail |
|---|---|---|
| 1 | Vanity page per mic | `slotted.co/adhdcomedy` |
| 2 | Title and collapsible description | "ADHD Open Mic", "Hide Description", host names |
| 3 | Venue address and transit note | "Two short blocks from the Classon Ave. Station on the G train" |
| 4 | Host-authored **RULES** | A real bullet list, including "you will be BANNED FROM THE MIC FOR THE FOLLOWING 3 WEEKS" |
| 5 | A dated event with a time range | `9/29/2026`, `6:00pm - 7:00pm` |
| 6 | A fixed number of named slots | 4 visible plus "plus 4 more slots" |
| 7 | Slot states | **Pending** (orange) and confirmed (dark), each with an X to remove |
| 8 | "Slot Me" | Takes the next slot |
| 9 | **No account required** | Modal asks Name (marked "visible to others"), Email (required), IG Handle (optional) |
| 10 | Email confirmation | Plus "Resend My Confirmation Email" |
| 11 | Calendar export per event | iCal and Google icons |
| 12 | "Print This Sheet" | For the host at the door |

The identity model is the important part: **email is the account**. No sign-up,
no password. That is why hosts can get a whole room onto a list.

## What Comediq already has

Most of the sheet exists and is switched off. From the audit: `mic_signup_events`
and `mic_signups` with RLS, a real numbered list with join and cancel in
`src/pages/MicSignup.tsx`, `getOrCreateNextEvent` / `signUpForEvent` /
`guestSignUpForEvent` / `cancelSignup` in `src/api/signups.ts`, and host
reordering in `src/components/host/RunOfShow.tsx`. **0 of 406 mics have
`slotsEnabled` or `signupMethod = 'comediq_slots'`**, so none of it is reachable.

## Where Comediq beats slotted

Worth building the pitch around, not just parity:

- **Verified check-in.** `check_in_mic` already geofences at 150 metres in SQL.
  Slotted enforces its no-show ban by hand, in prose. Comediq can detect a no-show
  automatically and move the next person up.
- **The mic is already listed.** A slotted link is a dead end; a Comediq sheet
  sits on a listing 1,500 comedians a week already browse.

## Decisions made

| Question | Decision |
|---|---|
| Where signup data lives | **Supabase now**, Worker only if row counts ever prove the worry right. |
| Who to pitch | **Slotted hosts only.** Start at Broadway Comedy Club. |
| Who can sign up | **Guests, no account.** Name, email, optional IG, exactly like slotted. Offer the account afterwards with the email prefilled. |
| No-shows | **Check-in auto-promotes.** Reserved but not checked in by start time releases the slot and moves the next person up. No-shows are recorded; banning stays the host's call. |

---

## The blocker: Comediq cannot send email

Slotted's entire guest flow rests on a confirmation email, and the audit is
unambiguous: **there is no email capability in this app.** No provider, no
dependency in either lockfile, no SMTP block in `supabase/config.toml`, no
template files, no sending code anywhere.

The only mail any user ever gets is Supabase Auth's own OTP, from Supabase's
**shared default sender**, and the app is already hitting that sender's cap.
`src/pages/Auth.tsx:43-61` has a purpose-built handler for it:

```ts
if (isHourlyEmailLimit) {
  return {
    title: 'Hourly email limit reached',
    description: 'Supabase has paused sending verification emails for this project...',
    cooldown: 60 * 60,
  };
}
```

That is load-bearing. Sign-in is **already** unreliable because of email limits,
and that sender cannot be used for arbitrary transactional mail anyway. Today
`guestSignUpForEvent` (`src/api/signups.ts:201-222`) writes `guest_email` to the
database and **never uses it**. The address is a column, not a capability.

**So step one is email, and it fixes sign-in at the same time.** Add Resend (an
HTTP API, so it works in a Deno edge function with plain `fetch` and no npm),
verify `comediq.us` with SPF, DKIM and DMARC, store `RESEND_API_KEY` as a
Supabase secret, and point **both** the new confirmation function and Supabase
Auth's SMTP at it in one pass. Doing the auth half separately wastes the domain
verification and leaves login capped.

## Second security finding

Unrelated to email but found next to it. `supabase/functions/create-email-account`
runs with `verify_jwt = false` and `Access-Control-Allow-Origin: '*'`, so anyone
on the internet can call it with any address. With `prepareExisting: true` it
runs:

```ts
body: JSON.stringify({ email_confirm: true, password: createTemporaryPassword() })
```

against an existing user, which **resets that user's password to a random value**
and locks them out of password sign-in. This joins the open `USING (true)` update
policy on `open_mics_historical` and the ungated `/dev-view` from the previous
plan. Three open doors is a pattern worth a dedicated pass.

## Second blocker: the signup URL cannot address a mic

`linkManager.micSignup` builds `/mic/${generateVenueSlug(mic)}/signup`, and
`generateVenueSlug` is `venueName-neighborhood`. It identifies a **venue**, not a
mic. Run that over the actual pitch list and it collapses:

```
Broadway 3       ->  /mic/broadway-comedy-club-hell-s-kitchen/signup
Broadway 3 Mic   ->  /mic/broadway-comedy-club-hell-s-kitchen/signup
Broadway 4       ->  /mic/broadway-comedy-club-hell-s-kitchen/signup
Broadway 5       ->  /mic/broadway-comedy-club-hell-s-kitchen/signup
Broadway 5 Mic   ->  /mic/broadway-comedy-club-hell-s-kitchen/signup
```

All five Broadway Comedy Club mics, the single biggest pitch target, share one
URL. Both BibbleBash mics do too. The sheet literally cannot tell them apart.

It is also the wrong shape to ask a host to put in their Instagram bio:

```
slotted.co/adhdcomedy                              20 chars, says the mic
comediq.us/mic/commune-bk-bed-stuy/signup          41 chars, says the venue
```

**Fix: a host-chosen vanity slug per mic**, `comediq.us/s/adhdcomedy`, set when
the host claims the mic. One nullable unique column on `open_mics_historical`,
one route. The venue-slug route keeps working for everything else.

---

## What the existing sheet is actually missing

The audit of `src/pages/MicSignup.tsx` found the gap is bigger than "turn it on".

- **There is no guest signup path at all.** `guestSignUpForEvent` exists in
  `src/api/signups.ts` but is **never imported** by the signup page. A signed-out
  visitor gets "Sign In to Sign Up". The guest flow is a build, not a wiring job.
- **The form asks for Name and Phone**, not email. Slotted asks Name, Email,
  Instagram. The phone field has no format validation and the panel is not even a
  `<form>`, so there is no Enter to submit.
- **Sheet creation is gated on being signed in** (`if (!mic || !user ...) return`).
  So a host shares their link, the first comedian clicks it signed out, and sees
  **"No signup sheet is open for this mic yet."** That alone kills the pitch.
- **The page renders no description, no rules, no cost, no stage time and no
  sign-up instructions.** Only name, venue, borough, day, time, address. Slotted's
  whole middle section has no equivalent.
- **Empty slots are not drawn.** Slotted shows 8 numbered slots with the open ones
  visible and "plus 4 more slots". Comediq shows only taken rows plus a count.
- **Cancelling locks you out.** Cancel is a soft update to `status = 'cancelled'`,
  but `UNIQUE(event_id, user_id)` still holds that row, so signing up again hits a
  unique violation and shows "You are already on this signup sheet." A comedian who
  cancels by accident cannot get back on the list. Fix with a partial unique index
  that ignores cancelled rows.

## Implementation order

1. **Email, once, properly.** Resend plus a verified `comediq.us` sender, pointed
   at both a new `send-signup-confirmation` edge function and Supabase Auth's
   SMTP. Fixes the capped login at the same time. `verify_jwt = true` on the new
   function; do not copy `create-email-account`'s open pattern.
2. **Vanity slug.** Nullable unique column, `/s/:slug` route, set during claim.
3. **The sheet, to parity.** Extend `src/pages/MicSignup.tsx`: title, collapsible
   description, host-authored rules, date and time range, a fixed slot count the
   host sets, pending versus confirmed states, remove-a-slot, print view, and the
   calendar export that already exists on the mic card.

   Note the enum needs one new value. Today
   `signup_status` is `('confirmed', 'waitlist', 'lottery_pending', 'cancelled')`,
   with nothing for "took a slot but has not clicked the email yet", which is
   slotted's orange **Pending**. One `ALTER TYPE ... ADD VALUE 'pending'`.
4. **Guest signup.** Swap the current name-plus-phone form for slotted's exact
   three fields: Name (shown to others), Email (required), Instagram (optional).
   Send the confirmation, support resend, and offer the account afterwards with
   the email prefilled.
5. **Fix the known bugs** before anyone depends on them: sheet creation is gated
   on being signed in, so a public link looks empty to the first visitor; the
   sheet orders by `created_at` and ignores the `signup_order` a host sets in
   `RunOfShow`; `spots_remaining` is never decremented; and cancelling leaves a
   row that blocks re-signup.
6. **Check-in promotion.** At start time, release reserved-but-not-checked-in
   slots, move the next person up, record the no-show. Reuses `check_in_mic`.
7. **Turn it on** for the first host who says yes, by setting `signupMethod =
   'comediq_slots'`.

## Verification

- Two mics at the same venue produce two different working signup URLs.
- A guest with no account: takes a slot, gets a real email, clicks through, goes
  from Pending to confirmed, and can cancel from the link.
- Resend the confirmation. It arrives. Sign-in OTP still arrives in the same hour,
  proving the auth sender is no longer the shared one.
- A host sets 8 slots; the ninth person is refused and `spots_remaining` matches
  the list.
- A host reorders in `RunOfShow`; the public sheet shows the new order.
- Reserve, do not check in, and confirm at start time the slot releases and the
  next person moves up.
- `npx tsc -b` and `npm run build` clean. Note `npx tsc --noEmit` compiles zero
  files here because the root `tsconfig.json` uses `"files": []`.
