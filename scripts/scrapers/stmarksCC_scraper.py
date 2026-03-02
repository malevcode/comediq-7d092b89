#!/usr/bin/env python3
"""
Scrape St. Marks Comedy Club calendar into JSON.

Output fields per event (aligned with NYCC/Grisly Pear):
- date, weekday, start_time, date_iso, start_local_iso
- location
- title, description_snippet, ticket_link
- full_event_title, ticket_price, age_restrictions, duration
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Tuple

import requests
from bs4 import BeautifulSoup

try:
    from dateutil import tz as dateutil_tz
except ImportError:
    dateutil_tz = None

URL_DEFAULT = "https://www.stmarkscomedyclub.com/calendar"
TIMEZONE = "America/New_York"

WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

# Example list-view line:
# "<Title> Thursday East Village January 15, 2026 6:30 pm"
EVENT_RE = re.compile(
    rf"^(?P<title>.+?)\s+"
    rf"(?P<weekday>{'|'.join(WEEKDAYS)})\s+"
    rf"(?P<venue_label>.+?)\s+"
    rf"(?P<month>[A-Za-z]+)\s+(?P<day>\d{{1,2}}),\s+(?P<year>\d{{4}})\s+"
    rf"(?P<time>\d{{1,2}}(?::\d{{2}})?\s*[ap]m)\s*$",
    re.IGNORECASE,
)

# Remove common CTA suffixes from anchor text
CTA_RE = re.compile(r"\s+(BUY\s+TICKETS|GET\s+TICKETS)\s*$", re.IGNORECASE)

# Venue label -> address (edit as needed)
VENUE_TO_ADDRESS = {
    "East Village": "12 St Marks Pl, New York, NY 10003",
}

@dataclass
class EventOut:
    date: Optional[str]
    weekday: Optional[str]
    start_time: Optional[str]
    date_iso: Optional[str]
    start_local_iso: Optional[str]
    location: Optional[str]
    title: Optional[str]
    description_snippet: Optional[str]
    ticket_link: str
    full_event_title: Optional[str]
    ticket_price: Optional[str]
    age_restrictions: Optional[str]
    duration: Optional[str]

def fetch_html(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; stmarks-scraper/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.text

def month_name_to_num(month: str) -> int:
    months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
    ]
    m = month.strip().lower()
    if m not in months:
        raise ValueError(f"Unknown month: {month}")
    return months.index(m) + 1

def parse_time_to_24h(time_text: str) -> Tuple[int, int]:
    m = re.match(r"^(?P<h>\d{1,2})(?::(?P<m>\d{2}))?\s*(?P<ap>[ap]m)$", time_text.strip(), re.IGNORECASE)
    if not m:
        raise ValueError(f"Bad time: {time_text}")
    hh = int(m.group("h"))
    mm = int(m.group("m") or "0")
    ap = m.group("ap").lower()
    if ap == "pm" and hh != 12:
        hh += 12
    if ap == "am" and hh == 12:
        hh = 0
    return hh, mm

def format_start_time_ampm(time_text: str) -> str:
    hh, mm = parse_time_to_24h(time_text)
    ap = "AM" if hh < 12 else "PM"
    hh12 = hh % 12
    if hh12 == 0:
        hh12 = 12
    return f"{hh12:02d}:{mm:02d}{ap}"

def build_start_local_iso(year: int, month: int, day: int, time_text: str) -> Optional[str]:
    try:
        hh, mm = parse_time_to_24h(time_text)
        dt = datetime(year, month, day, hh, mm)
        if dateutil_tz is not None:
            tzinfo = dateutil_tz.gettz(TIMEZONE)
            if tzinfo is not None:
                dt = dt.replace(tzinfo=tzinfo)
        return dt.isoformat()
    except Exception:
        return None

def clean_text(txt: str) -> str:
    txt = " ".join(txt.split()).strip()
    txt = CTA_RE.sub("", txt).strip()
    return txt

def scrape_events(html: str) -> List[EventOut]:
    soup = BeautifulSoup(html, "html.parser")

    # St. Marks calendar uses outbound ticketing (often tixr.com). Use that as stable ticket_link.
    by_url: Dict[str, str] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if "tixr.com" not in href.lower():
            continue
        text = clean_text(" ".join(a.stripped_strings))
        if not text:
            continue
        prev = by_url.get(href)
        if prev is None or len(text) > len(prev):
            by_url[href] = text

    out: List[EventOut] = []
    for ticket_link, text in by_url.items():
        m = EVENT_RE.match(text)
        if not m:
            # skip junk rows like bare "GET TICKETS"
            continue

        title = m.group("title").strip()
        weekday = m.group("weekday").capitalize()
        venue_label = m.group("venue_label").strip()
        month_name = m.group("month").strip()
        day = int(m.group("day"))
        year = int(m.group("year"))
        time_text = m.group("time").strip().lower()

        month_num = month_name_to_num(month_name)
        date_iso = f"{year:04d}-{month_num:02d}-{day:02d}"
        start_time = format_start_time_ampm(time_text)
        start_local_iso = build_start_local_iso(year, month_num, day, time_text)

        date = f"{weekday} {month_name} {day}"
        location = VENUE_TO_ADDRESS.get(venue_label, venue_label)

        out.append(EventOut(
            date=date,
            weekday=weekday,
            start_time=start_time,
            date_iso=date_iso,
            start_local_iso=start_local_iso,
            location=location,
            title=title,
            description_snippet=None,
            ticket_link=ticket_link,
            full_event_title=None,
            ticket_price=None,
            age_restrictions=None,
            duration=None,
        ))

    out.sort(key=lambda e: (e.date_iso or "", e.start_local_iso or "", (e.title or "").lower()))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL_DEFAULT)
    ap.add_argument("--out", default="stmarks_calendar.json")
    args = ap.parse_args()

    html = fetch_html(args.url)
    events = scrape_events(html)

    Path(args.out).write_text(json.dumps([asdict(e) for e in events], ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(events)} events to {args.out}")

if __name__ == "__main__":
    main()