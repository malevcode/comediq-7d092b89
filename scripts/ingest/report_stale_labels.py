#!/usr/bin/env python3
"""Report mic name labels whose date has already passed.

Mic names carry hand-written status labels like "Skin Tag *SKIPS 9/14*" or
"The Buddha Room 6:30 *Resumes 8/27*". Nothing in the pipeline expires them, so
they keep telling comics about a date that has gone by. Every one of these has
to be cleared by hand, and the only way to notice is to read all 400 names.

This reads public/mics.json and prints the ones whose date is in the past. It
changes nothing: clearing a label means rewriting that entry in
open_mic_updates.json in place, which is a judgement call about whether the mic
actually came back, and only Adam knows that.

Usage:
    python scripts/ingest/report_stale_labels.py [--json PATH] [--today YYYY-MM-DD]
"""
import argparse
import datetime as dt
import json
import re
import sys

# Labels are wrapped in asterisks: "Sick Hat *Final: 9/16 & 10/7*"
LABEL = re.compile(r"\*[^*]+\*")
# Dates are M/D, no year: 9/14, 10/27, 8/27. The date is not always inside the
# asterisks: "*Show Dependent* 9/10 Fear City Mic" puts it after the label, so
# a name that carries a label is searched end to end.
# Times are written with a colon ("The Buddha Room 6:30") and ordinals without
# digits on both sides of the slash ("*1st/3rd Sun*"), so neither matches here.
DATE = re.compile(r"\b(\d{1,2})/(\d{1,2})\b")


def resolve(month, day, today):
    """Pick the year for a bare M/D label.

    Labels are written close to the date they describe, so the current year is
    almost always right. The exception is a January date read in December: that
    means next year, not eleven months ago. Anything landing more than six
    months back gets rolled forward.
    """
    try:
        d = dt.date(today.year, month, day)
    except ValueError:
        return None
    if (today - d).days > 183:
        try:
            d = dt.date(today.year + 1, month, day)
        except ValueError:
            return None
    return d


def scan(mics, today):
    stale = []
    for m in mics:
        name = m.get("openMic") or ""
        if not LABEL.search(name):
            continue  # no label, nothing to expire
        dates = [resolve(int(a), int(b), today) for a, b in DATE.findall(name)]
        dates = [d for d in dates if d]
        if not dates:
            continue  # "*Biweekly*", "*1st/3rd Sun*": recurring, never expires
        # A label listing several dates is only spent once the last one goes
        if max(dates) < today:
            stale.append((max(dates), name, m.get("uniqueIdentifier", "")))
    return sorted(stale)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--json", default="public/mics.json")
    p.add_argument("--today", help="override today, for testing (YYYY-MM-DD)")
    args = p.parse_args()

    today = (
        dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    )
    with open(args.json) as fh:
        mics = json.load(fh)

    stale = scan(mics, today)
    if not stale:
        print(f"No expired labels as of {today}. {len(mics)} mics checked.")
        return 0

    print(f"{len(stale)} expired label(s) as of {today}, out of {len(mics)} mics:\n")
    for expired, name, uid in stale:
        days = (today - expired).days
        print(f"  {expired}  ({days}d ago)  {name}")
        print(f"              {uid}")
    print(
        "\nNothing was changed. To clear one, rewrite its entry in"
        "\nscripts/ingest/open_mic_updates.json in place. Deleting the entry"
        "\nleaves the stale name in the database forever."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
