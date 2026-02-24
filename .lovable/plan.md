

# Fix Plan: Share Text, Mic Submission, and Verification Lag

## 1. Share text says "ComiQ" instead of "Comediq"

**File:** `src/components/mic/MicActionBar.tsx`, line 106

Change `Check out ${micName} on ComiQ!` to `Check out ${micName} on Comediq!`

## 2. Mic submission button not working

**File:** `src/components/host/AddMicRequestForm.tsx`

The form renders inside a Radix Dialog, which can intercept form submission events. Additionally, there is no loading state on the submit button, so users get no feedback.

- Add `isSubmitting` state prop passed from parent
- Add `e.stopPropagation()` in `handleSubmit` to prevent Dialog from swallowing the event
- Disable submit button and show "Submitting..." text while in progress

**File:** `src/pages/OpenMics.tsx`, lines 432-482

- Remove `as SupabaseClient` cast (hides type errors)
- Add `isSubmitting` state to track submission progress
- Pass it to the form component

## 3. Verification lag (optimistic updates, keep dropdown)

Keep the existing dropdown UI exactly as-is (no question text, just the three status options). Fix the 3-6 second lag by adding optimistic cache updates.

**File:** `src/hooks/useMicStatus.ts`

Add `onMutate` for optimistic update: immediately set the new status in the query cache before the network request completes. Add `onError` rollback if the request fails. This eliminates the perceived lag entirely.

```
onMutate: async (newStatus) => {
  await queryClient.cancelQueries({ queryKey: ['mic-status', id] });
  const previous = queryClient.getQueryData(['mic-status', id]);
  queryClient.setQueryData(['mic-status', id], {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });
  return { previous };
},
onError: (err, newStatus, context) => {
  queryClient.setQueryData(['mic-status', id], context.previous);
}
```

Also allow re-verifying with the same status (currently `handleStatusSelect` skips if `newStatus === status`). This lets users tap green again to refresh the date without going yellow first.

**File:** `src/components/MicStatusDropdown.tsx`, line 81

Remove the `if (newStatus !== status)` guard so users can re-confirm the same status (e.g., tap "Happening" again to update the date).

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/mic/MicActionBar.tsx` | Fix "ComiQ" → "Comediq" |
| `src/components/host/AddMicRequestForm.tsx` | Add `isSubmitting` prop, `e.stopPropagation()`, disable button during submission |
| `src/pages/OpenMics.tsx` | Add `isSubmitting` state, remove `as SupabaseClient` cast, pass loading state to form |
| `src/hooks/useMicStatus.ts` | Add optimistic `onMutate`/`onError` to mutation for instant UI feedback |
| `src/components/MicStatusDropdown.tsx` | Remove same-status guard so users can re-verify without resetting first |

