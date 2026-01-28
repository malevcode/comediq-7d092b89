
# Implementation Plan: Status Dropdown, Saved Mics Page & Reduced Whitespace

## Overview
This plan implements three features:
1. **Traffic light status dropdown** - Replace single-click verification with a red/yellow/green dropdown accessible to all users
2. **Saved Mics page** - Create `/saved` route for users to view bookmarked mics
3. **Reduce whitespace** - Tighten spacing on mic tiles

---

## Part 1: Traffic Light Status Dropdown

### Design
Replace the current verification badge (click to verify) with a color-coded dropdown that lets anyone (logged in or not) indicate the mic's status.

| Color | Meaning | Display Text |
|-------|---------|--------------|
| 🟢 Green | Confirmed/Verified | "Happening" |
| 🟡 Yellow | Uncertain/Unverified | "Unverified" |
| 🔴 Red | Cancelled/Not happening | "Cancelled" |

### User Experience
- Current status shows as a colored pill with icon
- Clicking opens a dropdown with all three options
- Anyone can update the status (no login required)
- Most recent status "wins" (uses `mic_verifications` table with a new `status` column)

### Database Changes
Need to add a `status` column to the `mic_verifications` table or create a new approach:

**Option A**: Add `status` column to `mic_verifications`
- Values: `'verified'`, `'unverified'`, `'cancelled'`
- Query for the latest status by `verified_at DESC`

**Option B**: Create new `mic_status` table (simpler, cleaner)
- Columns: `id`, `mic_unique_identifier`, `status`, `updated_at`, `user_id` (nullable), `ip_hash`
- Only store the latest status per mic

For simplicity, I'll use Option A (extend existing table).

### Component Redesign

**Current**: `VerificationBadge.tsx` - Single button with click-to-verify

**New**: `MicStatusDropdown.tsx` - Dropdown with three status options

```text
┌──────────────────┐
│ 🟢 Happening  ▼  │  ← Current status pill (clickable)
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ 🟢 Happening     │  ← Option 1
│ 🟡 Unverified    │  ← Option 2
│ 🔴 Cancelled     │  ← Option 3
└──────────────────┘
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/MicStatusDropdown.tsx` | Create | New dropdown component with traffic light colors |
| `src/hooks/useMicStatus.ts` | Create | Hook to fetch/update mic status |
| `src/hooks/useLatestVerification.ts` | Modify | Update to also return status field |
| `src/components/OpenMicsDetailedList.tsx` | Modify | Replace `VerificationBadge` with `MicStatusDropdown` |
| `supabase/functions/verify-mic/index.ts` | Modify | Accept `status` parameter |

### Visual Design

```tsx
// Status configurations
const STATUS_CONFIG = {
  verified: {
    label: 'Happening',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500'
  },
  unverified: {
    label: 'Unverified',
    icon: HelpCircle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500'
  }
};
```

---

## Part 2: Saved Mics Page

### Route
`/saved` - Accessible to logged-in users only

### Features
- Display all bookmarked mics in a list view (same tile format as Open Mics page)
- Show empty state if no saved mics
- Redirect to auth if not logged in
- Uses existing `useSavedMics` hook and `saved_mics` table

### Implementation

**New File**: `src/pages/SavedMics.tsx`

Structure:
```tsx
// Layout
<PageHeader title="Saved Mics" subtitle="Your bookmarked open mics" />
<main>
  {!user && <RedirectToAuth />}
  {isLoading && <LoadingSpinner />}
  {savedMics.length === 0 && <EmptyState />}
  {savedMics.length > 0 && <MicsList />}
</main>
```

**Data Flow**:
1. Fetch saved mics from `useSavedMics()` hook
2. Get full mic data from `useOpenMics()` hook
3. Filter open mics to only those matching saved `mic_unique_identifier`
4. Render using `OpenMicDetailedCard` component

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/SavedMics.tsx` | Create | New page component |
| `src/App.tsx` | Modify | Add `/saved` route |
| `src/components/HamburgerMenu.tsx` | Modify | Add "Saved Mics" navigation link |

---

## Part 3: Reduce Whitespace on Tiles

### Current Issues
Looking at `OpenMicsDetailedList.tsx`, the card has:
- `p-4` padding (16px)
- `gap-2 md:gap-6` between sections
- Various `mb-2`, `mt-2` margins

### Proposed Changes

| Element | Current | New |
|---------|---------|-----|
| Card padding | `p-4` | `p-3` |
| Section gap | `gap-2 md:gap-6` | `gap-1 md:gap-4` |
| Action bar top border | `pt-3 mt-3` | `pt-2 mt-2` |
| Additional details box | `p-1.5` | `p-1` |
| Margins between elements | Various `mb-2` | `mb-1` |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/OpenMicsDetailedList.tsx` | Reduce padding and margins |
| `src/components/mic/MicActionBar.tsx` | Reduce top padding/margin |

---

## Technical Details

### Mic Status Hook (`useMicStatus.ts`)

```typescript
interface MicStatus {
  status: 'verified' | 'unverified' | 'cancelled';
  updatedAt: string;
}

function useMicStatus(micUniqueIdentifier: string) {
  // Query for latest status
  const query = useQuery({
    queryKey: ['mic-status', micUniqueIdentifier],
    queryFn: async () => {
      const { data } = await supabase
        .from('mic_verifications')
        .select('status, verified_at')
        .eq('mic_unique_identifier', micUniqueIdentifier)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data ? { status: data.status, updatedAt: data.verified_at } : null;
    }
  });

  // Mutation to update status
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      // Call edge function (works for logged in or anonymous)
      const response = await fetch('/functions/v1/verify-mic', {
        method: 'POST',
        body: JSON.stringify({ 
          mic_unique_identifier: micUniqueIdentifier,
          status: newStatus 
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mic-status', micUniqueIdentifier]);
    }
  });

  return { status: query.data, updateStatus };
}
```

### Edge Function Update

Modify `supabase/functions/verify-mic/index.ts` to:
1. Accept optional `status` parameter (default: `'verified'`)
2. Insert with the provided status value

---

## Implementation Order

1. **Database**: Add `status` column to `mic_verifications` (or confirm it exists)
2. **Edge function**: Update to accept `status` parameter
3. **Hook**: Create `useMicStatus.ts` hook
4. **Component**: Create `MicStatusDropdown.tsx` component
5. **Integration**: Replace `VerificationBadge` with `MicStatusDropdown` in tiles
6. **Saved page**: Create `SavedMics.tsx` page
7. **Routing**: Add `/saved` route and navigation link
8. **Whitespace**: Reduce padding/margins on tiles

---

## Summary of Changes

### New Files
| File | Purpose |
|------|---------|
| `src/components/MicStatusDropdown.tsx` | Traffic light status dropdown |
| `src/hooks/useMicStatus.ts` | Fetch and update mic status |
| `src/pages/SavedMics.tsx` | Saved mics page |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/saved` route |
| `src/components/HamburgerMenu.tsx` | Add Saved Mics nav link |
| `src/components/OpenMicsDetailedList.tsx` | Use new dropdown, reduce whitespace |
| `src/components/mic/MicActionBar.tsx` | Reduce spacing |
| `supabase/functions/verify-mic/index.ts` | Accept status parameter |
