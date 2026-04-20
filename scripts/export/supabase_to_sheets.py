#!/usr/bin/env python3
"""
Export open_mics_historical from Supabase into a new private Google Sheet.

The sheet is created privately (only the service account can see it) so you can
review/edit, then copy-paste the data into the public spreadsheet.

Required env vars:
  SUPABASE_URL               (or NEXT_PUBLIC_SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY  (service-role key for unrestricted read)
  GOOGLE_SERVICE_ACCOUNT_JSON  path to your service-account .json key file

Optional env vars:
  GOOGLE_SHEET_TITLE         name for the new sheet  (default: "NYC Open Mics – Master <date>")
  SHARE_EMAIL                your personal Gmail to auto-share the new sheet with

Setup:
  1. pip install gspread google-auth
  2. Create a Google Cloud project → enable Google Sheets API + Google Drive API
  3. Create a Service Account → download JSON key → set GOOGLE_SERVICE_ACCOUNT_JSON
  4. Optionally set SHARE_EMAIL so the sheet is shared to your account immediately

Usage:
  python scripts/export/supabase_to_sheets.py
  SHARE_EMAIL=you@gmail.com python scripts/export/supabase_to_sheets.py
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date
from typing import Any, Dict, List, Optional

import requests

# ---------------------------------------------------------------------------
# Column mapping: (supabase_field, spreadsheet_header)
# Order determines column order in the sheet.
# ---------------------------------------------------------------------------
COLUMNS: List[tuple[str, str]] = [
    ("open_mic",              "Open Mic Name"),
    ("venue_name",            "Venue"),
    ("location",              "Address"),
    ("borough",               "Borough"),
    ("neighborhood",          "Neighborhood"),
    ("city",                  "City"),
    ("day",                   "Day"),
    ("start_time",            "Start Time"),
    ("latest_end_time",       "Latest End Time"),
    ("stage_time",            "Stage Time"),
    ("cost",                  "Cost"),
    ("hosts_organizers",      "Hosts / Organizers"),
    ("sign_up_instructions",  "Sign Up Instructions"),
    ("signup_method",         "Sign Up Method"),
    ("signup_url",            "Sign Up URL"),
    ("last_verified",         "Last Verified"),
    ("status",                "Status"),
    ("active",                "Active"),
    ("frequency",             "Frequency"),
    ("frequency_custom_text", "Frequency Notes"),
    ("venue_type",            "Venue Type"),
    ("other_rules",           "Other Rules"),
    ("changes_updates",       "Changes / Updates"),
    ("legacy_tag",            "Legacy Tag"),
    ("verification_count",    "Verification Count"),
    ("unique_identifier",     "Unique ID"),
]


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def fetch_open_mics(supabase_url: str, service_key: str) -> List[Dict[str, Any]]:
    """Fetch all rows from open_mics_historical ordered by borough then day."""
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/open_mics_historical"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Accept": "application/json",
        # Ask PostgREST to return all rows (no default 1000-row limit)
        "Range-Unit": "items",
        "Range": "0-9999",
        "Prefer": "count=none",
    }
    params = {
        "select": "*",
        "order": "borough.asc.nullslast,day.asc.nullslast,start_time.asc.nullslast",
    }
    r = requests.get(endpoint, headers=headers, params=params, timeout=60)
    if r.status_code >= 400:
        raise RuntimeError(f"Supabase fetch failed ({r.status_code}): {r.text}")
    return r.json()


# ---------------------------------------------------------------------------
# Google Sheets helpers
# ---------------------------------------------------------------------------

def _gspread_client(service_account_json_path: str):
    """Return an authenticated gspread client from a service-account JSON file."""
    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError:
        raise SystemExit(
            "Missing packages. Run: pip install gspread google-auth"
        )

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(service_account_json_path, scopes=scopes)
    return gspread.authorize(creds)


def create_sheet(
    gc,
    rows: List[Dict[str, Any]],
    title: str,
    share_email: Optional[str],
) -> str:
    """Create a new Google Sheet, write data, return the sheet URL."""
    import gspread

    spreadsheet = gc.create(title)

    ws = spreadsheet.sheet1
    ws.update_title("Open Mics")

    headers = [col_label for _, col_label in COLUMNS]
    db_fields = [db_field for db_field, _ in COLUMNS]

    data: List[List[Any]] = [headers]
    for row in rows:
        data.append([_cell(row.get(field)) for field in db_fields])

    # Write in one request for speed
    ws.update("A1", data)

    # Bold the header row
    ws.format("1:1", {"textFormat": {"bold": True}})

    # Freeze header row
    spreadsheet.batch_update({
        "requests": [{
            "updateSheetProperties": {
                "properties": {
                    "sheetId": ws.id,
                    "gridProperties": {"frozenRowCount": 1},
                },
                "fields": "gridProperties.frozenRowCount",
            }
        }]
    })

    if share_email:
        spreadsheet.share(share_email, perm_type="user", role="writer", notify=True)
        print(f"Shared with {share_email}")

    return f"https://docs.google.com/spreadsheets/d/{spreadsheet.id}/edit"


def _cell(value: Any) -> Any:
    """Convert Python values to a spreadsheet-friendly form."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return value


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    sa_json_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    share_email  = os.getenv("SHARE_EMAIL")
    sheet_title  = os.getenv("GOOGLE_SHEET_TITLE") or f"NYC Open Mics – Master {date.today()}"

    missing = []
    if not supabase_url:
        missing.append("SUPABASE_URL")
    if not service_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not sa_json_path:
        missing.append("GOOGLE_SERVICE_ACCOUNT_JSON")
    if missing:
        raise SystemExit(f"Missing required env vars: {', '.join(missing)}")

    print("Fetching open mics from Supabase …")
    rows = fetch_open_mics(supabase_url, service_key)
    print(f"  → {len(rows)} rows fetched")

    print(f"Creating Google Sheet: '{sheet_title}' …")
    gc = _gspread_client(sa_json_path)
    url = create_sheet(gc, rows, sheet_title, share_email)

    print(f"\nDone! Sheet URL:\n  {url}")
    print()
    print("Next steps:")
    print("  1. Open the sheet above and review / clean up the data")
    print("  2. Copy the rows (excluding the header if the public sheet already has one)")
    print("  3. Paste into the public spreadsheet to keep its formatting intact")


if __name__ == "__main__":
    main()
