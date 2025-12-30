# Comediq 2026 Roadmap

> Last updated: 2025-12-30

## Legend
- ✅ Complete
- 🔄 In Progress
- ⬜ Not Started

---

# Section 1: Quick Reference Checklist

## Immediate Priority - 2025 Wrapped Launch

### Phase 1: Core Infrastructure (COMPLETED)
- ✅ Rename "Job Board" → "Find Gigs" across all pages
- ✅ Create `useWrapped` hook with custom stage time support
- ✅ Build 5-slide Wrapped experience (4 content + 1 shareable)
- ✅ Create Instagram-sized summary card (9:16 ratio)
- ✅ Add `stage_time_minutes` to `profile_custom_shows`
- ✅ Add `custom_stage_time` to `profile_open_mics`
- ✅ Add Quick Stats bar to Shows page

### Phase 2: Quick Show Input System
- ⬜ Create `src/utils/showParser.ts` - client-side NLP parser
- ⬜ Create `src/components/shows/QuickShowInput.tsx` - text input component
- ⬜ Create `src/components/shows/ParsedShowPreview.tsx` - confirmation UI
- ⬜ Database migration: Add `rating` column to `profile_custom_shows`
- ⬜ Update `src/pages/Shows.tsx` with Quick Input as primary CTA

### Phase 3: Bit/Joke Tracker
- ⬜ Create `comedian_bits` database table
- ⬜ Create `performance_bits` junction table
- ⬜ Create `src/components/shows/BitTracker.tsx`
- ⬜ Create `src/hooks/useBits.ts`
- ⬜ Integrate bit parsing into Quick Show Input

## Future Enhancements
- ⬜ Voice input with Web Speech API
- ⬜ Bulk import from Apple Notes (Lovable AI)
- ⬜ Bit Lab analytics dashboard
- ⬜ Achievement badges for Wrapped milestones
- ⬜ Download Wrapped as image (html2canvas)
- ⬜ Host verification workflow
- ⬜ Public comedian profiles
- ⬜ Weekly/monthly performance reports

---

# Section 2: Detailed Specifications

## 2.1 Quick Show Input System

### Overview
Natural language input that lets comedians quickly log shows without filling out forms.

### File: `src/utils/showParser.ts`

#### Date Patterns
```typescript
// Relative dates
"last night" → yesterday
"yesterday" → yesterday
"tonight" → today
"today" → today

// Day names (finds nearest past occurrence)
"Saturday" → nearest past Saturday
"Monday" → nearest past Monday

// Explicit dates
"12/28" → Dec 28 (current year)
"Dec 28" → Dec 28
"December 28" → Dec 28
"12/28/25" → Dec 28, 2025
```

#### Time Patterns
```typescript
"8pm" → "20:00"
"8:00 PM" → "20:00"
"8 PM" → "20:00"
"at 8" → "20:00" (assumes PM for comedy)
"20:00" → "20:00"
```

#### Venue Matching
- Fuzzy match against 180+ venues in `open_mics_historical`
- Case insensitive
- Partial matches prioritized by length
- Examples:
  - "cellar" → "Comedy Cellar"
  - "stand" → "The Stand"
  - "eastville" → "Eastville Comedy Club"
  - "creek" → "The Creek and the Cave"

#### Stage Time Patterns
```typescript
"5 min" → 5
"5 minutes" → 5
"5m" → 5
"did 5" → 5
"got 7" → 7
Default: 5 minutes
```

#### Rating Patterns
```typescript
// Numeric
"8/10" → 8.0
"8.5/10" → 8.5
"8" (standalone at end) → 8.0

// Sentiment-based (see Section 4)
"killed it" → 9
"bombed" → 3
"meh" → 6
```

#### Bit Extraction
```typescript
// Quoted phrases
"tried the 'divorce bit'" → ["divorce bit"]

// Action patterns
"X killed" → [X] with positive tag
"X bombed" → [X] with negative tag
"forgot X" → [X] with "forgot" tag
"new bit about X" → [X] with "new" tag
```

