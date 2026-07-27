# Comediq: Decentralized Editing & Upload UX

## Decision log from planning session, July 2026

This doc explains what we decided and why, in plain language. It's a living doc, more sections get added as we resolve more of the plan.

---

## The Problem

Comediq is too centrally managed. Adam is the bottleneck for every data change (new mics, new shows, corrections). It's also too hard for a host to add a new mic. This doc covers the fix for both.

---

## Part 1: The Editing Model (who can change what)

The big idea: split data into two buckets based on how risky it is if a stranger changes it.

**Bucket A: Facts about the world.** Things like a mic's venue, day, and time. Low stakes if wrong for a bit, easy to fix, good candidate for open editing.

**Bucket B: Personal expression.** A comedian's bio, a fan's review. This represents a specific person. Letting a stranger overwrite it isn't decentralization, it's vandalism risk.

### Decisions

| Data type | Who can edit | Login required? | Can be reverted? |
|---|---|---|---|
| Mic / show listings | Anyone | No (rate-limited + captcha) | Not initially, foundation gets built for later |
| Comedian profiles | Comedian owns it, can lock specific fields, rest stays open | Comedian needs an account to lock fields | Foundation built now, not fully wired up |
| Reviews | Locked to whoever wrote it (like Yelp) | Not decided yet, likely needed to attribute authorship | Locked to author means no vandalism risk here anyway |

**Where reviews live**: on the mic's own page, like a Yelp review. A review is attached to the mic it's about and displayed right there on that mic's listing. Ownership stays with the author (only they can edit it), but the review itself belongs on the mic page, not tucked away on the reviewer's profile or a separate reviews section.

### The revert mechanism (safety net)

Instead of a full Wikipedia-style version history, we're building something much lighter: whenever a field gets overwritten, the old value gets saved before it's replaced. Nothing gets permanently erased, ever. Reviews specifically must never be erasable, only restorable.

We're building this table/mechanism now since it's cheap, but **not** wiring up the revert button on every page right away. It rolls out where the risk is highest first, then expands later. One system, staged rollout, not two separate systems.

### Monthly export (the 25th)

This is a backup safety net, not the mechanism for decentralization itself. If something goes seriously wrong, there's a full snapshot to fall back on. It's separate from the day-to-day editing model above.

---

## Part 2: Upload UX (adding a new mic)

**The actual problem** (confirmed by Adam, not guessed): people don't know where to click to add a mic, and it wasn't clear how listings got approved.

**Half the problem is already solved**: since new listings publish instantly now (matches the open editing model above), there's no approval step left to be confused about.

### Decisions

- **Entry point**: A prominent "Add a Mic" button on the homepage and nav. This is the main fix for the "where do I click" complaint.
- **Minimum fields to publish**: venue, day/time, signup method, host name/contact info. Kept short on purpose, fewer fields means less friction and fewer people bouncing off the form.
- **Recurring vs one-off**: the form needs a repeat pattern (e.g. "every Tuesday") not just a single date, since most mics are recurring.
- **Host accounts**: optional. A host can create an account to get a persistent "my mics" dashboard, but nobody is required to have one just to add or edit a listing.

---

## Still open (not yet decided)

- Visual redesign (premium feel, 3D animations)
- Fan-facing features (find shows, find tours, connect to clips)
- Adam's personal comedian clip resume (MVP)
- Expanding the resume system to other comedians
- Spam/duplicate detection specifics for mic listings
- Exact review authorship/login requirements

---

## Summary

We split Comediq's data into "facts" (open to anyone) and "personal expression" (owned by the person it represents). We're building one lightweight save-the-old-value mechanism instead of full version history, rolled out gradually. Reviews stay attached to the mic page they're about, Yelp-style, editable only by their author. New listings publish instantly, killing the confusing approval step. The upload form gets a clear homepage entry point and a short required-field list, with an optional dashboard for hosts who want one.
