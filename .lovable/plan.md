

# Fix MicDetailPage: Spacing, Slots UX, Points, and Recommendations

## Problems
1. **Spacing**: Mic name gets clipped under the ad/marquee banner — page lacks `pt-28` used everywhere else
2. **"How to Sign Up" section**: Redundant for slots-enabled mics — Comediq Slots IS the signup method
3. **Quick Info whitespace**: Too much padding in the grid layout
4. **Points deduction**: Should be -5, not -50
5. **No "My Points" link**: Users can't see their points from the slots warning or profile
6. **"You Might Also Like" sorting**: Currently random — should prioritize same day + same neighborhood + similar time

## Changes

### 1. `src/pages/MicDetailPage.tsx`

- Add `pt-28` to the main container to clear header + marquee
- **Hide "How to Sign Up" card** when `mic.slotsEnabled === true` (the MicSlotsGrid replaces it)
- **Move MicSlotsGrid above** the "How to Sign Up" / Venue Details section for prominence
- **Reduce Quick Info whitespace**: Change `gap-4` → `gap-2` in the grid, reduce card padding
- **Sort "You Might Also Like"**: Score each similar mic by relevance:
  - +3 same day AND same neighborhood
  - +2 same neighborhood only
  - +2 same day only
  - +1 same cost
  - +1 similar start time (within 1 hour)
  - Sort descending by score, take top 6

### 2. `src/components/mic/MicSlotsGrid.tsx`

- Change `-50 point` → `-5 point` in the no-show warning text
- Add a "View My Points" link next to the warning that navigates to `/profile`

### 3. `src/pages/Profile.tsx`

- Add a points display card/badge showing `points_balance` from the user profile, so the "View My Points" link has a destination

### 4. Database migration

- Update the no-show trigger to deduct 5 instead of 50
- Update any reference in `points_ledger` amount from -50 to -5

## Files

| Action | File |
|--------|------|
| Edit | `src/pages/MicDetailPage.tsx` — spacing, hide signup card for slots mics, better recommendation sorting |
| Edit | `src/components/mic/MicSlotsGrid.tsx` — change -50 to -5, add "View My Points" link |
| Edit | `src/pages/Profile.tsx` — add points balance display |
| Migration | Update trigger function to deduct 5 points instead of 50 |

