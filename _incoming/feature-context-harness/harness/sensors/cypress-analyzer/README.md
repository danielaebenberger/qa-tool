# Cypress Analyzer Sensor

## Purpose

Pillar B computational feedback sensor. Goes beyond line/branch coverage to measure
**test adequacy** from a QA perspective:

| Coverage dimension | What it checks |
|-------------------|---------------|
| **Scenario coverage** | Happy path, error states, empty states |
| **Multilingual coverage** | Language-aware behaviour tested? |
| **Assertion quality** | Only `.be.visible`? Or content, ARIA, state? |
| **Data hygiene** | `before()`/`after()` hooks, apollo setup, logout |
| **Selector stability** | `data-sel-role` vs fragile CSS selectors |
| **Persona signals** | Which user archetypes are implicitly tested? |
| **Test smells** | `.skip`, `.only`, hardcoded paths, missing error scenarios |
| **AC cross-reference** | Which acceptance criteria have test evidence? |

---

## Usage

```bash
# Full scan of a Cypress test suite
node cypress-analyzer.js --tests-dir ./tests/cypress/e2e --verbose

# Filter to one feature, cross-reference with AC matrix
node cypress-analyzer.js \
  --tests-dir ./tests/cypress/e2e \
  --feature versioning \
  --ac-matrix versioning-ac-matrix.md \
  --output versioning-adequacy.json \
  --verbose

# Use ac-evidence-inventory.json from ac-validator as the AC reference
node cypress-analyzer.js \
  --tests-dir ./tests/cypress/e2e \
  --feature versioning \
  --ac-matrix ac-evidence-inventory.json
```

---

## Output format

```json
{
  "meta": { "generatedAt": "...", "testsDir": "...", "featureFilter": "versioning" },
  "summary": {
    "totalFiles": 2,
    "totalTests": 8,
    "averageQualityScore": 72,
    "overallGrade": "FAIR",
    "smellCount": { "HIGH": 1, "MEDIUM": 2, "LOW": 1 },
    "coverageSignals": {
      "hasErrorScenarios": false,
      "hasMultilingualTests": false,
      "hasSkippedTests": false,
      "hasOnlyTests": false,
      "usesPageObjects": true,
      "personasCovered": ["content-editor"]
    },
    "acCoverage": {
      "total": 5,
      "covered": 3,
      "missing": ["AC-003", "AC-004"]
    }
  },
  "files": [
    {
      "file": "tests/cypress/e2e/contentEditor/versioningScreen.cy.ts",
      "describes": ["Versioning screen tests"],
      "its": ["shows Versioning option in Advanced Options nav", "..."],
      "testCount": 3,
      "selRoles": ["versioning-panel", "version-group-item"],
      "assertions": { "visibilityOnly": false, "hasContentAssert": true, "hasAriaAssert": false },
      "setup": { "hasBefore": true, "hasAfter": true, "hasApollo": true, ... },
      "smells": [
        {
          "id": "NO_ERROR_SCENARIO",
          "severity": "MEDIUM",
          "message": "No error or failure scenario detected",
          "fix": "Add at least one test case for an error state"
        }
      ],
      "qualityScore": 80,
      "qualityGrade": "GOOD"
    }
  ]
}
```

---

## Quality scoring

Each file is scored 0–100:

| Smell | Severity | Score impact |
|-------|----------|-------------|
| No `data-sel-role` selectors | HIGH | −20 |
| `.skip` present | HIGH | −20 |
| `.only` present | HIGH | −20 |
| No `before()` hook | MEDIUM | −10 |
| No `after()` hook | MEDIUM | −10 |
| Assertions only check visibility | MEDIUM | −10 |
| No error/failure scenario | MEDIUM | −10 |
| Hardcoded JCR paths | LOW | −5 |
| No multilingual scenario | LOW | −5 |

Overall grade:
- **GOOD** (80–100): Test suite is well-structured and adequately covers scenarios
- **FAIR** (50–79): Usable but has notable gaps; prioritise MEDIUM/HIGH smells
- **POOR** (0–49): Significant quality issues; should not be treated as reliable evidence

---

## CI integration

The analyzer **exits with code 1** if `.only` is detected in any test file. This makes
it safe to run as a pre-merge check to catch accidental test isolation.

```yaml
# .github/workflows/qa-harness.yml (excerpt)
- name: Cypress test adequacy check
  run: node QA-Harness/harness/sensors/cypress-analyzer/cypress-analyzer.js \
    --tests-dir tests/cypress/e2e \
    --verbose
```

---

## Requirements

- Node.js ≥ 18 (no dependencies)
- Read access to the Cypress tests directory

---

## Relationship to Pillar A

The cypress-analyzer is the computational half of VALIDATION mode:

```
qa-ac-validate (skill)
  └── runs cypress-analyzer.js   ← computational sensor
  └── reads ac-evidence-inventory.json (from ac-validator.js)
  └── LLM maps test labels to AC criteria  ← inferential
  └── produces ac-matrix.md VALIDATION result
```
