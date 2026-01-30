

# Center Top Section of Mic Tiles

## Problem
The mic name row is centered, but the location/neighborhood and day rows are still left-aligned because they're missing `justify-center` on their flex containers.

## Current Layout
```
         Mic Name 🟢          <- centered ✓
📍 Venue, Neighborhood        <- left-aligned ✗
📅 Weekly - Monday            <- left-aligned ✗
```

## New Layout
```
         Mic Name 🟢          <- centered ✓
   📍 Venue, Neighborhood     <- centered ✓
      📅 Weekly - Monday      <- centered ✓
```

## Changes to `src/components/OpenMicsDetailedList.tsx`

### 1. Center the venue/neighborhood row (line 235)
```tsx
// Before
<span className="flex items-center gap-1">

// After
<span className="flex items-center gap-1 justify-center md:justify-start">
```

### 2. Center the day row (line 258)
```tsx
// Before
<span className="flex flex-row md:flex-col gap-1.5 md:gap-0">

// After
<span className="flex flex-row md:flex-col gap-1.5 md:gap-0 justify-center md:justify-start">
```

### 3. Center the calendar/host sub-rows (lines 259 and 267)
```tsx
// Before (line 259)
<span className="flex items-center gap-1">

// After
<span className="flex items-center gap-1 justify-center md:justify-start">
```

```tsx
// Before (line 267)  
<span className="flex items-center gap-1 md:hidden">

// After
<span className="flex items-center gap-1 md:hidden justify-center">
```

## Summary
Add `justify-center md:justify-start` to the flex containers for:
- Venue/neighborhood row
- Day/schedule row
- Host row (mobile only)

This ensures everything is centered on mobile while staying left-aligned on desktop (md and up).

