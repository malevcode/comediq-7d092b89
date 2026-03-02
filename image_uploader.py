#!/usr/bin/env python3
import os
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TABLE = "audience_shows"

if not SUPABASE_URL or not SERVICE_KEY:
    raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

VENUE_IMAGE_MAP = {
    "New York Comedy Club": "https://cotfweyhlglpjmgqxwqx.supabase.co/storage/v1/object/sign/venue-logos/nycc_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjIxZGY1OC1lNTgzLTQ5YzctOGRkZi04NTZmMWU2ZGEzMGYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2ZW51ZS1sb2dvcy9ueWNjX2xvZ28ucG5nIiwiaWF0IjoxNzcyNDQ4NDE5LCJleHAiOjQ4OTQ1MTI0MTl9.CQeuLHTZay7fPTT4Eq_sNkRlnw7M5pmc7EZA9HVSOa0",
    "Grisly Pear": "https://cotfweyhlglpjmgqxwqx.supabase.co/storage/v1/object/sign/venue-logos/grislypear_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjIxZGY1OC1lNTgzLTQ5YzctOGRkZi04NTZmMWU2ZGEzMGYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2ZW51ZS1sb2dvcy9ncmlzbHlwZWFyX2xvZ28ucG5nIiwiaWF0IjoxNzcyNDQ4NDA2LCJleHAiOjQ4OTQ1MTI0MDZ9.LgA5A3U5d5Mr7pYM89p73fqTntHVn5PAOkBqkVzdso8",
    "St. Mark's Comedy Club": "https://cotfweyhlglpjmgqxwqx.supabase.co/storage/v1/object/sign/venue-logos/stmarksCC_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjIxZGY1OC1lNTgzLTQ5YzctOGRkZi04NTZmMWU2ZGEzMGYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2ZW51ZS1sb2dvcy9zdG1hcmtzQ0NfbG9nby5wbmciLCJpYXQiOjE3NzI0NDg0MzEsImV4cCI6NDg5NDUxMjQzMX0.eBnKmXDbm3-K1t9gXqneCf7LG5jJbqBWfNDFuQUVkD8",
    "St. Marks Comedy Club": "https://cotfweyhlglpjmgqxwqx.supabase.co/storage/v1/object/sign/venue-logos/stmarksCC_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjIxZGY1OC1lNTgzLTQ5YzctOGRkZi04NTZmMWU2ZGEzMGYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2ZW51ZS1sb2dvcy9zdG1hcmtzQ0NfbG9nby5wbmciLCJpYXQiOjE3NzI0NDg0MzEsImV4cCI6NDg5NDUxMjQzMX0.eBnKmXDbm3-K1t9gXqneCf7LG5jJbqBWfNDFuQUVkD8",

}

def fetch_rows():
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    params = {
        "select": "id,venue_name,image_url",
        "image_url": "is.null"
    }
    r = requests.get(url, headers=headers, params=params)
    r.raise_for_status()
    return r.json()

def update_row(row_id, image_url):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{row_id}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    r = requests.patch(url, headers=headers, json={"image_url": image_url})
    r.raise_for_status()

def main():
    rows = fetch_rows()
    print(f"Found {len(rows)} rows with NULL image_url")

    updated = 0
    for row in rows:
        venue = row.get("venue_name")
        image_url = VENUE_IMAGE_MAP.get(venue)

        if image_url:
            update_row(row["id"], image_url)
            updated += 1

    print(f"Updated {updated} rows.")

if __name__ == "__main__":
    main()