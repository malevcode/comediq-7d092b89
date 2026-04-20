#!/usr/bin/env python3
"""
Ingest Austin open mic data into open_mics_historical in Supabase.

Reads one or more JSON files produced by the Austin scrapers and upserts
them into the same open_mics_historical table used for NYC mics.
Austin rows are distinguished by city = 'Austin, TX'.

Required env vars:
  SUPABASE_URL               (or NEXT_PUBLIC_SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY

Typical workflow:
  1. Run one or more scrapers to produce JSON files:
       python scripts/scrapers/austin/cap_city_scraper.py --out /tmp/cap_city.json
       python scripts/scrapers/austin/creek_cave_scraper.py --out /tmp/creek_cave.json
       python scripts/scrapers/austin/austin_txcomedy_scraper.py --input raw.json --out /tmp/tx.json

  2. Ingest all files at once:
       python scripts/ingest/ingest_austin_to_supabase.py /tmp/cap_city.json /tmp/creek_cave.json /tmp/tx.json

  3. Run the Supabase → Sheets exporter to build the Austin sheet:
       python scripts/export/supabase_to_sheets.py  (set GOOGLE_SHEET_TITLE='Austin Open Mics – Master')

Usage:
  python scripts/ingest/ingest_austin_to_supabase.py <file1.json> [file2.json ...]
  python scripts/ingest/ingest_austin_to_supabase.py --dir /tmp/austin_json/
"""

from __future__ import annotations

import argparse
import json
import os
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

TABLE = "open_mics_historical"
CITY = "Austin, TX"

# ---------------------------------------------------------------------------
# Field normalisation
# ---------------------------------------------------------------------------

DAY_ALIASES: Dict[str, str] = {
    "mon": "Monday", "tue": "Tuesday", "tues": "Tuesday",
    "wed": "Wednesday", "thu": "Thursday", "thur": "Thursday", "thurs": "Thursday",
    "fri": "Friday", "sat": "Saturday", "sun": "Sunday",
}

VALID_DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}


