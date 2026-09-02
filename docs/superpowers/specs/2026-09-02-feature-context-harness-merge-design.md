# Design: Merge feature-context-harness into qa-tool

**Date:** 2026-09-02
**Status:** Proposed
**Author:** Daniel Ebenberger (with Claude)

## Context

`qa-tool` and `feature-context-harness` are two personal repos, same owner, same
domain (Jahia QA), both explicitly modeled on the Fowler/Böckeler "harness
engineering" article (guides = feedforward, sensors = deterministic feedback,
skills = inferential/LLM-driven). `qa-tool` is actively developed (12 commits,
May–Sep 2026) and has a working CI dashboard app plus a prompt/skill/agent
layer. `feature-context-harness` is stalled (3 commits, all 2026-06-01) but
contributes real, non-overlapping capability: persona-based UAT, doc-staleness
review, a deterministic Cypress-suite adequacy sensor, and a working GitHub
Actions integration that posts PR comments and blocks merges on `.only`.

Both repos currently target **GitHub Copilot Chat**'s convention
(`.github/prompts/*.prompt.md`, `.github/copilot/*.prompt.md`,
`.github/copilot-instructions.md`). The QA team actually works via **Claude
Code**, whose native discovery convention is `.claude/skills/*/SKILL.md`,
`.claude/agents/*.agent.md`, and a root `CLAUDE.md`. This merge is also the
opportunity to convert to that native layout.

This design was produced as part of a two-phase analysis: Phase 1 (this doc)
merges the two personal repos; Phase 2 (separate, later) considers folding
mature pieces of the merged result into `Jahia/cortex`, the org-wide agentic
harness. Decisions here deliberately mirror Cortex's conventions
(`SKILL.md` frontmatter, `qa-`-style prefixing, a generated capability index)
so that a later Phase 2 move is a relocation, not a rewrite.

## Goals

1. `qa-tool` becomes the single surviving repo; `feature-context-harness` is
   archived (not deleted) once its content has landed.
2. Every skill/agent/sensor is discoverable by a human QA team member, not
   just by an agent guessing from a description — via a generated catalog.
3. No two capabilities in the merged repo do the same job under different
   names — genuine overlaps are consolidated; things that only *look* similar
   but serve different weights/use-cases stay distinct and are cross-linked.
4. The team can add new skills without reinventing existing ones, and without
   process overhead disproportionate to a <10-person contributor base.
5. feature-context-harness's working CI integration (PR comment + `.only`
   block) is preserved and becomes reusable by other Jahia repos, not just
   usable inside this one.

## Non-goals

- Building the `coverage`/`test-cases`/`motivation` pillars beyond their
  current state, except where feature-context-harness content fills them in.
- Adopting Cortex's heavier machinery (ADRs, `TOOL.md` contracts, CI-enforced
  lint) now — explicitly deferred (see "Deferred: heavier process").
- Any Phase 2 work (folding pieces into `Jahia/cortex`) — out of scope here.

## Decision 1 — Target directory layout

