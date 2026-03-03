

## Plan: Fix Playlist System + Add to Profile

### Problems Identified

1. **Playlist dropdown gets clipped**: The `PlaylistSelectorDropdown` uses `absolute bottom-full` positioning inside mic cards that have `overflow-x-hidden`. The dropdown renders behind/clipped by parent elements.
2. **No playlists on Profile page**: Profile has tabs for Profile, Gigs, Liked Mics, Signups — but no Playlists tab despite playlists being a core feature.
3. **Playlist discovery is weak**: Users aren't encouraged to create playlists the way Spotify does.

### Fix 1: Replace Dropdown with Dialog

Change `PlaylistSelectorDropdown` from an absolutely-positioned dropdown to a **Dialog (modal)** using the existing `Dialog` component. This eliminates all clipping/overflow issues regardless of where the button lives.

**File**: `src/components/mic/PlaylistSelectorDropdown.tsx`
- Convert from `<div className="absolute ...">` to `<Dialog>` with `open`/`onOpenChange` props
- Keep the same internal UI (playlist list, create new, checkmarks)
- Update `MicActionBar.tsx` to pass `open`/`onOpenChange` instead of toggling visibility manually

### Fix 2: Add Playlists Tab to Profile

**File**: `src/pages/Profile.tsx`
- Add a 5th tab: "Playlists" (with ListMusic icon)
- Import and render `PlaylistsTab` content (playlist cards + create button)
- Show playlist count in tab label
- Update grid from `grid-cols-4` to `grid-cols-5`

### Fix 3: Spotify-Style Encouragement

**File**: `src/components/playlists/PlaylistsTab.tsx`
- Update empty state with more engaging copy: "Build your mic rotation", suggested playlist names ("Monday Night Lineup", "Free Mics Only", "Brooklyn Circuit")
- Add quick-create buttons with pre-filled names so users can one-tap create common playlists

### Implementation Steps

| Step | What | File |
|------|------|------|
| 1 | Convert PlaylistSelectorDropdown to Dialog | `PlaylistSelectorDropdown.tsx` |
| 2 | Update MicActionBar to use dialog pattern | `MicActionBar.tsx` |
| 3 | Add "Playlists" tab to Profile page | `Profile.tsx` |
| 4 | Enhance empty state with Spotify-style prompts | `PlaylistsTab.tsx` |

