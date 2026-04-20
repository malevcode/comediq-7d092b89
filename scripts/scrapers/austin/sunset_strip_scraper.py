#!/usr/bin/env python3
"""
Scrape Sunset Strip Austin for open mic / comedy listings.

Pass the actual website URL via --url since the domain may vary.
Known candidates:
  - https://www.sunsetstripaustin.com
  - https://www.sunsetstripcomedy.com
  - Cap City's Sunset Showcase page on capcitycomedy.com

Usage:
  python sunset_strip_scraper.py --url https://www.sunsetstripaustin.com
  python sunset_strip_scraper.py --url <url> --out sunset_strip_mics.json
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

VENUE_NAME = "Sunset Strip Austin"
VENUE_ADDRESS = "Austin, TX"  # update with full address once confirmed
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

    # Try structured event containers first
    candidates = (
        soup.find_all("article", class_=re.compile(r"event|tribe"))
        or soup.find_all("div", class_=re.compile(r"event[\-_]item|event[\-_]card|event[\-_]row"))
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
        time_m = TIME_RE.search(text)

        events.append(OpenMicEvent(
            open_mic=title,
            venue_name=VENUE_NAME,
            location=VENUE_ADDRESS,
            city=CITY,
            day=day_m.group(1).capitalize() if day_m else None,
            start_time=time_m.group(1).upper() if time_m else None,
            cost=parse_cost(text),
            sign_up_instructions=None,
            hosts_organizers=None,
            source_url=detail_url,
        ))

    # Fallback: scan all text blocks for open mic mentions
    if not events:
        for block in soup.find_all(["p", "li", "div"], string=OPEN_MIC_KEYWORDS):
            text = block.get_text(" ", strip=True)
            day_m = DAY_RE.search(text)
            time_m = TIME_RE.search(text)
            events.append(OpenMicEvent(
                open_mic=text[:120],
                venue_name=VENUE_NAME,
                location=VENUE_ADDRESS,
                city=CITY,
                day=day_m.group(1).capitalize() if day_m else None,
                start_time=time_m.group(1).upper() if time_m else None,
                cost=parse_cost(text),
                sign_up_instructions=None,
                hosts_organizers=None,
                source_url=page_url,
            ))

    return events


def main() -> None:
    ap = argparse.ArgumentParser(description="Scrape Sunset Strip Austin open mics")
    ap.add_argument("--url", required=True, help="Full URL of the venue calendar/events page")
    ap.add_argument("--out", default="sunset_strip_mics.json")
    ap.add_argument("--venue-name", default=VENUE_NAME)
    ap.add_argument("--venue-address", default=VENUE_ADDRESS)
    args = ap.parse_args()

    global VENUE_NAME, VENUE_ADDRESS
    VENUE_NAME = args.venue_name
    VENUE_ADDRESS = args.venue_address

    print(f"Fetching {args.url} …")
    try:
        html = fetch(args.url)
    except Exception as e:
        raise SystemExit(f"Failed to fetch {args.url}: {e}")

    events = scrape_events(html, args.url)
    print(f"Found {len(events)} open mic events")

    output = [asdict(e) for e in events]
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(output)} events to {args.out}")


if __name__ == "__main__":
    main()