### Example Inputs & Outputs

```typescript
// Example 1
Input: "Last night Comedy Cellar 7 min 8.5/10 divorce bit killed"
Output: {
  date: "2025-12-29", // yesterday
  time: null,
  venue: "Comedy Cellar",
  borough: "Manhattan",
  stageTime: 7,
  rating: 8.5,
  bits: [{ name: "divorce bit", sentiment: "positive" }],
  notes: ""
}

// Example 2
Input: "Tonight 9pm The Stand, 5 min set, bombed the airplane callback"
Output: {
  date: "2025-12-30", // today
  time: "21:00",
  venue: "The Stand",
  borough: "Manhattan",
  stageTime: 5,
  rating: 3, // "bombed" sentiment
  bits: [{ name: "airplane callback", sentiment: "negative" }],
  notes: ""
}

// Example 3
Input: "Saturday Eastville 10 min crushed it, new bit about dating apps worked"
Output: {
  date: "2025-12-28", // last Saturday
  time: null,
  venue: "Eastville Comedy Club",
  borough: "Brooklyn",
  stageTime: 10,
  rating: 9, // "crushed" sentiment
  bits: [{ name: "dating apps", sentiment: "positive", isNew: true }],
  notes: ""
}
```

### File: `src/components/shows/QuickShowInput.tsx`

#### Component Structure
```tsx
<Card>
  <CardHeader>
    <CardTitle>Quick Add</CardTitle>
    <CardDescription>Type naturally: "Last night Comedy Cellar 5 min 8/10"</CardDescription>
  </CardHeader>
  <CardContent>
    <Textarea 
      placeholder="Last night Comedy Cellar 5 min killed it..."
      rows={3}
    />
    <div className="flex gap-2 mt-3">
      <Button onClick={handleParse}>Parse & Preview</Button>
      <Button variant="ghost">Use Detailed Form</Button>
    </div>
  </CardContent>
</Card>
```

#### State Management
- `inputText: string` - Raw user input
- `parsedData: ParsedShow | null` - Result from parser
- `isPreviewOpen: boolean` - Controls preview modal/sheet
- `isParsing: boolean` - Loading state

### File: `src/components/shows/ParsedShowPreview.tsx`

#### Component Structure
```tsx
<Sheet>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Confirm Show Details</SheetTitle>
    </SheetHeader>
    
    {/* Editable fields */}
    <div className="space-y-4">
      <DatePicker value={date} onChange={setDate} />
      <TimePicker value={time} onChange={setTime} />
      <VenueSelect value={venue} onChange={setVenue} />
      <Input label="Stage Time (min)" value={stageTime} />
      <Slider label="Rating" min={1} max={10} step={0.5} value={rating} />
      <Textarea label="Notes" value={notes} />
    </div>
    
    <SheetFooter>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSave}>Save to My Sets</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## 2.2 2025 Wrapped Feature (COMPLETED ✅)

### Current Implementation

#### Slide Structure
1. **Welcome Slide** - "Your 2025 Comedy Year" with animated intro
2. **Performances Slide** - Total count with mics/shows breakdown
3. **Stage Time Slide** - Hours/minutes with fun comparisons
4. **Top Spots Slide** - Favorite venue + boroughs explored
5. **Summary Card Slide** - Shareable Instagram-sized card

#### Data Sources
- `profile_open_mics` - Tracked open mic performances
- `profile_custom_shows` - Custom shows and booked gigs
- `open_mics_historical` - Venue details (borough, neighborhood)

#### Stage Time Calculation
```typescript
// Priority order:
1. custom_stage_time from profile_open_mics (if set)
2. stage_time_minutes from profile_custom_shows (if set)
3. stage_time from open_mics_historical (parsed to minutes)
4. Default: 5 minutes
```

#### Files
| File | Purpose |
|------|---------|
| `src/hooks/useWrapped.ts` | Data fetching, calculations, stats aggregation |
| `src/pages/Wrapped.tsx` | Slide rendering, navigation, animations |
| `src/components/wrapped/WrappedSummaryCard.tsx` | Instagram-sized shareable card |
| `src/components/wrapped/WrappedSlide.tsx` | Individual slide wrapper |
| `src/components/wrapped/AnimatedCounter.tsx` | Number animation component |
| `src/components/wrapped/ProgressDots.tsx` | Slide progress indicator |

#### Summary Card Specs
- Aspect ratio: 9:16 (1080x1920 for Instagram Stories)
- Content: Total performances, stage time, top venue, boroughs
- Branding: Comediq logo + "WRAPPED 2025"
- User personalization: Stage name displayed prominently

---

## 2.3 Bit/Joke Tracker

### Database Schema

```sql
-- Table: comedian_bits
-- Stores individual jokes/bits that a comedian performs
CREATE TABLE comedian_bits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  tags text[], -- e.g., ['observational', 'one-liner', 'callback']
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comedian_bits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bits"
  ON comedian_bits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bits"
  ON comedian_bits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bits"
  ON comedian_bits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bits"
  ON comedian_bits FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_comedian_bits_user_id ON comedian_bits(user_id);