```
qa-tool/
├── CLAUDE.md                          # merges both repos' AGENTS.md + .github/copilot-instructions.md
├── CONTRIBUTING.md                    # new — how to add a skill, naming, review expectations
├── .claude/
│   ├── skills/
│   │   ├── qa-tldr/SKILL.md
│   │   ├── qa-bug-brief/SKILL.md
│   │   ├── qa-coverage-map/SKILL.md
│   │   ├── qa-define-testcases/SKILL.md       # unchanged behavior, relocated + renamed only
│   │   ├── qa-test-case-design/SKILL.md
│   │   ├── qa-dashboard-widget/SKILL.md       # unchanged, engineering-facing
│   │   ├── qa-ac-validate/SKILL.md            # from feature-context-harness
│   │   ├── qa-cypress-analyze/SKILL.md        # from feature-context-harness
│   │   ├── qa-persona-uat/SKILL.md            # from feature-context-harness
│   │   ├── qa-doc-review/SKILL.md             # from feature-context-harness
│   │   ├── qa-report/SKILL.md                 # from feature-context-harness
│   │   ├── qa-run/SKILL.md                    # from feature-context-harness (pipeline orchestrator)
│   │   └── qa-capture/SKILL.md                # new — contribution on-ramp
│   ├── agents/
│   │   ├── qa-pr-test-reviewer.agent.md       # was pr-test-reviewer.agent.md
│   │   └── qa-self-reviewer.agent.md          # was qa-reviewer.agent.md (renamed to disambiguate
│   │                                           # now that everything carries a qa- prefix)
│   ├── guides/
│   │   ├── jahia-qa-domain.md                 # was .github/instructions/qa-domain.instructions.md
│   │   ├── typescript-conventions.md          # was .github/instructions/typescript.instructions.md
│   │   ├── bootstrap-reference.md             # was .github/prompts/bootstrap-qa-tool.prompt.md
│   │   ├── ac-templates/{AC_GUIDE.md,AC_REFINEMENT_MEETING.md}
│   │   ├── doc-standards/{DOC_SOURCES_TEMPLATE.md,DOC_STANDARDS.md}
│   │   └── personas/{PERSONA_TEMPLATE.md,README.md,SCENARIO_PATTERNS.md,
│   │                 admin.md,compliance-user.md,content-editor.md,
│   │                 developer.md,site-builder.md}
│   └── templates/
│       └── {ac-matrix,doc-review,persona-ucat-pack,qa-report,test-adequacy-review}.md
├── src/harness/sensors/
│   ├── ac-validator/       (ported to TS + Vitest tests + SENSOR.md)
│   ├── cypress-analyzer/   (ported to TS + Vitest tests + SENSOR.md)
│   └── doc-reviewer/       (ported to TS + Vitest tests + SENSOR.md)
├── src/dashboard/ src/core/ src/server/ src/failures/ src/stability/   # unchanged — Pillar 1
├── src/motivation/README.md                                            # unchanged stub
├── docs/CAPABILITIES.md               # generated — see Decision 4
├── scripts/generate-capabilities.ts   # new
└── .github/workflows/
    ├── qa-harness-reusable.yml        # was feature-context-harness's qa-harness.yml, generalized
    └── capabilities-check.yml         # new — fails CI if CAPABILITIES.md is stale
```

Removed once migrated: `AGENTS.md`, `.github/copilot-instructions.md`,
`.github/instructions/`, `.github/prompts/`, `.github/skills/` (old
locations), and (from feature-context-harness) `harness/`, `templates/`,
`.github/copilot/`.

`bootstrap-qa-tool.prompt.md` is reclassified from a skill to a guide — it's
scaffold history a reader consults, not a workflow anyone invokes, so it
belongs with feedforward reference material, not alongside `qa-run` or
`qa-tldr`.

## Decision 2 — Pillar reframing

Pillar 2 ("Coverage Analysis") expands to **"Feature Validation"**, housing
the full pipeline: `qa-run` → `qa-ac-validate` → `qa-cypress-analyze` →
`qa-persona-uat` → `qa-doc-review` → `qa-report`, plus the three sensors. This
keeps the six-stage pipeline whole rather than fragmenting it across
unrelated pillars. `qa-coverage-map` (macro, repo-wide, exploratory) stays in
this pillar alongside it, cross-linked but not merged — see Decision 3.

Meta/engineering tools that produce artifacts *about the harness itself*
rather than QA output — `qa-dashboard-widget`, `qa-self-reviewer`,
`qa-pr-test-reviewer`, `qa-capture` — get their own catalog grouping,
**"Harness Engineering"**, rather than being forced into one of the four
product-facing pillars where they don't conceptually belong.

Final pillar/grouping table:

| Group | Contents |
|---|---|
| Pillar 1 — CI Insight | dashboard app (`src/dashboard`, `src/core`, `src/server`, `src/failures`, `src/stability`) |
| Pillar 2 — Feature Validation | `qa-run`, `qa-ac-validate`, `qa-cypress-analyze`, `qa-persona-uat`, `qa-doc-review`, `qa-report`, `qa-coverage-map`, 3 sensors |
| Pillar 3 — Test-Case Identification | `qa-tldr`, `qa-bug-brief`, `qa-define-testcases`, `qa-test-case-design` |
| Pillar 4 — Team Motivation | unchanged stub (`src/motivation/README.md`) |
| Harness Engineering | `qa-dashboard-widget`, `qa-self-reviewer`, `qa-pr-test-reviewer`, `qa-capture` |

## Decision 3 — Overlap resolution