def normalise_day(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    raw = raw.strip().rstrip("s")  # remove trailing 's' (Wednesdays → Wednesday)
    cap = raw.capitalize()
    if cap in VALID_DAYS:
        return cap
    return DAY_ALIASES.get(raw.lower())


def normalise_time(raw: Optional[str]) -> Optional[str]:
    """Convert '9pm', '9:00pm', '21:00' to '9:00 PM' style."""
    if not raw:
        return None
    raw = raw.strip()
    # Already formatted
    if re.match(r"^\d{1,2}:\d{2}\s*(AM|PM)$", raw, re.IGNORECASE):
        return raw.upper()
    # "9pm" or "9 pm"
    m = re.match(r"^(\d{1,2})\s*(am|pm)$", raw, re.IGNORECASE)
    if m:
        return f"{m.group(1)}:00 {m.group(2).upper()}"
    # "9:30pm"
    m = re.match(r"^(\d{1,2}:\d{2})\s*(am|pm)$", raw, re.IGNORECASE)
    if m:
        return f"{m.group(1)} {m.group(2).upper()}"
    # 24-hour "21:00"
    m = re.match(r"^(\d{2}):(\d{2})$", raw)
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        suffix = "AM" if h < 12 else "PM"
        h12 = h % 12 or 12
        return f"{h12}:{mi:02d} {suffix}"
    return raw  # return as-is if unparseable


def scraper_row_to_db(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Map a scraper output dict to an open_mics_historical row.
    Returns None if essential fields are missing.
    """
    open_mic_name = (
        raw.get("open_mic")
        or raw.get("name")
        or raw.get("title")
        or ""
    ).strip()

    if not open_mic_name:
        return None

    venue_name = (raw.get("venue_name") or raw.get("venue") or "").strip() or None
    location = (raw.get("location") or raw.get("address") or "").strip() or None

    # Ensure city is always Austin, TX
    city = CITY

    day = normalise_day(raw.get("day"))
    start_time = normalise_time(raw.get("start_time"))
    cost = (raw.get("cost") or "").strip() or None
    sign_up_instructions = (raw.get("sign_up_instructions") or raw.get("signup") or "").strip() or None
    hosts_organizers = (raw.get("hosts_organizers") or raw.get("hosts") or "").strip() or None
    changes_updates = (raw.get("notes") or raw.get("changes_updates") or "").strip() or None

    return {
        "unique_identifier": str(uuid.uuid4()),  # new UUID; upsert uses open_mic+city+day
        "open_mic": open_mic_name,
        "venue_name": venue_name,
        "location": location,
        "city": city,
        "borough": None,         # not applicable for Austin
        "neighborhood": None,
        "day": day,
        "start_time": start_time,
        "cost": cost,
        "sign_up_instructions": sign_up_instructions,
        "hosts_organizers": hosts_organizers,
        "changes_updates": changes_updates,
        "active": True,
        "status": "trial",       # new submissions start as trial until verified
        "frequency": "weekly",
        "venue_type": raw.get("venue_type") or None,
        "submission_date": None,  # auto-defaulted by DB
    }


# ---------------------------------------------------------------------------
# Supabase upsert
# ---------------------------------------------------------------------------

def supabase_upsert(rows: List[Dict[str, Any]], *, url: str, service_key: str) -> None:
    if not rows:
        print("No rows to upsert.")
        return

    endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        # Merge on open_mic + city + day to avoid duplicates across re-runs.
        # Falls back to inserting new rows if the combo doesn't match.
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    # Note: the table has unique_identifier as PK. Since we generate a new
    # UUID each run we use open_mic+city+day as the natural dedup key.
    params = {"on_conflict": "open_mic,city,day"}

    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        r = requests.post(
            endpoint,
            headers=headers,
            params=params,
            data=json.dumps(batch),
            timeout=60,
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Upsert failed ({r.status_code}): {r.text[:500]}")

    print(f"Upserted {len(rows)} Austin open mic rows into {TABLE}.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_json(path: Path) -> List[Dict[str, Any]]:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        return [data]
    return [r for r in data if isinstance(r, dict)]


def main() -> None:
    ap = argparse.ArgumentParser(description="Ingest Austin open mics into Supabase")
    ap.add_argument("files", nargs="*", help="JSON files produced by Austin scrapers")
    ap.add_argument("--dir", help="Directory of JSON files to ingest")
    ap.add_argument("--dry-run", action="store_true", help="Print rows without upserting")
    args = ap.parse_args()

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not args.dry_run:
        if not supabase_url:
            raise SystemExit("Missing SUPABASE_URL env var")
        if not service_key:
            raise SystemExit("Missing SUPABASE_SERVICE_ROLE_KEY env var")

    # Collect input files
    input_paths: List[Path] = [Path(f) for f in args.files]
    if args.dir:
        input_paths.extend(Path(args.dir).glob("*.json"))

    if not input_paths:
        raise SystemExit("No input files provided. Pass JSON files as arguments or use --dir.")

    # Load + normalise
    all_raw: List[Dict[str, Any]] = []
    for path in input_paths:
        print(f"Loading {path} …")
        all_raw.extend(load_json(path))

    print(f"Total raw records: {len(all_raw)}")

    rows: List[Dict[str, Any]] = []
    skipped = 0
    for raw in all_raw:
        row = scraper_row_to_db(raw)
        if row:
            rows.append(row)
        else:
            skipped += 1

    print(f"  → {len(rows)} valid rows, {skipped} skipped (missing name)")

    # Dedup by (open_mic, city, day)
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for r in rows:
        key = (r["open_mic"].lower(), r["city"], r.get("day"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    print(f"  → {len(deduped)} after dedup")

    if args.dry_run:
        print("\nDRY RUN – sample output (first 5 rows):")
        for r in deduped[:5]:
            print(json.dumps(r, indent=2))
        return

    supabase_upsert(deduped, url=supabase_url, service_key=service_key)
    print("Done.")


if __name__ == "__main__":
    main()
