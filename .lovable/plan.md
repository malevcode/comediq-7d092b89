

# Reduce Whitespace in Mic Cards - Compact Action Bar

## Current Issues
Looking at the screenshot:
- The social action bar (like, comment, save, playlist, share) takes up ~3/8 of the card height
- Large padding on buttons and excessive margins
- Icons are oversized at 20px (w-5 h-5)
- Border and margins add unnecessary vertical space

## Proposed Changes

### 1. Compact MicActionBar Component

**File: `src/components/mic/MicActionBar.tsx`**

Reduce padding, margins, and icon sizes:

| Element | Before | After |
|---------|--------|-------|
| Container border-top + padding | `pt-1.5 mt-1` | `pt-1 mt-0.5` |
| Button padding | `px-3 py-2` | `px-2 py-1` |
| Icon size | `w-5 h-5` | `w-4 h-4` |
| Font size for counts | `text-sm` | `text-xs` |

```tsx
// Line 136 - Container
<div className="flex items-center justify-evenly border-t border-gray-200 pt-1 mt-0.5">

// Lines 143-145, 162, 174-176, 192, 202 - All buttons
className="flex items-center gap-1 px-2 py-1 h-auto"

// Lines 148-153, 164, 179-184, 194, 204 - All icons
<Heart className="w-4 h-4 ..." />
<MessageCircle className="w-4 h-4" />
<Bookmark className="w-4 h-4 ..." />
<ListPlus className="w-4 h-4" />
<Send className="w-4 h-4" />

// Lines 154, 165 - Count text
<span className="text-xs font-medium">{likeCount}</span>
```

### 2. Reduce Spacing in OpenMicsDetailedList

**File: `src/components/OpenMicsDetailedList.tsx`**

Tighten the gap between metadata row and action bar:

```tsx
// Line 321 - Right section container
<div className="w-full md:flex-[1.2] flex flex-col justify-center gap-0">
                                                              ^^^
// Changed from gap-0.5 to gap-0
```

Also reduce bottom margin on metadata section:

```tsx
// Line 293 - Metadata container
<div className="flex-1 flex flex-col justify-center min-w-0 gap-x-3 text-xs text-gray-700 mb-0 mr-1">
                                                                                      ^^^^
// Changed from mb-0.5 to mb-0
```

---

## Visual Comparison

### Before
```
┌─────────────────────────────────────────┐
│  5:30-7 PM    5 min    $5         ▼    │  ← metadata row
│                                         │  ← gap
├─────────────────────────────────────────┤  ← border + padding
│                                         │
│    ♡      💬      🔖      ≡+      ✈    │  ← large icons + padding
│                                         │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────┐
│  5:30-7 PM    5 min    $5         ▼    │  ← metadata row
├─────────────────────────────────────────┤  ← minimal border
│   ♡     💬     🔖     ≡+     ✈         │  ← compact icons
└─────────────────────────────────────────┘
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/mic/MicActionBar.tsx` | Reduce button padding, icon sizes, margins |
| `src/components/OpenMicsDetailedList.tsx` | Remove gap between metadata and action bar |

**Result**: Action bar height reduced from ~3/8 to ~1/8 of card size

