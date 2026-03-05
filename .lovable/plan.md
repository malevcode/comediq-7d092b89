

# Comediq Slots! Implementation Plan

## Overview
Launch "Comediq Slots!" with a visual slot grid on mic detail pages, one-click booking with confetti, projected stage times, host CSV export with Instagram handles, no-show tracking with -50 points, and beta activation for three specific mics.

## 1. Database Migration

**Add columns to `open_mics_historical`:**
- `slots_enabled` (boolean, default false)
- `slot_duration_minutes` (integer, default 5)
- `price_per_slot` (numeric, nullable) — future Stripe hook

**Create `mic_bookings` table** for no-show/history tracking:
- `id`, `signup_id` (FK → mic_signups), `event_id` (FK → mic_signup_events), `user_id`, `status` (text: completed/no_show/cancelled), `marked_by` (UUID), `created_at`
- RLS: hosts can insert/update for their events, users can view own records, admins full access

**No-show trigger function:**
- On INSERT to `mic_bookings` where `status = 'no_show'`, deduct 50 from `profiles.points_balance` and log to `points_ledger`

**Beta activation SQL:**
- UPDATE `open_mics_historical` SET `slots_enabled = true`, `slot_duration_minutes = 5` WHERE `unique_identifier` IN:
  - `0d6e6906-18a8-4a7b-89e4-e5d1b70dccb1` (Comediq Sunday)
  - `0f7cb01c-8879-4ea3-a97b-0de90802490a` (Michael Prank Mic)
  - `18838f99-fd80-46f5-a6f9-dc9def84e863` (Nico Extreme Phoenix)

## 2. New Component: `MicSlotsGrid.tsx`

Visual numbered slot grid showing:
- Slot number, **projected stage time** (calculated from `startTime + slot_index * slot_duration_minutes`)
- Green = available (clickable), Red = taken (shows username)
- One-click booking: click available slot → instant `signUpForEvent` → confetti animation + success toast
- Small warning note: "⚠️ No-shows result in a -50 point deduction."
- Auto-creates next event via `getOrCreateNextEvent` if none exists
- Login prompt for unauthenticated users

**Confetti**: Lightweight CSS-based confetti burst on successful booking (no external library needed).

## 3. Edit: `MicDetailPage.tsx`

- After the "How to Sign Up" card, conditionally render `<MicSlotsGrid>` when `mic.slotsEnabled === true`
- Pass `mic.startTime`, `mic.uniqueIdentifier`, `mic.day`, `slotDurationMinutes`

## 4. Edit: `OpenMic` type + `useOpenMics` hook

- Add `slotsEnabled`, `slotDurationMinutes`, `pricePerSlot` to `OpenMic` interface
- Map new DB columns in the hook

## 5. Edit: `ManageSignups.tsx` (Host Dashboard)

- **Mark No-Show** button per signup → inserts into `mic_bookings` with status `no_show`
- **Export CSV** button → downloads CSV with columns: #, Username, Stage Name, Instagram Handle, Signup Time, Notes
- Instagram handle fetched by joining `comedian_social_links` where `platform = 'instagram'`

## 6. API additions in `signups.ts`

- `markNoShow(signupId, eventId, userId)` — inserts into `mic_bookings`
- `exportEventSignups(eventId)` — fetches signups with profile + social links data

## Files

| Action | File |
|--------|------|
| Create | `src/components/mic/MicSlotsGrid.tsx` |
| Edit | `src/types/openMic.ts` |
| Edit | `src/hooks/useOpenMics.ts` |
| Edit | `src/pages/MicDetailPage.tsx` |
| Edit | `src/components/host/ManageSignups.tsx` |
| Edit | `src/api/signups.ts` |
| Migration | Schema changes + no-show trigger + beta activation |

