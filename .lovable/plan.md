

# Fix "Add Mic" Button -- Connect Form to Supabase

## Problem Diagnosis

The + button opens the form correctly, but submissions **fail silently** due to three issues:

### Issue 1: Missing Columns in `open_mics_requests` Table
The form collects 17 fields, but the `open_mics_requests` table only has 10 columns:

| Table Has | Form Sends (Missing from Table) |
|-----------|-------------------------------|
| unique_identifier, show_title, date, time, venue_name, borough, user_id, created_at, reviewed, status | neighborhood, location, venue_type, cost, stage_time, sign_up_instructions, hosts_organizers, changes_updates, other_rules, city, host_phone |

### Issue 2: Data Type Mismatch
- `date` column is type `DATE` but code inserts a weekday string like `"Monday"` -- this causes a type error
- `time` column is type `TIME` but code inserts strings like `"7:00 PM"` -- may also fail

### Issue 3: Auth-Only Insert Policy
The RLS policy only allows **authenticated** users to insert. Non-logged-in users clicking + will get a silent failure.

---

## Solution

### Step 1: Database Migration -- Expand `open_mics_requests` Table

Add all the missing columns and fix column types so the request table can store everything the form collects:

```sql
-- Add missing columns to match the form fields
ALTER TABLE open_mics_requests
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS venue_type text,
  ADD COLUMN IF NOT EXISTS cost text,
  ADD COLUMN IF NOT EXISTS stage_time text,
  ADD COLUMN IF NOT EXISTS sign_up_instructions text,
  ADD COLUMN IF NOT EXISTS hosts_organizers text,
  ADD COLUMN IF NOT EXISTS changes_updates text,
  ADD COLUMN IF NOT EXISTS other_rules text,
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'New York',
  ADD COLUMN IF NOT EXISTS host_phone text,
  ADD COLUMN IF NOT EXISTS latest_end_time text,
  ADD COLUMN IF NOT EXISTS open_mic text;

-- Fix type mismatches: change date to text (stores weekday name)
-- and time to text (stores free-form time string)
ALTER TABLE open_mics_requests
  ALTER COLUMN date TYPE text USING date::text,
  ALTER COLUMN time TYPE text USING time::text;

-- Allow anonymous users to submit mic requests too
CREATE POLICY "Allow anonymous inserts"
  ON open_mics_requests FOR INSERT
  TO anon
  WITH CHECK (true);
```

### Step 2: Update `handleRequestMic` in `src/pages/OpenMics.tsx`

Map ALL form fields to the correct database columns:

```tsx
const handleRequestMic = async (formData: MicRequestFormData) => {
  try {
    const insertObj = {
      show_title: formData.open_mic,
      open_mic: formData.open_mic,
      venue_name: formData.venue_name,
      borough: formData.borough || null,
      neighborhood: formData.neighborhood || null,
      location: formData.location || null,
      date: formData.day,           // weekday name stored as text now
      time: formData.start_time,    // free-form time string
      latest_end_time: formData.latest_end_time || null,
      stage_time: formData.stage_time || null,
      cost: formData.cost || null,
      venue_type: formData.venue_type || null,
      sign_up_instructions: formData.sign_up_instructions || null,
      hosts_organizers: formData.hosts_organizers || null,
      host_phone: formData.host_phone || null,
      changes_updates: formData.changes_updates || null,
      other_rules: formData.other_rules || null,
      city: formData.city || 'New York',
      user_id: user?.id || null,
    };

    const { error } = await (supabase as SupabaseClient)
      .from("open_mics_requests")
      .insert([insertObj]);

    if (error) {
      console.error('Insert error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request submitted!",
        description: "Thank you! We will review your mic suggestion soon.",
      });
      setShowRequestModal(false);
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    toast({
      title: "Error",
      description: "An unexpected error occurred.",
      variant: "destructive",
    });
  }
};
```

---

## Files to Change

| File | Action |
|------|--------|
| Database migration | Add 13 missing columns, fix date/time types, add anon insert policy |
| `src/pages/OpenMics.tsx` | Update `handleRequestMic` to send all form fields to the database |

No changes needed to `AddMicRequestForm.tsx` -- the form already collects all the right fields.

