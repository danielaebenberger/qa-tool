---
name: qa-sensor-cypress-analyzer
description: "Analyses a Cypress suite for test adequacy — scenario, assertion, persona, multilingual, and error-path coverage plus structural smells. Exits non-zero if .only is present, gating CI."
kind: sensor
pillar: feature-validation
version: "1.0"
---

# Cypress Analyzer Sensor

Run: `pnpm tsx src/harness/sensors/cypress-analyzer/cypress-analyzer.ts --tests-dir <path> [--ac-matrix <file>] [--feature <slug>] [--output <file>] [--verbose]`

Output: JSON adequacy report to `--output` (default `cypress-adequacy-report.json`). Exit code `1` if `.only` is detected anywhere in the suite — this is what `qa-harness-reusable.yml` (Task 15) uses to block a PR.
