# Comediq App Redesign: How It Works

## The big idea (5th grade version)
Think of the app like a field trip permission slip with 3 boxes to check:
1. **Sign up** for a mic (put your name on the list).
2. **Check in** when you physically get to the venue (your phone knows you're close). Whoever checks in first goes up first.
3. **Build and record** your set (write your joke list, hit record).

Every set you do gets saved in the **Sets** tab, like a scrapbook.

## The screens
| Screen | What it does |
|---|---|
| Home | Rows of mic cards you swipe sideways (Tonight Near You, Free Mics, etc.) |
| Map | Every mic is a circle on the map. Tap one, a preview card pops up. |
| Mic Detail | Photo, description, and the OPEN MIC card (signup time, set length, spots left). |
| Sign Up Sheet | Slides up from the bottom. Shows the 3 steps, then "Confirm Sign Up". |
| My Sign Up | Live tracker. Steps stay faded until you unlock them. |
| Sets | List of every mic/show you did. Tap one to hear the recording, see the set list, write notes. |
| Profile | Your stats and past mics. |

## The tracker states (the brain of the app)
`before` (not at venue, everything faded) -> `inRange` (green check, Check In button shows) -> `checking` (spinner) -> `checked` (you're #7, set tools unlocked).

## Reusable pieces (for porting to React Native)
- **VenueCard**: photo + round logo in the corner + name + distance.
- **StepCard**: number circle, small uppercase label, title, detail rows. Has 3 looks: dashed (preview), solid (active), faded (locked).
- **Pill / PillButton**: big rounded accent button, with a loading spinner state.
- **LogoBubble**: round venue logo, used on cards, pins, and rows.
- **FloatingNav**: 4-tab pill + a separate round button on the right.

## Brand choices (pulled from the live comediq.us CSS)
- Royal blue `#1E4894` (site `--lp-bg`): header band, buttons, active tab.
- Deep blue `#173A7A`: canvas backdrop.
- Sky `#8FC2F5` (site `--lp-accent`): avatar bubbles, city label, highlights. Dark ink `#08142B` goes on top of it.
- Cream `#F4EDE1` (site `--lp-ink`): app background and text on blue.
- Fonts: the **logo font** (Archivo, wide 112%, weight 800) for the Comediq wordmark, every venue name, the "Sets" title and the profile name. **DM Sans** for everything else.
- Type rules: sentence case everywhere, no uppercase or letter-spaced labels. Section labels are DM Sans semibold 17px in full-strength ink. Body is 15px regular. Secondary text is muted grey. Hierarchy comes from size and weight only.
- Logo: the real white Q mark from comediq.us (`/landing/logo-mark.png`).

## Add a listing flow (new, separate from the app screens)
Think of it like filling out a short form in 3 pages, then checking your work before you hand it in.

It's now ONE page, not three steps. Think of it like a compact order form where small boxes sit side by side.

1. **Chooser:** "An open mic" (for comedians) or "A show" (for audiences).
2. **One-page form:**
   - Mic rows: Mic name | Host IG, Venue, Day (Mon to Sun), Start | End, How often, Set length | Cost, Signup, Remind toggle.
   - Show rows: Show name | Instagram, Venue, Date | Starts | Doors, Price (small) | Ticket link, How often | Lineup, Description | Image, LaughPass, Remind toggle.
   - Extra fields (signup link, price, date, "Other" minutes, lineup order) pop in right under their chip only when needed.
3. **Preview:** the exact list card, an Edit link, and a green Publish button.
4. **Success:** the card again, Share to Instagram, Back to mics.

**Auto-advance:** every chip tap, venue pick, finished time/date, or Enter key jumps the cursor to the next EMPTY field. That's the `advance()` function: it looks at all inputs below the one you just finished and focuses the first blank one.

Errors only show after you tap "Preview listing", all at once, and the page scrolls to the first one.

### Fields kept from the old comediq.us forms
| Old field | Where it lives now |
|---|---|
| Lineup order (Bucket / random, Host chooses, Order of arrival) | Appears when Signup = "Lineup order" |
| Every other week + "next date" | Frequency chip "Every other week" shows a Next date field |
| Monthly dates + "1st and 3rd Thursday" note | Frequency "Monthly" shows Next date + Note (Optional) |
| One-off pop-up date | Frequency "One time" shows Date |
| End time, Doors | Kept, marked Optional (they were optional before) |
| Free tickets per show (LaughPass) | Appears when the LaughPass box is checked |

### Components (same name in the design and in React)
`StepHeader`, `TextInput`, `ChipGroup`, `VenueSearchField`, `ToggleCard`, `CheckboxCard`, `PreviewCard`, `PrimaryButton`. The CSS class names in the design match (`text-input`, `chip`, `toggle-card`, etc.).

### Colors for this flow
Royal blue `#1E4894` background, input fill `#2B56A6`, cards `#173A7A`, list card `#0E1A36`, sky `#8FC2F5` for selected chips and buttons, green `#3DBE74` for Publish, error `#FFB4A8`.

## Summary
- **2026-10-29:** Built a clickable Storytime-style prototype of the Comediq app on a Design canvas: one playable prototype, a board with all 7 screens, and a board with the 4 sign-up/check-in states. Venues and stats are sample data. Map is drawn, not Mapbox (prototype can't load Mapbox).
- **2026-10-29 (pass 2):** Matched the prototype to the live comediq.us: royal blue, sky, and cream colors, Archivo and Instrument Sans fonts, the real Q logo, and a royal blue header band on Home.
- **2026-10-29 (pass 3):** Typography cleanup (DM Sans, sentence case, 17/15px scale). Mic Detail rebuilt: neighborhood chip in header, "Details" (cost, doors, set length), one primary button that changes with state (Register > Check In > Rate this mic) next to Directions and Add to calendar icon buttons, date pills under the card, House rules with inline Read more.
- **2026-10-29 (pass 4):** Venue names, "Sets" and the profile name switched to the logo font.
- **2026-10-29 (pass 5):** New "Add a listing" flow on the same canvas, below the app screens: playable prototype, open mic path, show path, 6 states (empty, filled, venue not found, error, published, edit), a components sheet, and a desktop panel view. Existing app screens untouched.
- **2026-10-29 (pass 6):** Listing flow collapsed from 3 steps to 1 page. Inputs shrunk to 44px, fields paired 2 or 3 per row, chips became compact segmented controls, and focus auto-jumps to the next empty field.
- **2026-10-30 (pass 7):** Days now start on Sunday. Mics get a "Dates" calendar (multi-select); picking dates auto-fills Day and How often (same weekday 7 days apart = Weekly, 14 apart = Biweekly, other gaps = Monthly with a "1st and 3rd Thu" pattern). Mic form now has a required "I'll verify this mic is still active" toggle plus an opt-in "Email me reminders" checkbox. LaughPass no longer asks for a ticket count: members get in free while regular tickets are left. The Preview now looks like the real Mic/Show detail page from the app (cream page, stage photo, logo-font title, chips, Open mic card, blue button).
- **2026-10-30 (pass 8):** "Next dates" now takes up to 3 picks. Under How often, a line spells out the next 4 dates the mic will happen. The calendar shows 3 kinds of days: picked (solid blue), scheduled (light blue, filled in from the cadence), skipped (red, crossed out). Tapping a scheduled day skips it for a cancellation (holiday week, host away); tapping it again brings it back. Skipped dates drop out of the "next 4" list and show as "Skipping" on the preview.
