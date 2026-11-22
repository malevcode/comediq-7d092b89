# How to build this (notes for Claude Code)

These are design references. Build them as real components in each codebase. Do not copy the .dc.html files into the app.

## Rules
- Only add files. Never delete. Old versions get an ARCHIVED.md note instead.
- Work on a branch, never straight on main (comediq-7d092b89 main deploys comediq.us).

## Data model (new)
- listings: id, host_user_id (logged-in host who owns it), kind ('mic' | 'show'), name, venue_id or new venue fields, day, start, end, freq ('Weekly' | 'Every other week' | 'Monthly' | 'One time'), pattern_note, next_dates (up to 3 ISO dates), set_length, cost, price, signup_type, signup_link, lineup_order, host_ig, verify_active (bool, required for mics), email_reminders_opt_in (bool, default false), show fields (date, doors, ticket_price, ticket_link, ig, description, image_url, lineup 'Public' | 'Secret', laughpass_free (bool)).
- listing_skips: listing_id, date, reason ('Holiday' | 'Host away' | 'Venue closed' | 'Other'). A skipped date is hidden from all Comediq lists and the listing page shows "Skipped on <date>".
- Only the owning host can edit a listing or its skips.

## Logic to port (see ListingFlow.dc.html script)
- detectCadence(dates): same weekday 7 days apart = Weekly, 14 = Every other week, other gaps = Monthly with "1st and 3rd Thu" style note. Mixed weekdays = no auto-fill.
- projectDates(listing, today, horizonDays): every upcoming date from next_dates + cadence. Remove listing_skips to get what is shown publicly.
- "Next 4" line under How often = first 4 projected dates minus skips.
- Calendar taps: picked -> unpick, skipped -> unskip, scheduled -> skip, empty -> pick (max 3).
- LaughPass: members get a free ticket while regular tickets remain, until the show sells out. No per-show count.
- Validation runs only on "Preview listing", shows all errors, scrolls to the first.
- Auto-advance: after a chip tap, venue pick, completed time/date, or Enter, focus the next empty field.

## Screens
Chooser, one-page mic form, one-page show form, preview (renders the real listing detail page), success, My listings, Manage dates.
