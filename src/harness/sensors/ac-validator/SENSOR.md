---
name: qa-sensor-ac-validator
description: "Scans a Cypress test suite and produces a structured evidence inventory used by qa-ac-validate's VALIDATION mode."
kind: sensor
pillar: feature-validation
version: "1.0"
---

# AC Validator Sensor

Run: `pnpm tsx src/harness/sensors/ac-validator/ac-validator.ts --tests-dir <path> [--output <file>] [--feature <keyword>]`

Output: JSON inventory (describe/it structure, `data-sel-role` coverage) to `--output` (default `ac-evidence-inventory.json`).
