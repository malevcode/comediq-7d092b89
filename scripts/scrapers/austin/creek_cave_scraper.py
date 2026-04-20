#!/usr/bin/env python3
"""
Scrape Creek and Cave Austin for open mic listings.

Creek and Cave – https://www.creekandcave.com (Austin, TX comedy venue)
If the site structure differs from expectations, adjust CALENDAR_URL
and the parsing logic below.

Usage:
  python creek_cave_scraper.py
  python creek_cave_scraper.py --out creek_cave_mics.json
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from typing import List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.creekandcave.com"
CALENDAR_URL = "https://www.creekandcave.com/calendar"
VENUE_NAME = "Creek and Cave"
VENUE_ADDRESS = "Austin, TX"  # update with full address when confirmed
CITY = "Austin, TX"

OPEN_MIC_KEYWORDS = re.compile(
    r"\bopen\s*mic\b|\bopen\s*stage\b|\bopen\s*comedy\b|\bopen\s*stand[\s-]?up\b",
    re.IGNORECASE,
)

TIME_RE = re.compile(r"\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b", re.IGNORECASE)
DAY_RE = re.compile(
    r"\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b",
    re.IGNORECASE,
)


@dataclass
class OpenMicEvent:
    open_mic: str
    venue_name: str
    location: str
    city: str
    day: Optional[str]
    start_time: Optional[str]
    cost: Optional[str]
    sign_up_instructions: Optional[str]
    hosts_organizers: Optional[str]
    source_url: str


def fetch(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; comediq-austin-scraper/1.0)"}
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.text


def parse_cost(text: str) -> Optional[str]:
    m = re.search(r"\$\s*(\d+(?:\.\d{2})?)", text)
    if m:
        return f"${m.group(1)}"
    if re.search(r"\bfree\b", text, re.IGNORECASE):
        return "Free"
    return None


def scrape_events(html: str, page_url: str) -> List[OpenMicEvent]:
    soup = BeautifulSoup(html, "html.parser")
    events: List[OpenMicEvent] = []

    # Try common event-listing patterns (The Events Calendar, custom divs, etc.)
    candidates = (
        soup.find_all("article", class_=re.compile(r"event|tribe"))
        or soup.find_all("div", class_=re.compile(r"event[\-_]item|event[\-_]card|event[\-_]listing"))
        or soup.find_all("li", class_=re.compile(r"event"))
    )

    for item in candidates:
        text = item.get_text(" ", strip=True)
        if not OPEN_MIC_KEYWORDS.search(text):
            continue

        title_tag = (
            item.find(["h1", "h2", "h3", "h4"], class_=re.compile(r"title|name"))
            or item.find(["h1", "h2", "h3", "h4"])
        )
        title = title_tag.get_text(strip=True) if title_tag else "Open Mic"

        a_tag = item.find("a", href=True)
        detail_url = urljoin(page_url, a_tag["href"]) if a_tag else page_url

        day_m = DAY_RE.search(text)
        day = day_m.group(1).capitalize() if day_m else None

        time_m = TIME_RE.search(text)
        start_time = time_m.group(1).upper() if time_m else None

        cost = parse_cost(text)

        events.append(OpenMicEvent(
            open_mic=title,
            venue_name=VENUE_NAME,
            location=VENUE_ADDRESS,
            city=CITY,
            day=day,
            start_time=start_time,
            cost=cost,
            sign_up_instructions=None,
            hosts_organizers=None,
            source_url=detail_url,
        ))

    # If nothing found via structured elements, do a full-page text scan
    if not events:
        page_text = soup.get_text("\n", strip=True)
        for line in page_text.split("\n"):
            if OPEN_MIC_KEYWORDS.search(line):
                day_m = DAY_RE.search(line)
                time_m = TIME_RE.search(line)
                events.append(OpenMicEvent(
                    open_mic=line.strip()[:120],
                    venue_name=VENUE_NAME,
                    location=VENUE_ADDRESS,
                    city=CITY,
                    day=day_m.group(1).capitalize() if day_m else None,
                    start_time=time_m.group(1).upper() if time_m else None,
                    cost=parse_cost(line),
                    sign_up_instructions=None,
                    hosts_organizers=None,
                    source_url=page_url,
                ))

    return events


def enrich_from_detail(event: OpenMicEvent) -> OpenMicEvent:
    if event.source_url == CALENDAR_URL:
        return event
    try:
        html = fetch(event.source_url)
    except Exception:
        return event

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)

    signup_m = re.search(
        r"(sign[\s-]?up[^.!?\n]{0,200}[.!?])",
        text,
        re.IGNORECASE,
    )
    if signup_m:
        event.sign_up_instructions = signup_m.group(1).strip()

    host_m = re.search(
        r"host(?:ed)?\s+by\s+([A-Z][a-zA-Z\s]{2,40}?)(?:\.|,|\band\b|$)",
        text,
        re.IGNORECASE,
    )
    if host_m:
        event.hosts_organizers = host_m.group(1).strip()

    return event


def main() -> None:
    ap = argparse.ArgumentParser(description="Scrape Creek and Cave Austin open mics")
    ap.add_argument("--url", default=CALENDAR_URL, help="Calendar page URL")
    ap.add_argument("--out", default="creek_cave_mics.json")
    ap.add_argument("--no-detail", action="store_true")
    args = ap.parse_args()

    print(f"Fetching {args.url} …")
    try:
        html = fetch(args.url)
    except Exception as e:
        raise SystemExit(f"Failed to fetch {args.url}: {e}")

    events = scrape_events(html, args.url)
    print(f"Found {len(events)} open mic events")

    if not args.no_detail:
        for i, ev in enumerate(events):
            if ev.source_url != args.url:
                print(f"  detail {i+1}/{len(events)}: {ev.source_url}")
                events[i] = enrich_from_detail(ev)

    output = [asdict(e) for e in events]
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(output)} events to {args.out}")


if __name__ == "__main__":
    main()
