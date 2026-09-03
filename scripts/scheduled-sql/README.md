# Scheduled SQL

One-off statements that must run **on a specific date**, not whenever
migrations are applied.

These are deliberately **not** in `supabase/migrations/`. Anything in that
folder runs the moment migrations are applied, which would deactivate mics
that are still running.

## How to run

Paste the file into the Supabase SQL editor on (or after) the date in its
name, then let `public/mics.json` refresh (the `open_mics_historical` trigger
dispatches it, ~2m30s) or run `npm run export:mics`.

| File | Run on or after |
| --- | --- |
| `20260910_deactivate_partea_lab.sql` | 2026-09-11 |
| `20261007_deactivate_sick_hat.sql` | 2026-10-08 |
