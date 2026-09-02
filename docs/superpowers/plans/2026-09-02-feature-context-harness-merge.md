# Feature-Context-Harness Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `danielaebenberger/feature-context-harness` into `danielaebenberger/qa-tool`, converting both from GitHub Copilot's `.github/prompts` convention to Claude Code's native `.claude/skills` convention, deduplicating overlapping capabilities, porting three JS sensors to typed/tested TypeScript, adding a generated capability catalog with CI enforcement, and exposing the CI sensors as a reusable, version-pinned GitHub Actions workflow.

**Architecture:** All work happens on the existing branch `merge/feature-context-harness-design` in the local clone at `/private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/qa-tool` (already pushed to `origin`, currently containing only the design-spec commit). `feature-context-harness`'s history is pulled in via `git subtree`, then files are relocated task-by-task into the target `.claude/` layout. The three sensors move from plain Node/CommonJS to typed ESM TypeScript with Vitest coverage. A generated `docs/CAPABILITIES.md` (never hand-edited) becomes the human-facing catalog. `main` is only touched in the final cutover task, which requires explicit human go-ahead.

**Tech Stack:** TypeScript (strict, ESM), Vitest, pnpm, tsx, GitHub Actions (`workflow_call` reusable workflows), Node.js ≥ 20.

**Spec:** `docs/superpowers/specs/2026-09-02-feature-context-harness-merge-design.md`

## Global Constraints

