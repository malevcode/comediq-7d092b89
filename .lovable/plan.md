

## Plan: Comedy Club Activation Controls + Admin To-Do Board

### What We're Building

Two new admin dashboard tabs:

1. **"Venues" tab** — Manage which comedy clubs' scraped shows are visible to users. Toggle clubs on/off with one click.
2. **"To-Dos" tab** — A simple task board for tracking: clubs to scrape next, advertisers to cold-email, and show hosts to target.

---

### Part 1: Comedy Club Activation

#### Database

**New table: `venue_sources`** — Tracks each scraped comedy club and whether their shows should be publicly visible.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| source_key | text UNIQUE NOT NULL | e.g. "nycc", "grislypear", "stmarks" |
| venue_name | text NOT NULL | Display name |
| is_active | boolean DEFAULT false | Whether shows are listed publicly |
| permission_status | text DEFAULT 'pending' | 'pending', 'approved', 'declined' |
| contact_name | text | Point of contact |
| contact_email | text | |
| notes | text | Internal notes |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Admin-only for all operations, public SELECT for `is_active = true` rows.

**Modify `audience_shows` RLS**: Update the public SELECT policy to also check that the show's `source` exists in `venue_sources` with `is_active = true`, OR `source IS NULL` (independently submitted shows always visible if verified).

Seed with existing sources:
- `nycc` → "New York Comedy Club" (inactive by default)
- `grislypear` → "Grisly Pear" (inactive by default)  
- `stmarks` → "St. Marks Comedy Club" (inactive by default)

#### UI: `AdminVenueSourcesManager.tsx`

- Table listing each venue source with: name, show count, permission status dropdown, active toggle, notes field
- Show count pulled from `audience_shows` grouped by source
- Toggle flips `is_active` — instantly hides/shows all that club's listings
- Inline-editable contact info and notes

---

### Part 2: Admin To-Do Board

#### Database

**New table: `admin_todos`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| category | text NOT NULL | 'scrape_target', 'advertiser_outreach', 'host_target' |
| title | text NOT NULL | e.g. "Comedy Cellar" |
| description | text | Details/notes |
| status | text DEFAULT 'todo' | 'todo', 'in_progress', 'done' |
| priority | text DEFAULT 'medium' | 'low', 'medium', 'high' |
| assigned_to | text | Optional name |
| due_date | date | |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Admin-only for all CRUD operations.

#### UI: `AdminTodoBoard.tsx`

- Three-column layout (or collapsible sections on mobile):
  - **Clubs to Scrape** — comedy clubs to target next for scraping
  - **Advertisers to Contact** — cold email targets
  - **Show Hosts to Target** — independent producers to recruit
- Each item: title, description, priority badge, status toggle
- Add new item inline with category pre-selected
- Quick status cycling: todo → in_progress → done

---

### Implementation Summary

| Step | What | Files |
|------|------|-------|
| 1 | Create `venue_sources` + `admin_todos` tables, update `audience_shows` RLS | Migration |
| 2 | Seed venue_sources with existing scraped clubs | Migration |
| 3 | Build `AdminVenueSourcesManager.tsx` | New component |
| 4 | Build `AdminTodoBoard.tsx` | New component |
| 5 | Add "Venues" and "To-Dos" tabs to `AdminInterface.tsx` | Edit existing |

