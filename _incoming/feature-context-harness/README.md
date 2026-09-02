# Jahia QA Harness

> Validates changes delivered by the developer harness from the **product perspective**.
> A feature that passes all code tests can still fail a real user. This harness catches that.

---

## The two-harness model

```
Developer Harness              QA Harness
─────────────────              ──────────
"Does the code work?"          "Does the feature solve the user problem?"
compilation                    acceptance criteria
unit/integration tests         persona-based UAT
static analysis                test adequacy review
architecture constraints       documentation completeness
code review                    release confidence
```

These harnesses are complementary, not redundant. The QA harness consumes the
developer harness output and evaluates it from the outside — from the user's point of view.

---

## Pipeline

```
[Input: ticket / PRP plan / PR]
          │
          ▼
  Stage 1 ── Change Understanding
          │
          ▼
  Stage 2 ── Acceptance Criteria Validation     ◄── Pillar A
          │         (REFINEMENT: draft ACs)
          │         (VALIDATION: verify ACs)
          ▼
  Stage 3 ── Persona Scenario Generation         ◄── Pillar C (setup)
          │
          │    ⚠️  HUMAN CHECKPOINT
          │    QA engineer approves scenarios
          ▼
  Stage 4 ── Scenario Execution + Test Adequacy  ◄── Pillar B + C (eval)
          │
          ▼
  Stage 5 ── Documentation Review                ◄── Pillar D
          │
          ▼
  Stage 6 ── QA Decision
          │
          │    ⚠️  HUMAN CHECKPOINT
          │    QA engineer confirms recommendation
          ▼
[Output: QA Report + Release Recommendation]
```

Two modes:
- **REFINEMENT** (pre-development): drafts ACs, generates team meeting agenda, sets quality gate before coding starts
- **VALIDATION** (post-delivery): verifies ACs against evidence, evaluates test coverage and UAT

---

## Quick start

### Full pipeline (VALIDATION mode — after a PR is delivered)

```bash
# 1. Fill in the doc sources form
cp harness/guides/doc-standards/DOC_SOURCES_TEMPLATE.md versioning-doc-sources.md
# edit versioning-doc-sources.md with Academy URL, internal docs, etc.

# 2. Invoke the orchestrator skill
# In your coding agent (Copilot, Claude, etc.):
/qa-run --feature versioning --mode validate
```

### Pre-development (REFINEMENT mode — refining a ticket or PRP plan)

```bash
/qa-run --feature versioning --mode refine
# The skill will draft ACs and generate a team meeting agenda
# Human checkpoint: QA engineer signs off on ACs before development starts
```

### Run a single pillar

```bash
/qa-ac-validate       # Pillar A only
/qa-cypress-analyze   # Pillar B only
/qa-persona-uat       # Pillar C only
/qa-doc-review        # Pillar D only
/qa-report            # Stage 6 only (requires pillar outputs to exist)
```

### Run sensors directly (computational, no LLM)

```bash
# Cypress test adequacy scan
node harness/sensors/cypress-analyzer/cypress-analyzer.js \
  --tests-dir ./tests/cypress/e2e \
  --feature versioning \
  --verbose

# AC-to-test evidence inventory
node harness/sensors/ac-validator/ac-validator.js \
  --tests-dir ./tests/cypress/e2e \
  --feature versioning

# Documentation delta scan
node harness/sensors/doc-reviewer/doc-reviewer.js \
  --sources versioning-doc-sources.md \
  --feature versioning \
  --diff versioning.diff \
  --verbose
```

---

## Triggering the harness

The harness supports two complementary invocation modes — they are designed to coexist.

### Mode 1 — GitHub Actions (automatic, on every PR)

The workflow `.github/workflows/qa-harness.yml` triggers on `pull_request` (opened, synchronize, reopened) and:

