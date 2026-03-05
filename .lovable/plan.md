

## Plan: Simplify the "Request New Mic" Form

### Problem
The current `AddMicRequestForm` has 17 fields across 5 sections. Most users won't know (or need to provide) things like neighborhood, venue type, end time, stage time, or sign-up instructions. The admin can fill those in during review.

### Approach
Reduce the form to **6 core fields** + 1 optional, and use **Mapbox Geocoding** (already integrated in the project) to auto-fill location data from the venue name.

### New Form Fields

**Required (4):**
1. **Mic Name** — text input (same as now)
2. **Venue** — text input with Mapbox Places autocomplete. When a place is selected, auto-populate: address, borough, neighborhood, city
3. **Day of Week** — day picker (same as now)
4. **Start Time** — time input (same as now)

**Optional (3):**
5. **Cost** — text input (e.g., "Free", "$5", "1 drink min")
6. **Host Instagram** — single field, auto-copied to `changes_updates` on submit
7. **Notes** — textarea for anything else (sign-up instructions, rules, etc.)

### Auto-fill from Mapbox
When the user types a venue name, show a dropdown of Mapbox geocoding results (using the existing `GeocodingService` pattern and Mapbox token). On selection:
- `location` = full address
- `borough` = extracted from place context (Manhattan, Brooklyn, etc.)
- `neighborhood` = extracted from Mapbox neighborhood context
- `city` = extracted from place context

The user sees a small confirmation line like "📍 123 Main St, East Village, Manhattan" below the venue input. They never manually pick borough/neighborhood.

### Implementation

| Step | What | File |
|------|------|------|
| 1 | Rewrite `AddMicRequestForm.tsx` — 6 fields, Mapbox venue autocomplete, auto-fill location data | `src/components/host/AddMicRequestForm.tsx` |
| 2 | Update `MicRequestFormData` interface — keep all fields but only require `open_mic`, `venue_name`, `day`, `start_time` | Same file |
| 3 | Copy `hosts_organizers` value into `changes_updates` on submit so admin gets the contact info automatically | Same file |

No database changes needed — the `open_mics_requests` table already accepts all fields as nullable. The submit handler in `OpenMics.tsx` stays the same.

### Technical Detail: Mapbox Venue Search
Use Mapbox Geocoding API (already have the token via `getMapboxToken()` in `MapInitializer.ts`) with `types=poi,address` and debounced input. Extract borough from the `context` array in Mapbox results where `id` starts with `locality` or `place`. Map known NYC borough names. This keeps everything client-side with no new edge functions.

