# Storytime redesign: web layouts + host Manage tab (plan)

Rules that apply everywhere: blue and white only (no green, swap any green "Publish"/"Active" to Comediq blue),
DM Sans body, logo font for the wordmark and venue names, sentence case, no all-caps pill badges,
forms use the inverse pyramid (widest, biggest fields first, each row narrower and smaller).

## How phone screens become web screens
- Width breakpoints: phone < 768, tablet 768 to 1023, desktop >= 1024.
- Floating bottom pill nav (Home, Map, Sets, Profile) becomes a top bar on desktop: logo left, the same 4 tabs center, search + avatar right.
- Bottom sheets (Register, My mic tracker) become a right-side drawer 440px wide on desktop. Map or page stays visible behind it.
- Horizontal carousels become grids on desktop (3 to 4 cards per row) with a "See all" link per row.
- Single cards (forms, tracker) sit in a centered column, max 560px.

## Screen by screen
| Screen | Phone (done in design) | Web plan |
|---|---|---|
| Home | Stacked carousels | Same rows as 4-column grids. Mic of the Day pinned as a wide hero card at the top. |
| Map | Full-bleed map, bubbles, preview card above nav | Split view: list on the left (420px, scrolls, same order as map), map on the right. Hover a list row highlights its bubble; tapping a bubble scrolls the list to it. Venue preview card opens over the map, top right. |
| Venue with several mics | Swipe carousel of mic cards (Storytime "Reel collab / Story collab" style) | Same cards side by side in the preview, arrows to page through when more than 2. |
| Mic detail | One column | Two columns: photo, title, description on the left; Open mic card (signup, details, Register button) sticky on the right; mini map under it. |
| Register sheet | Bottom sheet, 3 dashed steps | Right drawer, same steps. |
| My mic tracker | Bottom sheet | Right drawer, stays open while you browse; Check In button only shows on phone (needs GPS), web shows "Check in from your phone". |
| Sets | List | Table-like list with columns: date, venue, length, recording, set list. Click opens review in a right drawer. |
| Set review | Full screen | Recording player on top, set list and notes side by side. |
| Profile | One column | Left: avatar, stats card, refer buttons. Right: past mics grid. |
| Add a listing (chooser, one-page mic/show form) | One page, paired fields | Centered 560px card, inverse pyramid layout, same fields. Preview shows the real detail page at desktop size. |
| My listings + Manage dates | Lists | Becomes the host Manage tab below. |

## Host Manage tab (new, based on Storytime's brand Manage screens)
Shown only to logged-in users who host at least one claimed mic or show. Dark navy theme like Storytime's, in Comediq blues.

1. **Manage home**
   - Header: Comediq wordmark, host name under it, settings gear.
   - "Your profile" card: host avatar, name, role (Host), chevron to edit host profile.
   - "Your listings": one large photo card per mic or show with status (Live, Pending, Paused), title, quick stats row (views, saves, check-ins, sign-ups), and "N dates skipped" chip.
2. **Listing page (view mode)**
   - Top: back, Live / Pending toggle (Pending shows the version waiting for approval), edit icon.
   - Photo, title, status, tag chips (Free, Bringer, Variety, By Comediq), description.
   - Locations card with mini map and Active state.
   - Upcoming dates with on/off switches (the Manage dates screen, folded in here). Turning one off cancels it and hides it from Comediq that day.
   - Analytics card: views, map taps, saves/likes, check-ins, sign-ups, recorded sets. Only show the ones we already track; add the rest later.
3. **Edit mode**
   - Header switches to "Edit mode" with Cancel and Save.
   - Every field gets an outlined edit box in place (title, photo with pencil, description, tags with remove buttons, add tag).
   - Save opens a confirm dialog.
   - Proposed rule (Adam to confirm): description, photo, tags and skipped dates go live right away. Venue, day, time, price and signup method go to Pending for a quick approve, and the live listing keeps running until approved. Same wording as Storytime: "Your listing keeps running with the current details until the changes are approved."
4. **Web**: Manage home becomes a 2 to 3 column card grid; the listing page becomes two columns (photo + details left, dates + analytics right); edit mode keeps Cancel and Save pinned in the top bar.

## Order to build
1. Map bubbles + multi-mic preview (done in OpenMicsMapRefactored.tsx behind USE_BUBBLE_MARKERS).
2. Host Manage home + listing page (view mode, dates on/off).
3. Edit mode + Pending approval queue in admin.
4. Web layouts per the table above, one screen at a time.