1. Runs both **computational sensors** (ac-validator + cypress-analyzer) — no LLM, no tokens
2. Posts a structured **QA report comment** on the PR with score, grade, and smell findings
3. **Blocks the PR** (exit code 1) immediately if a `.only` is detected in any test file
4. Refreshes the comment on re-push (no duplicate spam)
5. Leaves clear "Action" prompts for the AI-powered pillars (A, C, D) that require human judgement

The paths filter (`tests/**`, `src/**`) means the sensors only run when code or tests change, not on doc-only edits.

```
PR opened/updated
      │
      ▼
  ac-validator.js  ──► AC inventory JSON
  cypress-analyzer.js ──► adequacy report JSON
      │
      ▼
  PR comment: score + grade + smells + "Next: invoke /qa-run"
      │
      └── .only detected? ──► CI BLOCKS PR
```

### Mode 2 — Manual invocation in Copilot chat

For AI-powered analysis (Pillars A, C, D) and the full 6-stage pipeline, invoke skills directly:

| Goal | Command |
|------|---------|
| Full validation pipeline | `/qa-run --mode validate` |
| Refine a ticket before dev | `/qa-run --mode refine` |
| AC drafting + meeting agenda only | `/qa-ac-validate` |
| Cypress gap analysis | `/qa-cypress-analyze` |
| Persona UAT pack | `/qa-persona-uat` |
| Doc review | `/qa-doc-review` |
| Assemble final QA report | `/qa-report` |

### When to use which

| Trigger | When | Who |
|---------|------|-----|
| GitHub Actions | Every PR, automatically | CI/CD (no human needed) |
| `/qa-run --mode refine` | Ticket arrives, before coding starts | QA engineer + PM |
| `/qa-run --mode validate` | PR delivered, need full QA sign-off | QA engineer |
| Individual skill | Focused investigation of one pillar | QA engineer |

---

## What the harness produces

For each feature, the full run generates:

| Artefact | Contents |
|----------|----------|
| `[slug]-ac-matrix.md` | AC by AC verdict: PASS / PARTIAL / MISSING / CONFIRMED |
| `[slug]-test-adequacy-review.md` | Cypress coverage gaps, test smells, quality score |
| `[slug]-persona-ucat-pack.md` | Per-persona scenario results and synthetic walkthroughs |
| `[slug]-doc-review.md` | Doc delta: what changed vs. what is documented |
| `[slug]-qa-report.md` | Final report: all pillar verdicts + **release recommendation** |

Release recommendation is one of:
- `READY`
- `READY WITH KNOWN CAVEATS`
- `INSUFFICIENT EVIDENCE — manual items pending`
- `NOT READY — [primary blocking reason]`

---

## Repository structure

```
QA-Harness/
├── AGENTS.md                              ← agent instructions (read first)
├── README.md                              ← this file
├── .github/
│   ├── workflows/
│   │   └── qa-harness.yml                 ← GitHub Actions: auto-runs sensors on PR
│   └── copilot/                           ← SKILLS (reusable, invokable)
│       ├── qa-run.prompt.md               ← orchestrator
│       ├── qa-ac-validate.prompt.md       ← Pillar A
│       ├── qa-cypress-analyze.prompt.md   ← Pillar B
│       ├── qa-persona-uat.prompt.md       ← Pillar C
│       ├── qa-doc-review.prompt.md        ← Pillar D
│       └── qa-report.prompt.md            ← Stage 6
├── harness/
│   ├── guides/                            ← FEEDFORWARD (agent reads before acting)
│   │   ├── ac-templates/
│   │   │   ├── AC_GUIDE.md               ← how to write good ACs
│   │   │   └── AC_REFINEMENT_MEETING.md  ← team meeting facilitation
│   │   ├── personas/
│   │   │   ├── README.md                 ← selection heuristic
│   │   │   ├── PERSONA_TEMPLATE.md       ← copy to add a new persona
│   │   │   ├── SCENARIO_PATTERNS.md      ← reusable scenario patterns
│   │   │   ├── content-editor.md
│   │   │   ├── site-builder.md
│   │   │   ├── developer.md
│   │   │   ├── admin.md
│   │   │   └── compliance-user.md
│   │   └── doc-standards/
│   │       ├── DOC_STANDARDS.md          ← required docs by change type
│   │       └── DOC_SOURCES_TEMPLATE.md   ← human fills this before Pillar D
│   └── sensors/                          ← COMPUTATIONAL FEEDBACK (deterministic)
│       ├── ac-validator/
│       │   └── ac-validator.js           ← Cypress test inventory
│       ├── cypress-analyzer/
│       │   └── cypress-analyzer.js       ← test adequacy + smell detection
│       └── doc-reviewer/
│           └── doc-reviewer.js           ← doc delta scanner
└── templates/                            ← OUTPUT TEMPLATES
    ├── ac-matrix.md
    ├── test-adequacy-review.md
    ├── persona-ucat-pack.md
    ├── doc-review.md
    └── qa-report.md
```

