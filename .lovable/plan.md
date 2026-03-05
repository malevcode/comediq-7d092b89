

## Plan: Build "Slots" Tab + "NEW" Section in Hamburger Menu

### Overview
Create a new "Slots" tab under Perform where comedians can list their mics/shows for signups, and other users can sign up for spots. Add a flashy "NEW" section to the hamburger menu highlighting this feature.

### 1. New "Slots" Page (`src/pages/Slots.tsx`)

A dedicated page with two views:

**Browse View (default):** Shows all active signup events as cards, each displaying:
- Mic/show name, venue, date, time, borough
- Spots remaining (progress bar)
- "Sign Up" button (opens existing SignupButton dialog)
- Filterable by day, borough

**Create View (for hosts/authenticated users):** A streamlined form to:
- Select an existing mic from `open_mics_historical` (autocomplete)
- OR manually enter a mic/show name + venue
- Set date, time, total spots, signup mode (first come / lottery / bucket)
- Optional notes
- Submits to `mic_signup_events` via existing API

This reuses `SignupList`, `SignupButton`, and `CreateEventForm` components but wraps them in a more polished, browsable layout.

### 2. Add "Slots" Tab to Perform (`src/pages/Perform.tsx`)

- Add a 5th tab: "Slots" with a `TicketCheck` or `Users` icon
- Update `TabsList` from `grid-cols-4` to `grid-cols-5`
- Add scroll position tracking for the new tab
- Render `<Slots />` inside the new `TabsContent`

### 3. Update TabContext (`src/contexts/TabContext.tsx`)

- Default tab remains "find-mics", just add "slots" to the comment listing tracked tabs

### 4. Flashy "NEW" Section in Hamburger Menu (`src/components/HamburgerMenu.tsx`)

Add a new collapsible section between "Perform" and "Laugh" sections:

```text
┌─────────────────────────┐
│  🔥 NEW                 │
│  ├─ ✨ Slots        NEW │
│  └─ (future items)      │
└─────────────────────────┘
```

- Section header: gradient text or orange/amber highlight with a sparkle icon
- "NEW" pill badge next to "Slots" item (animated pulse, amber/orange)
- Links to `/open-mics?tab=slots`
- Collapsible, default expanded

### 5. Update Routes & Navigation

- **App.tsx**: No new route needed — Slots lives inside the Perform tabs at `/open-mics?tab=slots`
- **BottomNavigation.tsx**: Add `/open-mics` with `tab=slots` to the perform-active check (already covered)

### 6. Slots Page UI Design

The page will have:
- A header with "Slots" title and a prominent "Open Your List" CTA button
- A grid/list of active signup event cards with:
  - Gradient accent border for events with spots remaining
  - "FULL" overlay badge when no spots left
  - Animated spot counter
- Empty state: illustration + "No active slots — be the first to open one!"

### Technical Details

- **Data fetching**: New hook `useAllSignupEvents()` that queries `mic_signup_events` joined with `open_mics_historical` for all active future events (no mic_id filter)
- **RLS**: Existing policies already allow `SELECT` on active events for anyone and `INSERT` for authenticated hosts
- **Components reused**: `SignupButton`, `SignupList`, `CreateEventForm` (with minor prop adjustments)
- **New components**: `src/pages/Slots.tsx`, updated `HamburgerMenu.tsx`

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/Slots.tsx` | Create — main Slots page |
| `src/pages/Perform.tsx` | Edit — add 5th tab |
| `src/components/HamburgerMenu.tsx` | Edit — add "NEW" section |
| `src/components/BottomNavigation.tsx` | Edit — minor active-state update |
| `src/hooks/useAllSignupEvents.ts` | Create — fetch all active events |
| `src/api/signups.ts` | Edit — add `fetchAllActiveEvents()` |

