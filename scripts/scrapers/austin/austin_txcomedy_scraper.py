#!/usr/bin/env python3
"""
Pull Austin open mic data from @austintexascomedy and related Austin comedy sources.

Since Instagram's public API is highly restricted, this scraper works in two modes:

  MODE 1 – Manual JSON input (recommended)
    Paste raw open mic info scraped/copied from Instagram into a JSON file
    and this script normalises it into the standard schema.

  MODE 2 – Web search via Google (no API key required)
    Queries DuckDuckGo HTML for recent open mic posts from @austintexascomedy
    and other Austin comedy accounts.  Less reliable than Mode 1 but good for
    discovering new mics.

Usage:
  # Mode 1: normalise a manually-collected JSON file
  python austin_txcomedy_scraper.py --input raw_austin_mics.json --out austin_mics.json

  # Mode 2: search-based discovery
  python austin_txcomedy_scraper.py --search --out austin_mics.json

Input JSON schema for Mode 1 (one object per open mic):
  {
    "name": "Velveeta Open Mic",
    "venue": "Velveeta Room",
    "address": "521 E 6th St, Austin, TX 78701",
    "day": "Wednesday",
    "start_time": "9:00 PM",
    "cost": "Free",
    "sign_up_instructions": "In-person sign-up at 8:30 PM",
    "hosts": "John Doe",
    "instagram": "@velvetaroom",
    "notes": ""
  }
"""

from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import asdict, dataclass
from typing import List, Optional

import requests
from bs4 import BeautifulSoup

CITY = "Austin, TX"

# Austin-specific comedy Instagram handles to search for
AUSTIN_COMEDY_HANDLES = [
    "austintexascomedy",
    "capcitycomedy",
    "velvetaroom",
    "esthersfollies",
    "creekandcaveaustin",
]

DAY_RE = re.compile(
    r"\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b",
    re.IGNORECASE,
)
TIME_RE = re.compile(r"\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b")
COST_RE = re.compile(r"\$\s*(\d+(?:\.\d{2})?)")


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
    instagram_handle: Optional[str]
    source_url: str


def normalise_manual(raw: dict) -> OpenMicEvent:
    """Convert a manually-entered dict to OpenMicEvent."""
    time_raw = raw.get("start_time") or ""
    # normalise "9pm" -> "9:00 PM" etc.
    time_m = TIME_RE.search(time_raw)
    start_time = time_m.group(1).upper() if time_m else (time_raw.upper() or None)
    if start_time and ":" not in start_time:
        # Insert :00 before AM/PM
        start_time = re.sub(r"(\d+)(AM|PM)", r"\1:00 \2", start_time)

    cost_raw = raw.get("cost") or ""
    if re.search(r"\bfree\b", cost_raw, re.IGNORECASE):
        cost = "Free"
    elif COST_RE.search(cost_raw):
        m = COST_RE.search(cost_raw)
        cost = f"${m.group(1)}" if m else cost_raw
    else:
        cost = cost_raw or None

    return OpenMicEvent(
        open_mic=raw.get("name") or raw.get("open_mic") or "Open Mic",
        venue_name=raw.get("venue") or raw.get("venue_name") or "",
        location=raw.get("address") or raw.get("location") or CITY,
        city=CITY,
        day=(raw.get("day") or "").capitalize() or None,
        start_time=start_time,
        cost=cost,
        sign_up_instructions=raw.get("sign_up_instructions") or raw.get("signup") or None,
        hosts_organizers=raw.get("hosts") or raw.get("hosts_organizers") or None,
        instagram_handle=raw.get("instagram") or None,
        source_url=raw.get("source_url") or "https://www.instagram.com/austintexascomedy/",
    )


def ddg_search(query: str) -> str:
    """Fetch DuckDuckGo HTML results for a query (no API key required)."""
    url = "https://html.duckduckgo.com/html/"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; comediq-austin-scraper/1.0)"}
    r = requests.post(url, data={"q": query}, headers=headers, timeout=20)
    r.raise_for_status()
    return r.text


def search_mode() -> List[OpenMicEvent]:
    """Discover open mics by searching for Austin comedy sources."""
    events: List[OpenMicEvent] = []
    queries = [
        "Austin Texas open mic comedy schedule site:instagram.com OR site:capcitycomedy.com",
        "@austintexascomedy open mic weekly schedule",
        "Austin TX comedy open mic list 2025 2026",
    ]

    seen_names: set[str] = set()
    for q in queries:
        print(f"  Searching: {q[:60]}…")
        try:
            html = ddg_search(q)
        except Exception as e:
            print(f"    Search failed: {e}")
            continue

        soup = BeautifulSoup(html, "html.parser")
        for result in soup.find_all("div", class_="result__body"):
            snippet = result.get_text(" ", strip=True)
            if not re.search(r"\bopen\s*mic\b", snippet, re.IGNORECASE):
                continue

            day_m = DAY_RE.search(snippet)
            time_m = TIME_RE.search(snippet)
            cost_m = COST_RE.search(snippet)

            # Extract a reasonable name (first ~60 chars of snippet or heading)
            heading = result.find("a", class_="result__a")
            name_text = (heading.get_text(strip=True) if heading else snippet[:60]).strip()
            if name_text in seen_names:
                continue
            seen_names.add(name_text)

            # Try to extract the result URL
            link = heading["href"] if heading and heading.get("href") else ""

            events.append(OpenMicEvent(
                open_mic=name_text,
                venue_name="",
                location=CITY,
                city=CITY,
                day=day_m.group(1).capitalize() if day_m else None,
                start_time=time_m.group(1).upper() if time_m else None,
                cost=f"${cost_m.group(1)}" if cost_m else None,
                sign_up_instructions=None,
                hosts_organizers=None,
                instagram_handle=None,
                source_url=link,
            ))

        time.sleep(1)  # be polite between searches

    return events


def main() -> None:
    ap = argparse.ArgumentParser(description="Collect Austin open mic data from @austintexascomedy and friends")
    ap.add_argument("--input", help="Path to manually-collected JSON file (Mode 1)")
    ap.add_argument("--search", action="store_true", help="Use web search to discover mics (Mode 2)")
    ap.add_argument("--out", default="austin_txcomedy_mics.json")
    args = ap.parse_args()

    if not args.input and not args.search:
        ap.error("Provide --input <file> or --search")

    events: List[OpenMicEvent] = []

    if args.input:
        print(f"Loading manual data from {args.input} …")
        with open(args.input, encoding="utf-8") as f:
            raw_list = json.load(f)
        if isinstance(raw_list, dict):
            raw_list = [raw_list]
        events.extend(normalise_manual(r) for r in raw_list)
        print(f"  → {len(events)} mics normalised")

    if args.search:
        print("Running web search for Austin open mics …")
        found = search_mode()
        events.extend(found)
        print(f"  → {len(found)} potential mics discovered")

    output = [asdict(e) for e in events]
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(output)} events to {args.out}")
    if output:
        print()
        print("Next step: review the JSON, fill in any missing fields,")
        print("then run: python scripts/ingest/ingest_austin_to_supabase.py --input", args.out)


if __name__ == "__main__":
    main()