- Ask before installing new dependencies (npm package, system package) — from `AGENTS.md` §2, carried into `CLAUDE.md`. **This plan introduces zero new npm dependencies** — the frontmatter parser and capability generator are hand-written (no `gray-matter`/`js-yaml`), consistent with this constraint.
- Strict TypeScript only. No `any` without an inline justification comment. Prefer `unknown` + narrowing.
- No silent fallbacks — CI-data-dependent surfaces must show empty/error/loading states, never fake numbers. Sensors must never emit a false "PASS".
- Every skill/agent/sensor carries the frontmatter schema from spec Decision 4 (`name`, `description`, `kind`, `pillar`, `version`, optional `see_also`) — no exceptions.
- `qa-define-testcases` moves with **zero behavioral change** — file path and `name`/`kind`/`pillar`/`version` frontmatter only; body content is copied verbatim (spec Decision 3, confirmed with repo owner).
- Sensors ported to TypeScript are no longer literally "zero-dependency Node scripts" (the JS originals' framing) — this is a disclosed, deliberate trade-off for typing/testability. The reusable CI workflow (Task 15) preserves the *spirit* of spec Decision 5 ("without installing the whole dashboard app") by installing only the `tsx` CLI globally, not the full pnpm workspace.
- Commit after every task. Small, reviewable diffs — one task, one concern.

---

## Task 1: Safety-net tags

**Files:** none (git operations only)

**Interfaces:** N/A

- [ ] **Step 1: Tag current `main` on both repos before any destructive-adjacent work**

```bash
cd /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/qa-tool
git tag pre-merge main
git push origin pre-merge

cd /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/feature-context-harness
git tag pre-merge feature/qa-harness-initial
git push origin pre-merge
```

(feature-context-harness's default/active branch is `feature/qa-harness-initial`, not `main` — it never had a `main` branch. Every later step in this plan that references feature-context-harness's branch uses `feature/qa-harness-initial`; `main` throughout this plan refers only to qa-tool's default branch.)

- [ ] **Step 2: Verify tags exist on both remotes**

Run: `git ls-remote --tags origin` in each repo.
Expected: `pre-merge` listed in both.

- [ ] **Step 3: Confirm the working branch is checked out in qa-tool**

```bash
cd /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/qa-tool
git status
```

Expected: `On branch merge/feature-context-harness-design`, clean tree (the design-spec commit is already there — nothing to commit here).

---

## Task 2: Pull feature-context-harness history into the branch

**Files:**
- Creates (temporarily, at repo root): `harness/`, `templates/`, `.github/copilot/`, `.github/workflows/qa-harness.yml`, `AGENTS.md` conflict (feature-context-harness's own, see below)

**Interfaces:** N/A

- [ ] **Step 1: Add feature-context-harness as a subtree under a staging prefix**

```bash
cd /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/qa-tool
git remote add fch-origin /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/feature-context-harness
git fetch fch-origin
git subtree add --prefix=_incoming/feature-context-harness fch-origin feature/qa-harness-initial -m "chore: pull in feature-context-harness history via subtree"
```

- [ ] **Step 2: Verify the staged content landed under `_incoming/`**

Run: `find _incoming/feature-context-harness -maxdepth 2`
Expected: `AGENTS.md`, `README.md`, `LICENSE`, `harness/`, `templates/`, `.github/` all present under the prefix — nothing at repo root was touched.

- [ ] **Step 3: Remove the temporary remote (history is already pulled in, remote no longer needed)**

```bash
git remote remove fch-origin
```

- [ ] **Step 4: Commit is already made by `git subtree add` — verify log**

Run: `git log --oneline -3`
Expected: top commit is the subtree-add commit from Step 1.

*(Every later task moves files out of `_incoming/feature-context-harness/...` into their final `.claude/` locations with `git mv`, preserving the history `git subtree` brought in. `_incoming/` itself is deleted once empty — see Task 19.)*

---

## Task 3: Root `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`
- Delete: `AGENTS.md`
- Delete: `.github/copilot-instructions.md`

**Interfaces:**
- Produces: the root context file Claude Code loads automatically. Later tasks (5, 6, 7, 16) update its "Where things go" tree section as they land — this task establishes the file and its structure; those tasks each touch only their own added lines.

- [ ] **Step 1: Write `CLAUDE.md`**, merging `AGENTS.md`'s hard constraints/workflow/directory-map with `_incoming/feature-context-harness/AGENTS.md`'s pipeline description and `.github/copilot-instructions.md`'s quick reminders:

```markdown
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
```

- [ ] **Step 2: Delete the two superseded files**

```bash
git rm AGENTS.md .github/copilot-instructions.md
```

- [ ] **Step 3: Verify no other file still links to the deleted paths**

Run: `grep -rl "AGENTS.md\|copilot-instructions" --include="*.md" . --exclude-dir=_incoming --exclude-dir=node_modules --exclude-dir=.git`
Expected: no output (or only this task's own `CLAUDE.md`, which references itself correctly — re-check any hit manually).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: replace AGENTS.md + copilot-instructions.md with CLAUDE.md"
```

---

## Task 4: Move qa-domain and TypeScript guides

**Files:**
- Move: `.github/instructions/qa-domain.instructions.md` → `.claude/guides/jahia-qa-domain.md`
- Move: `.github/instructions/typescript.instructions.md` → `.claude/guides/typescript-conventions.md`
- Move: `.github/prompts/bootstrap-qa-tool.prompt.md` → `.claude/guides/bootstrap-reference.md`

**Interfaces:** N/A — these are reference guides, not invoked skills, so they carry no frontmatter schema (guides are prose, not catalog entries).

- [ ] **Step 1: Move the files**

```bash
mkdir -p .claude/guides
git mv .github/instructions/qa-domain.instructions.md .claude/guides/jahia-qa-domain.md
git mv .github/instructions/typescript.instructions.md .claude/guides/typescript-conventions.md
git mv .github/prompts/bootstrap-qa-tool.prompt.md .claude/guides/bootstrap-reference.md
rmdir .github/instructions 2>/dev/null || true
```

- [ ] **Step 2: Strip the Copilot-specific frontmatter from `bootstrap-reference.md`**

Its old frontmatter was:
```yaml
---
description: "Reference prompt capturing the original scaffold decisions for qa-tool. Useful context when adding major new structure."
mode: agent
---
```
Replace with a plain heading (guides don't carry the skill frontmatter schema):
```markdown
# Bootstrap reference — `qa-tool`

> Historical scaffold decisions, kept for context when adding major new structure.
```
(Keep everything below the original's first heading unchanged — this is a metadata-only edit.)

- [ ] **Step 3: Verify old paths are gone, new ones exist**

Run: `ls .claude/guides/ && ls .github/instructions 2>&1`
Expected: three files listed under `.claude/guides/`; `.github/instructions` reports "No such file or directory".

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: move qa-domain/typescript/bootstrap guides to .claude/guides"
```

---

## Task 5: Convert qa-tool's ticket-facing prompts to `.claude/skills`

**Files:**
- Move: `.github/prompts/tldr.prompt.md` → `.claude/skills/qa-tldr/SKILL.md`
- Move: `.github/prompts/bug-brief.prompt.md` → `.claude/skills/qa-bug-brief/SKILL.md`
- Move: `.github/prompts/coverage-map.prompt.md` → `.claude/skills/qa-coverage-map/SKILL.md`
- Move: `.github/prompts/define-testcases.prompt.md` → `.claude/skills/qa-define-testcases/SKILL.md`
- Move: `.github/skills/test-case-design/SKILL.md` → `.claude/skills/qa-test-case-design/SKILL.md`
- Move: `.github/skills/qa-dashboard-widget/SKILL.md` → `.claude/skills/qa-dashboard-widget/SKILL.md`

**Interfaces:**
- Produces: six `SKILL.md` files, each with frontmatter conforming to spec Decision 4's schema (`name`, `description`, `kind: skill`, `pillar`, `version`, optional `see_also`) — this is the exact schema `scripts/generate-capabilities.ts` (Task 13) parses.

- [ ] **Step 1: Move the files into place**

```bash
mkdir -p .claude/skills/qa-tldr .claude/skills/qa-bug-brief .claude/skills/qa-coverage-map \
         .claude/skills/qa-define-testcases .claude/skills/qa-test-case-design .claude/skills/qa-dashboard-widget

git mv .github/prompts/tldr.prompt.md .claude/skills/qa-tldr/SKILL.md
git mv .github/prompts/bug-brief.prompt.md .claude/skills/qa-bug-brief/SKILL.md
git mv .github/prompts/coverage-map.prompt.md .claude/skills/qa-coverage-map/SKILL.md
git mv .github/prompts/define-testcases.prompt.md .claude/skills/qa-define-testcases/SKILL.md
git mv .github/skills/test-case-design/SKILL.md .claude/skills/qa-test-case-design/SKILL.md
git mv .github/skills/qa-dashboard-widget/SKILL.md .claude/skills/qa-dashboard-widget/SKILL.md
rmdir .github/prompts .github/skills/test-case-design .github/skills/qa-dashboard-widget .github/skills 2>/dev/null || true
```

- [ ] **Step 2: Replace each file's frontmatter block** (the body below the frontmatter is untouched — copied verbatim, per the Global Constraints "zero behavioral change" rule for `qa-define-testcases` and, by the same logic, for the others' content):

| File | Old frontmatter had | New frontmatter (replace the whole `---...---` block with this) |
|---|---|---|
| `qa-tldr/SKILL.md` | `description` only | `name: qa-tldr`<br>`description: "Digest a verbose GitHub issue/PR, Jira ticket, or AI-generated description into a fast, practical summary before deciding what QA work it actually needs."`<br>`kind: skill`<br>`pillar: test-case-identification`<br>`version: "1.0"` |
| `qa-bug-brief/SKILL.md` | `description` only | `name: qa-bug-brief`<br>`description: "Rewrite a verbose bug ticket — or draft a new one from a raw report — into a compact, accurate brief with a scannable 'At a glance' summary plus the standard bug structure, so a time-constrained QA/PO can judge relevance and priority in seconds."`<br>`kind: skill`<br>`pillar: test-case-identification`<br>`version: "1.0"` |
| `qa-coverage-map/SKILL.md` | `description` only | `name: qa-coverage-map`<br>`description: "Build a coverage map for one Jahia repository — a per-area view, not a single coverage number."`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"`<br>`see_also: [qa-cypress-analyze, qa-ac-validate]` |
| `qa-define-testcases/SKILL.md` | `description` only | `name: qa-define-testcases`<br>`description: "Help a QA engineer identify, draft, and challenge test cases for a Jahia story or bug ticket. Use during refinement or the test phase of a ticket."`<br>`kind: skill`<br>`pillar: test-case-identification`<br>`version: "1.0"`<br>`see_also: [qa-test-case-design]` |
| `qa-test-case-design/SKILL.md` | `name: test-case-design`, `description` | `name: qa-test-case-design`<br>`description: "Multi-step workflow for designing a coherent set of test cases for a Jahia feature: risk storming → case generation → trace matrix → review checklist. Use when a QA engineer needs more than a one-shot list, or when qa-define-testcases needs to be expanded into a deeper artefact set."`<br>`kind: skill`<br>`pillar: test-case-identification`<br>`version: "1.0"`<br>`see_also: [qa-define-testcases]` |
| `qa-dashboard-widget/SKILL.md` | `name: qa-dashboard-widget`, `description` | `name: qa-dashboard-widget`<br>`description: "End-to-end workflow for adding a new widget to the qa-tool dashboard: data source → typed contract → component → tests → wiring. Use when implementing a new metric, stability indicator, or motivation surface inside qa-tool/src/dashboard/."`<br>`kind: skill`<br>`pillar: harness-engineering`<br>`version: "1.0"` |

(The old `mode: agent` field used by Copilot's prompt format is dropped — it has no meaning for Claude Code and isn't part of the Decision 4 schema.)

- [ ] **Step 3: Verify frontmatter is valid on all six files**

Run: `for f in .claude/skills/qa-{tldr,bug-brief,coverage-map,define-testcases,test-case-design,dashboard-widget}/SKILL.md; do echo "-- $f --"; sed -n '1,8p' "$f"; done`
Expected: each shows a `---`-delimited block containing `name`, `description`, `kind: skill`, `pillar`, `version`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: convert qa-tool prompts/skills to .claude/skills with catalog frontmatter"
```

---

## Task 6: Convert qa-tool's agents to `.claude/agents`

**Files:**
- Move: `.github/agents/pr-test-reviewer.agent.md` → `.claude/agents/qa-pr-test-reviewer.agent.md`
- Move: `.github/agents/qa-reviewer.agent.md` → `.claude/agents/qa-self-reviewer.agent.md`

**Interfaces:**
- Produces: two `.agent.md` files with `kind: agent` frontmatter, discovered by Task 13's generator alongside skills.

- [ ] **Step 1: Move the files**

```bash
mkdir -p .claude/agents
git mv .github/agents/pr-test-reviewer.agent.md .claude/agents/qa-pr-test-reviewer.agent.md
git mv .github/agents/qa-reviewer.agent.md .claude/agents/qa-self-reviewer.agent.md
rmdir .github/agents 2>/dev/null || true
```

- [ ] **Step 2: Update/add frontmatter on both** (replace existing frontmatter block; body unchanged):

`qa-pr-test-reviewer.agent.md`:
```yaml
---
name: qa-pr-test-reviewer
description: "Read-only subagent that reviews test PRs across any Jahia repo for coverage fit, convention fit, and cross-repo idiom consistency."
kind: agent
pillar: harness-engineering
version: "1.0"
---
```

`qa-self-reviewer.agent.md`:
```yaml
---
name: qa-self-reviewer
description: "Read-only subagent that reviews changes to qa-tool itself against the five pillar goals and CLAUDE.md's hard constraints."
kind: agent
pillar: harness-engineering
version: "1.0"
---
```

(Renamed from `qa-reviewer` to `qa-self-reviewer` per spec Decision 1, to disambiguate now that every skill/agent carries the `qa-` prefix — "qa-reviewer" no longer distinguishes "reviews this repo" from "does QA review work generally".)

- [ ] **Step 3: Search for any other file referencing the old agent names, update references**

Run: `grep -rl "qa-reviewer\.agent\|pr-test-reviewer\.agent" --include="*.md" . --exclude-dir=_incoming --exclude-dir=.git --exclude-dir=node_modules`
Expected: only `CLAUDE.md` (already updated in Task 3) and the two moved files themselves. Fix any other hit found.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: convert qa-tool agents to .claude/agents, rename qa-reviewer to qa-self-reviewer"
```

---

## Task 7: Convert feature-context-harness's six pipeline skills

**Files:**
- Move: `_incoming/feature-context-harness/.github/copilot/qa-ac-validate.prompt.md` → `.claude/skills/qa-ac-validate/SKILL.md`
- Move: `_incoming/feature-context-harness/.github/copilot/qa-cypress-analyze.prompt.md` → `.claude/skills/qa-cypress-analyze/SKILL.md`
- Move: `_incoming/feature-context-harness/.github/copilot/qa-doc-review.prompt.md` → `.claude/skills/qa-doc-review/SKILL.md`
- Move: `_incoming/feature-context-harness/.github/copilot/qa-persona-uat.prompt.md` → `.claude/skills/qa-persona-uat/SKILL.md`
- Move: `_incoming/feature-context-harness/.github/copilot/qa-report.prompt.md` → `.claude/skills/qa-report/SKILL.md`
- Move: `_incoming/feature-context-harness/.github/copilot/qa-run.prompt.md` → `.claude/skills/qa-run/SKILL.md`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: six `SKILL.md` files under the Pillar 2 ("Feature Validation") group, discovered by Task 13's generator. Their bodies reference `harness/guides/...` and `harness/sensors/...` paths that Tasks 8–11 relocate — Step 3 below fixes those references.

- [ ] **Step 1: Move the files**

```bash
mkdir -p .claude/skills/qa-ac-validate .claude/skills/qa-cypress-analyze .claude/skills/qa-doc-review \
         .claude/skills/qa-persona-uat .claude/skills/qa-report .claude/skills/qa-run

git mv _incoming/feature-context-harness/.github/copilot/qa-ac-validate.prompt.md .claude/skills/qa-ac-validate/SKILL.md
git mv _incoming/feature-context-harness/.github/copilot/qa-cypress-analyze.prompt.md .claude/skills/qa-cypress-analyze/SKILL.md
git mv _incoming/feature-context-harness/.github/copilot/qa-doc-review.prompt.md .claude/skills/qa-doc-review/SKILL.md
git mv _incoming/feature-context-harness/.github/copilot/qa-persona-uat.prompt.md .claude/skills/qa-persona-uat/SKILL.md
git mv _incoming/feature-context-harness/.github/copilot/qa-report.prompt.md .claude/skills/qa-report/SKILL.md
git mv _incoming/feature-context-harness/.github/copilot/qa-run.prompt.md .claude/skills/qa-run/SKILL.md

rmdir _incoming/feature-context-harness/.github/copilot 2>/dev/null || true
```

*(The `.github/copilot/` directory is now empty — removed here rather than left dangling, since Task 15 later needs `_incoming/feature-context-harness/.github/` to contain only `workflows/qa-harness.yml` so its own cleanup can fully remove `.github/` once that file is gone.)*

- [ ] **Step 2: Normalize frontmatter on all six** — these already carry `name`-equivalent info in their `description` prose (e.g. "Pillar A — Acceptance Criteria Validation") but use the Copilot `mode: agent` field, not the Decision 4 schema. Replace each frontmatter block, keeping the existing `description` text verbatim and adding the missing fields:

| File | Add these fields (keep existing `description` text as-is) |
|---|---|
| `qa-ac-validate/SKILL.md` | `name: qa-ac-validate`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"`<br>`see_also: [qa-define-testcases, qa-coverage-map]` |
| `qa-cypress-analyze/SKILL.md` | `name: qa-cypress-analyze`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"`<br>`see_also: [qa-coverage-map]` |
| `qa-doc-review/SKILL.md` | `name: qa-doc-review`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"` |
| `qa-persona-uat/SKILL.md` | `name: qa-persona-uat`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"` |
| `qa-report/SKILL.md` | `name: qa-report`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"` |
| `qa-run/SKILL.md` | `name: qa-run`<br>`kind: skill`<br>`pillar: feature-validation`<br>`version: "1.0"` |

Drop the old `mode: agent` field and (on `qa-report/SKILL.md`, which had a trailing `tools:` line per the earlier grep output) any Copilot-specific `tools:` key — it has no Claude Code equivalent in this schema.

- [ ] **Step 3: Fix path references inside each file's body** — every one of these six files references `harness/guides/...`, `harness/sensors/...`, or `templates/...` paths from the old repo layout. Update them to the Task 8–11 target paths:

```bash
for f in .claude/skills/qa-ac-validate/SKILL.md .claude/skills/qa-cypress-analyze/SKILL.md \
         .claude/skills/qa-doc-review/SKILL.md .claude/skills/qa-persona-uat/SKILL.md \
         .claude/skills/qa-report/SKILL.md .claude/skills/qa-run/SKILL.md; do
  sed -i.bak \
    -e 's#harness/guides/#\.claude/guides/#g' \
    -e 's#harness/sensors/\([a-z-]*\)/\1\.js#src/harness/sensors/\1/\1.ts#g' \
    -e 's#^templates/#.claude/templates/#g' \
    -e 's#`templates/#`.claude/templates/#g' \
    "$f"
  rm "${f}.bak"
done
```

- [ ] **Step 4: Verify no stale path references remain**

Run: `grep -rn "harness/guides\|harness/sensors\|^templates/" .claude/skills/qa-{ac-validate,cypress-analyze,doc-review,persona-uat,report,run}/SKILL.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: convert feature-context-harness pipeline prompts to .claude/skills"
```

---

## Task 8: Move guides, personas, and templates

**Files:**
- Move: `_incoming/feature-context-harness/harness/guides/ac-templates/*` → `.claude/guides/ac-templates/*`
- Move: `_incoming/feature-context-harness/harness/guides/doc-standards/*` → `.claude/guides/doc-standards/*`
- Move: `_incoming/feature-context-harness/harness/guides/personas/*` → `.claude/guides/personas/*`
- Move: `_incoming/feature-context-harness/templates/*` → `.claude/templates/*`

**Interfaces:** N/A — plain reference/template files, no frontmatter schema.

- [ ] **Step 1: Move the directories**

```bash
mkdir -p .claude/guides/ac-templates .claude/guides/doc-standards .claude/guides/personas .claude/templates

git mv _incoming/feature-context-harness/harness/guides/ac-templates/AC_GUIDE.md .claude/guides/ac-templates/
git mv _incoming/feature-context-harness/harness/guides/ac-templates/AC_REFINEMENT_MEETING.md .claude/guides/ac-templates/

git mv _incoming/feature-context-harness/harness/guides/doc-standards/DOC_SOURCES_TEMPLATE.md .claude/guides/doc-standards/
git mv _incoming/feature-context-harness/harness/guides/doc-standards/DOC_STANDARDS.md .claude/guides/doc-standards/

git mv _incoming/feature-context-harness/harness/guides/personas/PERSONA_TEMPLATE.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/README.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/SCENARIO_PATTERNS.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/admin.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/compliance-user.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/content-editor.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/developer.md .claude/guides/personas/
git mv _incoming/feature-context-harness/harness/guides/personas/site-builder.md .claude/guides/personas/

git mv _incoming/feature-context-harness/templates/ac-matrix.md .claude/templates/
git mv _incoming/feature-context-harness/templates/doc-review.md .claude/templates/
git mv _incoming/feature-context-harness/templates/persona-ucat-pack.md .claude/templates/
git mv _incoming/feature-context-harness/templates/qa-report.md .claude/templates/
git mv _incoming/feature-context-harness/templates/test-adequacy-review.md .claude/templates/

rmdir _incoming/feature-context-harness/harness/guides/ac-templates \
      _incoming/feature-context-harness/harness/guides/doc-standards \
      _incoming/feature-context-harness/harness/guides/personas \
      _incoming/feature-context-harness/harness/guides \
      _incoming/feature-context-harness/templates 2>/dev/null || true
```

- [ ] **Step 2: Verify counts match** (12 guide files: 2 ac-templates + 2 doc-standards + 8 personas, 5 template files)

Run: `find .claude/guides/ac-templates .claude/guides/doc-standards .claude/guides/personas -type f | wc -l && find .claude/templates -type f | wc -l`
Expected: `12` then `5`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: move personas/guides/templates from feature-context-harness into .claude/"
```

---

## Task 9: Port `ac-validator` sensor to TypeScript

**Files:**
- Create: `src/harness/sensors/ac-validator/ac-validator.ts`
- Create: `tests/unit/sensors/ac-validator.test.ts`
- Delete (Task 12 adds `SENSOR.md` here instead): `_incoming/feature-context-harness/harness/sensors/ac-validator/ac-validator.js`, `_incoming/feature-context-harness/harness/sensors/ac-validator/README.md`

**Interfaces:**
- Produces: `parseTestFile(filePath: string, cwd: string): TestFileEntry`, `findCypressFiles(dir: string): string[]`, `matchesFeature(entry: TestFileEntry, keyword: string | null): boolean`, `buildAcInventory(testsDir: string, featureKeyword: string | null, cwd?: string): AcInventorySummary` — all exported from `ac-validator.ts`. `AcInventorySummary` and `TestFileEntry` are the shapes Task 12's `SENSOR.md` documents and Task 15's reusable workflow's `--output` JSON matches.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/sensors/ac-validator.test.ts
import { describe, it, expect } from 'vitest';
import { parseTestFile, matchesFeature, buildAcInventory } from '../../../src/harness/sensors/ac-validator/ac-validator';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeTempCypressDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ac-validator-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const full = join(dir, relPath);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return dir;
}

describe('parseTestFile', () => {
  it('extracts describe/it blocks and data-sel-role selectors', () => {
    const dir = makeTempCypressDir({
      'versioning.cy.ts': `
        describe('Versioning', () => {
          before(() => { cy.apollo({ mutation: 'create' }); });
          it('publishes a new version', () => {
            cy.get('[data-sel-role="publish-button"]').click();
          });
          after(() => { cy.logout(); });
        });
      `,
    });
    try {
      const entry = parseTestFile(join(dir, 'versioning.cy.ts'), dir);
      expect(entry.describes).toEqual(['Versioning']);
      expect(entry.its).toEqual(['publishes a new version']);
      expect(entry.selRoles).toEqual(['publish-button']);
      expect(entry.setup.hasBefore).toBe(true);
      expect(entry.setup.hasAfter).toBe(true);
      expect(entry.setup.hasApollo).toBe(true);
      expect(entry.testCount).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('matchesFeature', () => {
  it('matches when keyword is null (no filter)', () => {
    const entry = { file: 'x.cy.ts', describes: [], its: [], selRoles: [], setup: {} as never, testCount: 0 };
    expect(matchesFeature(entry, null)).toBe(true);
  });

  it('matches on describe text case-insensitively', () => {
    const entry = { file: 'x.cy.ts', describes: ['Versioning Flow'], its: [], selRoles: [], setup: {} as never, testCount: 0 };
    expect(matchesFeature(entry, 'versioning')).toBe(true);
    expect(matchesFeature(entry, 'unrelated')).toBe(false);
  });
});

describe('buildAcInventory', () => {
  it('summarizes across multiple files and applies a feature filter', () => {
    const dir = makeTempCypressDir({
      'versioning.cy.ts': `describe('Versioning', () => { it('a', () => {}); });`,
      'unrelated.cy.ts': `describe('Something else', () => { it('b', () => {}); });`,
    });
    try {
      const summary = buildAcInventory(dir, 'versioning', dir);
      expect(summary.totalFiles).toBe(1);
      expect(summary.totalTests).toBe(1);
      expect(summary.files[0]?.file).toContain('versioning.cy.ts');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/sensors/ac-validator.test.ts`
Expected: FAIL — `Cannot find module '../../../src/harness/sensors/ac-validator/ac-validator'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/harness/sensors/ac-validator/ac-validator.ts
#!/usr/bin/env -S node --experimental-strip-types
/**
 * AC Validator Sensor — Cypress evidence mapper.
 *
 * Scans a repository's Cypress test suite and produces a structured
 * inventory that the `qa-ac-validate` skill uses during VALIDATION mode
 * to map acceptance criteria to test evidence.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface TestFileSetup {
  hasBefore: boolean;
  hasAfter: boolean;
  hasApollo: boolean;
  hasLoginSession: boolean;
}

export interface TestFileEntry {
  file: string;
  describes: string[];
  its: string[];
  selRoles: string[];
  setup: TestFileSetup;
  testCount: number;
}

export interface AcInventorySummary {
  generatedAt: string;
  testsDir: string;
  featureFilter: string;
  totalFiles: number;
  totalTests: number;
  totalSelRoles: number;
  files: TestFileEntry[];
}

export function findCypressFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    throw new Error(`[ac-validator] Tests directory not found: ${dir}`);
  }
  const results: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.cy\.(ts|js|tsx|jsx)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  };
  walk(dir);
  return results;
}

export function parseTestFile(filePath: string, cwd: string): TestFileEntry {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = relative(cwd, filePath);

  const describes = [...content.matchAll(/describe\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);
  const its = [...content.matchAll(/\bit\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);

  const selRoles = new Set<string>();
  for (const m of content.matchAll(/data-sel-role=["'`]([^"'`]+)["'`]/g)) selRoles.add(m[1] as string);
  for (const m of content.matchAll(/\[data-sel-role=["']([^"']+)["']\]/g)) selRoles.add(m[1] as string);

  const setup: TestFileSetup = {
    hasBefore: /\bbefore\s*\(/.test(content),
    hasAfter: /\bafter\s*\(/.test(content),
    hasApollo: /cy\.apollo/.test(content),
    hasLoginSession: /loginAndStoreSession/.test(content),
  };

  return {
    file: relativePath,
    describes,
    its,
    selRoles: [...selRoles],
    setup,
    testCount: its.length,
  };
}

export function matchesFeature(entry: TestFileEntry, keyword: string | null): boolean {
  if (!keyword) return true;
  const kw = keyword.toLowerCase();
  return (
    entry.file.toLowerCase().includes(kw) ||
    entry.describes.some((d) => d.toLowerCase().includes(kw)) ||
    entry.its.some((i) => i.toLowerCase().includes(kw))
  );
}

export function buildAcInventory(testsDir: string, featureKeyword: string | null, cwd: string = process.cwd()): AcInventorySummary {
  const files = findCypressFiles(testsDir);
  const inventory = files.map((f) => parseTestFile(f, cwd)).filter((e) => matchesFeature(e, featureKeyword));

  return {
    generatedAt: new Date().toISOString(),
    testsDir,
    featureFilter: featureKeyword ?? 'none (all files)',
    totalFiles: inventory.length,
    totalTests: inventory.reduce((sum, e) => sum + e.testCount, 0),
    totalSelRoles: new Set(inventory.flatMap((e) => e.selRoles)).size,
    files: inventory,
  };
}

function runCli(): void {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string | null): string | null => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? (args[idx + 1] ?? def) : def;
  };

  const testsDir = getArg('--tests-dir', './tests/cypress/e2e') as string;
  const outputFile = getArg('--output', 'ac-evidence-inventory.json') as string;
  const featureKeyword = getArg('--feature', null);

  const summary = buildAcInventory(testsDir, featureKeyword);
  writeFileSync(outputFile, JSON.stringify(summary, null, 2));

  console.log(`[ac-validator] Inventory written to: ${outputFile}`);
  console.log(`  Files scanned:    ${summary.totalFiles}`);
  console.log(`  Test cases found: ${summary.totalTests}`);
  console.log(`  Unique sel-roles: ${summary.totalSelRoles}`);
  if (featureKeyword) console.log(`  Feature filter:   "${featureKeyword}"`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/unit/sensors/ac-validator.test.ts`
Expected: PASS, 4 tests (1 in `parseTestFile`, 2 in `matchesFeature`, 1 in `buildAcInventory`).

- [ ] **Step 5: Remove the superseded JS original**

```bash
git rm _incoming/feature-context-harness/harness/sensors/ac-validator/ac-validator.js
git rm _incoming/feature-context-harness/harness/sensors/ac-validator/README.md
rmdir _incoming/feature-context-harness/harness/sensors/ac-validator 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port ac-validator sensor to typed TypeScript with tests"
```

---

## Task 10: Port `cypress-analyzer` sensor to TypeScript

**Files:**
- Create: `src/harness/sensors/cypress-analyzer/cypress-analyzer.ts`
- Create: `tests/unit/sensors/cypress-analyzer.test.ts`
- Delete: `_incoming/feature-context-harness/harness/sensors/cypress-analyzer/{cypress-analyzer.js,README.md}`

**Interfaces:**
- Produces: `analyzeFile(filePath: string, cwd: string): CypressFileAnalysis`, `matchesFeature`, `computeSummary(inventory: CypressFileAnalysis[], acCoverage: AcCoverageEntry[] | null): CypressAdequacySummary`, `buildAdequacyReport(testsDir, feature, acMatrixPath, cwd?): CypressAdequacyReport`. `hasOnly` on the returned summary's `coverageSignals` is what Task 15's reusable workflow reads to decide whether to fail CI — the field name must stay exactly `coverageSignals.hasOnlyTests` (matches the original JS sensor's JSON shape, which the existing `qa-harness.yml` comment-formatting logic already depends on).

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/sensors/cypress-analyzer.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeFile, computeSummary } from '../../../src/harness/sensors/cypress-analyzer/cypress-analyzer';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function writeTempCyFile(content: string): { dir: string; file: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cypress-analyzer-test-'));
  const file = join(dir, 'sample.cy.ts');
  writeFileSync(file, content, 'utf8');
  return { dir, file };
}

describe('analyzeFile', () => {
  it('flags HAS_ONLY and scores it POOR when .only is present with no hooks or sel-roles', () => {
    const { dir, file } = writeTempCyFile(`
      describe('X', () => {
        it.only('does a thing', () => {
          cy.get('.some-css-class').should('be.visible');
        });
      });
    `);
    try {
      const result = analyzeFile(file, dir);
      expect(result.coverage.hasOnly).toBe(true);
      expect(result.smells.some((s) => s.id === 'HAS_ONLY')).toBe(true);
      expect(result.smells.some((s) => s.id === 'NO_SEL_ROLE')).toBe(true);
      expect(result.qualityGrade).toBe('POOR');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not flag NO_SEL_ROLE when data-sel-role selectors are present, and detects personas', () => {
    const { dir, file } = writeTempCyFile(`
      describe('Content editor publishes', () => {
        before(() => { cy.apollo({ mutation: 'seed' }); loginAndStoreSession(); });
        it('publishes content', () => {
          cy.get('[data-sel-role="publish-button"]').click();
          cy.get('[data-sel-role="status"]').should('contain', 'Published');
        });
        after(() => { cy.logout(); });
      });
    `);
    try {
      const result = analyzeFile(file, dir);
      expect(result.smells.some((s) => s.id === 'NO_SEL_ROLE')).toBe(false);
      expect(result.personaSignals).toContain('content-editor');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('computeSummary', () => {
  it('sets hasOnlyTests true if any file has .only, used to gate CI', () => {
    const { dir, file } = writeTempCyFile(`describe('X', () => { it.only('a', () => {}); });`);
    try {
      const entry = analyzeFile(file, dir);
      const summary = computeSummary([entry], null);
      expect(summary.coverageSignals.hasOnlyTests).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/sensors/cypress-analyzer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/harness/sensors/cypress-analyzer/cypress-analyzer.ts
#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cypress Analyzer — QA Harness Pillar B.
 *
 * Analyses a Cypress test suite for test adequacy: scenario coverage,
 * assertion quality, data hygiene, persona coverage, and structural smells.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Smell {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  fix: string;
}

const SMELLS: Record<string, Smell> = {
  NO_BEFORE_HOOK: { id: 'NO_BEFORE_HOOK', severity: 'MEDIUM', message: 'No before() or beforeEach() hook — test may depend on shared state or external data', fix: 'Add a before() block that creates test data via cy.apollo() and loginAndStoreSession()' },
  NO_AFTER_HOOK: { id: 'NO_AFTER_HOOK', severity: 'MEDIUM', message: 'No after() or afterEach() hook — test data may leak between runs', fix: 'Add an after() block that deletes test data and calls cy.logout()' },
  NO_SEL_ROLE: { id: 'NO_SEL_ROLE', severity: 'HIGH', message: 'No data-sel-role selectors found — tests are coupled to CSS class names or DOM structure', fix: 'Replace CSS selectors with data-sel-role="..." attributes on the component' },
  ONLY_VISIBILITY: { id: 'ONLY_VISIBILITY', severity: 'MEDIUM', message: 'Assertions only check .should("be.visible") — no content or behaviour verified', fix: 'Add assertions on text content, disabled state, ARIA attributes, or data values' },
  HAS_SKIP: { id: 'HAS_SKIP', severity: 'HIGH', message: 'Contains .skip — test is not running; may hide coverage gap', fix: 'Re-enable the test or document the reason it is skipped with a ticket reference' },
  HAS_ONLY: { id: 'HAS_ONLY', severity: 'HIGH', message: 'Contains .only — other tests in the suite are suppressed', fix: 'Remove .only before merging; this must not reach CI' },
  HARDCODED_PATH: { id: 'HARDCODED_PATH', severity: 'LOW', message: 'Contains hardcoded JCR paths outside test data fixtures', fix: 'Move paths to constants or cy.apollo() fixtures to improve maintainability' },
  NO_ERROR_SCENARIO: { id: 'NO_ERROR_SCENARIO', severity: 'MEDIUM', message: 'No error or failure scenario detected — only happy path is tested', fix: 'Add at least one test case for an error state (API unavailable, permission denied, empty data)' },
  NO_MULTILANG: { id: 'NO_MULTILANG', severity: 'LOW', message: 'No multilingual scenario detected — tests only use one language', fix: 'Consider adding a language-switch test if the feature is language-aware' },
};

const PERSONA_KEYWORDS: Record<string, RegExp> = {
  'content-editor': /editor|jcontent|content.*creat|publish|workflow/i,
  'site-builder': /site.*build|page.*build|layout|component|template/i,
  developer: /api|graphql|module|deploy|bundle/i,
  admin: /admin|permission|role|user.*manag|module.*install/i,
  'compliance-user': /gdpr|wcag|a11y|accessibility|audit|keyboard|aria/i,
};

export interface CypressFileAnalysis {
  file: string;
  describes: string[];
  its: string[];
  testCount: number;
  selRoles: string[];
  cssSelectors: string[];
  assertions: { visibilityOnly: boolean; hasContentAssert: boolean; hasAriaAssert: boolean };
  setup: { hasBefore: boolean; hasAfter: boolean; hasApollo: boolean; hasLoginSession: boolean; hasLogout: boolean };
  coverage: { hasErrorScenario: boolean; hasMultilang: boolean; hasSkip: boolean; hasOnly: boolean; hasHardcodedPath: boolean };
  usesPageObjects: boolean;
  personaSignals: string[];
  smells: Smell[];
  qualityScore: number;
  qualityGrade: 'GOOD' | 'FAIR' | 'POOR';
}

export interface AcCoverageEntry {
  acId: string;
  description: string;
  covered: boolean;
  evidence: string | null;
}

export interface CypressAdequacySummary {
  totalFiles: number;
  totalTests: number;
  averageQualityScore: number;
  overallGrade: 'GOOD' | 'FAIR' | 'POOR';
  smellCount: { HIGH: number; MEDIUM: number; LOW: number };
  coverageSignals: {
    hasErrorScenarios: boolean;
    hasMultilingualTests: boolean;
    hasSkippedTests: boolean;
    hasOnlyTests: boolean;
    usesPageObjects: boolean;
    personasCovered: string[];
  };
  acCoverage: { total: number; covered: number; missing: string[] } | null;
}

export interface CypressAdequacyReport {
  meta: { generatedAt: string; testsDir: string; featureFilter: string; acMatrix: string | null };
  summary: CypressAdequacySummary;
  files: CypressFileAnalysis[];
}

export function findCypressFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    throw new Error(`[cypress-analyzer] Tests directory not found: ${dir}`);
  }
  const results: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.cy\.(ts|js|tsx|jsx)$/.test(entry.name)) results.push(full);
    }
  };
  walk(dir);
  return results;
}

export function analyzeFile(filePath: string, cwd: string): CypressFileAnalysis {
  const src = readFileSync(filePath, 'utf8');
  const relativePath = relative(cwd, filePath);

  const describes = [...src.matchAll(/describe\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);
  const its = [...src.matchAll(/\bit\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);

  const cssSelectors = [...src.matchAll(/cy\.get\(['"`](?!.*data-sel-role)([.#[\w][^'"`]+)['"`]\)/g)].map((m) => m[1] as string);
  const selRoles = [
    ...new Set([
      ...[...src.matchAll(/data-sel-role=["'`]([^"'`]+)["'`]/g)].map((m) => m[1] as string),
      ...[...src.matchAll(/\[data-sel-role=["']([^"']+)["']\]/g)].map((m) => m[1] as string),
    ]),
  ];

  const visibilityOnly = src.includes("should('be.visible')") || src.includes('should("be.visible")');
  const hasContentAssert = /\.should\((["'])(contain|have\.text|have\.value|have\.attr|not\.have|include|equal)/.test(src);
  const hasAriaAssert = /aria-/.test(src) || /\.should\(.*aria/.test(src);

  const hasBefore = /\bbefore(Each)?\s*\(/.test(src);
  const hasAfter = /\bafter(Each)?\s*\(/.test(src);
  const hasApollo = /cy\.apollo/.test(src);
  const hasLoginSession = /loginAndStoreSession/.test(src);
  const hasLogout = /cy\.logout/.test(src);

  const hasErrorScenario = /error|fail|unavailable|denied|invalid|empty|null/i.test(src) && its.some((t) => /error|fail|unavailable|denied|invalid|empty|null/i.test(t));
  const hasMultilang = /switchLanguage|changeLanguage|lang.*fr|lang.*de|'fr'|"fr"|'de'|"de"/i.test(src) || its.some((t) => /language|lang|multilingual/i.test(t));
  const hasSkip = /\.skip\(/.test(src);
  const hasOnly = /\.only\(/.test(src);
  const hasHardcodedPath = /\/sites\/[a-z]+\/[a-z-]+\/[a-z-]+\/[a-z-]+/.test(src);

  const usesPageObjects = /from ['"].*page-object['"]/.test(src) || /new (JContent|ContentEditor|JContentPublish)/.test(src);

  const personaSignals: string[] = [];
  for (const [persona, re] of Object.entries(PERSONA_KEYWORDS)) {
    if (re.test(src) || its.some((t) => re.test(t))) personaSignals.push(persona);
  }

  const fileSmells: Smell[] = [];
  if (!hasBefore) fileSmells.push(SMELLS.NO_BEFORE_HOOK as Smell);
  if (!hasAfter) fileSmells.push(SMELLS.NO_AFTER_HOOK as Smell);
  if (selRoles.length === 0) fileSmells.push(SMELLS.NO_SEL_ROLE as Smell);
  if (visibilityOnly && !hasContentAssert) fileSmells.push(SMELLS.ONLY_VISIBILITY as Smell);
  if (hasSkip) fileSmells.push(SMELLS.HAS_SKIP as Smell);
  if (hasOnly) fileSmells.push(SMELLS.HAS_ONLY as Smell);
  if (hasHardcodedPath) fileSmells.push(SMELLS.HARDCODED_PATH as Smell);
  if (!hasErrorScenario) fileSmells.push(SMELLS.NO_ERROR_SCENARIO as Smell);
  if (!hasMultilang) fileSmells.push(SMELLS.NO_MULTILANG as Smell);

  let score = 100;
  for (const smell of fileSmells) {
    if (smell.severity === 'HIGH') score -= 20;
    if (smell.severity === 'MEDIUM') score -= 10;
    if (smell.severity === 'LOW') score -= 5;
  }
  score = Math.max(0, score);

  return {
    file: relativePath,
    describes,
    its,
    testCount: its.length,
    selRoles,
    cssSelectors: cssSelectors.slice(0, 10),
    assertions: { visibilityOnly, hasContentAssert, hasAriaAssert },
    setup: { hasBefore, hasAfter, hasApollo, hasLoginSession, hasLogout },
    coverage: { hasErrorScenario, hasMultilang, hasSkip, hasOnly, hasHardcodedPath },
    usesPageObjects,
    personaSignals,
    smells: fileSmells,
    qualityScore: score,
    qualityGrade: score >= 80 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR',
  };
}

export function matchesFeature(entry: CypressFileAnalysis, kw: string | null): boolean {
  if (!kw) return true;
  const k = kw.toLowerCase();
  return entry.file.toLowerCase().includes(k) || entry.describes.some((d) => d.toLowerCase().includes(k)) || entry.its.some((i) => i.toLowerCase().includes(k));
}

export function crossRefWithAC(inventory: CypressFileAnalysis[], acMatrixPath: string | null): AcCoverageEntry[] | null {
  if (!acMatrixPath || !existsSync(acMatrixPath)) return null;
  const content = readFileSync(acMatrixPath, 'utf8');
  const acEntries: Array<{ id: string; description: string }> = [];

  if (acMatrixPath.endsWith('.json')) {
    const json = JSON.parse(content) as { files?: Array<{ its?: string[] }> };
    for (const f of json.files ?? []) for (const i of f.its ?? []) acEntries.push({ id: i, description: i });
  } else {
    for (const m of content.matchAll(/\|\s*(AC-\w+)\s*\|([^|]+)\|/g)) {
      acEntries.push({ id: (m[1] as string).trim(), description: (m[2] as string).trim() });
    }
  }

  const allIts = inventory.flatMap((e) => e.its.map((t) => ({ file: e.file, label: t })));
  return acEntries.map((ac) => {
    const match = allIts.find((t) => t.label.toLowerCase().includes(ac.description.toLowerCase().substring(0, 30)));
    return { acId: ac.id, description: ac.description, covered: !!match, evidence: match ? match.file : null };
  });
}

export function computeSummary(inventory: CypressFileAnalysis[], acCoverage: AcCoverageEntry[] | null): CypressAdequacySummary {
  const allSmells = inventory.flatMap((e) => e.smells);
  const highSmells = allSmells.filter((s) => s.severity === 'HIGH').length;
  const mediumSmells = allSmells.filter((s) => s.severity === 'MEDIUM').length;
  const lowSmells = allSmells.filter((s) => s.severity === 'LOW').length;

  const avgQuality = inventory.length ? Math.round(inventory.reduce((s, e) => s + e.qualityScore, 0) / inventory.length) : 0;
  const allPersonas = [...new Set(inventory.flatMap((e) => e.personaSignals))];

  const overallGrade: 'GOOD' | 'FAIR' | 'POOR' = avgQuality >= 80 && highSmells === 0 ? 'GOOD' : avgQuality >= 50 && highSmells <= 2 ? 'FAIR' : 'POOR';

  return {
    totalFiles: inventory.length,
    totalTests: inventory.reduce((s, e) => s + e.testCount, 0),
    averageQualityScore: avgQuality,
    overallGrade,
    smellCount: { HIGH: highSmells, MEDIUM: mediumSmells, LOW: lowSmells },
    coverageSignals: {
      hasErrorScenarios: inventory.some((e) => e.coverage.hasErrorScenario),
      hasMultilingualTests: inventory.some((e) => e.coverage.hasMultilang),
      hasSkippedTests: inventory.some((e) => e.coverage.hasSkip),
      hasOnlyTests: inventory.some((e) => e.coverage.hasOnly),
      usesPageObjects: inventory.some((e) => e.usesPageObjects),
      personasCovered: allPersonas,
    },
    acCoverage: acCoverage ? { total: acCoverage.length, covered: acCoverage.filter((a) => a.covered).length, missing: acCoverage.filter((a) => !a.covered).map((a) => a.acId) } : null,
  };
}

export function buildAdequacyReport(testsDir: string, feature: string | null, acMatrix: string | null, cwd: string = process.cwd()): CypressAdequacyReport {
  const files = findCypressFiles(testsDir);
  const inventory = files.map((f) => analyzeFile(f, cwd)).filter((e) => matchesFeature(e, feature));
  const acCovRef = crossRefWithAC(inventory, acMatrix);
  const summary = computeSummary(inventory, acCovRef);
  return { meta: { generatedAt: new Date().toISOString(), testsDir, featureFilter: feature ?? 'all', acMatrix }, summary, files: inventory };
}

function runCli(): void {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string | null): string | null => {
    const i = args.indexOf(flag);
    return i !== -1 ? (args[i + 1] ?? def) : def;
  };

  const testsDir = getArg('--tests-dir', './tests/cypress/e2e') as string;
  const acMatrix = getArg('--ac-matrix', null);
  const feature = getArg('--feature', null);
  const outputFile = getArg('--output', 'cypress-adequacy-report.json') as string;

  const report = buildAdequacyReport(testsDir, feature, acMatrix);
  writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`[cypress-analyzer] Done. Overall grade: ${report.summary.overallGrade}`);
  process.exit(report.summary.coverageSignals.hasOnlyTests ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/sensors/cypress-analyzer.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Remove the superseded JS original**

```bash
git rm _incoming/feature-context-harness/harness/sensors/cypress-analyzer/cypress-analyzer.js
git rm _incoming/feature-context-harness/harness/sensors/cypress-analyzer/README.md
rmdir _incoming/feature-context-harness/harness/sensors/cypress-analyzer 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port cypress-analyzer sensor to typed TypeScript with tests"
```

---

## Task 11: Port `doc-reviewer` sensor to TypeScript

**Files:**
- Create: `src/harness/sensors/doc-reviewer/doc-reviewer.ts`
- Create: `tests/unit/sensors/doc-reviewer.test.ts`
- Delete: `_incoming/feature-context-harness/harness/sensors/doc-reviewer/doc-reviewer.js`

**Interfaces:**
- Produces: `extractTermsFromDiff(diffPath: string | null): string[]`, `scanLocalFile(filePath: string, terms: string[], repoRoot: string): LocalDocScanResult`, `parseSourcesForm(filePath: string | null): ParsedSources | null`. The remote-fetch path (`fetchRemote`) is ported as-is but not unit-tested (network I/O — out of scope for unit coverage; matches spec's "unit tests for the ported sensors" without requiring network mocking infrastructure that nothing else in this plan needs).

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/sensors/doc-reviewer.test.ts
import { describe, it, expect } from 'vitest';
import { extractTermsFromDiff, scanLocalFile } from '../../../src/harness/sensors/doc-reviewer/doc-reviewer';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('extractTermsFromDiff', () => {
  it('extracts i18n display strings and data-sel-role values from added diff lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-reviewer-test-'));
    const diffFile = join(dir, 'change.diff');
    writeFileSync(
      diffFile,
      [
        '+  "versioning.title": "Content Versioning",',
        '+  <button data-sel-role="restore-version-button">Restore</button>',
        '-  "old.key": "Old Value",',
      ].join('\n'),
      'utf8',
    );
    try {
      const terms = extractTermsFromDiff(diffFile);
      expect(terms).toContain('Content Versioning');
      expect(terms).toContain('restore-version-button');
      expect(terms).not.toContain('Old Value');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns an empty array when no diff path is given', () => {
    expect(extractTermsFromDiff(null)).toEqual([]);
  });
});

describe('scanLocalFile', () => {
  it('marks a file LIKELY_UPDATED when all terms are present', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-reviewer-test-'));
    writeFileSync(join(dir, 'README.md'), 'This README documents Content Versioning support.', 'utf8');
    try {
      const result = scanLocalFile('README.md', ['Content Versioning'], dir);
      expect(result.verdict).toBe('LIKELY_UPDATED');
      expect(result.termsFound).toEqual(['Content Versioning']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('marks a missing file FILE_NOT_FOUND', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-reviewer-test-'));
    try {
      const result = scanLocalFile('MISSING.md', ['x'], dir);
      expect(result.verdict).toBe('FILE_NOT_FOUND');
      expect(result.exists).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/sensors/doc-reviewer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/harness/sensors/doc-reviewer/doc-reviewer.ts
#!/usr/bin/env -S node --experimental-strip-types
/**
 * Doc Reviewer Sensor — QA Harness Pillar D.
 *
 * Scans local documentation for mentions of feature-specific terms; fetches
 * publicly-accessible remote sources (Academy/Confluence-style) for the
 * same. Auth-gated remote sources are flagged for manual review, never
 * treated as evidence.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { get as httpsGet } from 'node:https';
import { fileURLToPath } from 'node:url';

export function extractTermsFromDiff(diffPath: string | null): string[] {
  if (!diffPath || !existsSync(diffPath)) return [];
  const diff = readFileSync(diffPath, 'utf8');
  const terms = new Set<string>();
  const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));

  const i18nRe = /"([a-zA-Z][a-zA-Z0-9_.]+)":\s*"([^"]+)"/g;
  for (const line of added) {
    for (const m of line.matchAll(i18nRe)) {
      const value = m[2] as string;
      if (value.length > 2 && value.length < 60) terms.add(value);
    }
  }
  const selRe = /data-sel-role=["']([^"']+)["']/g;
  for (const line of added) for (const m of line.matchAll(selRe)) terms.add(m[1] as string);

  const btnRe = /buttonLabel[^"']*['"]([^"']+)['"]/g;
  for (const line of added) for (const m of line.matchAll(btnRe)) terms.add(m[1] as string);

  return [...terms].filter((t) => t.length > 2);
}

export type DocVerdict = 'LIKELY_UPDATED' | 'PARTIALLY_UPDATED' | 'LIKELY_STALE' | 'EXISTS_NO_TERMS' | 'FILE_NOT_FOUND';

export interface LocalDocScanResult {
  exists: boolean;
  path: string;
  absolutePath?: string;
  lineCount?: number;
  lastModified?: string;
  hasVersionRef?: boolean;
  hasTodoMarker?: boolean;
  termsFound: string[];
  termsMissing: string[];
  coveragePercent?: number;
  verdict: DocVerdict;
}

export function scanLocalFile(filePath: string, terms: string[], repoRoot: string): LocalDocScanResult {
  const absPath = resolve(repoRoot, filePath);
  if (!existsSync(absPath)) {
    return { exists: false, path: filePath, termsFound: [], termsMissing: terms, verdict: 'FILE_NOT_FOUND' };
  }
  const content = readFileSync(absPath, 'utf8').toLowerCase();
  const termsFound = terms.filter((t) => content.includes(t.toLowerCase()));
  const termsMissing = terms.filter((t) => !content.includes(t.toLowerCase()));

  const hasVersionRef = /\d+\.\d+\.\d+/.test(content);
  const hasTodoMarker = /\bTODO\b|\bFIXME\b|\bXXX\b/.test(content);
  const lineCount = content.split('\n').length;
  const lastModified = statSync(absPath).mtime.toISOString().split('T')[0] as string;
  const coverage = terms.length > 0 ? Math.round((termsFound.length / terms.length) * 100) : 100;

  const verdict: DocVerdict = terms.length === 0 ? 'EXISTS_NO_TERMS' : coverage >= 80 ? 'LIKELY_UPDATED' : coverage >= 40 ? 'PARTIALLY_UPDATED' : 'LIKELY_STALE';

  return { exists: true, path: filePath, absolutePath: absPath, lineCount, lastModified, hasVersionRef, hasTodoMarker, termsFound, termsMissing, coveragePercent: coverage, verdict };
}

export interface RemoteDocScanResult {
  url: string;
  accessible: boolean;
  reason?: string;
  termsFound?: string[];
  termsMissing?: string[];
  coveragePercent?: number;
  verdict: string;
}

export function fetchRemote(url: string, terms: string[], timeoutMs = 8000): Promise<RemoteDocScanResult> {
  return new Promise((resolvePromise) => {
    const req = httpsGet(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        resolvePromise({ url, accessible: false, reason: 'AUTH_REQUIRED', verdict: 'MANUAL_REVIEW_REQUIRED' });
        return;
      }
      if (res.statusCode === 404) {
        resolvePromise({ url, accessible: false, reason: 'NOT_FOUND', verdict: 'URL_NOT_FOUND' });
        return;
      }
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
        const termsFound = terms.filter((t) => text.includes(t.toLowerCase()));
        const termsMissing = terms.filter((t) => !text.includes(t.toLowerCase()));
        const coverage = terms.length > 0 ? Math.round((termsFound.length / terms.length) * 100) : 100;
        resolvePromise({
          url,
          accessible: true,
          termsFound,
          termsMissing,
          coveragePercent: coverage,
          verdict: coverage >= 80 ? 'LIKELY_UPDATED' : coverage >= 40 ? 'PARTIALLY_UPDATED' : 'LIKELY_STALE',
        });
      });
    });
    req.on('error', (err) => resolvePromise({ url, accessible: false, reason: err.message, verdict: 'FETCH_ERROR' }));
    req.on('timeout', () => { req.destroy(); resolvePromise({ url, accessible: false, reason: 'TIMEOUT', verdict: 'FETCH_ERROR' }); });
  });
}

export interface ParsedSources {
  local: string[];
  remote: string[];
  manual: string[];
  rawContent: string;
}

export function parseSourcesForm(filePath: string | null): ParsedSources | null {
  if (!filePath || !existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf8');
  const sources: ParsedSources = { local: [], remote: [], manual: [], rawContent: content };

  const rowRe = /\|\s*\*\*[^|]+\*\*\s*\|\s*([^|]+)\s*\|/g;
  for (const m of content.matchAll(rowRe)) {
    const val = (m[1] as string).trim();
    if (val.startsWith('http')) sources.remote.push(val);
    else if (/\.(md|txt|graphql|yaml|yml|json)$/.test(val)) sources.local.push(val);
    else if (val.toLowerCase().includes('n/a') || val.toLowerCase().includes('none')) { /* skip */ }
    else if (val.toLowerCase().includes('manual') || val.toLowerCase().includes('login')) sources.manual.push(val);
  }
  return sources;
}

