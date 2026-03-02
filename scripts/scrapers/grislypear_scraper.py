#!/usr/bin/env python3
"""
Scrape Grisly Pear calendar into JSON.

Calendar: https://www.grislypearstandup.com/calendar
Event detail examples:
- usable: https://www.grislypearstandup.com/events/comedy-show-at-the-grisly-pear-greenwich-village-01-27-26-08-00-pm
- NOT usable (skip detail extraction): https://www.grislypearstandup.com/events/lectures-on-tap-the-hidden-score-of-the-universe-a-cosmic-rhythm-explored-01-27-26-06-30-pm

Output fields per event (same as NYCC set):
- date
- weekday
- start_time
- date_iso
- start_local_iso
- location  (mapped address string for known venues; else original venue label)
- title
- description_snippet
- ticket_link
- full_event_title
- ticket_price  (best-effort; if fees shown separately, returns base+fee total for cheapest)
- age_restrictions (if present)
- duration (if present)

Usage:
  python scrape_grislypear_calendar.py
  python scrape_grislypear_calendar.py --out grislypear_calendar.json
  python scrape_grislypear_calendar.py --max-events 50
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


BASE_URL = "https://www.grislypearstandup.com"
CAL_URL_DEFAULT = f"{BASE_URL}/calendar"
TIMEZONE = "America/New_York"

# Venue label (as shown on calendar) -> address string
VENUE_TO_ADDRESS = {
    "Greenwich Village": "107 MacDougal St New York, NY 10012",
    "Midtown": "243 W 54th St New York, NY 10019",
}

WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

# Calendar line example: "Friday 01/30 08:00PM"
CAL_LINE_RE = re.compile(
    rf"^(?P<weekday>{'|'.join(WEEKDAYS)})\s+"
    rf"(?P<month>\d{{2}})/(?P<day>\d{{2}})\s+"
    rf"(?P<time>\d{{1,2}}:\d{{2}}[AP]M)\s*$",
    re.IGNORECASE,
)

YEAR_RE = re.compile(r"\b(20\d{2})\b")

EVENT_PATH_RE = re.compile(r"^/events/.+", re.IGNORECASE)

PRICE_RE = re.compile(r"\$(\d+(?:\.\d{2})?)", re.IGNORECASE)
AGE_RE = re.compile(r"\b(?:Ages?|Age)\s*(\d{1,2}\+?)\b", re.IGNORECASE)
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
        "User-Agent": "Mozilla/5.0 (compatible; grislypear-scraper/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.text


def parse_time_to_24h(time_str: str) -> Tuple[int, int]:
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
    return hh, mm


def normalize_datetime(year: int, month: int, day: int, time_str: str) -> Tuple[str, str]:
    hh, mm = parse_time_to_24h(time_str)
    dt = datetime(year, month, day, hh, mm)
    if dateutil_tz is not None:
        tzinfo = dateutil_tz.gettz(TIMEZONE)
        if tzinfo is not None:
            dt = dt.replace(tzinfo=tzinfo)
    return dt.date().isoformat(), dt.isoformat()


def extract_year_from_calendar(soup: BeautifulSoup) -> Optional[int]:
    # The calendar page title/header typically includes the year (e.g., "January 2026")
    text = soup.get_text("\n", strip=True)
    years = [int(y) for y in YEAR_RE.findall(text)]
    if not years:
        return None
    # Heuristic: most common year on page
    freq: Dict[int, int] = {}
    for y in years:
        freq[y] = freq.get(y, 0) + 1
    return max(freq.items(), key=lambda kv: kv[1])[0]


def is_buy_tickets_anchor(a) -> bool:
    if not a or not a.has_attr("href"):
        return False
    href = a["href"].strip()
    if not EVENT_PATH_RE.match(href):
        return False
    txt = " ".join(a.get_text(" ", strip=True).split()).lower()
    return "buy tickets" in txt or txt == "buy" or txt == "tickets"


def parse_calendar_events(calendar_html: str, calendar_url: str, max_events: Optional[int]) -> List[Dict]:
    soup = BeautifulSoup(calendar_html, "html.parser")
    year = extract_year_from_calendar(soup)

    events: List[Dict] = []

    # Grisly Pear calendar renders each event as a small block with bullet-like lines and a "Buy Tickets" link.
    # Strategy: find each "Buy Tickets" link, then read nearby text within the same parent block.
    for a in soup.find_all("a", href=True):
        if not is_buy_tickets_anchor(a):
            continue

        ticket_link = urljoin(calendar_url, a["href"].strip())

        # Find a reasonable container around this link
        container = a.find_parent(["div", "section", "article", "li", "ul"])
        if not container:
            continue

        # Collect lines of text from the container (excluding the Buy Tickets text itself where possible)
        lines = []
        for ln in container.get_text("\n", strip=True).split("\n"):
            ln = " ".join(ln.split()).strip()
            if not ln:
                continue
            if ln.lower() == "buy tickets":
                continue
            lines.append(ln)

        # We expect the first few lines to include:
        #  - "Friday 01/30 08:00PM"
        #  - "Greenwich Village" or "Midtown"
        #  - title
        #  - description snippet
        date = weekday = start_time = date_iso = start_local_iso = None
        venue_label = None
        title = None
        desc = None

        # Find the date line
        date_line_idx = None
        for i, ln in enumerate(lines):
            if CAL_LINE_RE.match(ln):
                date_line_idx = i
                break

        if date_line_idx is not None:
            m = CAL_LINE_RE.match(lines[date_line_idx])
            assert m is not None
            weekday = m.group("weekday").capitalize()
            month = int(m.group("month"))
            day = int(m.group("day"))
            start_time = m.group("time").upper()
            date = f"{weekday} {month:02d}/{day:02d}"

            if year is not None:
                try:
                    date_iso, start_local_iso = normalize_datetime(year, month, day, start_time)
                except Exception:
                    date_iso, start_local_iso = None, None

            # Next non-empty line is usually venue label
            if date_line_idx + 1 < len(lines):
                venue_label = lines[date_line_idx + 1]

            # Next is usually title
            if date_line_idx + 2 < len(lines):
                title = lines[date_line_idx + 2]

            # Next is description snippet (if present)
            if date_line_idx + 3 < len(lines):
                desc = lines[date_line_idx + 3]
        else:
            # Fallback: try simple positional assumptions
            if len(lines) >= 1:
                title = lines[0]
            if len(lines) >= 2:
                desc = lines[1]

        location = VENUE_TO_ADDRESS.get(venue_label, venue_label)

        events.append(
            {
                "ticket_link": ticket_link,
                "date": date,
                "weekday": weekday,
                "start_time": start_time,
                "date_iso": date_iso,
                "start_local_iso": start_local_iso,
                "location": location,
                "title": title,
                "description_snippet": desc,
            }
        )

        if max_events is not None and len(events) >= max_events:
            break

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

    return list(by_url.values())


def detail_page_has_usable_ticketing(soup: BeautifulSoup) -> bool:
    """
    Heuristic to decide whether to scrape detail fields.
    Pages like "Lectures on Tap ..." can be mostly placeholder / non-ticketed.
    We only proceed if there's evidence of ticketing/pricing.
    """
    text = soup.get_text("\n", strip=True).lower()

    # Strong signals
    if "buy tickets" in text:
        return True
    if "tickets" in text and PRICE_RE.search(text):
        return True

    # JSON-LD Event with offers
    for s in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(s.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if isinstance(it, dict) and (it.get("@type") == "Event" or "Event" in str(it.get("@type"))):
                offers = it.get("offers")
                if isinstance(offers, dict) and offers.get("price"):
                    return True
                if isinstance(offers, list) and any(isinstance(o, dict) and o.get("price") for o in offers):
                    return True

    return False


def extract_purchase_tickets_block_text(soup: BeautifulSoup) -> str:
    """
    Returns the text in/near the 'Purchase Tickets' section.
    Works with pages where the section appears as an <h4> / <h3> / etc.
    """
    # Find a header containing "Purchase Tickets"
    header = None
    for tag in soup.find_all(["h1","h2","h3","h4","h5","h6"]):
        if "purchase tickets" in tag.get_text(" ", strip=True).lower():
            header = tag
            break

    if not header:
        return ""

    # Collect text from subsequent siblings until we hit another major section.
    parts: List[str] = []
    for sib in header.find_all_next():
        if sib.name in ["h1","h2","h3","h4","h5","h6"]:
            # stop at next header section
            break
        txt = sib.get_text(" ", strip=True)
        if txt:
            parts.append(txt)

    return "\n".join(parts)


def parse_ticket_price_total_from_purchase_block(block_text: str) -> Optional[str]:
    """
    Looks for a base ticket price + an added fee in the Purchase Tickets block.
    Returns base+fee for the cheapest base ticket as a string like "12.37".
    Returns None if the block has no base price (e.g., Eventbrite outbound pages).
    """
    if not block_text:
        return None

    lines = [ln.strip() for ln in block_text.splitlines() if ln.strip()]
    base_candidates: List[float] = []
    fee_candidates: List[float] = []

    for ln in lines:
        ln_l = ln.lower()
        amounts = [float(x) for x in PRICE_RE.findall(ln)]
        if not amounts:
            continue

        # Fee line
        if "fee" in ln_l:
            fee_candidates.extend(amounts)
            continue

        # Base ticket lines usually include "general admission", "admission", "vip", etc.
        if any(k in ln_l for k in ["general", "admission", "vip", "ticket"]):
            base_candidates.extend(amounts)

    if not base_candidates:
        return None

    base = min(base_candidates)
    fee = min(fee_candidates) if fee_candidates else 0.0
    return f"{(base + fee):.2f}"


def scrape_event_detail(event_url: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    html = fetch(event_url)
    soup = BeautifulSoup(html, "html.parser")

    # Title
    h1 = soup.find("h1")
    full_title = " ".join(h1.get_text(" ", strip=True).split()) if h1 else None
    if not full_title:
        t = soup.find("title")
        full_title = " ".join(t.get_text(" ", strip=True).split()) if t else None

    # Purchase Tickets block parsing
    purchase_block = extract_purchase_tickets_block_text(soup)
    ticket_price_total = parse_ticket_price_total_from_purchase_block(purchase_block)

    # Skip pages that have no usable internal ticket pricing (e.g., Eventbrite outbound)
    # (This matches your “Lectures on Tap” rule.)
    if ticket_price_total is None:
        return full_title, None, None, None

    # Age restrictions + duration (best-effort; keep as you already had)
    text_all = soup.get_text("\n", strip=True)

    age_m = AGE_RE.search(text_all)
    age = age_m.group(1) if age_m else None

    dur_m = DURATION_RE.search(text_all)
    duration = dur_m.group(1).strip() if dur_m else None

    return full_title, ticket_price_total, age, duration


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=CAL_URL_DEFAULT, help="Calendar URL")
    ap.add_argument("--out", default="grislypear_calendar.json", help="Output JSON file")
    ap.add_argument("--max-events", type=int, default=None, help="Limit events (useful for testing)")
    ap.add_argument("--sleep", type=float, default=0.0, help="Delay between detail-page requests (seconds)")
    args = ap.parse_args()

    cal_html = fetch(args.url)
    cal_events = parse_calendar_events(cal_html, args.url, args.max_events)

    out: List[EventOut] = []
    for e in cal_events:
        full_title, price, age, duration = scrape_event_detail(e["ticket_link"])

        out.append(
            EventOut(
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
            )
        )

        if args.sleep:
            import time
            time.sleep(args.sleep)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump([asdict(x) for x in out], f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(out)} events to {args.out}")


if __name__ == "__main__":
    main()
