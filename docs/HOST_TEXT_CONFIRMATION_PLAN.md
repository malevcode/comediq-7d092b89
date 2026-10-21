# Host text confirmation: design

Goal: the day before a mic runs, text its host "is it still on?". A reply of YES
marks the mic confirmed and Comediq shows the date it was last confirmed.

Status: design only. Nothing here is built. The questions at the bottom decide
the build.

## What already exists (so we reuse it)

- `open_mics_historical.last_confirmed_at` already exists, and the cards already
  show "Verified <date>" from it. A host YES just sets that column. No new display
  is needed, only friendlier wording ("Host confirmed Oct 21").
- The site already knows which mics run on a given day, including bi-weekly
  anchors and the exact dates for pop-up and custom mics (`src/utils/micOccurrences.ts`).
- GitHub Actions already runs scheduled jobs with the Supabase service key
  (`.github/workflows/`), and `supabase/functions/` already holds edge functions.
- New shows already store `confirm_active_agreed` and `last_confirmed_active_at`
  (migration `20261021120000_show_listing_fields.sql`), waiting for this job.
- `open_mics_historical.host_phone` exists but the add-a-mic card sends it empty,
  so assume almost no mic has a phone number today.

## The flow

1. **Opt in (once per host).** A host adds their phone number and ticks "Text me the
   day before to confirm my mic is on". Numbers live in a new private table
   (`mic_host_contacts`: mic, phone in E.164 format, consent time, opted out
   time). It has no public read access and is never added to `mics.json`.
2. **Prove the number is theirs.** The first text is "Reply YES to get Comediq
   confirmation texts for <mic>". Without this, anyone could sign a stranger up.
3. **Daily job, about noon New York time.** Find every mic running tomorrow that has
   an opted-in contact and has not been texted for that date. Send: "Comediq: is
   <mic> at <venue> still on tomorrow (<day>, <time>)? Reply YES to confirm or NO
   if it is off." Log it in `mic_confirmation_texts` (mic, date, sent, status, reply).
4. **Reply webhook** (an edge function the texting provider calls):
   - YES: set `last_confirmed_at = now()`. Card shows "Host confirmed <date>".
   - NO: mark that one date cancelled, card shows "Not running <date>".
   - STOP: opt the number out for good. Required by law.
   - Anything else: reply with the three options.
5. **No reply.** Keep the mic listed. The card keeps showing its last confirmed date,
   so an old date warns people on its own. A second nudge a few hours later is optional.
6. **Shows** use the same pipeline and the same columns the show form already writes.

## Rules we must follow

- Automated texts need clear consent from the person, a way to stop (STOP), and a
  message that says who it is from. The opt-in tick plus the YES reply covers this.
- US carriers require business texting senders to be registered (10DLC for a
  normal number, or toll-free verification). Registration can take days to weeks,
  so start it first. Check current rules and prices with the provider.
- Texts cost money, roughly a cent each plus a monthly number fee and registration
  fees. Confirm on the provider's pricing page before committing.

## Build order

1. Create the texting account and start sender registration (you, not code).
2. Database: `mic_host_contacts`, `mic_confirmation_texts`, a cancelled-dates
   place. Run in the SQL editor.
3. Opt-in screen for hosts, with the double opt-in text.
4. Reply webhook, then the daily job in dry-run mode (prints who it would text).
5. Turn on real sending for one friendly host, then everyone.
6. Card wording: "Host confirmed <date>" and "Not running <date>".

## Decisions needed

1. Where do host phone numbers come from?
2. Which texting provider?
3. How often do weekly mics get texted? Every week is a lot for a host.
4. What happens when nobody replies?
