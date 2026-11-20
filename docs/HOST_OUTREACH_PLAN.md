# Host outreach and mic confirmation plan

Decided with Adam on 2026-11-16. Written so a fresh session can pick up the next piece without this chat.

## Why
Mics were being confirmed by Instagram DMs sent and read through an unofficial Instagram API repo
(`comediq-ig-api`) that Meta has flagged. That risks the @comediq.us account, which is the best channel for
reaching hosts. Stop relying on it. Outreach stays human (a person sending DMs from a template).

## The ladder: give, ask, earn
1. **Give first.** Mic of the Day slot (built: `src/config/featuredMics.ts`), a home page spot, an Instagram shoutout,
   a street interview outside the mic.
2. **First ask.** Confirm the mic, claim it, give email, phone and Instagram (with text consent).
3. **Second ask.** Run signups through Comediq (built as a pilot: Gdrink at Gnihton, lineup by arrival).
4. **Third ask.** Ticketing.
5. **Later, with volume.** Paid show listings (mics stay free if verified), and paid guaranteed spots.

## Built (this session)
- **Host confirm, in the host dashboard** (logged in as a verified host): "Yes, still running", "It changed" (edit),
  "It ended". `confirm_mic_status` in `20261116120000_confirm_mics.sql`. Sets the "Verified <date>" label.
- **Confirm from real use:** two different people with a GPS-verified check-in at the mic within 14 days counts as
  confirmed (trigger `confirm_mic_from_checkins`). Everything is logged in `mic_confirmation_log`.
- **Unconfirmed label:** after 60 days with no confirmation, a grey "Unconfirmed" label and the mic sorts after
  confirmed ones on the Next tab. Not hidden. `src/utils/micConfirmation.ts`.
  **Grace period:** 57 percent of mics (240 of 420) were last verified over 60 days ago, so the 60 days count from
  2026-11-16 at the earliest (`GRACE_STARTS`). The first labels appear 2027-01-15.

## Not built yet (next, in a fresh session)
**Host outreach list in admin.** Mics sorted by how stale their confirmation is. For each: a copy-paste DM, checkboxes
for the value-add offered (Mic of the Day, home page, Instagram shoutout, street interview), and a status
(not contacted, contacted, replied, claimed). Needs a small table (`host_outreach`: mic id, status, offers, notes,
last contacted, who) and an admin page that reads stale mics from the mic list. Reuse the admin area and
`mic_confirmation_log` for "last confirmed".

## Decisions and ideas to keep
- **Meta developer account:** worth applying, but set expectations. The official Instagram API (Instagram Login, messaging)
  needs app review and a business account, and can only reply to people who message you first (24 hour window, longer with
  the human agent tag). It cannot cold-DM hosts. It is good for: receiving host replies in one inbox, replying
  to comments, and "comment a word, get a DM" offers. Outreach to new hosts stays manual.
- **Paid spots via credits:** let people buy spots with Comediq credits, sold as bundles (for example $25 for a set number,
  $50 for 60 credits). Credits spread the fixed Stripe fee over bigger purchases, so a $5 spot stays worthwhile.
  Label online spots clearly and only offer them where the host opts in. Credit packs and `CreditBalance` already exist
  in the app, check them first.
- **Unconfirmed rule:** 60 days, label plus lower rank, never hide. Hiding cost trust when Gladys Simon and BYOT were
  removed while still running.
