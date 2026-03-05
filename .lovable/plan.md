

## Issue 1: Green Checkmark Where Legacy Button Was

The `MicStatusBadge` component on line 242 is called with only `status={mic.status}` — no `legacyTag` prop. For verified mics without a legacyTag, it renders a green `CheckCircle2` icon (line 29-31 of MicStatusBadge.tsx). Previously the legacy badge occupied that space; now that it was moved to the dropdown, verified mics show the green check inline in the header.

**Fix**: Remove the `MicStatusBadge` from the header entirely (line 242) since the status is already communicated via the traffic-light `MicStatusDropdown` on the same row. This eliminates the redundant green checkmark.

## Issue 2: Make Legacy Tag Editable in Admin Dashboard

Currently `legacy_tag` is not in the `editableFields` array in `AdminAllMicsList.tsx`, so admins can't see or edit it. The hardcoded "Pre-March 2026" text in `OpenMicsDetailedList.tsx` ignores whatever the actual `legacy_tag` value is.

**Fix**:
1. **Admin dashboard** — Add `legacy_tag` to the `editableFields` array in `AdminAllMicsList.tsx` so admins can view/edit its value inline (e.g., set it to "First listed on Comediq: Jan 2026").
2. **Public display** — In `OpenMicsDetailedList.tsx`, replace hardcoded "Pre-March 2026" with the actual `mic.legacyTag` value so whatever the admin sets is what users see.
3. **Admin edit modal** — Add `legacy_tag` as an editable field in `AdminMicEditModal.tsx` too, for consistency.

### Files to Edit

| File | Change |
|------|--------|
| `src/components/OpenMicsDetailedList.tsx` | Remove `MicStatusBadge` from header (line 242); display `mic.legacyTag` value instead of hardcoded text (line 331) |
| `src/components/mic/MicStatusBadge.tsx` | No change needed (component still used elsewhere) |
| `src/components/admin/AdminAllMicsList.tsx` | Add `{ key: 'legacy_tag', label: 'Legacy Tag' }` to `editableFields` |
| `src/components/admin/AdminMicEditModal.tsx` | Add `legacy_tag` to `OPEN_MIC_FIELDS` |

