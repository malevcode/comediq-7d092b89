

# Inline "More" Toggle - Consolidate Additional Details

## Current Layout (wastes a line)
```text
┌──────────────────────────────────────────────────────────┐
│  5-6:30 PM    5 min    $8 + 1 drink min                  │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Additional Details                              ▼  │ │  ← separate row
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## New Layout (saves a line)
```text
┌──────────────────────────────────────────────────────────┐
│  5-6:30 PM    5 min    $8 + 1 drink min              ▼   │  ← entire row clickable
├──────────────────────────────────────────────────────────┤
│  (expanded content appears here when clicked)            │
└──────────────────────────────────────────────────────────┘
```

---

## Changes to `src/components/OpenMicsDetailedList.tsx`

### 1. Make the metadata row clickable (lines 293-308)

Convert the metadata container into a clickable row that toggles expansion:

```tsx
// Before (lines 292-308)
<div className="flex-1 flex flex-col justify-center min-w-0 gap-x-3 text-xs text-gray-700 mb-0.5 mr-1">
  <div className="flex flex-row gap-x-4 sm:gap-2 items-center justify-center md:justify-evenly md:grid md:grid-cols-2 text-xs text-gray-700">
    <span>...</span>
    <span>...</span>
    <span>...</span>
    <span>...</span>
  </div>
</div>

// After - add onClick, cursor-pointer, hover state, and chevron
<div className="flex-1 flex flex-col justify-center min-w-0 gap-x-3 text-xs text-gray-700 mb-0.5 mr-1">
  <div 
    className="flex flex-row gap-x-4 sm:gap-2 items-center justify-center md:justify-evenly text-xs text-gray-700 cursor-pointer hover:bg-blue-50 rounded-md px-1 py-0.5 transition-colors"
    onClick={() => setExpanded(e => !e)}
    role="button"
    tabIndex={0}
    aria-expanded={expanded}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(x => !x); }}
  >
    <span className="flex items-center gap-1">
      <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
      {formatTimeRange(mic.startTime, mic.latestEndTime)}
    </span>
    <span className="flex items-center gap-1">
      <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
      {formatStageTime(mic.stageTime)}
    </span>
    <span className="flex items-center gap-1">
      <DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />
      {mic.cost}
    </span>
    {/* Blue chevron toggle */}
    <ChevronDown
      className={`w-4 h-4 text-blue-600 ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    />
  </div>
  {/* Host info - only on desktop, stays outside clickable area */}
  <span className="hidden md:flex items-center gap-1 mt-0.5">
    <CircleUser className="w-3 h-3 flex-shrink-0 text-gray-400" />
    <span className="truncate text-xs">
      {mic.instagramHandle && mic.instagramHandle.trim() ? makeLinksClickable(mic.instagramHandle) : "No host"}
    </span>
  </span>
</div>
```

### 2. Move expanded content outside the blue box (lines 309-427)

Remove the blue box wrapper and render expanded content directly:

```tsx
// Before (lines 309-427)
<div className="w-full md:flex-[1.2] flex flex-col justify-center gap-0.5">
  <div className="bg-blue-50 border border-blue-100 rounded-md p-1 relative w-full">
    <div className="cursor-pointer ...">
      <span>Additional Details</span>
      <ChevronDown ... />
    </div>
    {expanded && (
      <div className="flex flex-col gap-1.5 mt-1.5">
        {/* all the expanded content */}
      </div>
    )}
  </div>
  <MicActionBar ... />
  <MicCommentSection ... />
</div>

// After - remove the blue box, just show expanded content
<div className="w-full md:flex-[1.2] flex flex-col justify-center gap-0.5">
  {expanded && (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-2 flex flex-col gap-1.5">
      {/* Sign-up instructions */}
      <div className="break-words font-normal select-text cursor-text flex flex-row text-xs">
        <span className="flex items-center gap-2 mr-1">
          <UserRoundCheck className="w-3 h-3" />Sign-Up Instructions:
        </span>
        <span className="flex">
          {mic.signUpInstructions ? makeLinksClickable(mic.signUpInstructions) : 'N/A'}
        </span>
      </div>
      {/* Address link */}
      <div className="text-xs">
        <a href={getMapUrl(mic.location, mic.venueName)} ...>
          <MapPin className="w-3 h-3" /> {mic.location}
        </a>
      </div>
      {/* House Rules */}
      {mic.otherRules && (...)}
      {/* Calendar buttons */}
      {...}
    </div>
  )}
  <MicActionBar ... />
  <MicCommentSection ... />
</div>
```

---

## Visual Summary

### Before (2 separate rows)
```
[Time] [Duration] [Cost] [Host]     ← metadata row
┌─────────────────────────────────┐
│ Additional Details           ▼  │ ← separate clickable box
└─────────────────────────────────┘
```

### After (1 unified row)
```
[Time] [Duration] [Cost]        ▼   ← entire row clickable, blue chevron
                                    ← expanded content appears below
```

---

## Summary

| Change | Description |
|--------|-------------|
| Make metadata row clickable | Add `onClick`, `cursor-pointer`, `hover:bg-blue-50` to time/duration/cost row |
| Add blue chevron | Insert `ChevronDown` icon at end of metadata row (blue color) |
| Remove "Additional Details" header | Delete the separate blue box header |
| Move host info outside clickable area | Keep desktop host display but outside the click zone |
| Preserve expanded content | Same content appears when clicked, now in a simpler container |

**File to edit:** `src/components/OpenMicsDetailedList.tsx`

