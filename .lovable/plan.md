# Mic of the Day — Why Crash Landing, and how to make MOTD easier to change

## Why Crash Landing Comedy is today's MOTD

The MOTD resolver runs this priority chain (`resolve_motd_for` in Postgres):

1. **Admin-locked pick** for today → none set
2. **Top-voted nomination** for today → **Crash Landing Comedy** (1 nomination, 0 votes) ✅ wins here
3. **Weekly default for this day-of-week** → would have been *Easy Paradise Mag @ KGB* (Monday default)
4. Most recent claim → n/a

So Crash Landing isn't hard-coded — one user nominated it earlier today (2:47pm ET) and it auto-won because it was the only nomination. The reason the *same mics* show up week after week is step 3: the `motd_weekly_defaults` table was seeded May 12 and never rotated, so when nobody nominates on a given day, you keep seeing the same 7 mics on repeat.

## What I'd build

### 1. Make "Nominate for Mic of the Day" much more discoverable
- The `NominateMotdButton` already exists inside the expanded mic card (it's there but buried below ~6 other buttons). I'll:
  - Move it to the **top of the expanded "Additional Details" panel** with a small "🏆 Nominate this for Mic of the Day" callout block, so it's the first thing users see when they expand a mic.
  - Add a tiny **"🏆 Nominate"** chip to the collapsed card's action row (next to Like / Save / Share) so users don't even need to expand.
  - Keep the existing one-nomination-per-day rule and the "already nominated" state styling.

### 2. Make weekly defaults rotate (so it doesn't feel stale)
Two small additions to the existing `AdminMotdControl` panel on `/admin`:
  - **"Rotate weekly defaults"** button that bumps each day's default to the next-highest-rated mic for that weekday (using `weekly_top_mics` rankings), so a stale default auto-refreshes.
  - **"Clear default"** quick action per day, so the resolver falls through to "most recent claim" instead of an old pick.

Optionally (ask below): an automatic monthly rotation via the existing `resolve-motd` cron, so you don't need to touch it manually.

### 3. Small transparency tweak
Add a subtle "Why this mic?" tooltip on the MOTD card showing which step won (nomination / weekly default / admin lock). Helps you debug at a glance instead of asking me.

## Technical notes

- Files touched: `src/components/OpenMicsDetailedList.tsx` (move + add chip), `src/components/mic/MicActionBar.tsx` (chip), `src/components/admin/AdminMotdControl.tsx` (rotate / clear), `src/components/MicOfTheDayCard.tsx` (tooltip).
- No schema migrations needed — `motd_nominations`, `motd_weekly_defaults`, and `resolve_motd_for` already support all of this.
- No edge function changes required unless you want auto-rotation (would add a small update to `supabase/functions/resolve-motd/index.ts`).

## One question before I build

Do you want weekly defaults to **auto-rotate** (e.g. monthly, pulling from top-rated mics for each weekday), or keep it **manual** with just easier admin controls?