const STANDARD_LOCAL = ['README.md', 'CHANGELOG.md', 'MIGRATION.md'];

async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const getArg = (f: string, d: string | null): string | null => {
    const i = args.indexOf(f);
    return i !== -1 ? (args[i + 1] ?? d) : d;
  };
  const hasFlag = (f: string): boolean => args.includes(f);

  const sourcesFile = getArg('--sources', null);
  const featureSlug = getArg('--feature', '') as string;
  const diffFile = getArg('--diff', null);
  const repoRoot = getArg('--repo-root', '.') as string;
  const outputFile = getArg('--output', 'doc-review-raw.json') as string;
  const verbose = hasFlag('--verbose');

  const terms = extractTermsFromDiff(diffFile);
  const parsed = parseSourcesForm(sourcesFile);
  const results: { meta: unknown; sources: Array<Record<string, unknown>>; summary?: Record<string, unknown> } = {
    meta: { generatedAt: new Date().toISOString(), featureSlug, terms },
    sources: [],
  };

  const localFiles = [...new Set([...STANDARD_LOCAL, ...(parsed?.local ?? [])])];
  for (const f of localFiles) {
    results.sources.push({ type: 'local', ...scanLocalFile(f, terms, repoRoot) });
  }

  for (const url of parsed?.remote ?? []) {
    if (verbose) process.stdout.write(`[doc-reviewer] Fetching: ${url} ... `);
    const result = await fetchRemote(url, terms);
    results.sources.push({ type: 'remote', ...result });
    if (verbose) console.log(result.verdict);
  }

  for (const note of parsed?.manual ?? []) {
    results.sources.push({ type: 'manual', note, verdict: 'MANUAL_REVIEW_REQUIRED' });
  }

  const allSources = results.sources;
  results.summary = {
    total: allSources.length,
    likelyUpdated: allSources.filter((s) => s.verdict === 'LIKELY_UPDATED').length,
    partiallyUpdated: allSources.filter((s) => s.verdict === 'PARTIALLY_UPDATED').length,
    likelyStale: allSources.filter((s) => s.verdict === 'LIKELY_STALE').length,
    notFound: allSources.filter((s) => ['FILE_NOT_FOUND', 'URL_NOT_FOUND'].includes(s.verdict as string)).length,
    manualRequired: allSources.filter((s) => s.verdict === 'MANUAL_REVIEW_REQUIRED').length,
    termsSearched: terms,
    overallVerdict: allSources.some((s) => s.verdict === 'LIKELY_STALE')
      ? 'GAPS_DETECTED'
      : allSources.some((s) => s.verdict === 'PARTIALLY_UPDATED')
        ? 'PARTIALLY_COMPLETE'
        : allSources.some((s) => s.verdict === 'MANUAL_REVIEW_REQUIRED')
          ? 'MANUAL_REVIEW_NEEDED'
          : 'LIKELY_COMPLETE',
  };

  writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`[doc-reviewer] Done. Verdict: ${(results.summary as { overallVerdict: string }).overallVerdict}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/sensors/doc-reviewer.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Remove superseded JS original and clean up empty dirs**

```bash
git rm _incoming/feature-context-harness/harness/sensors/doc-reviewer/doc-reviewer.js
rmdir _incoming/feature-context-harness/harness/sensors/doc-reviewer \
      _incoming/feature-context-harness/harness/sensors \
      _incoming/feature-context-harness/harness 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port doc-reviewer sensor to typed TypeScript with tests"
