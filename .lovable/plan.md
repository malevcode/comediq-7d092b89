

## Plan: Replace "Find Gigs" with "Growth Opportunities"

### Concept

Replace the underused Job Board with a simpler, more useful **Growth Opportunities** page. Three content sections:

1. **Barking Gigs** — Shows listing barking opportunities (reuses existing `show_postings` data filtered to barking roles, or simple cards)
2. **Festivals & Events** — A curated list of comedy festivals sharing info (deadlines, submission links)
3. **Sponsored: Schools & Training** — Paid ad slots for comedy schools and festivals advertising to comedians (ties into existing ad system via `banner_ads`)

### Database Changes

**New table: `growth_opportunities`**
- `id` uuid PK
- `type` text — `'barking'`, `'festival'`, `'school_ad'`
- `title` text
- `description` text
- `venue_name` text (nullable)
- `borough` text (nullable)
- `date` date (nullable — for festivals/barking deadlines)
- `time` text (nullable)
- `compensation` text (nullable — e.g. "$20/hr", "Free show entry")
- `contact_info` text (nullable — Instagram, email, phone)
- `external_url` text (nullable)
- `image_url` text (nullable)
- `is_featured` boolean default false
- `is_active` boolean default true
- `submitted_by` uuid (nullable, references auth.users)
- `contact_id` uuid (nullable, references ad_contacts for sponsored entries)
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

RLS: Public read for active entries. Authenticated insert for own submissions. Admin full access.

### File Changes

| File | Change |
|------|--------|
| **New: `src/pages/GrowthOpportunities.tsx`** | Main page with 3 tabbed sections: Barking, Festivals, Schools & Training. Each shows cards. Submit button for barking/festival entries. |
| **New: `src/components/growth/OpportunityCard.tsx`** | Card component for each opportunity type with appropriate icons and CTAs |
| **New: `src/components/growth/SubmitOpportunityForm.tsx`** | Form for submitting barking gigs or festival info |
| **New: `src/hooks/useGrowthOpportunities.ts`** | Hook to fetch/filter from `growth_opportunities` table |
| **New: `src/api/growthOpportunities.ts`** | Supabase CRUD functions |
| `src/App.tsx` | Replace `/job-board` route with `/growth`. Remove `CreatePosting` import if no longer needed. Keep `/job-board` as redirect to `/growth` for backwards compat. |
| `src/components/HamburgerMenu.tsx` | Replace "Find Gigs" with "Growth" pointing to `/growth` |
| `src/components/BottomNavigation.tsx` | Update active-path check from `job-board` to `growth` |
| `src/pages/JobBoard.tsx` | Keep file but redirect to `/growth`, or remove entirely |
| `src/api/index.ts` | Add `growthOpportunities` export |

### UI Layout (Growth Opportunities Page)

```text
┌──────────────────────────────────┐
│  Growth Opportunities            │
│  Level up your comedy career     │
├──────────────────────────────────┤
│ [Barking] [Festivals] [Training] │ ← Tabs
├──────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐       │
│  │ Card    │  │ Card    │       │ ← Grid of opportunity cards
│  │ Barking │  │ Barking │       │
│  └─────────┘  └─────────┘       │
│                                  │
│  [+ Submit Opportunity]          │ ← Auth-gated submit button
└──────────────────────────────────┘
```

- **Barking tab**: Shows needing barkers, with venue, date, pay info
- **Festivals tab**: Comedy festivals with deadlines, submission links
- **Training tab**: Sponsored cards from comedy schools (pulled from `growth_opportunities` where `type='school_ad'`, linked to `banner_ads`/`ad_contacts` system)

### Sponsored Section Integration

The "Training" tab pulls entries where `type='school_ad'` and `is_featured=true`. These are managed by admins through the existing ad contacts CRM, linking via `contact_id`. This gives comedy schools and festivals a dedicated, native-feeling ad placement targeted at comedians.