```

```sql
-- Table: performance_bits
-- Junction table linking bits to performances with per-performance ratings
CREATE TABLE performance_bits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL REFERENCES profile_custom_shows(id) ON DELETE CASCADE,
  bit_id uuid NOT NULL REFERENCES comedian_bits(id) ON DELETE CASCADE,
  rating numeric(3,1) CHECK (rating >= 1 AND rating <= 10),
  notes text, -- Performance-specific notes like "forgot punchline"
  order_in_set integer, -- Position in the set
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(performance_id, bit_id)
);

-- Enable RLS
ALTER TABLE performance_bits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own performance bits"
  ON performance_bits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profile_custom_shows 
      WHERE id = performance_bits.performance_id 
      AND profile_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_performance_bits_performance_id ON performance_bits(performance_id);
CREATE INDEX idx_performance_bits_bit_id ON performance_bits(bit_id);
```

### File: `src/hooks/useBits.ts`

```typescript
interface Bit {
  id: string;
  name: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  // Computed
  avgRating?: number;
  performanceCount?: number;
  trend?: 'up' | 'down' | 'flat';
  lastPerformed?: string;
}

interface UseBitsReturn {
  bits: Bit[];
  isLoading: boolean;
  createBit: (name: string, notes?: string) => Promise<Bit>;
  updateBit: (id: string, updates: Partial<Bit>) => Promise<void>;
  deleteBit: (id: string) => Promise<void>;
  linkBitToPerformance: (bitId: string, performanceId: string, rating?: number) => Promise<void>;
}
```

### File: `src/components/shows/BitTracker.tsx`

#### Component Structure
```tsx
<Card>
  <CardHeader>
    <CardTitle>Your Bits</CardTitle>
    <Button size="sm">+ New Bit</Button>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {bits.map(bit => (
        <BitCard 
          key={bit.id}
          name={bit.name}
          avgRating={bit.avgRating}
          trend={bit.trend}
          performanceCount={bit.performanceCount}
          onClick={() => openBitDetail(bit)}
        />
      ))}
    </div>
  </CardContent>
