# AC Validator Sensor

## Purpose

Scans a repository's Cypress `tests/` directory and produces a structured JSON
inventory of test files, test cases (`describe`/`it`), and `data-sel-role` selectors.

The `qa-ac-validate` skill consumes this inventory during **VALIDATION mode** to map
acceptance criteria to concrete test evidence without reading every test file manually.

---

## Usage

```bash
# Basic scan of the default tests/cypress/e2e directory
node ac-validator.js --tests-dir ./tests/cypress/e2e

# Filter to a specific feature (matches file name, describe labels, and it labels)
node ac-validator.js --tests-dir ./tests/cypress/e2e --feature versioning

# Write output to a specific file
node ac-validator.js --tests-dir ./tests/cypress/e2e --output versioning-evidence.json
```

---

## Output format

```json
{
  "generatedAt": "2026-05-28T...",
  "testsDir": "./tests/cypress/e2e",
  "featureFilter": "versioning",
  "totalFiles": 3,
  "totalTests": 12,
  "totalSelRoles": 8,
  "files": [
    {
      "file": "tests/cypress/e2e/contentEditor/versioningScreen.cy.ts",
      "describes": ["Versioning screen tests"],
      "its": [
        "shows Versioning option in Advanced Options nav",
        "displays version groups in versioning panel",
        "greys out versions from other languages"
      ],
      "selRoles": ["versioning-panel", "version-group-item", "advanced-options-nav"],
      "setup": {
        "hasBefore": true,
        "hasAfter": true,
        "hasApollo": true,
        "hasLoginSession": true
      },
      "testCount": 3
    }
  ]
}
```

---

## What the skill does with this output

1. For each AC requiring `cypress-e2e` evidence, the skill searches the inventory for:
   - A `it(...)` description that semantically matches the AC's Then clause
   - A `data-sel-role` selector that matches the expected UI element
   - A `before()` block that reproduces the Given precondition

2. The skill assigns evidence confidence:
   - `HIGH`: matching `it` label + matching `sel-role` + setup block
   - `MEDIUM`: matching `it` label but missing `sel-role` or setup
   - `LOW`: only file name matches the feature, no direct test case found

3. Any AC with no evidence found is reported as `MISSING`.

---

## Requirements

- Node.js ≥ 18 (no dependencies — pure stdlib)
- Read access to the Cypress tests directory

---

## Extensibility

To add detection of additional patterns (e.g., custom Cypress commands, page object
method calls), edit the parser section in `ac-validator.js`. The inventory format is
stable — the skill depends only on `describes`, `its`, `selRoles`, and `setup` fields.
