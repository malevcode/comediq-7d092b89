# Host outreach: September 2026 batch

Copy-paste Instagram DMs. One per host.

Five shows are already live on the Laugh tab. Three are not listed at all because the only date we had has already passed, so those messages ask for a future date first.

---

## Live on the tab

### 1. @carlosknowscomedy — Gilded Age presents Ladies Night (Sep 20)

Nothing missing. This is a heads-up plus a request for future dates.

> Ladies Night is up on Comediq. Sep 20, Alchemist, $20, two drink min. About 1500 comedians a week are on the site. Anything wrong on the listing, tell me and I fix it today. Send me your next few dates and I'll keep it current.

### 2. @the_girlshow — The Girl Show (first Sunday, monthly)

Listed through March 2027.

> Girl Show is on Comediq now, first Sunday every month, booked out through March. Free with a drink min, all-female lineup, sweet treats, trivia. If a date moves or the lineup is worth naming, send it over and I'll update. Also send me a flyer if you have one, listings with art get clicked more.

### 3. @sitcomnyc — Sitcom NYC at QED (Sep 22)

Missing: QED's street address. Also missing the next Flop House EV date.

> Sitcom is on Comediq for Sep 22, 9pm at QED. Two things. What's QED's street address so the map pin lands right? And when's the next Flop House EV with @verygoodcomedy, since Sep 3 already went by. Send both and I'll get them both listed.

### 4. @clockedoffcomedy — Sep 20

Missing: venue, address, start time. Listed as "Venue TBA / Time TBA" with the handle attached.

> Clocked Off is on Comediq for Sep 20 with your handle attached. Venue and start time are blank, so right now people have to click through to you to find out where to go. Send me the venue, the address, and the time and I'll fill it in.

### 5. @livin.4.laughs — Oct 3

Missing: venue, address, start time, cover.

> Livin 4 Laughs is on Comediq for Oct 3 with your handle attached. Venue and time are blank, so anyone interested has to go find you. Send me venue, address, start time, and cover if there is one. Takes me two minutes to fix.

---

## Not listed yet, date already passed

### 6. Zofia's Hideout — Comedy Night (was Aug 27)

**Contact unknown.** The flyer names Douglas Doneson as host. Need a handle before this can be sent.

> Saw the Zofia's Hideout show, 301 E 84th, Doug hosting. The date I have is Aug 27 which already passed. Send me the next one plus the start time and I'll list it on Comediq. Free to list. If there's an Instagram for the show send that too, it's the only thing I actually require.

### 7. Love & Laughs (was Sep 5)

**Contact unknown.** Only an Eventbrite link came through, and the caption said it was the last show of the year.

> Your Eventbrite for Love & Laughs came across my desk but the show already ran and the caption said it was the last of the year. When it comes back, send me the date, venue, and time and I'll put it on Comediq. DJ Winz stays in the description.

### 8. @verygoodcomedy — Flop House EV (was Sep 3, monthly)

Missing: the recurrence rule and the venue address.

> You co-run the monthly Flop House EV with Sitcom. Sep 3 already passed. What's the rule, first Thursday, second Thursday, something else? Send that plus the venue address and I'll list every future date at once instead of you posting it fresh each month.

---

## When replies come in

Each answer is a small edit to a row in `audience_shows`. Fill in `venue_name`, `venue_address`, `show_time`, `borough`, `ticket_price`. Then run `npm run geocode:audience-shows` so the show gets a map pin.

For shows 6, 7 and 8, a future date means adding a new row. See `documentation.md` for the four gates a row must pass to actually appear.
