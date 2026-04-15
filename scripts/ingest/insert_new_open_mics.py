#!/usr/bin/env python3
"""
Upsert open mic entries with corrected names (≤15 chars), end times, city, host.
Queries by venue_name + day (stable) then patches with full corrected data.

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment.
"""
from __future__ import annotations

import json
import os
import requests

TABLE = "open_mics_historical"

# Each entry has:
#   query_key: (venue_name, day) — used to find existing record
#   data: full corrected row to upsert
MICS = [
    # NY Comedy Club East Village — Mon–Fri
    *[
        {
            "query_key": ("New York Comedy Club - East Village", day),
            "data": {
                "open_mic": "NYCC East Mic",          # 13 chars
                "day": day,
                "start_time": "5:00 PM",
                "latest_end_time": "6:30 PM",
                "venue_name": "New York Comedy Club - East Village",
                "borough": "Manhattan",
                "city": "New York",
                "neighborhood": "East Village",
                "location": "85 E 4th St, New York, NY 10003",
                "venue_type": "Comedy Club",
                "cost": "$5",
                "stage_time": "5 minutes",
                "sign_up_instructions": "Sign up at the venue starting at 4:30 PM",
                "active": True,
                "signup_enabled": False,
                "status": "trial",
                "frequency": "weekly",
                "signup_method": "in_person",
                "last_verified": "2026-04-14",
            },
        }
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    ],
    # The Pit — Friday late night
    {
        "query_key": ("The Pit NYC", "Friday"),
        "data": {
            "open_mic": "The Pit Mic",               # 11 chars
            "day": "Friday",
            "start_time": "11:30 PM",
            "latest_end_time": "1:00 AM",
            "venue_name": "The Pit NYC",
            "borough": "Manhattan",
            "city": "New York",
            "neighborhood": "Gramercy",
            "location": "123 E 24th St, New York, NY 10010",
            "venue_type": "Comedy Club",
            "cost": "$5",
            "stage_time": "5 minutes",
            "sign_up_instructions": "Sign up at the venue starting at 11:00 PM",
            "active": True,
            "signup_enabled": False,
            "status": "trial",
            "frequency": "weekly",
            "signup_method": "in_person",
            "last_verified": "2026-04-14",
        },
    },
    # St. Marks Comedy Club — Sunday Spanish Open Mic
    {
        "query_key": ("St. Marks Comedy Club", "Sunday"),
        "data": {
            "open_mic": "Sunday Spanish",             # 14 chars
            "day": "Sunday",
            "start_time": "5:30 PM",
            "latest_end_time": "7:00 PM",
            "venue_name": "St. Marks Comedy Club",
            "borough": "Manhattan",
            "city": "New York",
            "neighborhood": "East Village",
            "location": "12 St. Marks Place, New York, NY 10003",
            "venue_type": "Comedy Club",
            "cost": "$5",
            "stage_time": "5 minutes",
            "sign_up_instructions": "Buy tickets online at stmarkscomedy.com ($5 per ticket)",
            "hosts_organizers": "Alexis Carabaño",
            "active": True,
            "signup_enabled": False,
            "status": "trial",
            "frequency": "weekly",
            "signup_method": "online",
            "signup_url": "https://www.stmarkscomedy.com/shows/cccd321c-df7e-47da-be35-2e3e6245e94b",
            "last_verified": "2026-04-14",
        },
    },
    # 3 Sheets Saloon — bi-weekly Wednesday
    {
        "query_key": ("3 Sheets Saloon", "Wednesday"),
        "data": {
            "open_mic": "3 Sheets Comedy",            # 15 chars
            "day": "Wednesday",
            "start_time": "8:00 PM",
            "latest_end_time": "9:30 PM",
            "venue_name": "3 Sheets Saloon",
            "borough": "Manhattan",
            "city": "New York",
            "neighborhood": "Greenwich Village",
            "location": "134 W 3rd St, New York, NY 10012",
            "venue_type": "Bar",
            "cost": "Free",
            "sign_up_instructions": "Sign up at the door",
            "hosts_organizers": "Max Blake",
            "active": True,
            "signup_enabled": False,
            "status": "trial",
            "frequency": "bi_weekly",
            "signup_method": "in_person",
            "last_verified": "2026-04-15",
        },
    },
]


def upsert_mic(url: str, service_key: str, venue_name: str, day: str, data: dict) -> str:
    endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}"
    headers_base = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }

    # Find existing record by venue_name + day
    r = requests.get(
        endpoint,
        headers=headers_base,
        params={"venue_name": f"eq.{venue_name}", "day": f"eq.{day}", "select": "unique_identifier", "limit": "1"},
        timeout=30,
    )
    r.raise_for_status()
    existing = r.json()

    if existing:
        uid = existing[0]["unique_identifier"]
        r = requests.patch(
            endpoint,
            headers={**headers_base, "Content-Type": "application/json", "Prefer": "return=minimal"},
            params={"unique_identifier": f"eq.{uid}"},
            data=json.dumps(data),
            timeout=60,
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Update failed ({r.status_code}): {r.text}")
        return "updated"
    else:
        r = requests.post(
            endpoint,
            headers={**headers_base, "Content-Type": "application/json", "Prefer": "return=minimal"},
            data=json.dumps(data),
            timeout=60,
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Insert failed ({r.status_code}): {r.text}")
        return "inserted"


def main() -> None:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.")

    print(f"Processing {len(MICS)} open mic records...")
    for entry in MICS:
        venue_name, day = entry["query_key"]
        action = upsert_mic(url, key, venue_name, day, entry["data"])
        print(f"  {action}: {entry['data']['open_mic']} / {day}")
    print("Done.")


if __name__ == "__main__":
    main()
