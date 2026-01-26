
# Display Rules & Redesign Verification Badge

## Overview
This plan addresses two improvements:
1. **Display mic rules** - Show the `other_rules` data from Supabase under the "Additional Details" section
2. **Redesign unverified badge** - Replace the current animation with a cleaner, more trustworthy design

---

## Part 1: Display Mic Rules

### Current State
- The `other_rules` column exists in `open_mics_historical` with detailed venue rules
- The data is NOT being fetched (not mapped in `useOpenMics`)
- There's a commented-out section in the UI that was intended to show rules
- Rules can be long (paragraph-length text about venue policies, age requirements, phone usage, etc.)

### Changes Required

**1. Update OpenMic Type**
Add `otherRules` field to the interface.

**2. Update useOpenMics Hook**
Map the `other_rules` database column to `otherRules` in the returned data.

**3. Update OpenMicsDetailedList Component**
Display the rules in the "Additional Details" expanded section with:
- A collapsible format (since rules can be long)
- A "Rules" label with an icon
- Only show if rules exist

### UI Placement
```text
Additional Details
├── Sign-Up Instructions: ...
├── Address: ...
├── 📋 Rules: [Expandable text block with venue rules]
├── [Sign Up Button]
└── [Calendar Buttons]
```

---

## Part 2: Redesign Unverified Badge

### Current Problems
The current unverified badge:
- Uses red background with red border (feels alarming/scammy)
- Has `animate-pulse` on success (feels cheap)
- `hover:scale-105` feels jumpy
- The "Click to verify" hover text change feels inconsistent

### New Design Philosophy
- **Unverified**: Neutral gray tone (not alarming), subtle indication it needs attention
- **Verified**: Calm green, trustworthy feel
- **Interactions**: Smooth, professional transitions without flashy animations
- **Success feedback**: Subtle checkmark animation, not pulsing

### New Design Specifications

| State | Background | Border | Text | Icon |
|-------|------------|--------|------|------|
| Unverified (default) | `bg-gray-50` | `border-gray-300` | `text-gray-600` | `HelpCircle` (?) |
| Unverified (hover) | `bg-gray-100` | `border-gray-400` | `text-gray-700` | `HelpCircle` |
| Verified | `bg-emerald-50` | `border-emerald-400` | `text-emerald-700` | `CheckCircle` |
| Loading | Same as current | - | - | `Loader2` (subtle spin) |
| Just verified | `bg-emerald-100` | `border-emerald-500` | `text-emerald-800` | `CheckCircle` (scale in) |

### Animation Changes
- **Remove**: `animate-pulse`, `hover:scale-105`, `active:scale-95`
- **Add**: Gentle `transition-colors duration-300` for state changes
- **Success**: Brief scale animation on icon only (not entire badge)

### Text Changes
- Unverified: "Needs verification" (neutral, not alarming)
- Hover: "I was there" (friendly, community-driven)
- Verified: "Verified 1.26.2026" (same as before)
- Just verified: "Thanks!" (brief, friendly)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/openMic.ts` | Add `otherRules: string` field |
| `src/hooks/useOpenMics.ts` | Map `other_rules` to `otherRules` |
| `src/components/OpenMicsDetailedList.tsx` | Add rules display in Additional Details section |
| `src/components/VerificationBadge.tsx` | Complete redesign with new colors, icons, and animations |

---

## Implementation Order

1. **Update type and hook** - Add `otherRules` to the data pipeline
2. **Add rules display** - Show rules in the Additional Details section
3. **Redesign badge** - Replace current styling with the new professional design

---

## Technical Details

### Rules Display Component
```text
{mic.otherRules && (
  <div className="text-xs">
    <div className="flex items-start gap-2">
      <ClipboardList className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
      <div>
        <span className="font-medium text-gray-700">House Rules:</span>
        <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">
          {mic.otherRules}
        </p>
      </div>
    </div>
  </div>
)}
```

### Badge Icon Switch
Replace `AlertCircle` (warning feel) with `HelpCircle` (neutral/questioning feel) for unverified state.

### Data Flow for Latest Verification (Previously Discussed)
This plan also incorporates the fix to show the newest verification timestamp:
- Create `useLatestVerification` hook to fetch from `mic_verifications` table
- Invalidate cache after successful verification
- Display most recent timestamp in badge
