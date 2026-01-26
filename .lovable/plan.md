
# Implementation Plan: Display Rules & Redesign Verification Badge

## Overview
This plan implements three features:
1. **Display mic rules** from `other_rules` column under "Additional Details"
2. **Redesign the verification badge** with a professional, trustworthy appearance  
3. **Show the latest verification timestamp** fetched directly from `mic_verifications` table

---

## Part 1: Display Mic Rules

### Problem
The `other_rules` column contains detailed venue rules (age requirements, phone policies, etc.) but is not being displayed. The data exists - sample rules include purchase minimums, age restrictions, phone/notes policies, and refund information.

### Implementation

**File 1: `src/types/openMic.ts`**
- Add `otherRules: string` to the `OpenMic` interface

**File 2: `src/hooks/useOpenMics.ts`**  
- Map `row["other_rules"]` to `otherRules` in the data transformation

**File 3: `src/components/OpenMicsDetailedList.tsx`**
- Add a rules section in the expanded "Additional Details" area
- Display with a `ClipboardList` icon and "House Rules:" label
- Only show when `mic.otherRules` exists and is not empty
- Use `whitespace-pre-wrap` for proper paragraph formatting

### UI Placement
```text
Additional Details (expanded)
├── Sign-Up Instructions: ...
├── Address: ...
├── 📋 House Rules: [Venue rules text]  ← NEW
├── [Sign Up Button]
└── [Calendar Buttons]
```

---

## Part 2: Redesign Verification Badge

### Current Problems
- Red background/border feels alarming and "scammy"
- `animate-pulse` on success feels cheap
- `hover:scale-105` is jumpy
- "Click to verify" text change on hover is inconsistent
- Uses `AlertCircle` which has a warning/error connotation

### New Design

| State | Background | Border | Text | Icon |
|-------|------------|--------|------|------|
| Unverified | `bg-gray-50` | `border-gray-300` | `text-gray-600` | `HelpCircle` |
| Unverified (hover) | `bg-amber-50` | `border-amber-300` | `text-amber-700` | `HelpCircle` |
| Verified | `bg-emerald-50` | `border-emerald-400` | `text-emerald-700` | `CheckCircle2` |
| Loading | gray tones | - | - | `Loader2` (subtle spin) |
| Just verified | `bg-emerald-100` | `border-emerald-500` | `text-emerald-800` | `CheckCircle2` |

### Animation Changes
- **Remove**: `animate-pulse`, `hover:scale-105`, `active:scale-95`
- **Add**: Smooth `transition-colors duration-200` for state changes
- **Success**: Brief opacity transition, no pulsing

### Text Changes
| State | Text |
|-------|------|
| Unverified (default) | "Needs verification" |
| Unverified (hover) | "I was there" |
| Verified | "Verified 1.26.2026" |
| Just verified | "Thanks!" |

---

## Part 3: Show Latest Verification Timestamp

### Problem
After verification, the badge shows the old cached date. We need to fetch the newest timestamp directly from `mic_verifications` table.

### Implementation

**New File: `src/hooks/useLatestVerification.ts`**
- Query `mic_verifications` table for the most recent `verified_at` for a given `mic_unique_identifier`
- Order by `verified_at DESC` and limit to 1
- Return the timestamp with a 5-minute stale time
- Provide an `invalidate()` function to refresh after new verification

**File: `src/hooks/useMicVerification.ts`**
- Import `useQueryClient` from `@tanstack/react-query`
- After successful verification, invalidate the `['latestVerification', micUniqueIdentifier]` query

**File: `src/components/VerificationBadge.tsx`**
- Import and use `useLatestVerification` hook
- Parse both ISO timestamps (from `mic_verifications`) and MM/DD/YYYY strings (fallback)
- Prioritize the fetched latest verification over the `lastVerified` prop

### Data Flow
```text
User clicks verify
    ↓
Edge function inserts into mic_verifications
    ↓
useMicVerification invalidates query cache
    ↓
useLatestVerification refetches from mic_verifications
    ↓
Badge displays the new timestamp
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/types/openMic.ts` | Modify | Add `otherRules: string` |
| `src/hooks/useOpenMics.ts` | Modify | Map `other_rules` → `otherRules` |
| `src/components/OpenMicsDetailedList.tsx` | Modify | Add rules display section |
| `src/hooks/useLatestVerification.ts` | Create | New hook to fetch latest verification |
| `src/hooks/useMicVerification.ts` | Modify | Invalidate cache on success |
| `src/components/VerificationBadge.tsx` | Modify | Complete redesign + use new hook |

---

## Technical Details

### Date Parsing Logic
The badge needs to handle two date formats:
1. **ISO format** from `mic_verifications.verified_at`: `2026-01-26T21:26:12.175Z`
2. **MM/DD/YYYY format** from `open_mics_historical.last_verified`: `01/26/2026`

```typescript
const parseVerificationDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  
  // Try ISO format first (from mic_verifications)
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) {
    return isoDate;
  }
  
  // Fall back to MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  
  return null;
};
```

### Rules Display Component Structure
```tsx
{mic.otherRules && (
  <div className="text-xs mt-2 pt-2 border-t border-blue-200">
    <div className="flex items-start gap-2">
      <ClipboardList className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
      <div>
        <span className="font-medium text-blue-800">House Rules:</span>
        <p className="text-gray-600 mt-1 whitespace-pre-wrap">
          {mic.otherRules}
        </p>
      </div>
    </div>
  </div>
)}
```

---

## Implementation Order

1. Update `OpenMic` type with `otherRules`
2. Update `useOpenMics` hook to map the field
3. Add rules display to `OpenMicsDetailedList`
4. Create `useLatestVerification` hook
5. Update `useMicVerification` to invalidate cache
6. Redesign `VerificationBadge` with new styling and hook integration
