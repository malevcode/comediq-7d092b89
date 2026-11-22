# Archived: ListingV2.tsx

Archived 2026-11-22. Superseded, do not build on it.

`ListingV2.tsx` was a UI-only draft of "Add a listing", built against the
first-round design folder (`docs/design/storytime-redesign/`). Two reasons it
is retired:

- **It is a mock.** Its own header says it: nothing writes to the database,
  the venue list is six hard-coded fixtures, and listings plus skipped dates
  live in React state, so everything is lost on reload.
- **The design moved on.** The approved flow is
  `docs/design/storytime-redesign-v3/` (ListingFlow, ListingMicPath,
  ListingShowPath, ListingStates, ListingComponents).

The live flow is `src/pages/AddListing.tsx`, which shares its date maths with
the mobile app through `src/utils/listingSchedule.ts` and saves to
`open_mics_historical`, `open_mics_requests` and `mic_skips`.

The file is kept for history, per the project rule that nothing is deleted.
