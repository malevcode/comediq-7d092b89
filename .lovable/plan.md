

## Growth Opportunities: Admin Management + User Submission Tracking

### Overview
Two features: (1) admin tab in the dashboard to manage all growth opportunities, and (2) a "My Submissions" section on the Growth page so users can see their submitted opportunities and their status.

### Problem
- Growth opportunities are not editable from the admin dashboard -- admins must go to Supabase directly
- Users who submit opportunities have no visibility into whether their submission was reviewed or approved
- The `growth_opportunities` table has `is_active` but no explicit review status field

### Database Migration

Add a `status` column to `growth_opportunities` to track review workflow:

```sql
ALTER TABLE growth_opportunities 
  ADD COLUMN status text NOT NULL DEFAULT 'submitted';
-- Values: 'submitted', 'in_review', 'approved', 'rejected'
```

No new RLS needed -- existing policies cover admin full access and user select on active items. Update the user-facing query to also let users see their own submissions regardless of `is_active`.

### Changes

**1. New component: `src/components/admin/AdminGrowthManager.tsx`**
- Table/card list of ALL growth opportunities (active, inactive, all statuses)
- Inline edit fields: title, description, type, venue, borough, date, time, compensation, contact_info, external_url, is_featured, is_active, status
- Toggle `is_active` and `is_featured` with switches
- Status dropdown (submitted → in_review → approved → rejected)
- Delete button with confirmation
- Auto-save on blur (same pattern as AdminAllMicsList)

**2. `src/pages/AdminInterface.tsx`**
- Add "Growth" tab trigger after "Contrib"
- Add `TabsContent value="growth"` rendering `AdminGrowthManager`

**3. `src/api/growthOpportunities.ts`**
- Add `fetchAllGrowthOpportunities()` (no `is_active` filter, for admin)
- Add `updateGrowthOpportunity(id, updates)` 
- Add `deleteGrowthOpportunity(id)`
- Add `fetchMySubmissions(userId)` -- returns user's own submissions with status
- Update `submitGrowthOpportunity` to set `status: 'submitted'`

**4. `src/hooks/useGrowthOpportunities.ts`**
- Add `useAllGrowthOpportunities()` hook for admin
- Add `useMyGrowthSubmissions()` hook for users
- Add `useUpdateOpportunity()` and `useDeleteOpportunity()` mutations

**5. `src/pages/GrowthOpportunities.tsx`**
- Add a "My Submissions" section below the tabs (only visible to authenticated users who have submissions)
- Shows a compact list of the user's submitted opportunities with status badges: Submitted (gray), In Review (yellow), Approved (green), Rejected (red)
- Each card shows title, type, date submitted, and current status

### Files Modified
- `src/api/growthOpportunities.ts` -- add admin CRUD + user submissions queries
- `src/hooks/useGrowthOpportunities.ts` -- add new hooks
- `src/pages/AdminInterface.tsx` -- add "Growth" tab
- `src/pages/GrowthOpportunities.tsx` -- add "My Submissions" section

### Files Created
- `src/components/admin/AdminGrowthManager.tsx`
- Database migration (add `status` column)

