# Agent Harness — `qa-tool`

This file is the entry point for any AI coding agent working in this
repository. Read it first. The team works via **Claude Code**; this harness
uses Claude Code's native conventions (`.claude/skills/`, `.claude/agents/`,
this file) — see `docs/superpowers/specs/2026-09-02-feature-context-harness-merge-design.md`
for why.

## 1. What this repo is

`qa-tool` is a standalone TypeScript QA assistant for the
[Jahia](https://www.jahia.com/) DXP suite, maintained by the Jahia QA squad.
It validates changes from the **product perspective**, not just the code
perspective — a feature can pass every unit/CI test and still fail a real
user. It is organised around four product pillars plus a harness-engineering
group for meta-tooling:

1. **CI Insight** — dashboard app: metrics, stability analysis (flaky / new /
   always-failing tests), TestRail-backed.
2. **Feature Validation** — the six-stage pipeline (`qa-run` →
   `qa-ac-validate` → `qa-cypress-analyze` → `qa-persona-uat` →
   `qa-doc-review` → `qa-report`) plus `qa-coverage-map`. Validates that a
   delivered feature actually satisfies acceptance criteria, has adequate
   Cypress coverage, passes persona-based UAT, and has current docs.
3. **Test-Case Identification** — `qa-tldr`, `qa-bug-brief`,
   `qa-define-testcases`, `qa-test-case-design`. Ticket-facing, used during
   refinement or the test phase of a ticket.
4. **Team Motivation** — small, sincere motivational mechanics (stub today).
5. **Harness Engineering** — meta-tools that work on the harness itself:
   `qa-dashboard-widget`, `qa-self-reviewer`, `qa-pr-test-reviewer`,
   `qa-capture`.

**The full, generated capability list lives in
[`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — regenerate it with
`pnpm capabilities:generate` after adding or changing any skill, agent, or
sensor.** Never hand-edit `CAPABILITIES.md`; CI rejects a stale one
(`.github/workflows/capabilities-check.yml`).

## 2. Hard constraints (do not violate)

- **Ask before installing new dependencies** (npm package, system package).
  Propose the package + version + reason; wait for approval.
- **Strict TypeScript only.** No `any` without an inline justification
  comment. Prefer `unknown` + narrowing.
- **No documentation churn.** Do not write status / change-log markdown files
  unless asked. Real changelog notes go to `.chachalog/`.
- **No silent fallbacks.** Surfaces that depend on CI data must clearly show
  empty / error / loading states; never fake numbers. Sensors must never
  emit a false PASS when evidence is absent — report MISSING.
- **No release READY verdict with `.only`** in any Cypress test file.
- **Every skill/agent/sensor carries the standard frontmatter** (`name`,
  `description`, `kind`, `pillar`, `version`, optional `see_also`) — see
  [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Human checkpoints in the Feature Validation pipeline are mandatory** —
  Stage 3 (persona scenario approval) and Stage 6 (release recommendation)
  must stop and wait for explicit QA-engineer approval. Never skip them.

## 3. The harness model

This harness follows
[Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html)
(Birgitta Böckeler, 2026): an **outer harness** of *guides* (feedforward) and
*sensors* (feedback), distributed **computational** (deterministic) and
**inferential** (LLM-based).

| Control | Type | Where |
|---|---|---|
| `CLAUDE.md` (this file) | guide / inferential | repo root |
| `.claude/guides/*` | guide / inferential | reference docs, read before invoking a related skill |
| `.claude/skills/*/SKILL.md` | guide / inferential | on-demand multi-step workflows |
| `.claude/agents/*.agent.md` | sensor / inferential | subagents |
| `src/harness/sensors/*` | sensor / computational | deterministic, produce JSON evidence |
| `pnpm lint && pnpm typecheck && pnpm test:run` | sensor / computational | pre-commit + CI |
| `pnpm e2e:smoke` | sensor / computational | CI on PR |
| `.github/workflows/qa-harness-reusable.yml` | sensor / computational | CI, reusable across Jahia repos |

The steering loop: when a recurring failure mode shows up, update the
harness (a guide, skill, or sensor) — don't just re-prompt around it. Use
`qa-capture` to route a freshly-learned lesson to the right place.

## 4. Default workflow for any task

1. Read this file, then any guide relevant to the pillar you're touching.
2. State your plan in one paragraph before editing.
3. Implement the smallest change that satisfies the request.
4. Run the relevant computational sensor before reporting done:
   `pnpm lint && pnpm typecheck && pnpm test:run`.
5. Surface anything you skipped, anything you guessed, and any new
   dependency you would need.

## 5. Where things go

```
qa-tool/
├── CLAUDE.md                          ← you are here
├── CONTRIBUTING.md                    ← how to add a skill/tool
├── .claude/
│   ├── skills/qa-*/SKILL.md
│   ├── agents/qa-*.agent.md
│   ├── guides/
│   └── templates/
├── src/
│   ├── dashboard/ core/ server/ failures/ stability/   ← Pillar 1
│   ├── harness/sensors/                                ← Pillar 2 sensors
│   ├── test-cases/                                     ← Pillar 3 (doc pointer)
│   ├── coverage/                                       ← Pillar 2 (doc pointer)
│   └── motivation/                                     ← Pillar 4 (stub)
├── docs/CAPABILITIES.md               ← generated, see §1
├── scripts/generate-capabilities.ts
├── tests/{unit,e2e}/
└── .github/workflows/
    ├── qa-harness-reusable.yml
    └── capabilities-check.yml
```
