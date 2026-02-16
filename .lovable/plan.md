

# Home Screen Revamp + Landing Page Rebrand

## Part 1: Logged-In Home Screen

### Problems
- "Total Stage Time" and "Day Streak" cards use amber/orange/red gradients that clash with the Comediq blue brand
- Quick Actions buttons use orange/red/blue borders inconsistently
- Upcoming mics cards use orange accents
- The Header component uses an orange gradient for the welcome text
- Background uses `from-[#f8f0e1]` (warm cream) which doesn't match the blue brand
- QuickNotes and Quick Actions card headers use `from-[#0E4898] to-[#5DC8E2]` which is close but the teal endpoint is off-brand
- Most of the content (stage time, quick actions) isn't that useful day-to-day -- the **mic likes, saved mics, and streak** are what people actually engage with

### Changes

**Retheming to Comediq Blue (`#1a5fb4`)**:
- Background: change from warm cream gradient to `from-blue-50/50 to-white` (subtle cool tone)
- Header welcome text: change orange gradient to solid `text-[#1a5fb4]`; level badge uses `text-[#1a5fb4]` instead of `text-orange-600`
- Stat cards: replace amber/red gradients with Comediq blue variations:
  - Day Streak card: `border-[#1a5fb4]/20 bg-gradient-to-br from-blue-50 to-[#1a5fb4]/10` with blue icon background
  - Stage Time card: same blue family, lighter variant
- Card headers: standardize to `bg-[#1a5fb4]` (solid) instead of the teal gradient
- Quick Action buttons: all use `border-[#1a5fb4]/20 text-[#1a5fb4] hover:bg-blue-50`
- Upcoming mic items: blue accent borders/icons instead of orange

**Content Restructure** -- replace underused widgets with useful ones:
- **Keep**: Day Streak (people like it), Quick Notes
- **Replace "Total Stage Time"** with a **"Liked Mics" card** showing count of mics the user has liked, linking to their saved/liked mics
- **Add**: A **"Saved Mics" quick-glance card** showing count of bookmarked mics with a link to `/saved`
- **Simplify Quick Actions**: Remove "Advertise With Us" (not a comedian action), keep "Find Open Mics" and "Log Performance", add "Saved Mics"

**BottomNavigation**: Change active tab color from `text-orange-500` to `text-[#1a5fb4]`

**SiteFooter**: Change hover link color from `hover:text-orange-400` to `hover:text-[#1a5fb4]`

---

## Part 2: Landing Page Rebrand (Non-Logged-In)

### Problems
- Hero section is sparse -- just a title, one paragraph, and a mascot image
- FeatureCard uses `from-orange-50 to-red-50` gradient (off-brand)
- Pricing section uses orange everywhere (orange badges, orange buttons, orange gradients)
- WaitlistForm section uses `from-orange-50 to-red-50` and orange submit button
- No social proof, no stats, no urgency
- The "AI disclaimer" paragraph in the hero is confusing for first-time visitors

### Changes

**Hero Section** (`Hero.tsx`):
- Replace background with `bg-gradient-to-br from-[#1a5fb4]/5 via-white to-blue-50`
- Add a bold tagline: "NYC's Open Mic Platform" above the main heading
- Rewrite subtitle to be punchier: "Find open mics. Track your sets. Grow your career."
- Add platform stats below the CTA button (e.g., "500+ open mics tracked" -- pulled from the existing `usePlatformStats` hook if available, or hardcoded)
- Move the AI disclaimer to a smaller note below the fold
- Keep mascot image but add a subtle blue glow/shadow behind it

**Features Section** (`Features.tsx` + `FeatureCard.tsx`):
- Retheme cards: `from-blue-50 to-[#1a5fb4]/5` instead of orange/red
- Card hover shadow uses blue tint
- Section heading stays the same

**Pricing Section** (`Pricing.tsx`):
- Replace orange gradient with `from-blue-50 to-[#1a5fb4]/10`
- Badge: `bg-[#1a5fb4]` instead of `bg-orange-500`
- CTA button: `bg-[#1a5fb4] hover:bg-[#164d94]` instead of orange

**Waitlist Section** (`WaitlistForm.tsx`):
- Background: `from-blue-50 via-white to-[#1a5fb4]/5`
- Submit button: `bg-[#1a5fb4] hover:bg-[#164d94]`

---

## Technical Details

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/Home.tsx` | Retheme all cards/gradients to Comediq blue; replace stage time with liked mics count; restructure stat grid |
| `src/components/Header.tsx` | Welcome text from orange gradient to `text-[#1a5fb4]`; level badge blue |
| `src/components/home/QuickNotes.tsx` | Card header gradient to solid `bg-[#1a5fb4]` |
| `src/components/Hero.tsx` | Blue-tinted background; add tagline; add stats bar; tighten copy |
| `src/components/Features.tsx` | No changes needed (just passes props) |
| `src/components/FeatureCard.tsx` | Retheme from orange/red to blue gradient |
| `src/components/Pricing.tsx` | Replace all orange with Comediq blue |
| `src/components/WaitlistForm.tsx` | Replace orange background/button with blue |
| `src/components/BottomNavigation.tsx` | Active color from `text-orange-500` to `text-[#1a5fb4]` |
| `src/components/SiteFooter.tsx` | Hover color from `hover:text-orange-400` to `hover:text-[#1a5fb4]` |

### Hooks needed
- Use existing `useSavedMics` to get saved mic count for the home screen card
- Use existing `useMicRatings` or a simple Supabase count query for liked mics count

### No database changes required
All data already exists -- we're just surfacing it differently on the home screen.

