

## Overhaul: Mic Submission Flow + Admin Safety Controls

### Problem Summary
1. The "Request New Mic" form is a 2-page wizard that scrolls on mobile, looks generic, and inserts into `open_mics_requests` (a review queue) -- too slow
2. "Comediq Direct" label is stale (should be "Comediq Slots!")
3. Frequency options order is wrong and missing a custom/free-text option
4. New mics need instant visibility with a "NEW MIC" badge instead of pending review
5. Admin needs ability to bulk-delete contributions by date range or user ID
6. The form doesn't guide users well on what data is actually needed

### Design Decisions
- New mics go directly into `open_mics_historical` with `status = 'trial'` (already visible to users per existing filter logic). No more `open_mics_requests` bottleneck for the primary flow.
- A "NEW MIC" badge replaces the current "Trial" badge for the first 7 days after `submission_date`.
- Admin gets a "Contributions" cleanup panel to delete/revert mics by date range or creator ID.
- The form becomes a single-page compact layout -- no wizard, no scroll on mobile.

---

### Changes

#### 1. Update `src/types/openMic.ts`
- Rename `comediq_direct` to `comediq_slots` in `SignupMethod` type and label map ("Comediq Slots!")
- Add `'custom'` to `MicFrequency` type
- Add `custom` label: "Custom (describe below)"
- Reorder `FREQUENCY_LABELS` to: weekly, one_off, bi_weekly, 1st_of_month, ...monthly variants, custom

#### 2. Rewrite `src/components/host/AddMicRequestForm.tsx` -- Single-page compact form
- Remove the 2-page wizard (no `page` state, no Next/Back buttons)
- All fields on one page in a compact mobile layout:
  - Row 1: Mic Name (full width)
  - Row 2: Venue autocomplete (full width)
  - Row 3: Day + Start Time (2-col)
  - Row 4: Cost + Host Instagram (2-col)
  - Row 5: Frequency select + Signup Method radio (2-col, compact)
  - Row 6: Stage Time + Sign-Up Instructions (2-col)
  - Conditional: signup URL input if "Online" selected; custom frequency text input if "Custom" selected
  - Submit button at bottom
- Use smaller text (`text-xs` labels, `h-9` inputs) to fit without scrolling on 390px viewport
- Remove page 2 optional fields (other_rules, signup_instructions textarea) -- fold sign-up instructions into a single-line input on page 1; drop other_rules from the user form entirely (admin-only field)
- Button text: "Add Mic" (not "Submit Mic Request")

#### 3. Update `src/pages/OpenMics.tsx` -- `handleRequestMic`
- Change from inserting into `open_mics_requests` to inserting directly into `open_mics_historical` with:
  - `status: 'trial'`
  - `active: true`
  - `submission_date: now()`
  - `creator_id: user?.id` (nullable for anon)
  - `verification_count: 0`
- Update success toast: "Mic added! It's now live on the site."
- Keep also inserting a copy into `open_mics_requests` with `reviewed: true` as an audit trail for admin

#### 4. "NEW MIC" badge -- Update mic card display
- In `src/components/OpenMicsDetailedList.tsx` (or wherever the Trial badge renders): if `status === 'trial'` AND `submissionDate` is within 7 days, show a green "NEW MIC" badge instead of the amber "Trial" badge
- After 7 days, revert to normal "Trial" display until verified

#### 5. Admin: Contributions cleanup panel
- Add a new section/tab in `src/pages/AdminInterface.tsx` called "Contributions"
- Features:
  - Date range picker: delete all `open_mics_historical` records where `submission_date` is within range AND `status = 'trial'`
  - User ID input: delete all records by a specific `creator_id`
  - Confirmation dialog before deletion
  - Uses existing admin RLS (admins can delete)

#### 6. Update `signup_method` enum in database
- Migration: rename enum value `comediq_direct` to `comediq_slots`
- Update any existing records using the old value

#### 7. Update frequency enum in database
- Migration: add `custom` value to `mic_frequency` enum
- Add `frequency_custom_text` column to `open_mics_historical` (text, nullable) for free-text frequency descriptions

#### 8. Update `src/hooks/useOpenMics.ts`
- Map the new `frequency_custom_text` field to the OpenMic interface
- Add `frequencyCustomText` to OpenMic type

### Files Modified
- `src/types/openMic.ts`
- `src/components/host/AddMicRequestForm.tsx` (major rewrite)
- `src/pages/OpenMics.tsx` (submission handler)
- `src/components/OpenMicsDetailedList.tsx` or mic card badge component (NEW MIC badge)
- `src/pages/AdminInterface.tsx` (contributions panel)
- `src/hooks/useOpenMics.ts` (new field mapping)
- Database migrations (enum updates + new column)

### Files Created
- None (all changes within existing files)

