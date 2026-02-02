

# Add Playlists Tab to Perform Page - Spotify-Style Mic Collections

## Overview
Add a **"My Playlists"** tab to the Perform page that allows users to view, create, and manage their mic playlists with smart recommendations based on preferences like neighborhoods, price, time of day, and day of the week.

---

## Current State
- Playlist database tables exist (`mic_playlists`, `mic_playlist_items`) and are functional
- `useMicPlaylists` hook works correctly (tested: creates playlists and adds mics)
- `PlaylistSelectorDropdown` component exists for adding mics to playlists
- Standalone pages exist at `/playlists` and `/playlists/:playlistId`
- The Perform page currently has 2 tabs: "Find Mics" and "Show Scheduler"

## Proposed Changes

### 1. Add "Playlists" Tab to Perform Page

**File: `src/pages/Perform.tsx`**

Add a third tab for "Playlists" to the existing tab structure:

```
Before:
┌─────────────────┬───────────────────┐
│   Find Mics     │  Show Scheduler   │
└─────────────────┴───────────────────┘

After:
┌─────────────┬───────────────┬───────────────┐
│  Find Mics  │   Playlists   │Show Scheduler │
└─────────────┴───────────────┴───────────────┘
```

- Update `TabsList` to 3 columns
- Add scroll position tracking for "playlists" tab
- Import and render new `PlaylistsTab` component

---

### 2. Create New PlaylistsTab Component

**File: `src/components/playlists/PlaylistsTab.tsx`** (new)

A self-contained tab component with:

**Section A: Quick Actions Header**
- "Create New Playlist" button
- Link to "Saved Mics" 
- Playlist count summary

**Section B: Smart Playlist Suggestions**
Generate auto-recommended collections based on user's liked/saved mics:
- "Free Mics Only" - filtered by cost = $0
- "Tonight's Picks" - mics happening today sorted by time
- "Your Neighborhood" - mics in user's most-visited boroughs
- "Late Night Spots" - mics starting after 9 PM
- "Quick Sets (5 min)" - beginner-friendly short stage times

**Section C: User's Playlists Grid**
- Display all user-created playlists in a card grid
- Show mic count, last updated, public/private status
- Quick actions: Edit, Delete, View

**Section D: Empty State**
For users with no playlists:
- Friendly illustration
- "Create Your First Playlist" CTA
- Explanation of how playlists work

---

### 3. Create PlaylistCard Component

**File: `src/components/playlists/PlaylistCard.tsx`** (new)

A reusable card for displaying playlists with:
- Gradient header with playlist name
- Mic count badge
- Public/private indicator
- Preview of first 3 mics (day + venue name)
- Open, Edit, Delete actions

---

### 4. Create SmartPlaylistCard Component

**File: `src/components/playlists/SmartPlaylistCard.tsx`** (new)

Auto-generated playlist recommendations:
- Different visual style (lighter, suggestion-style)
- "Quick Filter" label
- Click to view filtered mics inline
- No database storage needed (generated on-the-fly)

---

### 5. Inline Playlist View

**File: `src/components/playlists/PlaylistMicList.tsx`** (new)

When a playlist is opened from the tab:
- Show playlist header with name/description
- List mics using `OpenMicsDetailedList` component
- "Back to Playlists" navigation
- Inline editing of playlist name/description
- Remove mic from playlist action

---

### 6. Create Playlist Modal Enhancement

**File: `src/components/playlists/CreatePlaylistModal.tsx`** (new)

Enhanced creation flow with:
- Name and description fields
- Public/private toggle with explanation
- Optional: Set preferences for suggested mics:
  - Preferred boroughs (multi-select)
  - Price range slider
  - Time of day preferences
  - Day of week preferences

---

### 7. Update TabContext

**File: `src/contexts/TabContext.tsx`**

Add "playlists" as a valid tab option and update scroll position tracking.

---

## Visual Layout

### Playlists Tab (Logged In)
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │ [+] New Playlist    │  │ View Saved Mics (12)  →   │   │
│  └─────────────────────┘  └────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  QUICK FILTERS                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Tonight  │ │  Free    │ │Late Night│ │ Your Area   │  │
│  │  (8)     │ │  (24)    │ │  (15)    │ │   (12)      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  YOUR PLAYLISTS (3)                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ Monday Rotation     │ │ Brooklyn Favs       │           │
│  │ 🎤 5 mics          │ │ 🎤 8 mics           │           │
│  │ Updated 2 days ago  │ │ Updated yesterday   │           │
│  │ [Open] [✏️] [🗑️]   │ │ [Open] [✏️] [🗑️]    │           │
│  └─────────────────────┘ └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Playlists Tab (Not Logged In)
```
┌─────────────────────────────────────────────────────────────┐
│                     🎤                                      │
│           Create Mic Playlists                              │
│                                                             │
│   Organize your favorite mics into custom collections.      │
│   Share with friends or keep them private.                  │
│                                                             │
│           [Sign In to Get Started]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Perform.tsx` | Edit | Add third tab for Playlists |
| `src/contexts/TabContext.tsx` | Edit | Add "playlists" scroll tracking |
| `src/components/playlists/PlaylistsTab.tsx` | Create | Main tab content component |
| `src/components/playlists/PlaylistCard.tsx` | Create | User playlist card component |
| `src/components/playlists/SmartPlaylistCard.tsx` | Create | Quick filter suggestion card |
| `src/components/playlists/PlaylistMicList.tsx` | Create | Inline playlist view with mics |
| `src/components/playlists/CreatePlaylistModal.tsx` | Create | Enhanced playlist creation |
| `src/components/playlists/index.ts` | Create | Barrel export file |

---

## Technical Details

### Smart Playlist Generation Logic

Quick filters are computed from the full mic list:

```typescript
// Example: Tonight's picks
const tonightMics = allMics.filter(mic => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return mic.day === today;
});

// Example: Free mics
const freeMics = allMics.filter(mic => 
  mic.cost.toLowerCase().includes('free')
);

// Example: Late night (after 9 PM)
const lateNightMics = allMics.filter(mic => {
  const hour = parseTimeToHour(mic.startTime);
  return hour >= 21;
});

// Example: User's area (based on saved/liked mic boroughs)
const userBoroughs = getMostCommonBoroughs(userLikedMics);
const localMics = allMics.filter(mic => 
  userBoroughs.includes(mic.borough)
);
```

### Data Flow
1. `useMicPlaylists` hook provides CRUD operations for playlists
2. `useOpenMics` provides the full mic list for filtering
3. `usePlaylistItems` fetches mics in a specific playlist
4. Smart filters compute recommendations client-side (no extra DB calls)

### Authentication
- Playlists require authentication
- Unauthenticated users see a sign-in prompt
- Quick filters (smart playlists) can work for everyone as they're just filters

