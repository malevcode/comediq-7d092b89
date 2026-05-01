#!/usr/bin/env python3
"""
Import a CSV file into a PocketBase collection via the Admin API.

Usage:
    python scripts/import_to_pocketbase.py \
        --url https://comediq-pb.fly.dev \
        --email admin@example.com \
        --password yourpassword \
        --collection open_mics_historical \
        --csv path/to/export.csv

Import order that avoids FK issues:
    1. open_mics_historical
    2. venue_sources
    3. profiles   (needs email column — see pb_migrations/002_link_users_by_email.js)
    4. Everything else

Notes:
    - Rows that violate a UNIQUE index are skipped (upsert not supported via CSV).
    - Boolean columns: "true"/"1"/"yes" → true, anything else → false.
    - Empty strings are sent as null for number/bool/date/url/email columns.
    - Rate-limit: 20 requests/sec by default; adjust --batch-delay if needed.
"""

import argparse
import csv
import json
import sys
import time
from typing import Any

import requests

BOOL_TRUE = {"true", "1", "yes", "t"}

# Columns that should be sent as null when empty rather than as ""
NULLABLE_TYPES = {"number", "bool", "date", "url", "email", "json"}

# Known column types for the main collections (used for coercion).
# Anything not listed is treated as text and sent as-is.
COLUMN_TYPES: dict[str, dict[str, str]] = {
    "open_mics_historical": {
        "active": "bool",
        "signup_enabled": "bool",
        "slots_enabled": "bool",
        "verification_count": "number",
        "price_per_slot": "number",
        "slot_duration_minutes": "number",
        "last_verified": "date",
        "submission_date": "date",
        "signup_url": "url",
        "cover_image_url": "url",
    },
    "audience_shows": {
        "price_cents": "number",
        "is_paid": "bool",
        "allows_rsvp": "bool",
        "is_featured": "bool",
        "is_active": "bool",
        "verified": "bool",
        "is_recurring": "bool",
        "is_independently_produced": "bool",
        "showtn_eligible": "bool",
        "showtn_discount_value": "number",
        "expected_audience": "number",
        "rsvp_count": "number",
    },
    "profiles": {
        "isadmin": "bool",
        "points_balance": "number",
        "years_performing": "number",
        "email": "email",
    },
    "banner_ads": {
        "is_active": "bool",
        "external": "bool",
        "sort_order": "number",
        "amount_paid": "number",
        "start_date": "date",
        "end_date": "date",
        "href": "url",
        "icon_url": "url",
    },
    "growth_opportunities": {
        "is_active": "bool",
        "is_featured": "bool",
        "date": "date",
        "external_url": "url",
        "image_url": "url",
    },
}


def coerce(value: str, col_type: str) -> Any:
    if value == "" or value is None:
        if col_type in NULLABLE_TYPES:
            return None
        return value
    if col_type == "bool":
        return value.strip().lower() in BOOL_TRUE
    if col_type == "number":
        try:
            return int(value) if "." not in value else float(value)
        except ValueError:
            return None
    return value.strip() or None if col_type in NULLABLE_TYPES else value


def authenticate(base_url: str, email: str, password: str) -> str:
    resp = requests.post(
        f"{base_url}/api/admins/auth-with-password",
        json={"identity": email, "password": password},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def import_csv(
    base_url: str,
    token: str,
    collection: str,
    csv_path: str,
    batch_delay: float,
    dry_run: bool,
) -> None:
    col_types = COLUMN_TYPES.get(collection, {})
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    url = f"{base_url}/api/collections/{collection}/records"

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Importing {len(rows)} rows into '{collection}' from '{csv_path}'")
    if dry_run:
        print("[dry-run] First row preview:")
        if rows:
            print(json.dumps(rows[0], indent=2))
        return

    ok = skip = err = 0
    for i, row in enumerate(rows, 1):
        payload = {
            k: coerce(v, col_types.get(k, "text"))
            for k, v in row.items()
            if k  # skip blank header columns
        }
        # Drop the Supabase auto-generated id column — PocketBase assigns its own
        payload.pop("id", None)

        resp = requests.post(url, json=payload, headers=headers, timeout=15)

        if resp.status_code == 200:
            ok += 1
        elif resp.status_code == 400 and "unique" in resp.text.lower():
            skip += 1
        else:
            err += 1
            print(f"  Row {i} error {resp.status_code}: {resp.text[:200]}")

        if i % 50 == 0:
            print(f"  {i}/{len(rows)} processed (ok={ok} skip={skip} err={err})")
            time.sleep(batch_delay)

    print(f"Done: {ok} inserted, {skip} skipped (duplicate), {err} errors")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import CSV into PocketBase")
    parser.add_argument("--url", default="https://comediq-pb.fly.dev")
    parser.add_argument("--email", required=True, help="PocketBase admin email")
    parser.add_argument("--password", required=True, help="PocketBase admin password")
    parser.add_argument("--collection", required=True)
    parser.add_argument("--csv", required=True, dest="csv_path")
    parser.add_argument("--batch-delay", type=float, default=0.05,
                        help="Seconds to pause every 50 rows (default 0.05)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse CSV and print first row without inserting")
    args = parser.parse_args()

    try:
        token = authenticate(args.url, args.email, args.password)
    except requests.HTTPError as e:
        print(f"Auth failed: {e}", file=sys.stderr)
        sys.exit(1)

    import_csv(args.url, token, args.collection, args.csv_path,
               args.batch_delay, args.dry_run)


if __name__ == "__main__":
    main()
