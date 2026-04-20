#!/usr/bin/env python3
"""
Scrape Cap City Comedy Club (Austin, TX) for open mic listings.

Cap City Comedy Club – https://capcitycomedy.com
Looks for recurring open mic events on their calendar/events page.

Usage:
  python cap_city_scraper.py
  python cap_city_scraper.py --out cap_city_mics.json
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

BASE_URL = "https://capcitycomedy.com"
CALENDAR_URL = "https://capcitycomedy.com/events/"
VENUE_NAME = "Cap City Comedy Club"
VENUE_ADDRESS = "8120 Research Blvd, Austin, TX 78758"
CITY = "Austin, TX"

OPEN_MIC_KEYWORDS = re.compile(
    r"\bopen\s*mic\b|\bopen\s*stage\b|\bopen\s*comedy\b",
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

    # Cap City uses The Events Calendar plugin (common WordPress pattern)
    # Each event is an article.type-tribe_events or similar
    articles = soup.find_all("article", class_=re.compile(r"tribe_events|type-tribe"))
    if not articles:
        # Fallback: any article or div that might contain event info
        articles = soup.find_all(["article", "div"], class_=re.compile(r"event"))

    for article in articles:
        text = article.get_text(" ", strip=True)
        if not OPEN_MIC_KEYWORDS.search(text):
            continue

        # Title
        title_tag = article.find(["h2", "h3", "h1", "a"], class_=re.compile(r"title|summary"))
        if title_tag is None:
            title_tag = article.find(["h2", "h3", "h1"])
        title = title_tag.get_text(strip=True) if title_tag else "Open Mic"

        # Link to detail page
        a_tag = article.find("a", href=True)
        detail_url = urljoin(page_url, a_tag["href"]) if a_tag else page_url

        # Day of week
        day_m = DAY_RE.search(text)
        day = day_m.group(1).capitalize() if day_m else None

        # Time
        time_m = TIME_RE.search(text)
        start_time = time_m.group(1).upper() if time_m else None

        # Cost
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

    return events


def enrich_from_detail(event: OpenMicEvent) -> OpenMicEvent:
    """Fetch the event detail page to pull richer sign-up / host info."""
    try:
        html = fetch(event.source_url)
    except Exception:
        return event

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)

    # Sign-up instructions: look for sentences containing sign-up keywords
    signup_m = re.search(
        r"(sign[\s-]?up[^.!?\n]{0,200}[.!?])",
        text,
        re.IGNORECASE,
    )
    if signup_m:
        event.sign_up_instructions = signup_m.group(1).strip()

    # Host name
    host_m = re.search(
        r"host(?:ed)?\s+by\s+([A-Z][a-zA-Z\s]{2,40}?)(?:\.|,|\band\b|$)",
        text,
        re.IGNORECASE,
    )
    if host_m:
        event.hosts_organizers = host_m.group(1).strip()

    return event


def main() -> None:
    ap = argparse.ArgumentParser(description="Scrape Cap City Comedy Club open mics")
    ap.add_argument("--out", default="cap_city_mics.json")
    ap.add_argument("--no-detail", action="store_true", help="Skip detail-page fetches")
    args = ap.parse_args()

    print(f"Fetching {CALENDAR_URL} …")
    html = fetch(CALENDAR_URL)
    events = scrape_events(html, CALENDAR_URL)

    if not args.no_detail:
        for i, ev in enumerate(events):
            print(f"  detail {i+1}/{len(events)}: {ev.source_url}")
            events[i] = enrich_from_detail(ev)

    output = [asdict(e) for e in events]
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(output)} open mic events to {args.out}")


if __name__ == "__main__":
    main()
