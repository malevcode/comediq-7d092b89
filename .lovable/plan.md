

## Slots Page Overhaul + Host Run-of-Show + Performance Tracking + Waitlist Notifications

This is a large feature set. I'll break it into 4 phases, with Phase 1 (Slots page redesign + functional signup) being the immediate implementation, and Phases 2-4 as follow-ups.

---

### Phase 1: Slots Page Redesign (matching screenshot) + Functional Signup

**Goal**: Make `/slots` (and the Perform > Slots tab) match the reference screenshot -- clean header, "Mics with Slots Available" horizontal card row, "+ List My Mic Slots" CTA, and inline signup flow.

**File: `src/pages/Slots.tsx`** -- Full rewrite:
- **Header**: Keep `TicketCheck` icon + "Slots" title + subtitle. Move "+ Open List" button to the right of the header (already done, matches screenshot).
- **"+ List My Mic Slots" CTA**: Full-width outlined button below header that toggles the create form inline (currently "Open Your List" -- rename to match screenshot).
- **"Mics with Slots Available" section**: Replace the vertical card list with a horizontal scrolling row of compact cards showing mic name, venue, day/time, host, and slot duration badge. This matches the 3-card horizontal layout in the screenshot. Use `overflow-x-auto flex gap-3` with min-width cards.
- **Active Signup Events section below**: Keep the existing vertical card list for events that have active signups, with the progress bar and signup button. If no events, show the "No active signup events yet" empty state (matches screenshot).
- **Guest/anonymous signup**: Update `SignupButton` to support guest signups -- if user is not authenticated, show a dialog collecting Name, Email, Phone (per the Comediq Slots memory). Insert into `mic_signups` using a guest flow (or prompt sign-in). This requires a small schema addition.

**File: `src/components/signup/SignupButton.tsx`**:
- Replace "Sign in to sign up" disabled button with a dialog that collects name/email/phone for guest signups.
- For authenticated users, keep one-click signup flow.

**Database migration**:
- Add `guest_name`, `guest_email`, `guest_phone` nullable text columns to `mic_signups` table.
- Update RLS: allow anon inserts to `mic_signups` (with `guest_email IS NOT NULL` check).

---

### Phase 2: Run of Show (Host Drag & Drop Lineup)

**Goal**: Hosts can reorder signups into a lineup on the Host Dashboard.

**File: `src/components/host/RunOfShow.tsx`** (new):
- Drag-and-drop list of confirmed signups for an event using `@dnd-kit/core` (already common in React).
- Each item shows: order number, comedian name, notes, status badge.
- "Save Order" button persists `signup_order` on each `mic_signups` row.
- "Export CSV" button generates a downloadable lineup.

**File: `src/pages/HostDashboard.tsx`**:
- Replace `ManageSignups` with `RunOfShow` component for each active event.
- Add a tab or section toggle between "Signups" (raw list) and "Run of Show" (reorderable).

**Database migration**:
- `signup_order` column already exists on `mic_signups` -- just need to ensure hosts can update it (RLS already allows host updates).

---

### Phase 3: "I Went Up" Performance Tracking

**Goal**: Comedians can mark that they performed at a mic, building a personal heat map.

**File: `src/components/mic/WentUpToggle.tsx`** (new):
- Simple toggle button on mic detail and signup list: "I went up" checkmark.
- On toggle, inserts into a `user_mic_checkins` table with `user_id`, `mic_id`, `checked_in_at`.

**File: `src/components/profile/PerformanceHeatmap.tsx`** (new):
- Calendar heat map (like GitHub contributions) showing which days/mics the user performed.
- Data sourced from `user_mic_checkins`.

**Database migration**:
- Create `user_mic_checkins` table: `id uuid PK`, `user_id uuid NOT NULL`, `mic_id uuid NOT NULL`, `checked_in_at timestamptz DEFAULT now()`, unique constraint on `(user_id, mic_id, date(checked_in_at))`.
- RLS: users can insert/select/delete their own rows.

---

### Phase 4: Waitlist Automation (SMS/Browser Notifications)

**Goal**: Notify comedians when they're 3 spots away from going up.

**Implementation approach**:
- **Browser notifications**: Use the Web Push API. When a comedian signs up, prompt for notification permission. Store push subscription in a `push_subscriptions` table.
- **SMS notifications**: Requires Twilio integration via a Supabase Edge Function. When `signup_order` changes (host reorders lineup), the edge function checks if any comedian is now 3 spots away and sends an SMS.
- **Edge Function: `notify-upcoming-spot`**: Triggered by a database webhook on `mic_signups` update. Checks position, sends notification.

**Database migration**:
- Create `push_subscriptions` table for browser push.
- Add `phone_number` to profiles (or use `guest_phone` from signups).

---

### Implementation Order

Phase 1 is the immediate build. Phases 2-4 will be follow-up tasks. Phase 1 covers:

1. **Migration**: Add guest columns to `mic_signups` + anon insert RLS
2. **`src/pages/Slots.tsx`**: Rewrite with horizontal "Mics with Slots" cards + vertical events list
3. **`src/components/signup/SignupButton.tsx`**: Add guest signup dialog
4. **`src/components/signup/SignupList.tsx`**: Show guest names alongside authenticated usernames

### Files Modified
- `src/pages/Slots.tsx` (major rewrite)
- `src/components/signup/SignupButton.tsx` (guest flow)
- `src/components/signup/SignupList.tsx` (display guest names)
- Database migration (guest columns + RLS)

### Files Created (Phase 2-4, later)
- `src/components/host/RunOfShow.tsx`
- `src/components/mic/WentUpToggle.tsx`
- `src/components/profile/PerformanceHeatmap.tsx`

