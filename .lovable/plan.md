

# Landing Page Revamp: Two-Audience Strategy

## Problem
1. The mascot's hat is clipped because the Hero section needs more top padding to clear the fixed header + marquee banner (needs `pt-28` or similar on the section itself)
2. "NYC's Open Mic Platform" is too narrow -- Comediq serves both comedians AND audience members
3. The landing page only speaks to comedians and ignores the Laugh tab audience entirely
4. No mention of LaughPass, show discovery, or the audience experience

## New Landing Page Structure

The page will flow as a series of full-width sections, each with clear purpose:

```text
[Header + Marquee Banner]
  |
[Hero] -- "NYC's Comedy Platform" + dual CTA (Perform / Laugh)
  |
[Social Proof Bar] -- "1,250+ comedians weekly | 500+ open mics | 5 boroughs"
  |
[For Comedians Section] -- 2-column grid of performer tools
  |
[For Audiences Section] -- LaughPass pitch + show features
  |
[Popular Open Mics] -- existing top-rated mics carousel
  |
[Pricing] -- Free plan + LaughPass ($29/mo) side by side
  |
[Waitlist / Affiliate Form]
```

## Detailed Section Plans

### 1. Hero Section Fix + Rewrite
**File: `src/components/Hero.tsx`**

- Add `pt-28` to the section to clear header + banner (fixes the hat clipping)
- Change tagline from "NYC's Open Mic Platform" to **"NYC's Comedy Platform"**
- Change subtitle to: **"Whether you're on stage or in the audience, Comediq is your home for live comedy."**
- Replace single "Sign In" button with two CTAs side-by-side:
  - "I Perform" (links to /auth or /perform) -- solid blue
  - "I Watch" (links to /auth or /laugh) -- outlined blue
- Keep mascot image, keep the blue glow

### 2. Social Proof Bar (new)
**Add to `src/pages/Index.tsx`** (inline, not a separate component)

A slim, high-contrast bar between Hero and Features showing:
- "1,250+ comedians visit weekly"
- "500+ open mics tracked"
- "5 NYC boroughs"

Styled as a horizontal strip with `bg-[#1a5fb4]` and white text.

### 3. For Comedians Section (replaces current Features)
**File: `src/components/Features.tsx`** -- restructure

Section heading: **"Built for Comedians"**
Subheading: "Everything you need from your first open mic to your first special."

Show features in a clean 2-column layout (icon + title + 1-liner):
- Open Mic Finder (live, linked)
- Comedian Portfolio (live, linked)
- Progress Tracker (live, linked)
- Calendar and Booking Tools (coming soon badge)
- Set Transcriptions and Bit Analysis (coming soon badge)
- Parallel Thinking Detector (coming soon badge)

Features that are live get a subtle "Try it" link. Coming soon features get a muted "Coming Soon" badge.

### 4. For Audiences Section (new)
**New component: `src/components/landing/ForAudiences.tsx`**

Section heading: **"Built for Comedy Fans"**
Subheading: "Discover shows, remember every set, and never miss a comedian you loved."

Two-part layout:

**Left/Top: LaughPass Pitch**
- Bold card: "LaughPass -- $29/month"
- "4 free comedy show tickets every month"
- "That's less than $8 per show"
- CTA: "Get LaughPass" (links to /auth)

**Right/Bottom: Audience Feature List**
- Show Discovery: Browse upcoming comedy shows across NYC
- Show Reviews: Rate and review shows like Letterboxd for comedy
- Comedian Tracking: Remember who made you laugh -- build your favorites list
- Personalized Recommendations: We learn your taste and suggest comedians you'll love (coming soon badge)
- Post-Show Recall: "What was that joke?" -- show playbills with full lineups and comedian details

### 5. Popular Open Mics
Keep existing section from Index.tsx, no changes needed.

### 6. Pricing Section Update
**File: `src/components/Pricing.tsx`**

Show two cards side by side:
- **Free Plan** (existing): Open Mic Finder, Portfolio, Booking Tools -- $0/month
- **LaughPass** (new): 4 show tickets/month, show reviews, comedian tracking -- $29/month

### 7. SEO Update
**File: `src/pages/Index.tsx`**

- Title: "Comediq -- NYC's Comedy Platform for Performers and Audiences"
- Description: "Find open mics, track your sets, discover comedy shows, and get monthly tickets with LaughPass. 1,250+ comedians use Comediq every week."

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/landing/ForAudiences.tsx` | New audience-focused section with LaughPass pitch |

### Files to Edit
| File | Changes |
|------|---------|
| `src/components/Hero.tsx` | Add `pt-28` padding; change tagline to "NYC's Comedy Platform"; dual CTA buttons; new subtitle |
| `src/components/Features.tsx` | Rename to "Built for Comedians"; add coming soon badges; 2-column layout |
| `src/components/FeatureCard.tsx` | Add optional `comingSoon` prop for badge rendering |
| `src/components/Pricing.tsx` | Add LaughPass card alongside free plan |
| `src/pages/Index.tsx` | Add social proof bar; insert ForAudiences section; update SEO meta |

### No database changes needed
All content is static marketing copy.