**The one real duplicate — resolved by consolidation:** none. Original
analysis proposed folding `qa-define-testcases` into the AC-refinement flow;
**rejected** — `define-testcases` is a high-frequency, low-ceremony daily tool
("ticket arrives without sufficient test coverage, draft cases now") and
`test-case-design`'s own description already documents the intended
relationship ("when `/define-testcases` needs to be expanded into a deeper
artefact set"). Collapsing it into a heavier structured flow would have made
the most-used tool harder to reach. **Decision: `qa-define-testcases` is
relocated and renamed only — behavior, invocation, and output format
unchanged.**

**Kept distinct, cross-linked (not merged):**

| A | B | Why distinct |
|---|---|---|
| `qa-coverage-map` (macro, whole-repo, exploratory, LLM-inferred) | `qa-cypress-analyze` + `qa-ac-validate` (micro, PR/diff-scoped, deterministic sensor + LLM validation, CI-gate-oriented) | Different altitude and different trigger — one is "how healthy is this repo's testing overall," the other is "is this specific change adequately covered before merge." |
| `qa-define-testcases` (fast draft, ad hoc) | `qa-ac-validate` REFINEMENT mode (formal AC drafting, feeds a traceable matrix) | Different weight — quick daily tool vs. pipeline-stage artifact meant for release-level traceability. |

Both pairs get an explicit `see_also` frontmatter field (Decision 4) and a
"when to use" column in the generated catalog, so the disambiguation lives in
one generated place instead of being re-explained in each `SKILL.md`.

## Decision 4 — Capability catalog

Every skill, agent, and sensor carries the same YAML frontmatter block —
sensors get a new `SENSOR.md` alongside their script so the generator has one
consistent shape to scan (sensors are plain TS, not Markdown, so they can't
carry frontmatter directly):

```yaml
---
name: qa-define-testcases
description: Draft test cases fast when a ticket lacks sufficient test coverage.
kind: skill              # skill | agent | sensor
pillar: test-case-identification
version: 1.0
see_also: [qa-test-case-design]
---
```

`scripts/generate-capabilities.ts` scans `.claude/skills/*/SKILL.md`,
`.claude/agents/*.agent.md`, and `src/harness/sensors/*/SENSOR.md`, and
regenerates `docs/CAPABILITIES.md` as a table grouped by pillar (name / kind /
one-liner / see-also). The generated file is committed; `docs/CAPABILITIES.md`
is never hand-edited directly — that's what causes catalog drift.
`.github/workflows/capabilities-check.yml` reruns the generator in CI and
fails the PR if the committed file doesn't match, so drift is caught
mechanically rather than relying on reviewer discipline.

## Decision 5 — CI sensors as a reusable GitHub Action

`feature-context-harness/.github/workflows/qa-harness.yml` (runs sensors
inline, posts/refreshes a PR comment, blocks merge on `.only`) becomes
`.github/workflows/qa-harness-reusable.yml` in `qa-tool`, converted to a
`workflow_call` reusable workflow parameterized by `cypress-path`,
`enable-doc-review`, and `fail-on-only`. Other Jahia repos adopt it with:

```yaml
jobs:
  qa-harness:
    uses: Jahia/qa-tool/.github/workflows/qa-harness-reusable.yml@qa-harness-v1
    with:
      cypress-path: tests/cypress/e2e
```

Consumers pin to a **release tag** (`@qa-harness-v1`), not `@main` — this
workflow becomes an interface other repos' CI depends on, so a breaking change
in `qa-tool`'s `main` must not silently break someone else's pipeline. The
sensors stay dependency-free TypeScript/Node specifically so the reusable
workflow can run them via a pinned/sparse checkout of `qa-tool` without
installing the whole dashboard app.

## Decision 6 — Governance and contribution loop

Adopted now (cheap, directly solves the stated problems):

- **`qa-` naming prefix**, kebab-case, on every skill/agent — already true for
  most of feature-context-harness's prompts, applied to the rest during
  migration. Removes any future collision risk if pieces move into Cortex's
  `.claude/skills/` (which prefixes everything `jahia-*`).
- **Generated catalog** (Decision 4) as the discoverability mechanism.
- **`version` field** in frontmatter — minor bump for behavior changes, major
  for breaking changes to expected input/output. No separate changelog file.
- **PR review is the governance gate.** No new tooling — every new/changed
  skill goes through a normal PR; the QA manager is the natural first-pass
  reviewer given team size.
- **`qa-capture` skill** (new): the on-ramp for "I just worked out X the hard
  way." Interviews the contributor briefly, drafts a correctly-named
  `SKILL.md` stub with frontmatter in the right pillar, and tells them to open
  a PR. It does not auto-open PRs itself — the human-reviews-before-it-ships
  gate stays intact.
- **`CONTRIBUTING.md`** documents all of the above on one page, plus the
  explicit deferral triggers below.

### Deferred: heavier process

Not adopted now: ADRs, `TOOL.md`-style stable contracts per tool, CI-enforced
frontmatter/shape linting. These are real value at Cortex's scale (42 skills,
14 tools, 6 authors) but disproportionate overhead for <10 contributors and a
much smaller capability set. Revisit when either trigger is hit: **>15
skills**, or **the catalog generator itself needs a stable interface** (i.e.
something external starts depending on `CAPABILITIES.md`'s exact shape).

## Decision 7 — Migration and rollout plan

**Step 0 — Safety net.** Tag `pre-merge` on both repos' current `main`.
Branch in `qa-tool`: `merge/feature-context-harness`. Nothing is destructive
before Step 4.

**Step 1 — Bring history across.** `git subtree merge` feature-context-harness
into the branch rather than a flat copy, preserving file history/blame.

**Step 2 — Restructure** (dependency order):
1. Merge both `AGENTS.md` files + `.github/copilot-instructions.md` into one
   `CLAUDE.md`.
2. Move/rename qa-tool's prompts and skills into `.claude/skills/qa-*/SKILL.md`
   (per Decision 1's table); `qa-define-testcases` moves unchanged.
3. Move `.github/agents/*.agent.md` → `.claude/agents/qa-*.agent.md`.
4. Move feature-context-harness's six `.github/copilot/*.prompt.md` skills →
   `.claude/skills/qa-*/SKILL.md` — no renames needed, already `qa-`-prefixed.
5. Move `harness/guides/*` → `.claude/guides/*`, `templates/*` →
   `.claude/templates/*`.
6. **Port `harness/sensors/*.js` → TypeScript under `src/harness/sensors/`,
   with Vitest unit tests.** The one step with real implementation risk —
   ported sensors must behave identically (including the `.only`-detection
   path that gates CI) for the reusable workflow to keep working.
7. Add `SENSOR.md` per sensor; write and run `scripts/generate-capabilities.ts`;
   commit generated `docs/CAPABILITIES.md`.
8. Add `capabilities-check.yml` and `qa-harness-reusable.yml`.
9. Write `qa-capture` skill and `CONTRIBUTING.md`.
10. Rewrite root `README.md` around the pillar table in Decision 2, linking to
    `CAPABILITIES.md`.
11. Delete obsolete paths listed at the end of Decision 1.

**Step 3 — Validate before merging to `main`:**
- qa-tool's existing Vitest + Playwright suites stay green (proves Pillar 1's
  app is untouched).
- New unit tests for the ported sensors.
- Regenerate and eyeball `CAPABILITIES.md` for completeness and standalone
  clarity of each description.
- Dogfood `qa-harness-reusable.yml` against a real Cypress suite — confirm the
  PR-comment and `.only`-block behavior matches feature-context-harness's
  original exactly. This is the one place the `workflow_call` refactor could
  silently break checkout/path logic.
- 1–2 squad members smoke-test the branch in Claude Code — confirm
  `qa-define-testcases`, `qa-tldr`, `qa-run`, etc. are discoverable and behave
  as before. This manual check matters more here than any automated test,
  since discoverability was the point of the exercise.

**Step 4 — Cutover.** Merge to `main`; tag `qa-harness-v1`. Update
feature-context-harness's `README.md` with a pointer to `qa-tool`, then
**archive** the repo on GitHub (read-only, reversible, not deleted).

**Step 5 — Rollout.** One announcement pointing at `CLAUDE.md` and
`docs/CAPABILITIES.md`, plus a line on `qa-capture` as "how to propose the
next one." Adoption is `git pull` — no install step, since interaction is via
Claude Code against the repo directly.

**Rollback.** Everything lives on a branch until Step 4; `pre-merge` tags give
a clean revert point; the reusable workflow is tag-pinned so a bad `main`
commit can't break already-adopted consumers until they bump the tag;
archiving (not deleting) feature-context-harness means nothing is
unrecoverable.

## Risks

- **Sensor port introduces behavioral drift.** Mitigated by Step 3's explicit
  dogfooding against a real Cypress suite before cutover, not just unit tests
  of the ported logic in isolation.
- **Reusable workflow refactor breaks other repos' CI silently.** Mitigated
  by tag-pinning (Decision 5) rather than `@main`.
- **Catalog goes stale immediately after launch.** Mitigated by
  `capabilities-check.yml` (Decision 4) — mechanical enforcement, not
  discipline.
- **`qa-define-testcases` gets renamed but muscle memory / any downstream
  reference to its old prompt path breaks.** Scope explicitly confirmed with
  the repo owner: only the file path/prefix changes, not the invocation
  content, output format, or the tool's behavior.
