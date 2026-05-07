"""
Ingest Austin open mic data from austin_mics.csv into the open_mics_historical table.

Usage:
    SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... python ingest_austin_mics.py

Requires: pip install supabase python-dotenv
"""

import csv
import os
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone

try:
    from supabase import create_client, Client
except ImportError:
    print("Missing dependency: pip install supabase")
    sys.exit(1)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

CSV_PATH = Path(__file__).parent.parent / "austin_mics.csv"

# Valid enum values from the DB schema
VALID_STATUS = {"trial", "verified", "pending"}
VALID_FREQUENCY = {
    "weekly", "bi_weekly", "1st_of_month", "2nd_of_month",
    "3rd_of_month", "4th_of_month", "last_of_month", "one_off"
}
VALID_SIGNUP_METHOD = {"in_person", "online", "comediq_direct", "other"}


def coerce_bool(val: str) -> bool:
    return val.strip().lower() in ("true", "1", "yes")


def clean(val: str) -> str | None:
    v = val.strip()
    return v if v else None


def build_row(row: dict) -> dict:
    status = row.get("status", "pending").strip()
    if status not in VALID_STATUS:
        status = "pending"

    frequency = row.get("frequency", "weekly").strip()
    if frequency not in VALID_FREQUENCY:
        frequency = "weekly"

    signup_method = row.get("signup_method", "in_person").strip()
    if signup_method not in VALID_SIGNUP_METHOD:
        signup_method = "other"

    active_str = row.get("active", "true")
    active = coerce_bool(active_str)

    # Merge instagram handle into hosts_organizers if present and not already there
    hosts = clean(row.get("hosts_organizers", "")) or ""
    ig = clean(row.get("instagram_handle", "")) or ""
    if ig and ig not in hosts:
        hosts = f"{hosts}, {ig}".strip(", ") if hosts else ig

    return {
        "unique_identifier": str(uuid.uuid4()),
        "open_mic": clean(row["open_mic"]),
        "day": clean(row.get("day")),
        "start_time": clean(row.get("start_time")),
        "venue_name": clean(row.get("venue_name")),
        "location": clean(row.get("location")),
        "neighborhood": clean(row.get("neighborhood")),
        "borough": clean(row.get("neighborhood")),  # Austin has no boroughs; reuse neighborhood
        "city": clean(row.get("city")) or "Austin",
        "cost": clean(row.get("cost")) or "Free",
        "stage_time": clean(row.get("stage_time")),
        "sign_up_instructions": clean(row.get("sign_up_instructions")),
        "hosts_organizers": hosts or None,
        "other_rules": clean(row.get("other_rules")),
        "changes_updates": clean(row.get("changes_updates")),
        "active": active,
        "status": status,
        "frequency": frequency,
        "signup_method": signup_method,
        "submission_date": datetime.now(timezone.utc).isoformat(),
        "last_verified": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "verification_count": 0,
    }


def existing_mic_keys(city: str) -> set[tuple]:
    """Return (lower open_mic, lower day) tuples already in the table for this city."""
    resp = (
        supabase.table("open_mics_historical")
        .select("open_mic, day")
        .eq("city", city)
        .execute()
    )
    return {
        (r["open_mic"].lower().strip(), (r["day"] or "").lower().strip())
        for r in (resp.data or [])
    }


def main():
    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH}")
        sys.exit(1)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Loaded {len(rows)} rows from CSV")

    # Fetch existing mics for Austin and San Marcos to avoid duplicates
    existing_austin = existing_mic_keys("Austin")
    existing_smtx = existing_mic_keys("San Marcos")
    existing = existing_austin | existing_smtx
    print(f"Found {len(existing)} existing Austin/San Marcos mics in DB")

    to_insert = []
    skipped = []

    for row in rows:
        mic_name = clean(row.get("open_mic", ""))
        day = clean(row.get("day", "")) or ""
        if not mic_name:
            continue

        key = (mic_name.lower(), day.lower())
        if key in existing:
            skipped.append(f"{mic_name} ({day})")
            continue

        to_insert.append(build_row(row))

    print(f"\nSkipping {len(skipped)} already-existing mics:")
    for s in skipped:
        print(f"  - {s}")

    print(f"\nInserting {len(to_insert)} new mics:")
    for r in to_insert:
        print(f"  + {r['open_mic']} ({r.get('day', 'no day')}) — {r.get('city')}")

    if not to_insert:
        print("\nNothing to insert.")
        return

    confirm = input(f"\nProceed with inserting {len(to_insert)} records? [y/N] ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    # Insert in batches of 20
    batch_size = 20
    inserted = 0
    errors = []

    for i in range(0, len(to_insert), batch_size):
        batch = to_insert[i : i + batch_size]
        try:
            resp = supabase.table("open_mics_historical").insert(batch).execute()
            inserted += len(resp.data or batch)
            print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} rows)")
        except Exception as e:
            errors.append(str(e))
            print(f"  ERROR on batch {i // batch_size + 1}: {e}")

    print(f"\nDone. Inserted {inserted} records.")
    if errors:
        print(f"Errors ({len(errors)}):")
        for e in errors:
            print(f"  {e}")


if __name__ == "__main__":
    main()