---

## The four pillars at a glance

| Pillar | Name | Type | Human checkpoint? |
|--------|------|------|------------------|
| A | Acceptance Criteria | Inferential + computational | REFINEMENT: before dev; VALIDATION: Stage 6 |
| B | Test Adequacy | Computational + inferential | Stage 6 (report review) |
| C | Persona UAT | Inferential (+ manual) | Stage 3 (scenario approval) + Stage 6 |
| D | Documentation | Computational + inferential | Before evaluation (sources form) + Stage 6 |

---

## The human's role

The QA engineer **steers** the harness. Two types of steering:

**Per-run steering** (every feature):
- Confirm the change model (Stage 1)
- Approve/adjust persona scenarios (Stage 3 checkpoint)
- Provide doc sources (Pillar D)
- Review and sign off on the QA report (Stage 6 checkpoint)
- Risk-accept gaps that are not worth fixing

**Harness steering** (continuous improvement):
When the same issue appears across multiple runs, update the harness:
- Recurring AC gap → update `AC_GUIDE.md`
- Recurring test smell → add to `SCENARIO_PATTERNS.md` evaluation hints
- Consistently missing doc type → add to `DOC_STANDARDS.md`
- False-positive scenario → remove from `SCENARIO_PATTERNS.md`

> The harness gets better with every use. Build that muscle.

---

## Extending the harness

### Add a persona
```bash
cp harness/guides/personas/PERSONA_TEMPLATE.md harness/guides/personas/<slug>.md
# Edit the file, then add a row to harness/guides/personas/README.md
```
The skills auto-discover new personas on next run.

### Add a scenario pattern
Edit `harness/guides/personas/SCENARIO_PATTERNS.md` — add to the relevant section
and update the persona × feature type matrix.

### Adapt to a new Jahia repository
1. Point `--tests-dir` to the repo's Cypress test folder
2. Fill in the `DOC_SOURCES_TEMPLATE.md` for that repo's doc locations
3. No other configuration needed — the harness is repository-agnostic

---

## Design principles

This harness is built on [Martin Fowler's harness engineering model](https://martinfowler.com/articles/harness-engineering.html) (May 2026):

| Principle | Implementation |
|-----------|----------------|
| Feedforward + feedback | Guides (feedforward) + sensors and skills (feedback) |
| Computational + inferential | Node.js sensors (deterministic) + LLM skills (semantic) |
| Keep quality left | REFINEMENT mode catches gaps before a line of code is written |
| Human in the loop | Two mandatory checkpoints per pipeline run |
| Behaviour harness | Evaluates product correctness, not code correctness |
| Steerable | Harness improves through QA engineer steering, not just automation |

---

## Prerequisites

- Node.js ≥ 18 (for sensors — no dependencies required)
- A coding agent that supports `.prompt.md` skills (Copilot, Claude Code, etc.)
- Read access to the target repository's `tests/cypress/e2e/` folder
- A completed `DOC_SOURCES_TEMPLATE.md` for Pillar D

---

## License

Internal Jahia tooling. See repository licence file.
