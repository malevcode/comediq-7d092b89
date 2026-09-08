#!/usr/bin/env python3
"""Upload curated audience shows to Supabase.

Shows collected from hosts (Instagram DMs, flyers) live in
audience_shows_seed.json next to this file. This script pushes them into the
audience_shows table over PostgREST, using the same credentials and endpoint
shape as ingest_to_supabase.py.

Why not an upsert: the table's unique constraint is on (source, source_event_id)
and curated rows carry source = NULL. Postgres treats NULLs as distinct in a
unique index, so on_conflict would insert a fresh duplicate on every run.
Instead each show is looked up first and only inserted when missing, which makes
re-running a no-op.

Note that PostgREST cannot run DDL. Shows with no confirmed start time need
show_time to be nullable, so if that migration has not been applied those rows
fail with a clear message while every other show still uploads.

Usage:
    python scripts/ingest/seed_audience_shows.py --dry-run
    python scripts/ingest/seed_audience_shows.py
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

TABLE = "audience_shows"
SEED_FILE = Path(__file__).resolve().parent / "audience_shows_seed.json"

NULLABLE_SHOW_TIME_SQL = (
    "ALTER TABLE public.audience_shows ALTER COLUMN show_time DROP NOT NULL;"
)


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

    def find_id(self, filters: Dict[str, str]) -> Optional[str]:
        params = dict(filters, select="id", limit="1")
        r = self._send("GET", params=params)
        if r.status_code >= 400:
            raise RuntimeError(f"Lookup failed ({r.status_code}): {r.text}")
        rows = r.json()
        return rows[0]["id"] if rows else None

    def insert(self, row: Dict[str, Any]) -> Optional[str]:
        if self.dry_run:
            print(f"      [dry-run] would insert: {json.dumps(row, sort_keys=True)}")
            return None
        r = self._send(
            "POST",
            data=json.dumps(row),
            headers={"Prefer": "return=representation"},
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Insert failed ({r.status_code}): {r.text}")
        return r.json()[0]["id"]


def is_null_show_time_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "show_time" in text and ("null value" in text or "not-null" in text)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be inserted without writing anything.",
    )
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        raise SystemExit(
            "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or "
            "SUPABASE_SERVICE_ROLE_KEY in env."
        )

    seed = json.loads(SEED_FILE.read_text())
    client = Client(supabase_url, service_key, dry_run=args.dry_run)

    inserted: List[str] = []
    skipped: List[str] = []
    failed: List[str] = []
    blocked_on_show_time: List[str] = []

    def attempt(
        label: str,
        filters: Dict[str, str],
        row: Dict[str, Any],
        known_missing: bool = False,
    ) -> Optional[str]:
        try:
            existing = None if known_missing else client.find_id(filters)
            if existing:
                print(f"  skip     {label} (already present)")
                skipped.append(label)
                return existing
            new_id = client.insert(row)
            print(f"  {'would add' if client.dry_run else 'inserted '} {label}")
            inserted.append(label)
            return new_id
        except Exception as exc:  # noqa: BLE001  one row must not abort the rest
            if is_null_show_time_error(exc):
                print(f"  BLOCKED  {label}: show_time is still NOT NULL")
                blocked_on_show_time.append(label)
            else:
                print(f"  FAILED   {label}: {exc}")
            failed.append(label)
            return None

    print(f"Seeding {TABLE} from {SEED_FILE.name}"
          f"{' (dry run, nothing will be written)' if args.dry_run else ''}\n")

    print("One-off shows:")
    for show in seed.get("one_off_shows", []):
        attempt(
            f"{show['title']} on {show['show_date']}",
            {
                "title": f"eq.{show['title']}",
                "show_date": f"eq.{show['show_date']}",
                "is_recurring": "eq.false",
            },
            show,
        )

    print("\nRecurring shows:")
    for entry in seed.get("recurring_shows", []):
        template = entry["template"]
        title = template["title"]
        template_existed = client.find_id(
            {"title": f"eq.{title}", "is_recurring": "eq.true"}
        )
        template_id = attempt(
            f"{title} (recurring template)",
            {"title": f"eq.{title}", "is_recurring": "eq.true"},
            template,
        )
        if template_id is None and not (client.dry_run and not template_existed):
            print(f"  skipping instances of {title}: no template id")
            continue

        # A dry run never writes the template, so its instances cannot be looked
        # up by parent_show_id and are known to be missing.
        instances_known_missing = client.dry_run and not template_existed

        # Instances copy the template's details but carry their own date, are not
        # themselves templates, and point back at the template. They must be
        # matched on parent_show_id rather than title, since the template shares
        # both title and show_date with its first instance.
        instance_base = {
            k: v
            for k, v in template.items()
            if k not in ("is_recurring", "recurrence_pattern", "recurrence_day", "show_date")
        }
        for show_date in entry.get("instance_dates", []):
            row = dict(
                instance_base,
                show_date=show_date,
                is_recurring=False,
                parent_show_id=template_id,
            )
            attempt(
                f"{title} on {show_date}",
                {"parent_show_id": f"eq.{template_id}", "show_date": f"eq.{show_date}"},
                row,
                known_missing=instances_known_missing,
            )

    print(
        f"\nDone. inserted={len(inserted)} skipped={len(skipped)} failed={len(failed)}"
    )

    if blocked_on_show_time:
        print(
            "\nThese shows have no confirmed start time and need show_time to be "
            "nullable first.\nRun this once in the Supabase SQL editor, then re-run "
            f"this job:\n\n    {NULLABLE_SHOW_TIME_SQL}\n"
        )
        for label in blocked_on_show_time:
            print(f"  - {label}")

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
