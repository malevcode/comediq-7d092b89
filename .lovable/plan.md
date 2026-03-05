

## Plan: Smart Data Organizer (AI-Powered Bulk Update Tool)

### What It Does
A new "Update" tab in the admin dashboard where you paste unstructured update messages (like the Buddha Room example), and AI parses them into actionable database updates — matching existing mics and showing a diff-style preview before committing.

### Architecture

**1. New Edge Function: `parse-mic-updates`**
- Takes raw text, sends it to Lovable AI (Gemini Flash) with a specialized prompt for *updates* (not new mics)
- Uses tool calling to extract structured update operations:
  - `action`: `update_time` | `update_cost` | `add_new` | `deactivate`
  - `venue_name`, `day`, `old_start_time`, `new_start_time`, `cost`, `stage_time`, `open_mic` name, etc.
- Returns an array of proposed changes

**2. New Component: `SmartUpdateInterface.tsx`**
- **Input step**: Large textarea for pasting raw messages + "Parse Updates" button
- **Preview step**: A table showing each proposed change with:
  - Matched mic name + venue (auto-matched from `open_mics_historical` by venue + day + time)
  - Change type badge (Time Change, New Mic, Cost Update)
  - Before → After diff columns (e.g., `8:00 PM` → `7:30 PM`)
  - Match confidence indicator (green = exact match found, yellow = fuzzy, red = no match / new mic)
  - Checkbox per row to include/exclude
- **Commit step**: Applies selected updates via Supabase update/insert calls

**3. Matching Logic (client-side)**
- After AI returns parsed updates, the component fetches all mics and matches by `venue_name` (fuzzy) + `day` + `start_time`
- Exact matches get auto-linked; ambiguous matches show a dropdown to pick the right mic
- "Add new" actions route through the existing insert flow

**4. Admin Dashboard Integration**
- Add a new "Update" tab trigger in the `TabsList` on `AdminInterface.tsx`
- Render `<SmartUpdateInterface />` inside it

### Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/parse-mic-updates/index.ts` | Create — AI edge function for update parsing |
| `supabase/config.toml` | Edit — register new function |
| `src/components/admin/SmartUpdateInterface.tsx` | Create — main UI component |
| `src/pages/AdminInterface.tsx` | Edit — add "Update" tab |

### Edge Function Prompt Design
The system prompt will instruct the AI to identify update *operations* rather than full mic records. For the Buddha Room example, it would return:
```json
[
  { "action": "update_time", "venue_name": "The Buddha Room", "day": "Monday", "old_start_time": "4:00 PM", "new_start_time": "4:30 PM" },
  { "action": "update_time", "venue_name": "The Buddha Room", "day": "Monday", "old_start_time": "8:00 PM", "new_start_time": "7:30 PM" },
  { "action": "add_new", "venue_name": "The Buddha Room", "day": "Monday", "new_start_time": "9:00 PM", "stage_time": "6 minutes", "cost": "$5" },
  { "action": "update_time", "venue_name": "The Buddha Room", "day": "Tuesday", "old_start_time": "8:00 PM", "new_start_time": "7:30 PM" },
  { "action": "update_time", "venue_name": "The Buddha Room", "day": "Tuesday", "old_start_time": "10:00 PM", "new_start_time": "9:00 PM" }
]
```

