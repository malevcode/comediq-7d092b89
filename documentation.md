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

Took two rounds of host replies from the September blast and turned them into one
reviewed SQL migration. Nothing was written to the live database from here: this
session has read access only, so the output is SQL you paste into the Supabase SQL
editor. `public/mics.json` is deliberately untouched, because `prebuild` re-exports
it from Supabase on every build and would overwrite a hand edit.

**Verified, not assumed.** The migration was run against a throwaway PostgreSQL
database built to match the real schema and seeded with **all 407 live rows**. Every
single-row UPDATE matched exactly 1 row, the batch matched exactly 4, all 5 INSERTs
are idempotent across a second full run, and the public export filter lands on 405
visible rows with 7 correctly hidden.

**Two ambiguous host replies got decoded rather than guessed.**
- `the_secret_mics` sent a bare numbered Y/N list. Their 5 rows are Mon to Fri, and
  two independent anchors confirm the ordering: item 4 says "no thursday mics" and
  position 4 is Thursday; item 5 says "24th st" and position 5 is the only 24th St row.
- West Side Comedy Club's "no 2 5 or 7" maps one-for-one onto our 10 rows by name and
  time. Those are one-week skips, not closures, and the week has passed, so nothing
  was changed.

**The NYCC Midtown address came from this repo**, `scripts/scrapers/NYCC_scraper.py`,
which maps Midtown to 241 East 24th Street. Three separate items needed it, and none
of them required inventing an address.

**Applied:** 3 closures, 2 hiatus notes, 11 edits in place, 4 verification bumps,
3 new mics live (Girl Dinner, The Secret Mic @ Midtown, Hot Take) and 2 staged as
`pending` because no venue was given.

**The useful finding:** several "changes" were already correct in the database, and
three "new" mics already existed. Rodney's Wednesday was already 6PM with Ellen
Maloney, and both Pear schedules already matched kmehra's lists row for row. Inserting
the duplicates would have put them in front of 1500 weekly users.

**One thing still open:** Grisly Pear Wednesday (@asapangry_). That handle hosts an
unrelated mic in our data, and there are three candidate Wednesday rows, so the
"5 min + feedback" label waits rather than landing on the wrong mic.
