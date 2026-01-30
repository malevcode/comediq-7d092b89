

# UI Refinements: Full Mic Names, Compact Status Badge, and Centered Layout

## Overview
Three changes to improve mic tile layout:
1. **Show full mic names** - Remove the 15-character truncation (the `...` looks unprofessional)
2. **Compact status badge** - When collapsed, show only the color dot + icon + date (no text label); show full labels only when dropdown is open
3. **Center content** - Evenly distribute and center all elements instead of left-aligned layout

---

## Part 1: Remove Mic Name Truncation

### Current Behavior
```text
*biweekly* LGBTQ… (truncated with ellipsis)
```

### New Behavior
```text
*biweekly* LGBTQ Oh Craft! Beer mic (full name displayed)
```

### Change
Remove the `truncateMicName()` call in `OpenMicsDetailedList.tsx` line 227.

---

## Part 2: Compact Status Badge

### Current Collapsed State
```text
┌────────────────────────────────┐
│ 🟢 ✓ Happening 1.28.2026 ▼    │
└────────────────────────────────┘
```

### New Collapsed State (much smaller)
```text
┌─────────────────┐
│ 🟢 ✓ 1.28.2026 ▼│
└─────────────────┘
```
- Only show: colored dot + icon + date (if verified) + chevron
- No text label ("Happening", "Unverified", "Cancelled")

### Dropdown Open (unchanged - still shows full labels)
```text
┌────────────────────┐
│ 🟢 ✓ Happening    │
│ 🟡 ? Unverified   │
│ 🔴 ✗ Cancelled    │
└────────────────────┘
```

### Changes to `MicStatusDropdown.tsx`
- Remove `<span>{currentConfig.label}</span>` from the main button (line 106)
- Keep the label in the dropdown options (line 134)
- Reduce padding from `px-2 py-1` to `px-1.5 py-0.5` for a more compact pill

---

## Part 3: Centered Layout

### Current Layout (Left-Aligned)
```text
┌─────────────────────────────────────────┐
│ Mic Name 🟢                             │
│ 📍 Venue, Neighborhood                  │
│ 📅 Weekly - Monday                       │
│─────────────────────────────────────────│
│ 🕐 5-7 PM   🕐 5 min   💲 Free          │
│─────────────────────────────────────────│
│ [Additional Details]                     │
│─────────────────────────────────────────│
│ ❤️  💬  🔖  📋  ✈️                      │ ← left-aligned buttons
└─────────────────────────────────────────┘
```

### New Layout (Centered and Even Distribution)
```text
┌─────────────────────────────────────────┐
│          Mic Name 🟢                     │
│    📍 Venue, Neighborhood               │
│       📅 Weekly - Monday                │
│─────────────────────────────────────────│
│   🕐 5-7 PM  │  🕐 5 min  │  💲 Free    │ ← evenly distributed
│─────────────────────────────────────────│
│          [Additional Details]            │
│─────────────────────────────────────────│
│    ❤️    💬    🔖    📋    ✈️           │ ← centered buttons
└─────────────────────────────────────────┘
```

### Changes to `OpenMicsDetailedList.tsx`
- Add `text-center` or `items-center justify-center` to content sections
- Use `justify-evenly` on the metadata row (time, cost, stage time)
- Center the mic name and status dropdown row

### Changes to `MicActionBar.tsx`
- Change `justify-between` to `justify-evenly` for the action buttons

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/OpenMicsDetailedList.tsx` | Remove truncation, center layout |
| `src/components/MicStatusDropdown.tsx` | Hide label on collapsed state, reduce padding |
| `src/components/mic/MicActionBar.tsx` | Center action buttons with even distribution |

---

## Technical Details

### MicStatusDropdown.tsx - Key Changes

**Button (collapsed state):**
```tsx
// Before
<span>{currentConfig.label}</span>
{dateDisplay && <span className="text-[10px] opacity-70">{dateDisplay}</span>}

// After - only show date, no label
{dateDisplay && <span className="text-[10px] opacity-70">{dateDisplay}</span>}
```

**Compact padding:**
```tsx
// Before
"px-2 py-1"

// After
"px-1.5 py-0.5"
```

### OpenMicsDetailedList.tsx - Key Changes

**Mic name (no truncation):**
```tsx
// Before
{truncateMicName(mic.openMic)}

// After
{mic.openMic}
```

**Centered header row:**
```tsx
// Before
<div className="flex items-center gap-1.5 flex-wrap">

// After
<div className="flex items-center gap-1.5 flex-wrap justify-center">
```

**Centered metadata:**
```tsx
// Before  
<div className="flex flex-row gap-x-4 sm:gap-2 sm:items-center ...">

// After
<div className="flex flex-row gap-x-4 sm:gap-2 items-center justify-center md:justify-evenly ...">
```

### MicActionBar.tsx - Key Changes

**Even button distribution:**
```tsx
// Before
<div className="flex items-center justify-between border-t ...">

// After
<div className="flex items-center justify-evenly border-t ...">
```

