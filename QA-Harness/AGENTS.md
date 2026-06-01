# QA Harness — Agent Instructions

This file is the master instruction set for any coding agent working within the
Jahia QA Harness repository. Read it before invoking any skill or modifying any file.

---

## What this harness is

The QA Harness validates changes delivered by a developer harness from the
**product perspective** — not the code perspective.

> A feature can pass all tests and still fail a real user.
> This harness catches those failures.

It is a **behaviour harness** (per Fowler's harness engineering model), operating across
four pillars: Acceptance Criteria (A), Test Adequacy (B), Persona UAT (C), and
Documentation (D).

---

## Role of the agent

You are an extension of the QA engineer — not a replacement.

Your job:
- Mechanical analysis: scan test files, map ACs to evidence, extract terms from diffs
- Inferential evaluation: synthetic walkthroughs, semantic gap analysis, doc delta assessment
- Drafting: AC sets, team meeting agendas, CHANGELOG entries, support Q&As
- Orchestration: run the six-stage pipeline, enforce checkpoints, chain pillar outputs

The QA engineer's job (not yours):
- Final AC sign-off before development
- Persona scenario approval before execution
- Risk acceptance decisions
- Manual testing (accessibility, visual, perception)
- Final release recommendation confirmation

**You must stop at every human checkpoint. Do not proceed without explicit approval.**

---

## Pipeline — six stages, two checkpoints

```
Stage 1  Change Understanding        — build the change model
Stage 2  Acceptance Mapping          — Pillar A: ACs → evidence → verdict
Stage 3  Persona Scenario Generation — Pillar C (setup)
         ⚠️ CHECKPOINT 1: QA engineer approves scenarios
Stage 4  Scenario + Test Execution   — Pillar B + C evaluation
Stage 5  Documentation Review        — Pillar D
Stage 6  QA Decision                 — assemble final report
         ⚠️ CHECKPOINT 2: QA engineer confirms release recommendation
```

---

## Available skills

| Skill | Invocation | What it does |
|-------|------------|--------------|
| Full pipeline | `/qa-run` | Runs all 6 stages; enforces both checkpoints |
| Partial run | `/qa-run --pillars A,B` | Runs only specified pillars |
| AC validation | `/qa-ac-validate` | Pillar A — REFINEMENT or VALIDATION mode |
| Test adequacy | `/qa-cypress-analyze` | Pillar B — Cypress suite analysis |
| Persona UAT | `/qa-persona-uat` | Pillar C — scenario generation and evaluation |
| Doc review | `/qa-doc-review` | Pillar D — documentation gap analysis |
| QA report | `/qa-report` | Stage 6 — assemble report + recommendation |

All skills are in `.github/copilot/`. Skills are designed to be invoked individually
or chained by `/qa-run`.

---

## Feedforward guides (read before evaluation)

| Guide | Location | Used by |
|-------|----------|---------|
| AC writing standards | `harness/guides/ac-templates/AC_GUIDE.md` | `/qa-ac-validate` |
| AC refinement meeting | `harness/guides/ac-templates/AC_REFINEMENT_MEETING.md` | QA engineer + `/qa-ac-validate` |
| Persona definitions | `harness/guides/personas/*.md` | `/qa-persona-uat` |
| Persona selection heuristic | `harness/guides/personas/README.md` | `/qa-persona-uat`, `/qa-run` |
| Scenario patterns | `harness/guides/personas/SCENARIO_PATTERNS.md` | `/qa-persona-uat` |
| Documentation standards | `harness/guides/doc-standards/DOC_STANDARDS.md` | `/qa-doc-review` |
| Doc sources template | `harness/guides/doc-standards/DOC_SOURCES_TEMPLATE.md` | QA engineer (fills in) |

**Always read the relevant guide before invoking a skill.**
Guides are feedforward controls — they increase the probability of correct first-attempt evaluation.

---

## Computational sensors (run before inferential evaluation)

| Sensor | Location | Invoked by |
|--------|----------|-----------|
| AC validator | `harness/sensors/ac-validator/ac-validator.js` | `/qa-ac-validate` |
| Cypress analyzer | `harness/sensors/cypress-analyzer/cypress-analyzer.js` | `/qa-cypress-analyze` |
| Doc reviewer | `harness/sensors/doc-reviewer/doc-reviewer.js` | `/qa-doc-review` |

Sensors produce JSON output. Run them first; use their output as input to the inferential evaluation.
Never skip the computational sensor step — it provides deterministic evidence that anchors the LLM evaluation.

---

## Output templates

All pillar outputs follow a template in `templates/`:

| Template | Produced by |
|----------|-------------|
| `ac-matrix.md` | `/qa-ac-validate` |
| `test-adequacy-review.md` | `/qa-cypress-analyze` |
| `persona-ucat-pack.md` | `/qa-persona-uat` |
| `doc-review.md` | `/qa-doc-review` |
| `qa-report.md` | `/qa-report` |

Save output files as `[feature-slug]-[template-name].md` in the working directory.

---

## Non-negotiable constraints

1. **No fabrication**: if evidence is absent, report MISSING — never infer PASS
2. **No checkpoint skipping**: Stage 3 and Stage 6 checkpoints are mandatory
3. **No AC finalisation alone**: always wait for QA engineer sign-off in REFINEMENT mode
4. **No synthetic PASS for accessibility**: a11y scenarios are always MANUAL-REQUIRED
5. **No PASS with LOW confidence alone**: LOW confidence requires human review
6. **No evaluation without sources**: Pillar D requires a filled sources form
7. **No release READY verdict with `.only`** in any Cypress test file
8. **No release READY verdict with a missing migration guide** for a declared breaking change

---

## Extending the harness

### Add a persona
1. Copy `harness/guides/personas/PERSONA_TEMPLATE.md` to `<slug>.md`
2. Fill in all sections, especially `Core tasks` and `Failure signals`
3. Add a row to `harness/guides/personas/README.md`
4. The skill auto-discovers the file on next run

### Add a scenario pattern
1. Add the pattern to `harness/guides/personas/SCENARIO_PATTERNS.md`
2. Add a row to the persona × feature type matrix in that file

### Add a documentation standard
1. Add a new row to the "Required documentation by change type" table in `DOC_STANDARDS.md`
2. Add quality criteria for the new doc type

### Update a skill
1. Edit the `.prompt.md` file in `.github/copilot/`
2. Test with a known feature (e.g., the versioning plan from the examples)
3. Add a change note to the skill's YAML frontmatter description

### Steer the harness (the human's job)
When a failure mode recurs across multiple runs, improve the harness:
- If the same AC gap appears repeatedly → update `AC_GUIDE.md` with a new rule
- If the same test smell appears repeatedly → update the persona's `Scenario evaluation hints`
- If a doc type is consistently missing → add it to `DOC_STANDARDS.md` as always-required
- If a persona scenario is always PASS with no value → remove it from `SCENARIO_PATTERNS.md`

---

## Jahia-specific context

- Primary test location: `tests/cypress/e2e/` (Cypress TypeScript)
- Selector convention: `data-sel-role="..."` (prefer over CSS selectors)
- Test data: `cy.apollo({ mutation/mutationFile })` for GraphQL setup
- Auth: `cy.loginAndStoreSession()` / `cy.logout()`
- Page objects: `JContent`, `ContentEditor`, `JContentPublish` from `../../page-object`
- i18n: `jcontent:label.*` keys in `en.json` (and other locale files)
- End-user docs: `academy.jahia.com`
- Module deployment: dx-cli, Maven
- Environments: digitall (reference site), staging, production
