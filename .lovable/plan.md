

# Add Mic Button with Comprehensive Mic Request Form

## Overview
Add a "+" button next to the Filters button on the OpenMics page to allow users to request new mics. Create a new comprehensive form component that collects ALL fields needed for the `open_mics_historical` table.

---

## Current State

**OpenMics page search/filters bar (lines 592-607):**
```tsx
<div className="flex flex-row gap-3 items-center">
  <div className="flex-1 relative">
    <Search ... />
    <Input ... />
  </div>
  <div className="flex gap-2">
    <MicFilters ... />
  </div>
</div>
```

**Existing ShowForm** only collects: title, venue, date, time, borough, notes

**Required fields for `open_mics_historical`:**
- `open_mic` (name) - required
- `venue_name` - required
- `borough` - required for NYC
- `neighborhood`
- `location` (address)
- `day` (weekday) - required
- `start_time` - required
- `latest_end_time`
- `cost`
- `stage_time`
- `sign_up_instructions` (free text)
- `hosts_organizers` (host Instagram)
- `venue_type` (comedy club, bar, etc.)
- `changes_updates` (host contact for updates)
- `other_rules`
- `city` (default: New York)
- Host phone number (optional - for contact)

---

## Implementation Plan

### 1. Create New AddMicRequestForm Component

**New file: `src/components/host/AddMicRequestForm.tsx`**

A comprehensive modal form with all required fields organized into logical sections:

```tsx
// Form sections:
// 1. Basic Info: mic name, venue name, city
// 2. Location: borough, neighborhood, address
// 3. Schedule: day, start time, end time, stage time
// 4. Details: cost, venue type, signup instructions
// 5. Host Info: host name/instagram, phone (optional), updates contact
// 6. Rules: other rules (free text)
```

**Form fields:**

| Field | Type | Required | Placeholder/Options |
|-------|------|----------|---------------------|
| open_mic | Input | Yes | "e.g., Comedy Night at Joe's" |
| venue_name | Input | Yes | "e.g., Joe's Bar" |
| city | Select | Yes | New York (default), Los Angeles |
| borough | Select | Conditional* | Manhattan, Brooklyn, Queens, Bronx, Staten Island |
| neighborhood | Input | No | "e.g., East Village" |
| location | Input | No | "123 Main St, New York, NY" |
| day | Select | Yes | Monday-Sunday |
| start_time | Time Input | Yes | "7:00 PM" |
| latest_end_time | Time Input | No | "9:00 PM" |
| stage_time | Input | No | "e.g., 5 minutes" |
| cost | Input | No | "e.g., Free, $5, 1 drink min" |
| venue_type | Select | No | Comedy Club, Bar, Restaurant, Coffee Shop, Other |
| sign_up_instructions | Textarea | No | "How to sign up for this mic..." |
| hosts_organizers | Input | No | "@instagram_handle" |
| host_phone | Input | No | "(555) 123-4567" |
| changes_updates | Input | No | "Contact for changes (Instagram)" |
| other_rules | Textarea | No | "Any additional rules..." |

*Borough required if city is NYC

**Layout:**
- Scrollable modal with max height
- Form organized in 2-column grid where appropriate
- Clear section headers
- Submit button at bottom

### 2. Update OpenMics Page

**File: `src/pages/OpenMics.tsx`**

Add a "+" button next to the Filters button:

```tsx
// Line ~604-606 - Update the flex container
<div className="flex gap-2">
  <Button
    onClick={() => setShowRequestModal(true)}
    variant="outline"
    size="sm"
    className="flex items-center gap-1 px-3 py-4 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
  >
    <Plus className="h-4 w-4" />
  </Button>
  <MicFilters ... />
</div>
```

Import changes:
```tsx
import { Search, HelpCircle, LogIn, Plus } from "lucide-react";
import AddMicRequestForm from "@/components/host/AddMicRequestForm";
```

Replace the ShowForm modal with the new AddMicRequestForm:
```tsx
{showRequestModal && (
  <AddMicRequestForm 
    onSubmit={handleRequestMic} 
    onCancel={() => setShowRequestModal(false)} 
  />
)}
```

### 3. Update handleRequestMic Function

**File: `src/pages/OpenMics.tsx`**

Expand the submit handler to include all new fields:

```tsx
const handleRequestMic = async (formData: MicRequestData) => {
  try {
    const insertObj = {
      show_title: formData.open_mic,
      venue_name: formData.venue_name,
      borough: formData.borough,
      date: formData.day, // Store weekday
      time: formData.start_time,
      // Additional fields stored in a notes/metadata field or 
      // requires expanding open_mics_requests table
      created_at: new Date().toISOString(),
      user_id: user?.id || null,
    };
    // ... rest of submission logic
  }
};
```

### 4. Remove Bottom "Request a Mic" Card

Since the + button is now prominently placed at the top, remove or hide the bottom card (lines 652-661) to reduce redundancy.

---

## Technical Details

### Database Consideration

The `open_mics_requests` table currently only has:
- unique_identifier, show_title, date, time, venue_name, borough, user_id, created_at, reviewed, status

**Option A**: Store extra fields as JSON in a new column
**Option B**: Add migration to expand the table with all fields
**Option C**: Store essential fields now, let admins fill in details after approval

Recommend **Option C** for simplicity - collect essential fields and have admins complete the rest during review.

### Form Validation

- Mic name, venue name, day, start time: Required
- Borough: Required if city = "New York"
- Phone: Optional, validate format if provided
- Times: Validate format (12h or 24h)

---

## Files to Change

| File | Action |
|------|--------|
| `src/components/host/AddMicRequestForm.tsx` | Create new comprehensive form component |
| `src/pages/OpenMics.tsx` | Add + button, import new form, update submit handler |
| `src/components/ShowForm.tsx` | No changes (can keep for other uses) |

---

## Visual Layout

### Header Bar (After)
```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search venues, neighborhoods...              ] [+] [⚙️] │
└─────────────────────────────────────────────────────────────┘
```

### New Form Modal
```
┌─────────────────────────────────────────────────────────┐
│ Request New Mic                                    [X]  │
├─────────────────────────────────────────────────────────┤
│ ─ Basic Info ─                                          │
│ Mic Name *        [                              ]      │
│ Venue Name *      [                              ]      │
│ City *            [New York          ▼]                 │
│                                                         │
│ ─ Location ─                                            │
│ Borough *         [Select...         ▼]                 │
│ Neighborhood      [                              ]      │
│ Address           [                              ]      │
│                                                         │
│ ─ Schedule ─                                            │
│ Day *       [Monday ▼]   Start Time * [7:00 PM]        │
│ End Time    [9:00 PM]    Stage Time   [5 min  ]        │
│                                                         │
│ ─ Details ─                                             │
│ Cost              [Free / $5 / 1 drink min]            │
│ Venue Type        [Bar               ▼]                 │
│ Sign-up Instructions                                    │
│ [                                                  ]    │
│                                                         │
│ ─ Host Info ─                                           │
│ Host Instagram    [@handle           ]                  │
│ Phone (optional)  [(555) 123-4567    ]                  │
│ Updates Contact   [@handle           ]                  │
│                                                         │
│ ─ Rules ─                                               │
│ [Other rules or notes...                           ]    │
│                                                         │
│                           [Submit Mic Request]          │
└─────────────────────────────────────────────────────────┘
```