</Card>
```

#### BitCard Features
- Bit name with trend indicator (↗ ↘ →)
- Average rating as stars or numeric
- Performance count badge
- Sparkline showing recent ratings (optional)
- Click to expand for full history

---

## 2.4 Shows Page Layout

### Current State (✅ Implemented)
- Quick Actions: "Find Open Mics" + "Find Gigs" buttons
- Quick Stats bar: mics count, shows count, stage time
- ShowNotepad component for listing shows

### Planned Enhancements
```
┌─────────────────────────────────────────┐
│  Quick Add                              │
│  ┌───────────────────────────────────┐  │
│  │ Last night Comedy Cellar 5 min... │  │
│  └───────────────────────────────────┘  │
│  [Parse & Preview]  [Use Detailed Form] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  2025 Stats                             │
│  🎤 42 Mics  |  🎭 8 Shows  |  ⏱ 4.2h   │
│  [View Your Wrapped →]                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Quick Actions                          │
│  [Find Open Mics]  [Find Gigs]          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Your Sets                    [Sort ▼]  │
│  ├─ 12/29 Comedy Cellar      7 min 8.5  │
│  ├─ 12/28 The Stand          5 min 7.0  │
│  └─ 12/27 Eastville         10 min 9.0  │
└─────────────────────────────────────────┘
```

---

# Section 3: Completed Features Log

| Date | Feature | Files Changed |
|------|---------|---------------|
| 2025-12-28 | Renamed "Job Board" → "Find Gigs" | JobBoard.tsx, HamburgerMenu.tsx, CreatePosting.tsx |
| 2025-12-28 | Added `stage_time_minutes` to profile_custom_shows | Migration |
| 2025-12-28 | Added `custom_stage_time` to profile_open_mics | Migration |
| 2025-12-28 | Created 5-slide Wrapped experience | Wrapped.tsx, useWrapped.ts |
| 2025-12-28 | Added Quick Stats bar to Shows page | Shows.tsx |
| 2025-12-28 | Created Instagram-sized summary card | WrappedSummaryCard.tsx |
| 2025-12-30 | Created 2026 Roadmap document | 2026_PLANS.md |

---

# Section 4: Technical Reference

## Sentiment-to-Rating Mapping

| Phrase | Rating | Category |
|--------|--------|----------|
| "killed it", "crushed", "murdered", "destroyed" | 9 | Excellent |
| "great", "solid", "really good", "nailed it" | 8 | Great |
| "good", "decent", "worked", "landed" | 7 | Good |
| "okay", "meh", "alright", "fine" | 6 | Average |
| "rough", "struggled", "tough crowd" | 4 | Below Average |
| "bombed", "died", "tanked", "crickets" | 3 | Poor |

## Venue Borough Mapping (Auto-fill)

Borough is automatically filled based on venue match from `open_mics_historical`:

| Venue (partial match) | Full Name | Borough |
|----------------------|-----------|---------|
| "cellar" | Comedy Cellar | Manhattan |
| "stand" | The Stand | Manhattan |
| "eastville" | Eastville Comedy Club | Brooklyn |
| "creek" | The Creek and the Cave | Queens |
| "stress factory" | Stress Factory | New Jersey |
| "gotham" | Gotham Comedy Club | Manhattan |
| "greenwich" | Greenwich Village Comedy Club | Manhattan |

## Stage Time Defaults

| Context | Default |
|---------|---------|
| Open mic (no data) | 5 minutes |
| Booked show (no data) | 10 minutes |
| Showcase (no data) | 7 minutes |
| Headliner (no data) | 45 minutes |

---

# Section 5: API Reference

## Supabase Tables Used

| Table | Purpose |
|-------|---------|
| `profile_open_mics` | User's tracked open mic performances |
| `profile_custom_shows` | User's custom shows and booked gigs |
| `open_mics_historical` | Master list of 180+ open mics with venue details |
| `comedian_bits` | (Planned) User's jokes/bits library |
| `performance_bits` | (Planned) Junction table for bits per performance |

## Key Queries

### Fetch User's 2025 Performances
```typescript
// Open mics
const { data: mics } = await supabase
  .from('profile_open_mics')
  .select('*, open_mics_historical(*)')
  .eq('profile_id', userId)
  .eq('schedule_type', 'completed')
  .gte('created_at', '2025-01-01')
  .lte('created_at', '2025-12-31');

// Custom shows
const { data: shows } = await supabase
  .from('profile_custom_shows')
  .select('*')
  .eq('profile_id', userId)
  .eq('schedule_type', 'completed')
  .gte('date', '2025-01-01')
  .lte('date', '2025-12-31');
```

### Fetch Venue List for Matching
```typescript
const { data: venues } = await supabase
  .from('open_mics_historical')
  .select('venue_name, borough, neighborhood')
  .eq('active', true);
```