```

---

## Task 12: `SENSOR.md` for each sensor

**Files:**
- Create: `src/harness/sensors/ac-validator/SENSOR.md`
- Create: `src/harness/sensors/cypress-analyzer/SENSOR.md`
- Create: `src/harness/sensors/doc-reviewer/SENSOR.md`

**Interfaces:**
- Produces: the frontmatter Task 13's generator scans for `kind: sensor` entries (sensors are `.ts`, not `.md`, so they can't carry frontmatter directly — `SENSOR.md` is their catalog entry).

- [ ] **Step 1: Write the three files**

```markdown
<!-- src/harness/sensors/ac-validator/SENSOR.md -->
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
```

```markdown
<!-- src/harness/sensors/cypress-analyzer/SENSOR.md -->
---
name: qa-sensor-cypress-analyzer
description: "Analyses a Cypress suite for test adequacy — scenario, assertion, persona, multilingual, and error-path coverage plus structural smells. Exits non-zero if .only is present, gating CI."
kind: sensor
pillar: feature-validation
version: "1.0"
---

# Cypress Analyzer Sensor

Run: `pnpm tsx src/harness/sensors/cypress-analyzer/cypress-analyzer.ts --tests-dir <path> [--ac-matrix <file>] [--feature <slug>] [--output <file>]`

