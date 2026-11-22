# Comediq app redesign: build spec (v3, 2026-11-17)

The .dc.html files in this folder are the approved screen designs (open any of them in a browser to view;
images that point to /_blob/... only load on the hosted canvas, use the real logo files in the app instead).
Build real React Native screens that look and behave like them. Do not ship the .dc.html files in the app.

## Rules
- Never delete files. To retire an old version, add an ARCHIVED.md note next to it.
- Brand: Comediq blue and white only, no green anywhere (swap any green in the designs for Comediq blue).
  Royal #1E4894, deep #173A7A, sky #8FC2F5, cream #F4EDE1, ink #08142B.
- Fonts: DM Sans for everything. Archivo (wide, weight 800) only for the Comediq wordmark and venue names.
- Sentence case. No all-caps pill badges.
- Forms: inverse pyramid (widest, biggest fields first, each row narrower).

## Screens (file -> what to build)
- Main.dc.html, Flow.dc.html, States.dc.html: Home, Map, Mic detail, Register sheet, My mic tracker
  (before check-in, in range, checked in), Sets, Set review, Profile. Floating pill tab bar.
- ListingFlow / ListingMicPath / ListingShowPath / ListingStates / ListingComponents: Add a listing.
  One-page form, calendar with up to 3 next dates that auto-fills day + how often, skip dates,
  preview that looks like the real detail page, success.
- MapBubbles.dc.html: the map.
- HostManage.dc.html: host Manage tab.
- WebMap / WebManage / ListingDesktop: web versions (for comediq.us later, not the app).

## Map rules
- One round bubble per venue: the host's map icon, or initials on a Comediq blue. Comediq-run mics use the Q logo.
- Sizes: Comediq-run largest, happening today medium, other days small. Bigger on top. Unverified faded.
- Zoomed out: bubbles shrink and overlap (dense). Zoomed in: full size. No number clusters.
- Tap a venue: header "<Venue> · <now time> · N now, N next", then swipeable cards:
  only events not yet ended, "Happening now · until <end>" first (button Join now), then "Next · <time>"
  (button Sign up), in time order. Ended events are hidden.

## Host Manage tab (only for users who host a claimed mic or show)
- Manage home: host profile card, a card per listing with status (Live / Pending), stats, "+ List a new mic or show".
- Listing page: Live / Pending toggle, edit button, tags, upcoming dates with on/off switches
  (off = skipped, hidden from Comediq that day, shows "Skipped" on the listing), analytics (only stats we already track).
- Edit mode: Cancel / Save, edit the square banner photo AND the circle map icon separately, title, tags, description, time.
- Save rule: banner, map icon, tags, description and skipped dates go live right away.
  Venue, day, time, price and signup method go to Pending for admin approval; the live listing keeps running until approved.
