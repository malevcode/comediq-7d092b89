#!/usr/bin/env python3
"""
Fix/upsert open mic entries: correct 3 Sheets address, add city field to all records.

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment.
"""
from __future__ import annotations

import json
import os
import requests

TABLE = "open_mics_historical"

MICS = [
    # NY Comedy Club East Village — Mon–Fri
    {
        "open_mic": "NY Comedy Club Open Mic (East Village)",
        "day": "Monday",
        "start_time": "5:00 PM",
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
    {
        "open_mic": "NY Comedy Club Open Mic (East Village)",
        "day": "Tuesday",
        "start_time": "5:00 PM",
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
    {
        "open_mic": "NY Comedy Club Open Mic (East Village)",
        "day": "Wednesday",
        "start_time": "5:00 PM",
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
    {
        "open_mic": "NY Comedy Club Open Mic (East Village)",
        "day": "Thursday",
        "start_time": "5:00 PM",
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
    {
        "open_mic": "NY Comedy Club Open Mic (East Village)",
        "day": "Friday",
        "start_time": "5:00 PM",
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
    # The Pit — Friday late night
    {
        "open_mic": "The Pit Open Mic",
        "day": "Friday",
        "start_time": "11:30 PM",
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
    # St. Marks Comedy Club — Sunday Spanish Open Mic
    {
        "open_mic": "Sunday Spanish Open Mic",
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
    # 3 Sheets Saloon — bi-weekly Wednesday (corrected address & neighborhood)
    {
        "open_mic": "3 Sheets Open Mic Comedy Night",
        "day": "Wednesday",
        "start_time": "8:00 PM",
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
]


def upsert_mic(url: str, service_key: str, mic: dict) -> str:
    """Update if exists, insert if not. Returns 'updated' or 'inserted'."""
    endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}"
    headers_base = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }

    # Check if record exists
    params = {
        "open_mic": f"eq.{mic['open_mic']}",
        "day": f"eq.{mic['day']}",
        "select": "unique_identifier",
        "limit": "1",
    }
    r = requests.get(endpoint, headers=headers_base, params=params, timeout=30)
    r.raise_for_status()
    existing = r.json()

    if existing:
        uid = existing[0]["unique_identifier"]
        # PATCH to update
        r = requests.patch(
            endpoint,
            headers={**headers_base, "Content-Type": "application/json", "Prefer": "return=minimal"},
            params={"unique_identifier": f"eq.{uid}"},
            data=json.dumps(mic),
            timeout=60,
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Update failed ({r.status_code}): {r.text}")
        return "updated"
    else:
        r = requests.post(
            endpoint,
            headers={**headers_base, "Content-Type": "application/json", "Prefer": "return=minimal"},
            data=json.dumps(mic),
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
    for mic in MICS:
        action = upsert_mic(url, key, mic)
        print(f"  {action}: {mic['open_mic']} / {mic['day']}")
    print("Done.")


if __name__ == "__main__":
    main()
