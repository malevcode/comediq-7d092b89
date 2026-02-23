

# Mic Playlists Feature - Bug Report and Fix Plan

## Bugs Found

### Bug 1: Broken "View Saved Mics" link (PlaylistsTab.tsx)
The "View Saved Mics" button inside the Playlists tab links to `/saved-mics`, but the actual route is `/saved`. This means when users click it, they get a 404/Not Found page.

**File:** `src/components/playlists/PlaylistsTab.tsx`, line 199
**Current:** `<Link to="/saved-mics">`
**Fix:** `<Link to="/saved">`

### Bug 2: Playlists are buried and hard to find
The playlist feature is hidden inside a "Playlists" sub-tab within the Perform page. Users must: navigate to Perform -> click "Playlists" tab -> then see the feature. There is no link from the bottom navigation, home dashboard, or profile page. Most users will never discover it.

**Fix:** Add a "Playlists" link from the Home dashboard or from the Saved Mics page so users naturally find it.

### Bug 3: Two competing playlist systems confuse users
There are TWO separate playlist pages:
1. `/playlists` - A standalone page with its own create/edit/delete UI (Playlists.tsx)
2. Playlists tab inside `/open-mics` (Perform.tsx -> PlaylistsTab) with a completely different UI

Both use the same data but have different styling and navigation. Users who find one may never find the other, and the duplication is confusing.

**Fix:** Remove the standalone `/playlists` page and consolidate into the tab experience, OR redirect `/playlists` to the Perform page's playlists tab.

### Bug 4: No visual feedback on which mics are already in a playlist
When a user opens the playlist selector dropdown from a mic card, there's no indication of which playlists already contain that mic. Users may try to add the same mic again and get a confusing duplicate error.

**Fix:** Check existing playlist membership when the dropdown opens and show a checkmark for playlists that already contain the mic.

## Proposed Changes

| File | Change |
|------|--------|
| `src/components/playlists/PlaylistsTab.tsx` | Fix `/saved-mics` link to `/saved` |
| `src/pages/Playlists.tsx` | Redirect to `/open-mics?tab=playlists` instead of rendering a duplicate UI |
| `src/components/Home.tsx` | Add a "My Playlists" quick link on the dashboard so users can discover the feature |
| `src/components/mic/PlaylistSelectorDropdown.tsx` | Query existing playlist items for the mic and pre-mark playlists that already contain it |

## Technical Details

### Fix 1 - Broken link (1 line change)
In `PlaylistsTab.tsx` line 199, change the Link `to` prop from `/saved-mics` to `/saved`.

### Fix 2 - Consolidate duplicate playlist page
In `Playlists.tsx`, replace the full page with a redirect: `navigate("/open-mics?tab=playlists")`. This eliminates the confusing duplicate and funnels users to the richer tab experience.

### Fix 3 - Add dashboard discoverability
In `Home.tsx`, add a small "My Playlists" card or link below the Saved/Liked row that navigates to `/open-mics?tab=playlists`.

### Fix 4 - Show existing membership in dropdown
In `PlaylistSelectorDropdown.tsx`, for each playlist, query `mic_playlist_items` to check if `micUniqueIdentifier` already exists. Pre-populate the `addedTo` set with those playlist IDs so checkmarks appear immediately and the add button is disabled for existing entries.

