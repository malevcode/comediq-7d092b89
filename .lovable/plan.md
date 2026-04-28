
## Mic of the Day — Refined Plan

### Layout (mobile-first)
Side-by-side row above the mic list, each card ~50% width:
```text
┌──────────────┬──────────────┐
│ [Ad] Likeable│ ⭐ Mic o' Day│
│   Podcast ↗  │   Venue Name │
└──────────────┴──────────────┘
```
- Grid: `grid-cols-2 gap-2` — both cards same compact height as current SponsorCard (single line, ~1/2 standard card)
- Mic of the Day card: gold left border, tiny "⭐ Mic of Day" badge (text-[9px]), mic name truncated, no extra metadata to keep it light

### Click behavior
Tapping the Mic of the Day card:
1. Scrolls to that mic's row in the list (using `scrollIntoView` on a ref keyed by `uniqueIdentifier`)
2. Auto-expands the "Additional Details" dropdown for that card
3. Briefly highlights the row (gold flash, ~1.5s) for visual confirmation

Implementation: `OpenMicsDetailedList` already manages expanded state per mic. Add support for an `initialExpandedMicId` that:
- Sets that mic as expanded on mount/when it changes
- Scrolls its DOM node into view (smooth, block: 'center')

### Visibility everywhere
Mic of the Day appears on:
1. **Find Mics → Next tab** (paired with sponsor ad, side-by-side, per drawing)
2. **OpenMicsLoadingScreen** (below the loading spinner, paired with the existing loading_screen sponsor in the same 2-col grid)
3. Stays hidden on other day tabs (Sun/Mon/Tue/etc.) — same restriction as sponsor ad

### Database (one new table)
`mic_of_the_day`:
- `id` uuid PK
- `mic_unique_identifier` uuid (the mic being featured)
- `claimed_by` uuid (host user_id)
- `claim_date` date — **UNIQUE** (race-safe first-come-first-served)
- `claimed_at` timestamptz
- `created_at` timestamptz

RLS:
- SELECT: public
- INSERT: authenticated verified hosts of that mic only (checked against `mic_hosts.is_verified = true`)
- Admin full access

### Claim flow
- Verified hosts see "Claim Mic of the Day" button inside their mic's expanded details (next to existing ClaimMicButton)
- Button disabled if today's slot already claimed (shows current holder's mic name)
- Insert fails gracefully via unique constraint → toast "Already claimed for today"
- Slot resets at midnight America/New_York

### Files
**Create**
- `supabase/migrations/<new>.sql` — table + RLS
- `src/hooks/useMicOfTheDay.ts` — fetches today's mic + full OpenMic data
- `src/components/MicOfTheDayCard.tsx` — compact card matching SponsorCard sizing, accepts onClick
- `src/components/host/ClaimMicOfDayButton.tsx` — host-only claim button

**Edit**
- `src/components/OpenMicsDetailedList.tsx` — render 2-col grid (sponsor + mic of day) when `showMicOfDay` true; accept `initialExpandedMicId`; add row refs + scroll/expand/flash logic
- `src/pages/OpenMics.tsx` — pass `showMicOfDay={activeTab === "next"}` and wire click handler to set expanded id
- `src/components/OpenMicsLoadingScreen.tsx` — render the same 2-col grid (existing SponsorCard + MicOfTheDayCard)
- `src/components/host/HostMicEditForm.tsx` (or wherever host actions live for a claimed mic) — mount ClaimMicOfDayButton

### Open question
None — proceeding with the layout exactly as drawn in attachment 1, loading screen pairing as in attachment 2, and tap-to-scroll-and-expand behavior.

---

## MOTD Phase 2 — Nomination, Voting, Admin Control

Keep in mind:
- **UI**: MOTD active and functional.
- **Data**: Nomination/Voting loop live.
- **Business**: Credit/Wallet system ready for the "Pro" membership launch.

### Prompt
I need to implement a 'Mic of the Day' (MOTD) nomination and voting system.

Nomination UI: Add a 'Nominate for Mic of the Day' button on each mic listing card.

Voting: Create a simple voting interface where users can upvote a nomination.

Logic:
- Create a database table motd_nominations to track submissions.
- Create a cron job logic that runs at midnight to determine the winner based on vote counts.
- If no votes exist, implement a fallback function that pulls the pre-set historical mic name for that specific day of the week (Sunday-Saturday).

Admin Dashboard: Add an 'MOTD Control' section in the Admin view to manually select/lock a mic as the MOTD. This should override both nominations and defaults.
