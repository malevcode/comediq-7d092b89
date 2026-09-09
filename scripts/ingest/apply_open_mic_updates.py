#!/usr/bin/env python3
"""Apply curated open mic updates to Supabase.

Host responses (Instagram DMs, the update form) are normally processed into mic
edits automatically. When that does not run, the batch is written by hand into
open_mic_updates.json next to this file and applied with this script.

Edits are matched by unique_identifier, so every change targets exactly one
known row. A removal sets active = false rather than deleting: export-mics.mjs
filters on active = eq.true, so that drops the mic from mics.json while keeping
its history, ratings and comments intact.

After this runs, the "Refresh mics.json" workflow regenerates the public cache,
and `npm run geocode:open-mics` fills coordinates for any mic whose location
changed (those edits null out the geocoding fields so it picks them up).

Usage:
    python scripts/ingest/apply_open_mic_updates.py --dry-run
    python scripts/ingest/apply_open_mic_updates.py
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_to_supabase import (  # noqa: E402  reuse the existing retry policy
    UPSERT_MAX_ATTEMPTS,
    retry_delay_seconds,
    should_retry_upsert_response,
)

# The mic listings live in open_mics_historical. There is no "open_mics" table:
# pointing at that name made every lookup 404 with PGRST205.
TABLE = "open_mics_historical"
UPDATES_FILE = Path(__file__).resolve().parent / "open_mic_updates.json"


class Client:
    def __init__(self, url: str, service_key: str, dry_run: bool = False):
        self.endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}"
        self.dry_run = dry_run
        self.session = requests.Session()
        self.session.headers.update(
            {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            }
        )

    def _send(self, method: str, **kwargs) -> requests.Response:
        for attempt in range(1, UPSERT_MAX_ATTEMPTS + 1):
            try:
                r = self.session.request(method, self.endpoint, timeout=60, **kwargs)
            except requests.RequestException as exc:
                if attempt >= UPSERT_MAX_ATTEMPTS:
                    raise RuntimeError(f"{method} failed after {attempt} attempts: {exc}") from exc
                time.sleep(retry_delay_seconds(attempt))
                continue
            if r.status_code < 400 or not (
                should_retry_upsert_response(r) and attempt < UPSERT_MAX_ATTEMPTS
            ):
                return r
            time.sleep(retry_delay_seconds(attempt))
        raise RuntimeError(f"{method} exhausted retries")

    def select(self, filters: Dict[str, str], columns: str = "unique_identifier") -> List[Dict[str, Any]]:
        r = self._send("GET", params=dict(filters, select=columns))
        if r.status_code >= 400:
            raise RuntimeError(f"Lookup failed ({r.status_code}): {r.text}")
        return r.json()

    def patch(self, uid: str, changes: Dict[str, Any]) -> int:
        """Update one mic. Returns how many rows were actually changed."""
        if self.dry_run:
            return 1
        r = self._send(
            "PATCH",
            params={"unique_identifier": f"eq.{uid}"},
            data=json.dumps(changes),
            headers={"Prefer": "return=representation"},
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Update failed ({r.status_code}): {r.text}")
        return len(r.json())

    def insert(self, row: Dict[str, Any]) -> None:
        if self.dry_run:
            return
        r = self._send("POST", data=json.dumps(row), headers={"Prefer": "return=minimal"})
        if r.status_code >= 400:
            raise RuntimeError(f"Insert failed ({r.status_code}): {r.text}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true",
                        help="Report what would change without writing anything.")
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        raise SystemExit(
            "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or "
            "SUPABASE_SERVICE_ROLE_KEY in env."
        )

    data = json.loads(UPDATES_FILE.read_text())
    client = Client(supabase_url, service_key, dry_run=args.dry_run)
    applied = skipped = failed = 0

    print(f"Applying open mic updates from {UPDATES_FILE.name}"
          f"{' (dry run, nothing will be written)' if args.dry_run else ''}\n")

    def edit(uid: str, note: str, changes: Dict[str, Any], label: str) -> None:
        nonlocal applied, failed
        try:
            existing = client.select({"unique_identifier": f"eq.{uid}"}, "unique_identifier,open_mic")
            if len(existing) != 1:
                # Matching zero rows is the real hazard here: it would look like
                # a clean run while the update silently went nowhere.
                print(f"  FAILED   {label}: matched {len(existing)} rows, expected 1")
                failed += 1
                return
            name = existing[0].get("open_mic", "?")
            count = client.patch(uid, changes)
            verb = "would edit" if client.dry_run else "edited   "
            print(f"  {verb} {name!r} ({count} row) - {note}")
            applied += 1
        except Exception as exc:  # noqa: BLE001  one row must not abort the rest
            print(f"  FAILED   {label}: {exc}")
            failed += 1

    print("Edits:")
    for e in data.get("edits", []):
        edit(e["unique_identifier"], e["note"], e["set"], e["unique_identifier"][:8])

    print("\nRemovals (active = false, the record is kept):")
    for r in data.get("removals", []):
        edit(r["unique_identifier"], r["note"], {"active": False}, r["unique_identifier"][:8])

    print("\nNew mics:")
    for n in data.get("new_mics", []):
        row = n["row"]
        label = f"{row['open_mic']} ({row['day']} {row['start_time']})"
        try:
            existing = client.select(
                {
                    "open_mic": f"eq.{row['open_mic']}",
                    "day": f"eq.{row['day']}",
                    "start_time": f"eq.{row['start_time']}",
                }
            )
            if existing:
                print(f"  skip      {label} (already present)")
                skipped += 1
                continue
            client.insert(row)
            print(f"  {'would add' if client.dry_run else 'added    '} {label} - {n['note']}")
            applied += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  FAILED    {label}: {exc}")
            failed += 1

    print(f"\nDone. applied={applied} skipped={skipped} failed={failed}")
    if not args.dry_run and not failed:
        print("\nNext: run the 'Refresh mics.json' workflow, then "
              "`npm run geocode:open-mics` for the mics that changed venue.")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
