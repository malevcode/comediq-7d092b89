

## Plan: Gate Location Behind Auth & Persist Permission

### Problem
Every visitor (including anonymous) gets hit with a browser "share your location?" prompt on page load. This is intrusive UX. Location should only be requested for logged-in users, and the grant should be remembered so they aren't re-prompted.

### Changes

#### 1. `src/hooks/useUserLocation.ts` — Only request location for logged-in users

- Import `useAuth` and check `user` before requesting location
- If no user, skip the auto-request on mount entirely (return null location, no error)
- Cache the last known location in `localStorage` keyed by user ID so we can restore it instantly on next visit without re-prompting (the browser remembers the grant, but this avoids the loading delay)
- On mount with a logged-in user: first load cached coords from localStorage, then request fresh coords in background

#### 2. `src/components/OpenMicsDetailedList.tsx` — No behavior change needed

The `useUserLocation` hook already returns `null` for location when not available — the distance display simply won't show, which is correct for anonymous users.

#### 3. `src/components/map/OpenMicsMapRefactored.tsx` — Gate auto-location request

- The map component has its own inline location request (`recenterOnUserLocation` called on mount). Import `useAuth` and only auto-request on mount if user is logged in.
- Keep the manual "Recenter" button functional for logged-in users only. For anonymous users, hide or disable the recenter button.

### Summary

| File | Change |
|------|--------|
| `src/hooks/useUserLocation.ts` | Import `useAuth`, skip auto-request if no user, cache coords in localStorage per user ID |
| `src/components/map/OpenMicsMapRefactored.tsx` | Import `useAuth`, only call `recenterOnUserLocation` on mount if logged in, disable recenter button for anonymous |

Two files edited. Anonymous users never see the location prompt. Logged-in users get location cached so subsequent visits are instant.

