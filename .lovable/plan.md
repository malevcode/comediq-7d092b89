

# Fix: Slots Navigation & Standalone Route

## Problem
The hamburger menu "Slots" link points to `/open-mics?tab=slots`, but `OpenMics.tsx` doesn't handle a `tab` parameter — it just shows Find Mics. The Slots component is buried inside the Perform page as a tab, so users can never reach it from the menu.

## Solution

### 1. Add a standalone `/slots` route in `App.tsx`
Register `<Route path="/slots" element={<Slots />} />` so Slots has its own page.

### 2. Update hamburger menu link
Change the Slots path from `/open-mics?tab=slots` to `/slots`.

### 3. Update Perform tab's Slots trigger
Change the Slots tab trigger in `Perform.tsx` to navigate to `/slots` instead of rendering inline (or keep both — the tab and the standalone route).

### 4. Ensure the Slots browse view shows the beta mics
The `fetchAllActiveEvents` query already fetches from `mic_signup_events` with `is_active = true`. The three beta mics need active events created. The `MicSlotsGrid` on the detail page auto-creates events, but the browse view depends on events existing. We should either:
- Auto-seed events for `slots_enabled` mics, OR
- Show `slots_enabled` mics in the browse view even without an active event, with a "Sign up" link to the mic detail page

The simpler approach: enhance the Slots browse view to also query `open_mics_historical` where `slots_enabled = true` and display those mics as cards linking to their detail pages (where `MicSlotsGrid` handles event creation).

## Files to Change

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/slots` route |
| `src/components/HamburgerMenu.tsx` | Update Slots path to `/slots` |
| `src/pages/Slots.tsx` | Add a section showing `slots_enabled` mics from `open_mics_historical`, linking to their detail pages |
| `src/pages/Perform.tsx` | Update Slots tab to link/redirect to `/slots` |

