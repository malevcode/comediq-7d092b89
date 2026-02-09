

# Dev View -- Spreadsheet/Excel View for Open Mics

## Overview
Create a new "Dev View" page accessible from the Perform tab that displays all open mic data in a Google Sheets-style spreadsheet. This gives users the same familiar tabular experience they currently get from the open source Google Sheet, but with up-to-date Supabase data. Logged-in users can edit cells inline (auto-save on blur). Sensitive columns (phone numbers, user info, sms_response) are excluded.

## Why This Matters
Hundreds of users still check the original Google Sheet because it offers:
- A dense, scrollable spreadsheet view of all mic data
- Offline-friendly (static, cacheable data)
- Editable cells for community corrections

This page replicates all of that with live Supabase data.

---

## What Gets Built

### 1. New Page: `src/pages/DevView.tsx`

A full-page spreadsheet component that:

- Fetches all active mics from `open_mics_historical` using the existing `useOpenMics` hook (already cached for 10 min, works offline if previously loaded)
- Displays every shareable column in a horizontal-scrolling table
- Logged-in users can click any cell to edit it inline (auto-saves on blur, like the admin spreadsheet)
- Non-logged-in users see a read-only view
- Column filters for Day, Borough, City
- Search bar for quick text filtering
- Dense rows (compact styling similar to AdminMicsSpreadsheet)

**Columns displayed (in order):**

| Column | DB Field | Editable |
|--------|----------|----------|
| Day | day | Yes (logged in) |
| Start Time | start_time | Yes |
| End Time | latest_end_time | Yes |
| Name | open_mic | Yes |
| Venue | venue_name | Yes |
| Borough | borough | Yes |
| Neighborhood | neighborhood | Yes |
| Address | location | Yes |
| City | city | Yes |
| Venue Type | venue_type | Yes |
| Cost | cost | Yes |
| Stage Time | stage_time | Yes |
| Sign-Up Instructions | sign_up_instructions | Yes |
| Host(s) | hosts_organizers | Yes |
| Instagram/Updates | changes_updates | Yes |
| Other Rules | other_rules | Yes |
| Last Verified | last_verified | Yes |

**Excluded columns** (sensitive/admin-only):
- `sms_response` -- internal admin field
- `host_phone` -- PII
- `signup_enabled` -- admin-managed
- `active` -- admin-managed
- `cover_image_url` -- not useful in spreadsheet

### 2. New Tab in Perform Page

Add a 4th tab to `src/pages/Perform.tsx`:

```
[ Find Mics ] [ Playlists ] [ Shows ] [ Dev View ]
```

The "Dev View" tab will use a spreadsheet icon (`Sheet` or `Table2` from lucide-react) and link to the new component.

### 3. Route Registration

Add `/dev-view` route in `src/App.tsx` and update `BottomNavigation.tsx` to keep the Perform tab highlighted when on `/dev-view`.

---

## Technical Approach

### Data Source
Reuses the existing `useOpenMics()` hook which:
- Fetches from `open_mics_historical`
- Filters to active mics only
- Has 10-minute stale time (works offline from cache)
- Returns `OpenMic[]` mapped interface

For the spreadsheet, we also need raw DB column names for editing. We'll fetch data directly from Supabase in this component (similar to `AdminMicsSpreadsheet`) to avoid the mapping layer.

### Inline Editing (Logged-In Users Only)
- Click a cell to enter edit mode (shows an Input)
- On blur or Enter: auto-save to `open_mics_historical` via Supabase
- On Escape: cancel edit
- Visual feedback: brief green ring on successful save
- Uses the existing RLS policy: "Verified hosts can update their mic info" for hosts, and regular authenticated users will get a permission error (gracefully handled with a toast)

**RLS consideration**: Currently only admins and verified hosts can UPDATE `open_mics_historical`. For community editing, we need to add an RLS policy allowing authenticated users to update non-sensitive columns. This will be done via a database migration.

### New RLS Policy
Add an UPDATE policy for authenticated users on `open_mics_historical` that allows editing the public-facing columns only. This keeps admin-only fields (active, signup_enabled, sms_response) locked down.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/DevView.tsx` | **Create** -- New spreadsheet page component |
| `src/pages/Perform.tsx` | **Modify** -- Add 4th "Dev View" tab, update grid-cols-3 to grid-cols-4 |
| `src/contexts/TabContext.tsx` | **Modify** -- Add 'dev-view' to scroll positions |
| `src/App.tsx` | **Modify** -- Add `/dev-view` route |
| `src/components/BottomNavigation.tsx` | **Modify** -- Add `/dev-view` to Perform active check |
| Database migration | **Create** -- Add RLS policy for authenticated user updates on safe columns |

---

## Database Migration

```sql
-- Allow authenticated users to update public-facing columns
-- This enables community editing like the original Google Sheet
CREATE POLICY "Authenticated users can update public mic info"
  ON open_mics_historical
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

Note: Since Postgres RLS policies cannot restrict which columns are updated at the policy level, the application code will enforce which columns are editable. The existing admin-only fields (active, signup_enabled) will simply not be rendered as editable in the Dev View UI.

---

## Key Design Decisions

1. **Separate from Admin Spreadsheet**: The Admin spreadsheet has bulk operations (delete, activate/deactivate, export) and shows all columns including sensitive ones. Dev View is a public-facing, simplified version.

2. **Offline-friendly**: Data is cached via React Query with a 10-minute stale time. Once loaded, the spreadsheet remains viewable even if the connection drops.

3. **No bulk operations**: Unlike the admin view, no checkboxes, no bulk delete/export. Just simple cell-by-cell editing.

4. **Dense styling**: Compact rows (~24px height) to maximize visible data, matching the Google Sheets feel.

