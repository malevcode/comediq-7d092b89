#!/usr/bin/env python3
"""
Scrape New York Comedy Club calendar into JSON.

Fields per event:
- date, weekday, start_time, date_iso, start_local_iso
- location (mapped address string based on venue)
- title, description_snippet, ticket_link
- full_event_title, ticket_price, age_restrictions, duration (from detail page)

Usage:
  python scrape_nycc_calendar.py
  python scrape_nycc_calendar.py --out nycc_calendar.json --max-events 50
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

try:
    from dateutil import tz as dateutil_tz
except ImportError:
    dateutil_tz = None

BASE_URL = "https://newyorkcomedyclub.com"
CAL_URL_DEFAULT = "https://newyorkcomedyclub.com/calendar"
TIMEZONE = "America/New_York"

VENUE_TO_ADDRESS = {
    "Midtown": "241 East 24th Street \nNew York, NY",
    "Upper West Side": "236 W 78th Street\nNew York, NY",
    "East Village": "85 East 4th Street\nNew York, NY",
}

WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
MONTHS = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
)

# Calendar line example: "Saturday January 31st 05:00PM"
DATE_LINE_RE = re.compile(
    rf"^(?P<weekday>{'|'.join(WEEKDAYS)})\s+"
    rf"(?P<month>{'|'.join(MONTHS)})\s+"
    rf"(?P<day>\d{{1,2}})(?:st|nd|rd|th)?\s+"
    rf"(?P<time>\d{{1,2}}:\d{{2}}[AP]M)$",
    re.IGNORECASE,
)

# Month-year context often appears in page text like "January 2026"
MONTH_YEAR_RE = re.compile(
    rf"\b(?P<month>{'|'.join(MONTHS)})\s+(?P<year>20\d{{2}})\b",
    re.IGNORECASE,
)

EVENT_PATH_RE = re.compile(r"^/events/.+", re.IGNORECASE)

PRICE_RE = re.compile(r"\$(\d+(?:\.\d{2})?)")
AGE_RE = re.compile(r"\bAges?\s*(\d{1,2}\+?)\b", re.IGNORECASE)
DURATION_RE = re.compile(
    r"\b(?:Duration[:\s]*)?(\d{1,3}\s*(?:min|mins|minutes|hr|hrs|hours))\b",
    re.IGNORECASE,
)


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


def fetch(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; nycc-scraper/1.1)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.text


def month_to_num(month: str) -> int:
    month = month.strip().lower()
    mapping = {m.lower(): i + 1 for i, m in enumerate(MONTHS)}
    if month not in mapping:
        raise ValueError(f"Unknown month: {month}")
    return mapping[month]


def build_month_year_map(page_text: str) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for month, year in MONTH_YEAR_RE.findall(page_text):
        out[month.capitalize()] = int(year)
    return out


def normalize_datetime(year: int, month_name: str, day: int, time_str: str) -> Tuple[str, str]:
    m = re.match(r"^(?P<h>\d{1,2}):(?P<m>\d{2})(?P<ap>[AP]M)$", time_str.strip(), re.IGNORECASE)
    if not m:
        raise ValueError(f"Bad time format: {time_str}")
    hh = int(m.group("h"))
    mm = int(m.group("m"))
    ap = m.group("ap").upper()
    if ap == "PM" and hh != 12:
        hh += 12
    if ap == "AM" and hh == 12:
        hh = 0

    dt = datetime(year, month_to_num(month_name), day, hh, mm)
    if dateutil_tz is not None:
        tzinfo = dateutil_tz.gettz(TIMEZONE)
        if tzinfo is not None:
            dt = dt.replace(tzinfo=tzinfo)

    return dt.date().isoformat(), dt.isoformat()


def parse_ul_event(ul, month_year_map: Dict[str, int], fallback_year: Optional[int], calendar_url: str) -> Optional[Dict]:
    """
    Parse one calendar <ul> block that contains a BUY TICKETS link to /events/...
    """
    # Find ticket link within this UL
    ticket_a = None
    for a in ul.find_all("a", href=True):
        href = a["href"].strip()
        if EVENT_PATH_RE.match(href):
            # Prefer the anchor whose text includes "BUY TICKETS"
            if "buy tickets" in " ".join(a.get_text(" ", strip=True).split()).lower():
                ticket_a = a
                break
            ticket_a = ticket_a or a

    if not ticket_a:
        return None

    ticket_link = urljoin(calendar_url, ticket_a["href"].strip())

    # Pull LI texts
    lis = ul.find_all("li", recursive=False)
    li_texts = [" ".join(li.get_text(" ", strip=True).split()) for li in lis if li.get_text(strip=True)]

    # Expect (typical):
    # 0: "Saturday January 31st 05:00PM"
    # 1: "Midtown"
    # 2: "<Show title> at Midtown"
    # 3: "<Description...>"
    date_line = li_texts[0] if len(li_texts) > 0 else None
    venue_name = li_texts[1] if len(li_texts) > 1 else None
    title_line = li_texts[2] if len(li_texts) > 2 else None
    desc = li_texts[3] if len(li_texts) > 3 else None

    date = weekday = start_time = date_iso = start_local_iso = None

    if date_line:
        m = DATE_LINE_RE.match(date_line)
        if m:
            weekday = m.group("weekday").capitalize()
            month = m.group("month").capitalize()
            day = int(m.group("day"))
            start_time = m.group("time").upper()

            year = month_year_map.get(month) or fallback_year
            date = f"{weekday} {month} {day}"

            if year is not None:
                try:
                    date_iso, start_local_iso = normalize_datetime(year, month, day, start_time)
                except Exception:
                    date_iso, start_local_iso = None, None
        else:
            # If formatting changes, at least preserve raw string
            date = date_line

    title = title_line
    if title_line and venue_name:
        suffix = f" at {venue_name}".lower()
        if title_line.lower().endswith(suffix):
            title = title_line[: -len(suffix)].strip()

    location_address = VENUE_TO_ADDRESS.get(venue_name) if venue_name else None

    return {
        "ticket_link": ticket_link,
        "date": date,
        "weekday": weekday,
        "start_time": start_time,
        "date_iso": date_iso,
        "start_local_iso": start_local_iso,
        "venue_name": venue_name,
        "location": location_address,
        "title": title,
        "description_snippet": desc,
    }


def find_calendar_events(calendar_html: str, calendar_url: str, max_events: Optional[int]) -> List[Dict]:
    soup = BeautifulSoup(calendar_html, "html.parser")
    page_text = soup.get_text("\n", strip=True)
    month_year_map = build_month_year_map(page_text)
    fallback_year = next(iter(month_year_map.values()), None)

    events: List[Dict] = []
    for ul in soup.find_all("ul"):
        ev = parse_ul_event(ul, month_year_map, fallback_year, calendar_url)
        if ev:
            events.append(ev)

    # Deduplicate by ticket_link
    by_url: Dict[str, Dict] = {}
    for e in events:
        u = e["ticket_link"]
        prev = by_url.get(u)
        if prev is None:
            by_url[u] = e
        else:
            score_prev = sum(1 for v in prev.values() if v)
            score_new = sum(1 for v in e.values() if v)
            if score_new > score_prev:
                by_url[u] = e

    out = list(by_url.values())
    if max_events is not None:
        out = out[:max_events]
    return out


def scrape_event_detail(event_url: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Returns: (full_event_title, ticket_price_total, age_restrictions, duration)

    ticket_price_total is base ticket + fee (cheapest available base ticket), formatted "31.94".
    """
    html = fetch(event_url)
    soup = BeautifulSoup(html, "html.parser")

    # Full title: first H1 if present, else title tag
    h1 = soup.find("h1")
    full_title = " ".join(h1.get_text(" ", strip=True).split()) if h1 else None
    if not full_title:
        t = soup.find("title")
        full_title = " ".join(t.get_text(" ", strip=True).split()) if t else None

    # Work line-by-line for better context
    lines = [ln.strip() for ln in soup.get_text("\n", strip=True).split("\n") if ln.strip()]

    # --- Ticket price total (base + fee) ---
    # Base price candidates: lines that look like ticket types and do NOT contain "fee"
    base_keywords = ("general", "admission", "vip", "ticket")
    base_candidates: List[float] = []
    fee_candidates: List[float] = []

    for ln in lines:
        ln_l = ln.lower()

        amounts = [float(x) for x in PRICE_RE.findall(ln)]
        if not amounts:
            continue

        if "fee" in ln_l:
            # Fee line (service fee, processing fee, etc.)
            fee_candidates.extend(amounts)
            continue

        # Ticket-type line (avoid grabbing random $ values like drink minimums if present)
        if any(k in ln_l for k in base_keywords):
            base_candidates.extend(amounts)

    # If we didn't find base candidates via keywords, fall back to "all $ amounts that aren't on fee lines"
    if not base_candidates:
        for ln in lines:
            ln_l = ln.lower()
            if "fee" in ln_l:
                continue
            base_candidates.extend([float(x) for x in PRICE_RE.findall(ln)])

    ticket_price_total: Optional[str] = None
    if base_candidates:
        base = min(base_candidates)  # cheapest base ticket
        fee = min(fee_candidates) if fee_candidates else 0.0  # usually one fee; if multiple, take smallest
        ticket_price_total = f"{(base + fee):.2f}"

    # --- Age restriction ---
    text_all = soup.get_text("\n", strip=True)
    age_m = AGE_RE.search(text_all)
    age = age_m.group(1) if age_m else None

    # --- Duration ---
    dur_m = DURATION_RE.search(text_all)
    duration = dur_m.group(1).strip() if dur_m else None

    return full_title, ticket_price_total, age, duration



def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=CAL_URL_DEFAULT)
    ap.add_argument("--out", default="nycc_calendar.json")
    ap.add_argument("--max-events", type=int, default=None)
    ap.add_argument("--sleep", type=float, default=0.0, help="Delay between detail page requests (seconds)")
    args = ap.parse_args()

    cal_html = fetch(args.url)
    cal_events = find_calendar_events(cal_html, args.url, args.max_events)

    out: List[EventOut] = []
    for e in cal_events:
        full_title, price, age, duration = scrape_event_detail(e["ticket_link"])

        out.append(EventOut(
            date=e.get("date"),
            weekday=e.get("weekday"),
            start_time=e.get("start_time"),
            date_iso=e.get("date_iso"),
            start_local_iso=e.get("start_local_iso"),
            location=e.get("location"),
            title=e.get("title"),
            description_snippet=e.get("description_snippet"),
            ticket_link=e["ticket_link"],
            full_event_title=full_title,
            ticket_price=price,
            age_restrictions=age,
            duration=duration,
        ))

        if args.sleep:
            import time
            time.sleep(args.sleep)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump([asdict(x) for x in out], f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(out)} events to {args.out}")


if __name__ == "__main__":
    main()
