

# Compact Grid View - High-Density Mic Tiles

## Goal
Transform the grid view to display 16+ mic tiles per viewport (up from ~8) while keeping essential info visible at a glance.

---

## Current State Analysis

Looking at `src/pages/OpenMics.tsx` lines 354-375:

```tsx
// Current grid
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 ...">
  <Card className="... w-full sm:w-24 h-24">  // 96px height
    <CardContent className="p-2 ...">
      <h3 className="... line-clamp-2">       // 2 lines for title
        {mic.openMic}
      </h3>
      <div>{formatTime(mic.startTime)}</div>  // Separate row
      <div className="flex justify-between">
        <span>{formatCost(mic.cost)}</span>   // Another row
        <span>{formatStageTime(...)}</span>
      </div>
    </CardContent>
  </Card>
</div>
```

---

## Proposed Changes

### 1. Reduce Card Size

| Property | Before | After |
|----------|--------|-------|
| Card height | `h-24` (96px) | `h-16` (64px) |
| Card width | `w-full sm:w-24` | `w-full` (flex with grid) |
| Padding | `p-2` | `p-1.5` |
| Gap between cards | `gap-1` | `gap-0.5` |

### 2. Single-Line Title (15 char limit, no ellipsis)

Add a helper function to truncate titles:

```tsx
const truncateTitle = (title: string, maxLen = 15) =>
  title.length > maxLen ? title.slice(0, maxLen) : title;
```

Update title rendering:
```tsx
<h3 className="font-bold text-xs leading-tight text-gray-900 truncate">
  {truncateTitle(mic.openMic, 15)}
</h3>
```

### 3. Combine Metadata into Single Row

Merge time, cost, and stage time into one evenly-distributed row:

```tsx
<div className="flex justify-between items-center text-xs w-full">
  <span className="text-gray-800 font-semibold">{formatTime(mic.startTime)}</span>
  <span className="text-green-700 font-bold">{formatCost(mic.cost)}</span>
  <span className="text-orange-700 font-bold">{formatStageTime(mic.stageTime)}</span>
</div>
```

### 4. Increase Grid Density

Update grid columns for more tiles:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0.5 ...">
```

---

## Visual Comparison

### Before (8 tiles visible)
```
┌─────────────────┐  ┌─────────────────┐
│ Pear TS 5:30    │  │ Caravan of      │
│ Open Mic        │  │ Dreams          │
│ 5:30 PM         │  │ 6:00 PM         │
│ $5           5  │  │ $1           5  │
└─────────────────┘  └─────────────────┘
```

### After (16+ tiles visible)
```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Pear TS 5:30   │ │ Caravan of Dre │ │ Grisly 6       │ │ Buddha 6       │
│ 5:30 PM $5  5  │ │ 6 PM    $1   5 │ │ 6 PM   $5   5  │ │ 6 PM   $5   5  │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Producer's Clu │ │ Phoenix Bar    │ │ QED Monday     │ │ Harlem Nights  │
│ 6 PM   $5   5  │ │ 6 PM  Free  5  │ │ 6 PM   $5   5  │ │ 6 PM  Free  5  │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

---

## Implementation

**File: `src/pages/OpenMics.tsx`**

1. Add truncation helper (near line 177):
```tsx
const truncateTitle = (title: string, maxLen = 15) =>
  title.length > maxLen ? title.slice(0, maxLen) : title;
```

2. Update grid container (line 354):
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0.5 max-h-[calc(100vh-320px)] overflow-y-auto">
```

3. Update Card component (lines 356-374):
```tsx
<Card
  key={index}
  className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-102 ${getBoroughOutline(mic.borough)} ${getVerificationBackgroundColor(mic.lastVerified)} rounded-md w-full h-14`}
  onClick={() => setSelectedMic(mic)}
>
  <CardContent className="p-1.5 h-full flex flex-col justify-between">
    <h3 className="font-bold text-xs leading-tight text-gray-900 truncate">
      {truncateTitle(mic.openMic, 15)}
    </h3>
    <div className="flex justify-between items-center text-[10px] w-full">
      <span className="text-gray-800 font-semibold">{formatTime(mic.startTime)}</span>
      <span className="text-green-700 font-bold">{formatCost(mic.cost)}</span>
      <span className="text-orange-700 font-bold">{formatStageTime(mic.stageTime)}</span>
    </div>
  </CardContent>
</Card>
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/pages/OpenMics.tsx` | Add `truncateTitle` helper, reduce card height to `h-14`, merge metadata to single row, increase grid columns |

**Result**: 16+ tiles visible per page with time/cost/stage time on one row, titles truncated to 15 chars

