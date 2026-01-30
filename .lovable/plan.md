

# Center Title + Right-Align Status Badge + Host Background Image Upload

## Overview
Three changes to improve mic tile layout and add host customization:

1. **Center-align mic title** - The mic name should be truly centered in its row
2. **Right-align verified badge** - Push the status dropdown to the right edge of the row
3. **Add background image upload for hosts** - Allow verified hosts to customize their mic's appearance

---

## Part 1: Center Title + Right-Align Status Badge

### Current Layout
```text
┌─────────────────────────────────────────────────────────────┐
│ [Mic Name 🔗] [🟢 1.28.2026 ▼]                              │
│            (both items left-aligned together)               │
└─────────────────────────────────────────────────────────────┘
```

### New Layout
```text
┌─────────────────────────────────────────────────────────────┐
│              [Mic Name 🔗]           [🟢 1.28.2026 ▼]       │
│             (centered)                    (right-aligned)   │
└─────────────────────────────────────────────────────────────┘
```

### Changes to `src/components/OpenMicsDetailedList.tsx`

**Restructure the header row (line 219):**
```tsx
// Before
<div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
  <a ...>{mic.openMic}</a>
  <MicStatusDropdown ... />
</div>

// After - use justify-between with centered title
<div className="flex items-center w-full">
  {/* Spacer for balance */}
  <div className="flex-1" />
  
  {/* Centered mic name */}
  <a 
    href={...}
    className="font-semibold text-sm text-gray-900 ... flex items-center gap-1"
  >
    {mic.openMic}
    <ExternalLink className="w-3 h-3" />
  </a>
  
  {/* Right-aligned status badge */}
  <div className="flex-1 flex justify-end">
    <MicStatusDropdown micUniqueIdentifier={mic.uniqueIdentifier} />
  </div>
</div>
```

This creates a three-column layout:
- Left spacer (flex-1) for balance
- Center: mic name
- Right spacer (flex-1 + justify-end) pushes status badge to the edge

---

## Part 2: Host Background Image Upload

### Database Change
Add a `cover_image_url` column to the `open_mics_historical` table to store the custom background image URL.

```sql
ALTER TABLE open_mics_historical 
ADD COLUMN cover_image_url TEXT;
```

### Storage Bucket
Create a storage bucket for mic cover images:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('mic-covers', 'mic-covers', true);

-- RLS policy: Anyone can view, only verified hosts can upload to their mic
CREATE POLICY "Anyone can view mic covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'mic-covers');

CREATE POLICY "Verified hosts can upload mic covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mic-covers' AND
  EXISTS (
    SELECT 1 FROM mic_hosts
    WHERE mic_hosts.user_id = auth.uid()
    AND mic_hosts.is_verified = true
    AND mic_hosts.mic_id::text = (storage.foldername(name))[1]
  )
);
```

### New Component: `src/components/host/MicCoverUpload.tsx`

A component for hosts to upload/change their mic's cover image:

```tsx
export function MicCoverUpload({ micId, currentCoverUrl }: Props) {
  // Shows current cover preview (or placeholder)
  // File input for selecting new image
  // Upload to storage bucket
  // Update open_mics_historical.cover_image_url
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Cover Image</CardTitle>
        <CardDescription>
          Add a custom background image for your mic listing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Image preview */}
        {/* Upload button */}
        {/* Remove button if image exists */}
      </CardContent>
    </Card>
  );
}
```

### Update Host Dashboard

Add the cover upload component to `HostMicPanel` in `src/pages/HostDashboard.tsx`:

```tsx
function HostMicPanel({ hostId, micId, micName }: Props) {
  return (
    <div className="space-y-6">
      <Card>...</Card>
      
      {/* New: Cover image customization */}
      <MicCoverUpload micId={micId} />
      
      <CreateEventForm ... />
      {/* ... */}
    </div>
  );
}
```

### Update Mic Tile to Show Cover Image

In `OpenMicsDetailedList.tsx`, use the cover image as a subtle background:

```tsx
<div 
  className={`flex flex-col ... ${getBoroughOutline(mic.borough)}`}
  style={mic.coverImageUrl ? {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${mic.coverImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : undefined}
>
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/OpenMicsDetailedList.tsx` | Restructure header row for centered title + right-aligned badge; add cover image background |
| `src/components/host/MicCoverUpload.tsx` | New component for uploading cover images |
| `src/pages/HostDashboard.tsx` | Add MicCoverUpload to HostMicPanel |
| `src/api/openMics.ts` | Add updateMicCover function |
| `src/types/openMic.ts` | Add coverImageUrl field |
| `src/hooks/useOpenMics.ts` | Include cover_image_url in data mapping |
| Migration SQL | Add cover_image_url column + storage bucket + RLS policies |

---

## Visual Summary

### Mic Tile Header (Before vs After)

**Before:**
```
[Mic Name 🔗] [🟢 1.28.2026]
     ↑ both left-aligned together
```

**After:**
```
            [Mic Name 🔗]            [🟢 1.28.2026]
                 ↑                        ↑
            (centered)            (right-aligned)
```

### Host Dashboard (New Section)
```
┌─────────────────────────────────────────────┐
│  Customize Cover Image                       │
│  Add a custom background image for your     │
│  mic listing                                 │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │   [Current cover preview or         │    │
│  │    placeholder image]               │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  [Upload Image]  [Remove]                    │
└─────────────────────────────────────────────┘
```

