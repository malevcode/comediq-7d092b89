# Comediq Documentation

Plain-English explanation of how the mic data works and what changed.

---

## How the mic database actually works

Think of it like a bulletin board that gets photocopied.

**1. The real list lives in Supabase.**
The table is called `open_mics_historical`. Every row is one mic on one day.
A mic that runs Monday and Wednesday is **two rows**, not one.

**2. The website does not read Supabase directly.**
A script (`scripts/export-mics.mjs`) copies the list into a plain file,
`public/mics.json`. Visitors read that file. This keeps the site fast and
cheap, because 1500 people a week reading a file costs nothing.

**3. The photocopy refreshes itself.**
When a row changes, a database trigger pings GitHub, which re-runs the export
about 2m30s later. You can also run `npm run export:mics` by hand.

### Two gotchas that will bite you

- **`changes_updates` is NOT a notes field.** Despite the name, the export maps
  it to the public **Instagram handle**. Real notes go in `other_rules`.
- **The export hides two kinds of rows.** It only copies rows where
  `active = true` **and** `status <> 'pending'`. So:
  - `active = false` → mic is closed, invisible on the site, data kept.
  - `status = 'pending'` → mic is staged/half-finished, invisible on the site.

That second one is useful: you can park an incomplete mic in the database
without it showing up publicly.

### Why we never DELETE a mic

There is a `mic_edit_history` table built for undoing edits. A `DELETE` throws
the row away for good and the undo cannot bring it back. So a closed mic gets
`active = false` instead. If the mic comes back, flip it to `true` and it
returns with its history intact.

---

## Where the September 2026 changes live

| File | What it is | When it runs |
| --- | --- | --- |
| `supabase/migrations/20260903120000_september_2026_mic_blast_updates.sql` | All the safe changes | When migrations are applied |
| `scripts/scheduled-sql/20260910_deactivate_partea_lab.sql` | Closes Partea Lab | Run by hand on/after 9/11 |
| `scripts/scheduled-sql/20261007_deactivate_sick_hat.sql` | Closes Sick Hat | Run by hand on/after 10/8 |

**Why two mics are in a separate folder:** they are still running today. Anything
in `supabase/migrations/` executes the moment migrations are applied, which
would have hidden two live mics early. Files in `scripts/scheduled-sql/` only
run when you paste them in yourself, on the date.

Every statement targets a mic by its `unique_identifier` (its ID), not by name,
so a mic with a similar name can never be hit by accident.

---

## Summarize

### Session: September 2026 host-blast mic updates

Took host replies from the September blast and turned them into reviewed SQL.
Nothing was written to the live database — this session had no Supabase write
credentials, so the output is SQL for review.

**Verified, not assumed.** Every target was matched against the live export,
then the migration was run against a throwaway PostgreSQL database built to
match the real schema. All 12 updates hit exactly 1 row each, the insert
guard survived a second run without duplicating, and the closures correctly
dropped 4 rows out of the public export.

**Applied (13 changes):** closed Chewsdays Innit; hiatus notes on Sick Hat and
Partea Lab; Energizer Honeys to biweekly 5:30 PM; Have A Good Mic to 8:30 PM;
Last Stop Mic host to Thomas Purdy; Feelings Wheel renamed to The Feelings
Anonymous Mic; Freddy's signup note; Greenpoint Wednesday host and cost;
Comedy in Harlem Tuesday signup time; Social Club address; one new staged mic.

**The useful finding:** five requested changes were already done, and three
"new" mics already existed. Adding them would have created duplicates on a
site 1500 people use weekly. Full detail is in the pull request.

**Held back for Adam:** Golden Pen (report says Friday 6PM, database says
Sunday 5PM), Grisly Pear Wednesday (@asapangry_ hosts an unrelated mic), and
The Sunday Open Mic (no matching row) — all flagged rather than guessed.