Output: JSON adequacy report to `--output` (default `cypress-adequacy-report.json`). Exit code `1` if `.only` is detected anywhere in the suite — this is what `qa-harness-reusable.yml` (Task 15) uses to block a PR.
```

```markdown
<!-- src/harness/sensors/doc-reviewer/SENSOR.md -->
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
```

- [ ] **Step 2: Verify all three parse as valid frontmatter**

Run: `for f in src/harness/sensors/*/SENSOR.md; do echo "-- $f --"; sed -n '1,7p' "$f"; done`
Expected: three `---`-delimited blocks, each with `kind: sensor`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add SENSOR.md catalog entries for the three ported sensors"
```

---

## Task 13: Capability catalog generator

**Files:**
- Create: `scripts/generate-capabilities.ts`
- Create: `tests/unit/generate-capabilities.test.ts`
- Create (generated, committed): `docs/CAPABILITIES.md`
- Modify: `package.json` (add `capabilities:generate` script)

**Interfaces:**
- Consumes: the frontmatter schema established in Tasks 5–7 and 12 (`name`, `description`, `kind`, `pillar`, `version`, optional `see_also`) from `.claude/skills/*/SKILL.md`, `.claude/agents/*.agent.md`, `src/harness/sensors/*/SENSOR.md`.
- Produces: `parseFrontmatter(content: string): Record<string, string> | null`, `collectCapabilities(rootDir: string): Capability[]`, `renderCapabilitiesMarkdown(capabilities: Capability[]): string` — exported for the test file; Task 14's `capabilities-check.yml` runs this same script's CLI entrypoint.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/generate-capabilities.test.ts
import { describe, it, expect } from 'vitest';
import { parseFrontmatter, renderCapabilitiesMarkdown, type Capability } from '../../scripts/generate-capabilities';

describe('parseFrontmatter', () => {
  it('parses simple key: value pairs and bracketed lists', () => {
    const content = [
      '---',
      'name: qa-tldr',
      'description: "Digest a ticket fast."',
      'kind: skill',
      'pillar: test-case-identification',
      'version: "1.0"',
      'see_also: [qa-bug-brief, qa-define-testcases]',
      '---',
      '',
      '# Body',
    ].join('\n');
    const fm = parseFrontmatter(content);
    expect(fm).toEqual({
      name: 'qa-tldr',
      description: 'Digest a ticket fast.',
      kind: 'skill',
      pillar: 'test-case-identification',
      version: '1.0',
      see_also: 'qa-bug-brief, qa-define-testcases',
    });
  });

  it('returns null when there is no frontmatter block', () => {
    expect(parseFrontmatter('# Just a heading\n\nNo frontmatter here.')).toBeNull();
  });
});

describe('renderCapabilitiesMarkdown', () => {
  it('groups capabilities by pillar into a markdown table', () => {
    const capabilities: Capability[] = [
      { name: 'qa-tldr', description: 'Digest a ticket fast.', kind: 'skill', pillar: 'test-case-identification', version: '1.0', seeAlso: [] },
      { name: 'qa-run', description: 'Runs the full pipeline.', kind: 'skill', pillar: 'feature-validation', version: '1.0', seeAlso: [] },
    ];
    const md = renderCapabilitiesMarkdown(capabilities);
    expect(md).toContain('## Pillar 2 — Feature Validation');
    expect(md).toContain('## Pillar 3 — Test-Case Identification');
    expect(md).toContain('qa-tldr');
    expect(md).toContain('qa-run');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/generate-capabilities.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// scripts/generate-capabilities.ts
#!/usr/bin/env -S node --experimental-strip-types
// Regenerates docs/CAPABILITIES.md from the frontmatter of every
// .claude/skills/*/SKILL.md, .claude/agents/*.agent.md, and
// src/harness/sensors/*/SENSOR.md file. Never hand-edit CAPABILITIES.md —
// this script is the single source of truth for its content.
// No third-party YAML parser: frontmatter is a flat key: value block,
// optionally with a bracketed list value — uses a simple hand-written parser.
// (Line comments, not a block comment, immediately after the shebang — a
// block comment there tripped an esbuild/vitest parsing quirk when Task 13
// was implemented.)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Capability {
  name: string;
  description: string;
  kind: 'skill' | 'agent' | 'sensor';
  pillar: string;
  version: string;
  seeAlso: string[];
}

export function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const block = match[1] as string;
  const lines = block.split('\n');
  const result: Record<string, string> = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1] as string;
    const rawValue = (m[2] as string).trim();

    // YAML block-scalar indicator (`>`, `>-`, `|`, `|-`) with nothing else on
    // the line: fold the indented continuation lines into one value. Several
    // of Task 7's skills use `description: >` for multi-line prose, carried
    // over from their original Copilot frontmatter — this parser must handle
    // that shape, not just single-line values.
    if (/^[>|][-+]?$/.test(rawValue)) {
      const collected: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+\S/.test(lines[j] as string)) {
        collected.push((lines[j] as string).trim());
        j++;
      }
      result[key] = collected.join(' ').trim();
      i = j - 1;
      continue;
    }

    let value = rawValue;
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1).trim();
    result[key] = value;
  }
  return result;
}

function toCapability(frontmatter: Record<string, string>): Capability | null {
  if (!frontmatter.name || !frontmatter.kind || !frontmatter.pillar) return null;
  return {
    name: frontmatter.name,
    description: frontmatter.description ?? '',
    kind: frontmatter.kind as Capability['kind'],
    pillar: frontmatter.pillar,
    version: frontmatter.version ?? '1.0',
    seeAlso: frontmatter.see_also ? frontmatter.see_also.split(',').map((s) => s.trim()).filter(Boolean) : [],
  };
}

function readCapabilityFiles(dir: string, matcher: RegExp): string[] {
  const results: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...readCapabilityFiles(full, matcher));
    else if (matcher.test(entry.name)) results.push(full);
  }
  return results;
}

export function collectCapabilities(rootDir: string): Capability[] {
  const files = [
    ...readCapabilityFiles(join(rootDir, '.claude/skills'), /^SKILL\.md$/),
    ...readCapabilityFiles(join(rootDir, '.claude/agents'), /\.agent\.md$/),
    ...readCapabilityFiles(join(rootDir, 'src/harness/sensors'), /^SENSOR\.md$/),
  ];
  const capabilities: Capability[] = [];
  for (const file of files) {
    const fm = parseFrontmatter(readFileSync(file, 'utf8'));
    if (!fm) continue;
    const cap = toCapability(fm);
    if (cap) capabilities.push(cap);
  }
  return capabilities.sort((a, b) => a.name.localeCompare(b.name));
}

const PILLAR_ORDER = ['ci-insight', 'feature-validation', 'test-case-identification', 'team-motivation', 'harness-engineering'];
const PILLAR_TITLES: Record<string, string> = {
  'ci-insight': 'Pillar 1 — CI Insight',
  'feature-validation': 'Pillar 2 — Feature Validation',
  'test-case-identification': 'Pillar 3 — Test-Case Identification',
  'team-motivation': 'Pillar 4 — Team Motivation',
  'harness-engineering': 'Harness Engineering',
};

export function renderCapabilitiesMarkdown(capabilities: Capability[]): string {
  const lines: string[] = [
    '<!-- GENERATED FILE — do not hand-edit. Run `pnpm capabilities:generate` after adding or changing a skill, agent, or sensor. -->',
    '',
    '# qa-tool capability catalog',
    '',
  ];

  const pillars = [...new Set(capabilities.map((c) => c.pillar))].sort((a, b) => {
    const ai = PILLAR_ORDER.indexOf(a);
    const bi = PILLAR_ORDER.indexOf(b);
    return (ai === -1 ? PILLAR_ORDER.length : ai) - (bi === -1 ? PILLAR_ORDER.length : bi);
  });

  for (const pillar of pillars) {
    lines.push(`## ${PILLAR_TITLES[pillar] ?? pillar}`, '', '| Name | Kind | Description | Version | See also |', '|---|---|---|---|---|');
    for (const cap of capabilities.filter((c) => c.pillar === pillar)) {
      const seeAlso = cap.seeAlso.length ? cap.seeAlso.join(', ') : '—';
      lines.push(`| \`${cap.name}\` | ${cap.kind} | ${cap.description} | ${cap.version} | ${seeAlso} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function runCli(): void {
  const rootDir = process.cwd();
  const capabilities = collectCapabilities(rootDir);
  const markdown = renderCapabilitiesMarkdown(capabilities);
  writeFileSync(join(rootDir, 'docs/CAPABILITIES.md'), markdown);
  console.log(`[generate-capabilities] Wrote docs/CAPABILITIES.md with ${capabilities.length} entries.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/generate-capabilities.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Add the npm script**

Edit `package.json`, in the `"scripts"` block, add:
```json
"capabilities:generate": "tsx scripts/generate-capabilities.ts",
```

- [ ] **Step 6: Generate `docs/CAPABILITIES.md` for real and inspect it**

Run: `pnpm capabilities:generate && cat docs/CAPABILITIES.md`
Expected: five pillar sections, all 17 capabilities from Tasks 5–7 and 12 present (6 from Task 5, 2 from Task 6, 6 from Task 7, 3 from Task 12 = 17). `qa-capture` from Task 16 isn't written yet, so the count is 17, not 18, at this point — it appears once Task 16 lands and this script is rerun in Task 16's own steps.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add generated capability catalog (docs/CAPABILITIES.md)"
```

---

## Task 14: CI enforcement for the catalog

**Files:**
- Create: `.github/workflows/capabilities-check.yml`

**Interfaces:**
- Consumes: `pnpm capabilities:generate` (Task 13).

- [ ] **Step 1: Write the workflow**

```yaml
# .github/workflows/capabilities-check.yml
name: Capabilities catalog check

on:
  pull_request:
    paths:
      - '.claude/skills/**'
      - '.claude/agents/**'
      - 'src/harness/sensors/**'
      - 'scripts/generate-capabilities.ts'
      - 'docs/CAPABILITIES.md'

jobs:
  check:
    name: docs/CAPABILITIES.md is up to date
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm capabilities:generate
      - name: Fail if CAPABILITIES.md is stale
        run: |
          if ! git diff --quiet -- docs/CAPABILITIES.md; then
            echo "::error::docs/CAPABILITIES.md is out of date. Run 'pnpm capabilities:generate' and commit the result."
            git diff -- docs/CAPABILITIES.md
            exit 1
          fi
```

- [ ] **Step 2: Verify the workflow is valid YAML**

Run: `node -e "require('node:fs').readFileSync('.github/workflows/capabilities-check.yml','utf8')" && python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/capabilities-check.yml'))" 2>&1 || echo "install a yaml linter locally if this fails only due to missing pyyaml"`
Expected: no parse error (a missing `pyyaml` module is fine to ignore; a YAML syntax error is not).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: fail PRs when docs/CAPABILITIES.md is stale"
```

---

## Task 15: Reusable `qa-harness` workflow

**Files:**
- Create: `.github/workflows/qa-harness-reusable.yml`
- Delete (once moved): `_incoming/feature-context-harness/.github/workflows/qa-harness.yml`

**Interfaces:**
- Consumes: `src/harness/sensors/cypress-analyzer/cypress-analyzer.ts` (Task 10) — specifically its `summary.coverageSignals.hasOnlyTests` field name, unchanged from the JS original, and its process exit code (`1` when `.only` is present).

- [ ] **Step 1: Write the reusable workflow**, converting `_incoming/feature-context-harness/.github/workflows/qa-harness.yml`'s `on: pull_request` trigger to `on: workflow_call` with inputs, and its inline `node harness/sensors/...` calls to `pnpm tsx src/harness/sensors/...` against this repo's own checkout (installing only `tsx` globally, not the full pnpm workspace — see Global Constraints):

```yaml
# .github/workflows/qa-harness-reusable.yml
name: QA Harness (reusable)

on:
  workflow_call:
    inputs:
      cypress-path:
        description: "Path to the calling repo's Cypress e2e tests folder"
        required: false
        type: string
        default: 'tests/cypress/e2e'
      enable-doc-review:
        description: "Whether to also run the doc-reviewer sensor (requires a filled doc-sources file in the caller repo)"
        required: false
        type: boolean
        default: false
      fail-on-only:
        description: "Fail the job when .only is detected in any Cypress test"
        required: false
        type: boolean
        default: true

permissions:
  contents: read
  pull-requests: write

jobs:
  sensors:
    name: QA Sensors (Pillars A + B)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout caller repository
        uses: actions/checkout@v4
        with:
          path: target
          fetch-depth: 0

      - name: Determine the ref the caller pinned
        id: pin
        run: |
          # github.job_workflow_ref for a reusable-workflow job resolves to
          # "owner/repo/.github/workflows/qa-harness-reusable.yml@<ref>"
          # (e.g. "...@refs/tags/qa-harness-v1") — the ref after the last
          # '@' is exactly what the calling repo pinned via `uses: ...@<ref>`.
          # There is no simpler built-in context var for this; github.action_ref
          # does not apply here (that's for composite/JS actions, not reusable
          # workflow callers).
          REF="${{ github.job_workflow_ref }}"
          REF="${REF##*@}"
          echo "ref=$REF" >> "$GITHUB_OUTPUT"

      - name: Checkout qa-tool sensors at this pinned ref
        uses: actions/checkout@v4
        with:
          repository: danielaebenberger/qa-tool
          ref: ${{ steps.pin.outputs.ref }}
          path: qa-tool-sensors
          sparse-checkout: |
            src/harness/sensors

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install tsx globally (no full workspace install)
        run: npm install -g tsx

      - name: Run AC Validator
        working-directory: target
        run: |
          tsx ../qa-tool-sensors/src/harness/sensors/ac-validator/ac-validator.ts \
            --tests-dir "${{ inputs.cypress-path }}" \
            --output /tmp/ac-inventory.json || true

      - name: Run Cypress Analyzer
        id: cypress_analyzer
        working-directory: target
        run: |
          tsx ../qa-tool-sensors/src/harness/sensors/cypress-analyzer/cypress-analyzer.ts \
            --tests-dir "${{ inputs.cypress-path }}" \
            --output /tmp/cypress-adequacy-report.json
          echo "exit_code=$?" >> "$GITHUB_OUTPUT"
        continue-on-error: true

      - name: Collect sensor outputs
        id: collect
        run: |
          CY_SCORE=$(node -e "try { console.log(require('/tmp/cypress-adequacy-report.json').summary.averageQualityScore); } catch(e) { console.log('N/A'); }")
          CY_GRADE=$(node -e "try { console.log(require('/tmp/cypress-adequacy-report.json').summary.overallGrade); } catch(e) { console.log('N/A'); }")
          HAS_ONLY=$(node -e "try { console.log(require('/tmp/cypress-adequacy-report.json').summary.coverageSignals.hasOnlyTests); } catch(e) { console.log('false'); }")
          {
            echo "cy_score=$CY_SCORE"
            echo "cy_grade=$CY_GRADE"
            echo "has_only=$HAS_ONLY"
          } >> "$GITHUB_OUTPUT"

      - name: Post QA Harness report comment
        uses: actions/github-script@v7
        with:
          script: |
            const hasOnly = '${{ steps.collect.outputs.has_only }}' === 'true';
            const cyScore = '${{ steps.collect.outputs.cy_score }}';
            const cyGrade = '${{ steps.collect.outputs.cy_grade }}';
            const statusLine = hasOnly
              ? '## 🔴 QA Harness — BLOCKED\n> `.only` detected in Cypress tests — PR cannot be merged until removed.'
              : cyGrade === 'GOOD' ? '## 🟢 QA Harness — Sensors PASSED'
              : cyGrade === 'FAIR' ? '## 🟡 QA Harness — Sensors FAIR (review gaps)'
              : '## 🔴 QA Harness — Sensors POOR (action required)';
            const body = `${statusLine}\n\n<!-- qa-harness-report -->\n| Metric | Value |\n|---|---|\n| Quality score | \`${cyScore}/100\` |\n| Grade | \`${cyGrade}\` |\n| \`.only\` detected | \`${hasOnly ? '⛔ YES' : '✅ No'}\` |\n`;
            const { data: comments } = await github.rest.issues.listComments({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number });
            const existing = comments.find(c => c.user.type === 'Bot' && c.body.includes('<!-- qa-harness-report -->'));
            if (existing) {
              await github.rest.issues.updateComment({ owner: context.repo.owner, repo: context.repo.repo, comment_id: existing.id, body });
            } else {
              await github.rest.issues.createComment({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number, body });
            }

      - name: Fail if .only detected and fail-on-only is true
        if: inputs.fail-on-only == true
        run: |
          if [ "${{ steps.collect.outputs.has_only }}" = "true" ]; then
            echo "::error::.only detected in Cypress tests — remove before merging."
            exit 1
          fi
```

*(Note: `github.job_workflow_ref`, parsed in the "Determine the ref the caller pinned" step, resolves to the tag/ref the caller pinned when invoking `uses: danielaebenberger/qa-tool/.github/workflows/qa-harness-reusable.yml@qa-harness-v1` — this is what makes the sensor checkout version-locked to the same tag the caller opted into, per spec Decision 5.)*

- [ ] **Step 2: Remove the old workflow file**

```bash
git rm _incoming/feature-context-harness/.github/workflows/qa-harness.yml
rmdir _incoming/feature-context-harness/.github/workflows _incoming/feature-context-harness/.github 2>/dev/null || true
```

- [ ] **Step 3: Verify YAML validity**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/qa-harness-reusable.yml'))" 2>&1 || true`
Expected: no syntax error.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: convert qa-harness.yml into a version-pinnable reusable workflow"
```

---

## Task 16: `qa-capture` skill and `CONTRIBUTING.md`

**Files:**
- Create: `.claude/skills/qa-capture/SKILL.md`
- Create: `CONTRIBUTING.md`

**Interfaces:**
- Produces: the eighteenth catalog entry (`kind: skill`, `pillar: harness-engineering`) — regenerating `docs/CAPABILITIES.md` after this task must show 18 entries total (17 from Task 13 + this one).

- [ ] **Step 1: Write `.claude/skills/qa-capture/SKILL.md`**

```markdown
---
name: qa-capture
description: "Turn a lesson you just learned the hard way into a proposed skill, guide, or sensor — the on-ramp for contributing to this harness instead of solving the same problem alone next time."
kind: skill
pillar: harness-engineering
version: "1.0"
---

# Skill — Capture a lesson

Use this when you just worked something out the hard way and think
"someone else on the QA squad is going to hit this too."

## What this skill does

1. Asks you three questions:
   - What was the problem? (one or two sentences)
   - What did you do to solve it? (the actual steps/commands/prompt you used)
   - How often do you expect this to come up again? (one-off vs. recurring)
2. Based on the answers, proposes where it belongs:
   - **New skill** (`.claude/skills/qa-<name>/SKILL.md`) — if it's a
     repeatable, parameterised workflow.
   - **New guide** (`.claude/guides/<name>.md`) — if it's reference
     knowledge someone should read before doing a task, not a workflow
     someone runs.
   - **An addition to an existing skill/guide** — if it's a variant or edge
     case of something already in the catalog. Check
     [`docs/CAPABILITIES.md`](../../../docs/CAPABILITIES.md) first — this
     skill does that check for you and tells you if something close already
     exists.
   - **Not worth capturing** — a genuine one-off. Say so plainly; don't
     force a capture that isn't useful again.
3. Drafts the file with correct frontmatter (`name` with the `qa-` prefix,
   `description`, `kind`, `pillar` — ask which of the five groups in
   `CLAUDE.md` §1 fits — `version: "1.0"`).
4. Tells you to review the draft, run `pnpm capabilities:generate`, and open
   a PR. **This skill never opens a PR itself** — a human reviews every new
   or changed capability before it ships (see `CONTRIBUTING.md`).

## When to use

- You just spent 20 minutes figuring out a prompt/workaround that worked.
- You're about to write a one-off script and suspect you've done something
  like it before (this skill will tell you if a matching skill already
  exists, so you don't reinvent it).
- You noticed the catalog is missing something QA-relevant that the whole
  squad would benefit from.
```

- [ ] **Step 2: Write `CONTRIBUTING.md`**

```markdown
# Contributing to qa-tool

This repo's `.claude/` directory is a shared harness for the Jahia QA squad.
Anyone on the team can add to it. This page is the whole process — it's
deliberately short.

## Adding a new skill, agent, or sensor

1. **Check `docs/CAPABILITIES.md` first**, or run `qa-capture` (it checks
   for you) — don't build something that already exists under a different
   name.
2. Create the file:
   - Skill: `.claude/skills/qa-<name>/SKILL.md`
   - Agent: `.claude/agents/qa-<name>.agent.md`
   - Sensor: implementation in `src/harness/sensors/<name>/<name>.ts`, plus a
     `SENSOR.md` alongside it for the catalog.
3. Give it frontmatter with all of: `name` (prefixed `qa-`, kebab-case),
   `description` (one line, specific enough to disambiguate it from
   anything similar), `kind` (`skill` | `agent` | `sensor`), `pillar` (one
   of the five groups in `CLAUDE.md` §1), `version` (start at `"1.0"`).
   Add `see_also` (a bracketed list of other capability names) if something
   in the catalog is easily confused with this one — say why they're
   different in each one's description, not just in the list.
4. Run `pnpm capabilities:generate` and commit the updated
   `docs/CAPABILITIES.md` alongside your new file — CI rejects a PR where
   they're out of sync.
5. Open a PR. A second person reviews it — same as any code change. Explain
   *why* in the PR description, not just what.
6. Bump `version` (minor for a behavior tweak, major for a breaking change
   to the expected input/output) whenever you edit an existing capability.

## What NOT to do

- Don't hand-edit `docs/CAPABILITIES.md` — it's generated, and CI will
  reject a hand-edited version that doesn't match a fresh
  `pnpm capabilities:generate` run.
- Don't skip the `qa-` prefix — every skill/agent name is a candidate for
  eventually moving into `Jahia/cortex`'s `.claude/skills/`, which prefixes
  everything `jahia-*`. A consistent `qa-` prefix means zero renaming or
  collision risk if/when that happens.
- Don't merge two similar-but-different tools into one just because they
  sound alike — if they solve different-weight problems (a fast daily tool
  vs. a formal traceable one, say), keep them distinct and cross-link them
  with `see_also` instead.

## When this process needs to grow up

This is deliberately lightweight for a team under 10 contributors. If either
of these happens, it's time to revisit (add ADRs, per-tool contract docs,
CI-enforced frontmatter linting):

- The catalog passes **15 skills/agents/sensors** (currently at the count
  from `docs/CAPABILITIES.md`'s total after this task).
- `scripts/generate-capabilities.ts` itself needs a stable interface because
  something external starts depending on `CAPABILITIES.md`'s exact shape.
```

- [ ] **Step 3: Regenerate the catalog now that `qa-capture` exists**

Run: `pnpm capabilities:generate && grep -c '| \`qa-' docs/CAPABILITIES.md`
Expected: 18 (the 17 from Task 13 plus `qa-capture`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add qa-capture skill and CONTRIBUTING.md"
```

---

## Task 17: Rewrite `README.md`

**Files:**
- Modify: `README.md`

**Interfaces:** N/A — documentation only.

- [ ] **Step 1: Read the current `README.md`** to see its existing structure (tables/sections referenced by earlier commit history — `#8`/`#9` added `bug-brief` to its pillar and quick-reference tables), then rewrite its pillar table and quick-reference table to match the five-group structure from spec Decision 2 / `CLAUDE.md` §1, and add a link to `docs/CAPABILITIES.md` as the canonical, generated list. Concretely:
  - Replace the existing 4-pillar table with the 5-group table from `CLAUDE.md` §1.
  - Replace any per-skill "quick reference" listing with: "See the full, generated list in [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — regenerate it after any change with `pnpm capabilities:generate`."
  - Update any reference to `.github/prompts/`, `.github/skills/`, `.github/agents/`, or `AGENTS.md` to point at `.claude/skills/`, `.claude/agents/`, and `CLAUDE.md` respectively.
  - Add one sentence noting the merge: "As of 2026-09, this repo also absorbs what was `feature-context-harness` — its persona-based UAT, doc-review, and Cypress-adequacy sensor now live here as the Feature Validation pillar."
  - Leave everything else (setup instructions, env vars, ports, prerequisites) untouched.

- [ ] **Step 2: Verify no dead links remain**

Run: `grep -n "\.github/prompts\|\.github/skills\|\.github/agents\|AGENTS\.md" README.md`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README for the merged five-group capability structure"
```

---

## Task 18: Clean up remaining obsolete paths

**Files:**
- Delete: `_incoming/feature-context-harness/README.md`, `_incoming/feature-context-harness/LICENSE`, `_incoming/` (now empty)

**Interfaces:** N/A

- [ ] **Step 1: Confirm `_incoming/feature-context-harness` only has the two leftover top-level files**

Run: `find _incoming -type f`
Expected: exactly `_incoming/feature-context-harness/README.md` and `_incoming/feature-context-harness/LICENSE` (every other file was moved or deleted in Tasks 3–15).

- [ ] **Step 2: Remove them** — their content isn't lost; it's preserved in feature-context-harness's own repo history and in this branch's earlier subtree-add commit (Task 2), and feature-context-harness itself gets archived, not deleted, in Task 20.

```bash
git rm _incoming/feature-context-harness/README.md _incoming/feature-context-harness/LICENSE
rmdir _incoming/feature-context-harness _incoming 2>/dev/null || true
```

- [ ] **Step 3: Verify the working tree has no leftover Copilot-era or `_incoming` paths**

Run: `find . -maxdepth 2 -iname "*copilot*" -not -path "./.git/*"; find . -maxdepth 1 -iname "_incoming"`
Expected: no output from either command.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove leftover _incoming staging files"
```

---

## Task 19: Full validation pass

**Files:** none (verification only)

**Interfaces:** N/A

- [ ] **Step 1: Run the full existing test suite — must be unaffected by this merge**

Run: `pnpm test:run`
Expected: PASS — the five pre-existing unit test files (`FakeCIProvider`, `buildWatchedCase`, `failuresRoute`, `parseRunName`, `stability.classifier`) plus the four new sensor/generator test files all pass.

- [ ] **Step 2: Run lint and typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: no errors. Fix any `any`-without-justification or import-path issue surfaced by the moves in Tasks 3–18 before proceeding.

- [ ] **Step 3: Run the e2e smoke suite — proves Pillar 1's dashboard app is untouched**

Run: `pnpm e2e:smoke`
Expected: PASS.

- [ ] **Step 4: Regenerate the catalog one final time and confirm it's committed clean**

Run: `pnpm capabilities:generate && git status --porcelain docs/CAPABILITIES.md`
Expected: no output (nothing to commit — the committed version already matches).

- [ ] **Step 5: Manually dogfood the reusable workflow's sensor logic against this repo's own tree** (qa-tool has no Cypress suite of its own, so point the analyzer at a throwaway fixture to confirm the ported logic still behaves — this is a smoke check of the *ported code path*, not a full CI dry-run, which requires a real consuming repo and is out of scope for this task)

```bash
mkdir -p /tmp/fixture-cypress/e2e
cat > /tmp/fixture-cypress/e2e/sample.cy.ts <<'EOF'
describe('Sample', () => {
  it.only('does something', () => { cy.get('.css-class').should('be.visible'); });
});
EOF
pnpm tsx src/harness/sensors/cypress-analyzer/cypress-analyzer.ts --tests-dir /tmp/fixture-cypress/e2e --output /tmp/report.json
echo "Exit code: $?"
node -e "console.log(require('/tmp/report.json').summary.coverageSignals.hasOnlyTests)"
rm -rf /tmp/fixture-cypress /tmp/report.json
```

Expected: "Exit code: 1" (the `.only` in the fixture correctly triggers the CI-blocking exit code) and `true` printed for `hasOnlyTests` — confirms the TS port preserves the exact behavior `qa-harness-reusable.yml` depends on.

- [ ] **Step 6: Note the two validation steps this task cannot automate**, and flag them to the user before Task 20:
  - **Dogfooding `qa-harness-reusable.yml` end-to-end** requires a real consuming repo's CI to invoke `uses: danielaebenberger/qa-tool/.github/workflows/qa-harness-reusable.yml@<tag>` — only possible after Task 20's cutover creates the `qa-harness-v1` tag. Recommend a first real run against a low-stakes Jahia repo before treating the reusable workflow as trustworthy elsewhere.
  - **Team smoke-test in Claude Code** ("open this branch, confirm `qa-define-testcases`, `qa-tldr`, `qa-run` are discoverable and behave as before") is a human task — ask 1-2 QA squad members to do this on the pushed branch before cutover.

- [ ] **Step 7: Commit** (only if Steps 1–5 required any fixes)

```bash
git add -A
git commit -m "fix: address validation findings from full test/lint/typecheck/smoke pass"
```
(Skip this commit if nothing needed fixing.)

---

## Task 20: Cutover — requires explicit human go-ahead

**This task is not autonomous.** Merging to `main`, tagging a release other repos will pin to, and archiving another GitHub repository are hard-to-reverse and visible-to-others actions. Do not execute this task's steps without the repo owner explicitly confirming: (a) Task 19's validation passed, (b) the two manual checks in Task 19 Step 6 are either done or explicitly waived, and (c) they want cutover to happen now.

**Files:** none (git/GitHub operations only)

- [ ] **Step 1: Push the final state of the branch** (if not already up to date)

```bash
cd /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/qa-tool
git push origin merge/feature-context-harness-design
```

- [ ] **Step 2: Open a PR and get it reviewed** (per `CONTRIBUTING.md`'s own rule — this PR is exactly the kind of change it describes)

```bash
gh pr create --repo danielaebenberger/qa-tool \
  --title "Merge feature-context-harness into qa-tool" \
  --body "Implements docs/superpowers/specs/2026-09-02-feature-context-harness-merge-design.md and docs/superpowers/plans/2026-09-02-feature-context-harness-merge.md."
```

- [ ] **Step 3: After approval, merge and tag**

```bash
gh pr merge --repo danielaebenberger/qa-tool --merge
git checkout main && git pull origin main
git tag qa-harness-v1
git push origin qa-harness-v1
```

- [ ] **Step 4: Update feature-context-harness's README with a pointer, then archive (not delete) the repo**

```bash
cd /private/tmp/claude-502/-Users-debenberger/23619d5a-4155-489f-a846-bda87dc4bcb6/scratchpad/repos/feature-context-harness
git checkout feature/qa-harness-initial
```

Edit `README.md`'s first line to:
```markdown
> **Archived 2026-09.** This repo's content has been merged into
> [`qa-tool`](https://github.com/danielaebenberger/qa-tool) — see its
> Feature Validation pillar and `docs/CAPABILITIES.md`.
```

```bash
git add README.md
git commit -m "docs: note merge into qa-tool before archiving"
git push origin main
gh repo archive danielaebenberger/feature-context-harness --yes
```

- [ ] **Step 5: Announce to the team** — one message pointing at `CLAUDE.md` and `docs/CAPABILITIES.md`, plus a line on `qa-capture` as how to propose the next one (spec Decision 7, Step 5). This is a communication step for the repo owner to send in their own voice — not something to automate.

---

## Self-Review Notes

*(Recorded here per the writing-plans skill's self-review step — not part of the executable plan.)*

- **Spec coverage:** Decision 1 (layout) → Tasks 3–12, 18. Decision 2 (pillar reframing) → `CLAUDE.md` in Task 3, `README.md` in Task 17, pillar values used throughout Tasks 5–7/12. Decision 3 (overlap resolution) → Task 5 Step 2 (unchanged `qa-define-testcases`), `see_also` fields in Tasks 5/7. Decision 4 (catalog) → Tasks 13–14. Decision 5 (reusable Action) → Task 15. Decision 6 (governance) → Task 16. Decision 7 (migration steps 0–5) → Tasks 1–2 (step 0-1), 3–18 (step 2's eleven substeps), 19 (step 3), 20 (steps 4–5). All spec decisions have a task.
- **Placeholder scan:** no TBD/TODO; every code step has complete, runnable content; no "similar to Task N" references.
- **Type consistency:** `hasOnlyTests` (not `hasOnly`) is used consistently at the `summary.coverageSignals` level across Task 10's implementation, Task 15's workflow JS, and Task 19's dogfooding check — verified against the original JS sensor's field name, which the pre-existing `qa-harness.yml` comment logic already depended on. `AcInventorySummary`/`CypressAdequacyReport`/`ParsedSources` types are defined once in their owning task and referenced, not redefined, in every task that touches them.
