---
name: qa-sensor-doc-reviewer
description: "Scans local docs (README/CHANGELOG/MIGRATION) and declared remote sources for terms extracted from a diff, flagging stale or auth-gated documentation."
kind: sensor
pillar: feature-validation
version: "1.0"
---

# Doc Reviewer Sensor

Run: `pnpm tsx src/harness/sensors/doc-reviewer/doc-reviewer.ts --sources <doc-sources.md> --feature <slug> [--diff <file>] [--repo-root <path>] [--output <file>]`

Output: JSON report to `--output` (default `doc-review-raw.json`). Auth-gated remote sources are flagged `MANUAL_REVIEW_REQUIRED`, never scored as evidence.
