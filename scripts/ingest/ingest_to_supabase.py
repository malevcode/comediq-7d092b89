#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

import requests

# ------------------------
# Config
# ------------------------
TABLE = "audience_shows"

HERE = Path(__file__).resolve()
REPO_ROOT = HERE.parents[2]          # scripts/ingest/ -> scripts -> repo root
SCRAPERS_DIR = REPO_ROOT / "scripts" / "scrapers"

SOURCE_SCRIPTS = [
    ("nycc", str(SCRAPERS_DIR / "NYCC_scraper.py"), "nycc_calendar.json"),
    ("grislypear", str(SCRAPERS_DIR / "grislypear_scraper.py"), "grislypear_calendar.json"),
    ("stmarks", str(SCRAPERS_DIR / "stmarksCC_scraper.py"), "stmarks_calendar.json"),
]

# Venue naming for your DB (edit to taste)
DEFAULT_VENUE_NAME = {
    "nycc": "New York Comedy Club",
    "grislypear": "Grisly Pear",
    "stmarks": "St. Marks Comedy Club",
}

# Optional: refine by address/label if you want
def infer_venue_name(source: str, ev: Dict[str, Any]) -> str:
    return DEFAULT_VENUE_NAME.get(source, source)

# Optional: borough mapping if you want to populate borough column
def infer_borough(address_or_label: Optional[str]) -> Optional[str]:
    if not address_or_label:
        return None
    s = address_or_label.lower()
    if "new york, ny" in s or "manhattan" in s or "st marks" in s or "macdougal" in s or "w 54" in s or "w 78" in s or "east 4th" in s or "east 24" in s:
        return "Manhattan"
    return None

# ------------------------
# Time helpers
# ------------------------
TIME_12H_RE = re.compile(r"^(?P<h>\d{1,2}):(?P<m>\d{2})(?P<ap>AM|PM)$", re.IGNORECASE)

def ampm_to_24h_hms(t: str) -> Optional[str]:
    """
    Convert '06:30PM' -> '18:30:00'
    Accepts '6:30PM' also.
    """
    if not t:
        return None
    t = t.strip().upper()
    m = TIME_12H_RE.match(t)
    if not m:
        return None
    hh = int(m.group("h"))
    mm = int(m.group("m"))
    ap = m.group("ap").upper()
    if ap == "PM" and hh != 12:
        hh += 12
    if ap == "AM" and hh == 12:
        hh = 0
    return f"{hh:02d}:{mm:02d}:00"

def iso_to_date_time(iso_str: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract date + time from ISO string.
    Returns ('YYYY-MM-DD', 'HH:MM:SS').
    """
    try:
        # Handles '2026-03-02T19:30:00-05:00' or without TZ
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.date().isoformat(), dt.time().replace(microsecond=0).isoformat()
    except Exception:
        return None, None

# ------------------------
# Supabase upsert (PostgREST)
# ------------------------
def supabase_upsert(rows: List[Dict[str, Any]], *, url: str, service_key: str) -> None:
    if not rows:
        return

    endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        # merge duplicates means UPDATE on conflict
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    # PostgREST upsert via on_conflict query parameter
    params = {"on_conflict": "source,source_event_id"}

    # Batch to avoid request limits
    batch_size = 200
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        r = requests.post(endpoint, headers=headers, params=params, data=json.dumps(batch), timeout=60)
        if r.status_code >= 400:
            raise RuntimeError(f"Upsert failed ({r.status_code}): {r.text}")

# ------------------------
# Scraper execution
# ------------------------
def run_scraper(script_path: str, out_path: str) -> None:
    # Each scraper supports --out (NYCC/grislypear do; stmarks version above does)
    cmd = [sys.executable, script_path, "--out", out_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Scraper failed: {script_path}\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}")

def load_events(json_path: str) -> List[Dict[str, Any]]:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        return []
    return [x for x in data if isinstance(x, dict)]

# ------------------------
# Normalization into DB rows
# ------------------------
def event_to_db_row(source: str, ev: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    ticket_link = ev.get("ticket_link")
    if not ticket_link or not isinstance(ticket_link, str):
        return None

    # date + time
    date_iso = ev.get("date_iso")
    start_local_iso = ev.get("start_local_iso")
    show_date = None
    show_time = None

    if isinstance(start_local_iso, str) and start_local_iso:
        show_date, show_time = iso_to_date_time(start_local_iso)

    if not show_date and isinstance(date_iso, str) and date_iso:
        show_date = date_iso

    if not show_time:
        st = ev.get("start_time")
        if isinstance(st, str) and st:
            show_time = ampm_to_24h_hms(st)

    # Require at least date
    if not show_date:
        return None
    if not show_time:
        # If time missing, set to midnight to keep row insertable; you can tighten this later.
        show_time = "00:00:00"

    title = ev.get("title") or ev.get("full_event_title") or ""
    if not isinstance(title, str) or not title.strip():
        return None

    location = ev.get("location")
    if location is not None and not isinstance(location, str):
        location = None

    description = ev.get("description_snippet")
    if description is not None and not isinstance(description, str):
        description = None

    ticket_price = ev.get("ticket_price")
    if ticket_price is not None and not isinstance(ticket_price, str):
        ticket_price = str(ticket_price)

    age_restriction = ev.get("age_restrictions")
    if age_restriction is not None and not isinstance(age_restriction, str):
        age_restriction = str(age_restriction)

    venue_name = infer_venue_name(source, ev)
    borough = infer_borough(location)

    row: Dict[str, Any] = {
        "source": source,
        "source_event_id": ticket_link,  # stable unique id per source
        "title": title.strip(),
        "description": description,
        "show_date": show_date,
        "show_time": show_time,
        "venue_name": venue_name,
        "venue_address": location,
        "borough": borough,
        # write both link columns; harmless if one is unused in UI
        "ticket_url": ticket_link,
        "external_ticket_url": ticket_link,
        "ticket_price": ticket_price,
        "age_restriction": age_restriction,
        "verified": True,
        "is_active": True,
        "is_recurring": False,
    }
    return row

def main() -> None:
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise SystemExit("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in env.")

    rows: List[Dict[str, Any]] = []

    with tempfile.TemporaryDirectory() as td:
        for source, script, out_name in SOURCE_SCRIPTS:
            out_path = os.path.join(td, out_name)
            run_scraper(script, out_path)
            events = load_events(out_path)
            for ev in events:
                row = event_to_db_row(source, ev)
                if row:
                    rows.append(row)

    # Dedup locally by (source, source_event_id) to reduce payload
    seen = set()
    deduped: List[Dict[str, Any]] = []
    for r in rows:
        k = (r["source"], r["source_event_id"])
        if k in seen:
            continue
        seen.add(k)
        deduped.append(r)

    print(f"Prepared {len(deduped)} rows for upsert.")
    supabase_upsert(deduped, url=supabase_url, service_key=service_key)
    print("Upsert complete.")

if __name__ == "__main__":
    main()