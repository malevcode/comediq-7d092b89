#!/usr/bin/env python3
"""Summarise what an export did to public/mics.json, as GitHub step-summary markdown.

The apply workflow runs this between exporting mics.json and committing it, so a
merged batch reports its own effect on the site instead of leaving you to diff
the commit or refresh the page and hope. It compares the freshly exported file
against the committed one, so it must run before the commit step.

Never fails the job: a broken summary is not a reason to block publishing a
correct export, so any error is reported and exited 0.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

MICS = Path("public/mics.json")
# Noise: these move on their own whenever the geocoder runs, and reporting them
# would bury the edits a person actually made.
IGNORED = {"geocodedAt", "geocodingProvider", "geocodingScore", "geocodingMatchAddress"}
MAX_LISTED = 40


def committed_version() -> list | None:
    try:
        raw = subprocess.run(
            ["git", "show", f"HEAD:{MICS.as_posix()}"],
            capture_output=True, text=True, check=True,
        ).stdout
        return json.loads(raw)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return None


def label(mic: dict) -> str:
    return f"{mic.get('openMic', '?')} ({mic.get('day', '?')} {mic.get('startTime', '?')})"


def main() -> None:
    out: list[str] = ["## mics.json", ""]

    if not MICS.exists():
        print("\n".join(out + ["Export produced no file."]))
        return

    after = json.loads(MICS.read_text())
    before = committed_version()

    if before is None:
        out.append(f"{len(after)} mics exported. No committed version to compare against.")
        print("\n".join(out))
        return

    by_id_before = {m["uniqueIdentifier"]: m for m in before}
    by_id_after = {m["uniqueIdentifier"]: m for m in after}

    added = [by_id_after[k] for k in by_id_after.keys() - by_id_before.keys()]
    removed = [by_id_before[k] for k in by_id_before.keys() - by_id_after.keys()]

    changed: list[tuple[dict, list[str]]] = []
    for uid in by_id_before.keys() & by_id_after.keys():
        b, a = by_id_before[uid], by_id_after[uid]
        diffs = [
            f"`{f}`: {b.get(f)!r} to {a.get(f)!r}"
            for f in sorted(set(b) | set(a))
            if f not in IGNORED and b.get(f) != a.get(f)
        ]
        if diffs:
            changed.append((a, diffs))

    out.append(f"**{len(before)} to {len(after)} mics.** "
               f"{len(added)} added, {len(removed)} removed, {len(changed)} edited.")

    if not (added or removed or changed):
        out += ["", "No visible change. The database already matched what the site was serving."]

    for title, items in (("Added", added), ("Removed (no longer active)", removed)):
        if items:
            out += ["", f"### {title}", ""]
            out += [f"- {label(m)}" for m in items[:MAX_LISTED]]
            if len(items) > MAX_LISTED:
                out.append(f"- ...and {len(items) - MAX_LISTED} more")

    if changed:
        out += ["", "### Edited", ""]
        for mic, diffs in changed[:MAX_LISTED]:
            out.append(f"- **{label(mic)}**")
            out += [f"  - {d}" for d in diffs]
        if len(changed) > MAX_LISTED:
            out.append(f"- ...and {len(changed) - MAX_LISTED} more")

    print("\n".join(out))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001  a bad summary must not block the export
        print(f"## mics.json\n\nCould not summarise the change: {exc}")
        sys.exit(0)
