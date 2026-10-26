# Host text confirmation: design

Goal: the day before a mic runs, text its host "is it still on?". A reply of YES
marks the mic confirmed and Comediq shows the date it was last confirmed.

Status: the database, the daily job (dry run) and the host opt-in card are built.
Sending real texts and catching replies are NOT built, because the texting
provider is not chosen yet. See "Go live" at the bottom.

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

## Decisions made (Oct 21)

1. **Phone numbers:** hosts opt in themselves, on the Host Dashboard. Only a verified
   host (an approved claim in `mic_hosts`) can turn texts on for a mic. This matters
   because the replies set the public "Verified" date.
2. **Provider:** not chosen. Twilio code is included and is the only provider-specific
   piece (`sendSms()` in the script). Replace it to switch.
3. **Weekly mics:** one text a month. A weekly mic is texted only when it has not been
   confirmed in the last 28 days. Bi-weekly, monthly, pop-up and custom mics are
   texted before every show.
4. **No reply:** nothing changes. The mic stays listed and keeps showing its last
   confirmed date, so an old date warns people on its own.

Mics where we cannot tell which dates they run (bi-weekly with no anchor, pop-up
or custom with no listed dates) are never texted.

## What is built

- `supabase/migrations/20261021130000_host_confirmation_texts.sql`: the two private
  tables, `set_host_confirmation_contact` (what the opt-in card calls) and
  `apply_host_reply` (what the reply webhook will call). Tested on a real Postgres
  engine: phone cleanup, host checks, YES / NO / STOP, number changes.
- `scripts/send-host-confirmation-texts.ts` and
  `.github/workflows/host_confirmation_texts.yaml`: the daily job. Dry run by
  default; tested against a fake database for who gets texted and who is skipped.
- `src/components/host/HostConfirmationTexts.tsx`: the opt-in card on the Host Dashboard.
- Display: nothing new needed. A YES sets `last_confirmed_at`, which cards already
  show as "Verified <date>".

## Not built yet

- **The reply webhook.** The provider needs a public address to send replies to. It
  should check the provider's signature, then call `apply_host_reply(phone, body)`
  with the service key and answer with a short reply. Until it exists, YES replies
  go nowhere and nothing gets confirmed.
- **Cancelled dates.** A NO is recorded but not shown on the mic yet.
- A second nudge when nobody replies (optional).

## Go live checklist

1. Create the texting account and start sender registration (days to weeks).
2. Run the two migrations' SQL (this one and any earlier ones not yet run).
3. Add the Twilio values as GitHub secrets: `TWILIO_ACCOUNT_SID`,
   `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.
4. Build the reply webhook (ask for it once the provider is chosen).
5. Run the workflow by hand with "send" ticked, with one friendly host opted in.
6. Set the repository variable `HOST_TEXTS_LIVE` to `true` so the daily run sends.
