# Comediq - Claude Code Preferences

## PR Workflow

- When finishing a PR, always mark it ready for review and merge it immediately. Do not leave PRs as drafts waiting for manual merge.

## Open mic data conventions

- **Mic names put the start time first.** `5 Buddha Room Hour Mic`, never
  `The Buddha Room 5 Hour Mic`, which reads as a five hour mic. Shape is
  `<start time> <venue> <what the room calls it>`.
- **If a start time changes, the name and the end time both change with it.**
  A mic is 90 minutes unless the room specifically says it is a one hour mic.
- **Run `python scripts/ingest/report_stale_labels.py` before shipping a
  batch.** Names carry labels like `*SKIPS 9/14*` that nothing expires.
- Full detail lives in `documentation.md` under "Open mics".
