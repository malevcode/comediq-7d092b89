# Mic Confirm / Report / Points - Build Spec

**Goal:** kill stale mic listings with almost zero ongoing effort from Adam, using the community. Ships inside the 5GB/mo Supabase egress limit.

**Table note:** the canonical open mic table is `open_mics_historical`, keyed by `unique_identifier`.

## 1. Schema Changes (Supabase)

### `open_mics_historical` table - add columns

```sql
alter table public.open_mics_historical
  add column if not exists last_confirmed_at timestamptz;

-- `active` boolean already exists on open_mics_historical.
```

### New table: `mic_confirmations`

One row = one mic confirmed active for one month. Only one confirmation counts per mic per month.

```sql
create table public.mic_confirmations (
  id uuid primary key default gen_random_uuid(),
  mic_unique_identifier text
    references public.open_mics_historical(unique_identifier)
    on delete cascade
    not null,
  user_id uuid references auth.users(id) not null,
  month text not null, -- format 'YYYY-MM'
  created_at timestamptz default now(),
  unique (mic_unique_identifier, month)
);
```

### New table: `mic_flags`

One row = one user flagging one mic in one month. Max one flag per user per mic per month.

```sql
create table public.mic_flags (
  id uuid primary key default gen_random_uuid(),
  mic_unique_identifier text
    references public.open_mics_historical(unique_identifier)
    on delete cascade
    not null,
  user_id uuid references auth.users(id) not null,
  month text not null,
  created_at timestamptz default now(),
  unique (mic_unique_identifier, user_id, month)
);
```

### Points

Confirmation/report points are stored in `user_points` and logged in `point_transactions`.

## 2. Button Row

Before: `upvote/downvote`, `Sign Up`, location, heart, bookmark, share.

After: `upvote/downvote`, `Sign Up`, location, `Confirm`, `Report`, share.

Upvote/downvote, location, sign up, and share stay as-is. Only heart and bookmark get swapped.

## 3. Confirm Flow

1. User taps **Confirm** on a mic card.
2. Modal: "Confirm [Mic Name] is still running?" with **Yes** / Cancel.
3. On Yes:
   - Insert into `mic_confirmations` with `mic_unique_identifier`, `user_id`, and current `YYYY-MM`.
   - If the unique constraint fails, show: "Already confirmed by someone else this month, thanks anyway!"
   - On success, update `open_mics_historical.last_confirmed_at = now()`.
   - Award 1 point through `point_transactions` and `user_points`.
   - Button changes to disabled "Confirmed this month" state for everyone viewing that mic.

## 4. Report Flow

1. User taps **Report**.
2. Modal: "Flag [Mic Name] as inactive?" with **Yes** / Cancel.
3. On Yes:
   - Insert into `mic_flags` with `mic_unique_identifier`, `user_id`, and current `YYYY-MM`.
   - Unique constraint blocks the same user flagging the same mic twice in a month.
   - Count distinct flags for that mic this month.
   - If count reaches 2, set `open_mics_historical.active = false` and award 1/2 point to each of the 2 flaggers.
   - If count is below 2, no point yet; show the flag in an admin view.

Manual override path: if Adam reviews a mic with 1-2 flags and confirms it is dead, deactivating it manually should award a full point to each existing flagger for that month.

## 5. Monthly Reset

No cron job needed. Since confirmations and flags are scoped by `month`, a new month just means new rows can be inserted. `active=false` mics stay deactivated until Adam flips them back on manually.

## 6. Backend Surface

Add two server-side entry points so point/count logic is not trusted to the client:

- `confirm_mic(mic_unique_identifier)`
- `report_mic(mic_unique_identifier)`

Both should write against `open_mics_historical`.
