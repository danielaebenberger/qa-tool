# pr-test-reviewer Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new read-only subagent, `pr-test-reviewer`, to `qa-tool` that reviews an already-open test PR (Cypress/e2e/Selenium/unit) in any Jahia repo — coverage audit, convention fit, a weighted cross-repo idiom check, scope/independence, blockers, and prior-review tracking — and wire it into the repo's existing documentation surfaces (`README.md`, `AGENTS.md`).

**Architecture:** One new markdown agent-definition file (`.github/agents/pr-test-reviewer.agent.md`), sibling to the existing `.github/agents/qa-reviewer.agent.md`, following the same frontmatter + review-dimensions + fixed-output-format shape. No application code changes — this is a prompt/instructions artifact, same tier as the repo's existing prompts/skills/agents. Validated by dry-running it (via a subagent that adopts its instructions) against `Jahia/serverSettings#224` and comparing the result to the manual review already produced for that PR.

**Tech Stack:** Markdown (agent/prompt definition), GitHub CLI (`gh`) for read-only PR/repo access, no new dependencies.

## Global Constraints

- Read-only: the new agent must never run a GitHub write command (`gh pr comment`, `gh pr review`, `gh pr merge`, etc.) and must never edit files in the target repo.
- No fabricated behavior, coverage numbers, or conventions — "I cannot verify X" is a valid and expected output.
- Scoped to test PRs only (Cypress/e2e, Selenium, unit) — must say so and stop if the PR under review is not a test PR.
- Every item under "Specific suggestions" in the output must cite a concrete `file:line`, either in the target repo or in one of the reference repos.
- Cross-repo idiom check uses exactly this weighted allowlist, in this order: `Jahia/jahia-cypress` (check first — shared helpers), `Jahia/mail-service` (current gold standard for structure/wait-strategy), `Jahia/jcontent` (largest mature e2e suite), `Jahia/jahia-ee` (essential-flow coverage only, NOT a style/wait-strategy exemplar — flag conflicts with the others explicitly rather than silently picking one).
- Output is exactly one markdown document in the fixed shape defined in Task 1 — no free-form deviation.
- New agent file must match `qa-reviewer.agent.md`'s density/length (roughly 70-110 lines) — do not pad or under-specify.

---

### Task 1: Create the `pr-test-reviewer` agent definition

**Files:**
- Create: `.github/agents/pr-test-reviewer.agent.md`
- Reference (read, not modified): `.github/agents/qa-reviewer.agent.md` (style template), `.github/instructions/qa-domain.instructions.md` (rules the new agent must cite/load)

**Interfaces:**
- Consumes: `.github/instructions/qa-domain.instructions.md` (loaded by reference at runtime, per its existing content: coverage-audit rule, shared-component rule, group-by-feature rule, no-test-chaining rule, write-up-length rule).
- Produces: the file path `.github/agents/pr-test-reviewer.agent.md`, which Task 2 and Task 3 link to from `README.md` and `AGENTS.md`, and which Task 4 dry-runs.

- [ ] **Step 1: Write the agent definition file**

Create `.github/agents/pr-test-reviewer.agent.md` with exactly this content:

```markdown
---
name: pr-test-reviewer
description: "Read-only review of a test PR (Cypress/e2e/Selenium/unit) in any Jahia repo — coverage fit, convention fit, cross-repo idiom check, scope, and prior-feedback tracking. Use when: reviewing a PR that adds/changes tests."
tools: ["read", "search", "grep", "bash", "webfetch"]
---

# Subagent — `pr-test-reviewer`

You are a focused code-review subagent for **test PRs in any Jahia
repository** (not just `qa-tool`). You **read only** — via `gh`/`curl`
read/GET operations, never a GitHub write command (`gh pr comment`,
`gh pr review`, `gh pr merge`, etc.). You do not edit files. You return one
structured review to the calling agent.

If the PR under review does not add or modify tests (Cypress/e2e,
Selenium, unit), say so explicitly and stop — you are not built to judge
non-test source changes.

## What to load before reviewing

1. [`.github/instructions/qa-domain.instructions.md`](../instructions/qa-domain.instructions.md)
   — coverage-audit rule, no-duplicate-shared-component rule, group-by-
   feature rule, no-test-chaining rule, write-up-length-matches-change-size
   rule. Apply all of these to code that already exists, not to cases not
   yet written.
2. The PR itself: `gh pr view <owner>/<repo>#<n> --json title,body,files,commits`
   and `gh pr diff <n> --repo <owner>/<repo>`.

## Review pipeline (apply in order)

### Step 0 — Prior-review check (skip if none exist)

Run:
- `gh api repos/{owner}/{repo}/pulls/{n}/reviews`
- `gh api repos/{owner}/{repo}/pulls/{n}/comments`

For every prior point raised, classify against the **current** diff:
`addressed` / `not addressed` / `superseded` (the code changed enough that
the original point no longer applies as stated). Only after this
classification do you move to steps 1–5, and only for what's new or still
open.

### Step 1 — Coverage audit (target repo)

Search the target repo for existing tests touching this area — **twice**:
once by code-level identifiers (action ids, function/prop names), once by
human-visible text (button/menu labels, page titles) — a canonical
enumeration/"sanity" spec often asserts rendered labels only, and a
code-token-only search misses it. Identify:
- Whether the PR should have extended a canonical test instead of adding a
  parallel new file.
- Whether the PR re-tests a shared component/action already proven
  elsewhere (should assert reachability only).
- If neither applies, say explicitly this is new, non-duplicated coverage.

### Step 2 — Convention fit (target repo, self-consistency)

Does the new page-object/spec match this repo's own existing style? Class
shape (e.g. `extends BasePage`, static `visit()`, fluent chaining
returning `this`), fixture setup/teardown pattern, naming. Cite the
existing file(s) compared against.

### Step 3 — Cross-repo idiom check

Search this default allowlist for established patterns the PR should
reuse rather than reinvent. Weight them — do not treat all four as
equally authoritative:

1. `Jahia/jahia-cypress` — the shared `@jahia/cypress` package (custom
   commands, page-object base classes, plugins). Check FIRST: if a
   helper/command already exists here, the PR should use it, not reinvent
   it.
2. `Jahia/mail-service` — most recent, highest-coverage suite in the org.
   Treat as the current gold standard for structure and wait-strategy
   when repos disagree. Its own `cy.wait()` calls are only ever the
   sleep-between-attempts inside a bounded hand-rolled poll helper
   (`tests/cypress/support/mailpit.ts`, `tests/cypress/support/mailService.ts`)
   — never a bare fire-and-hope wait. Surface that distinction (`cy.wait`
   as a poll-loop primitive vs. `cy.wait` as the entire wait strategy)
   when relevant.
3. `Jahia/jcontent` — largest, most mature Cypress e2e suite. Strong
   source of real-world precedent for UI/iframe-heavy flows (`cy.waitUntil`
   polling iframe content is the recurring idiom, e.g.
   `tests/cypress/page-object/contentEditor.ts`).
4. `Jahia/jahia-ee` — covers essential/core flows but is older and
   inconsistent: mixes `cy.waitUntil` with legacy bare `cy.wait(ms)`.
   Useful for "does an essential flow like this already exist," NOT for
   wait-strategy or style precedent. If `jahia-ee`'s convention conflicts
   with `jahia-cypress`/`mail-service`, say so explicitly and prefer the
   latter — never silently pick one without flagging the conflict.

The user may name additional repos in their request ("also check
jahia-forms"); search those too with the same cite-what-you-found rigor.

### Step 4 — Scope & independence

- Grouped by feature/capability, not by file or method.
- No test chains — each `it()` independently runnable, one clear failure
  signal; shared fixture setup in `before`/`beforeEach` is fine, dependency
  between `it()` blocks is not.
- This report's own length matches the size of the change under review.

### Step 5 — Blockers

- Referenced open PRs / unresolved dependencies mentioned in the PR body.
- Unchecked PR checklist items that look substantive vs. cosmetic.
- Anything that would make CI red on merge as-is.

## Output format

Return exactly one markdown document:

```
# pr-test-reviewer report

**Target PR:** <link>
**Verdict:** <approve | request changes | block>

## Prior-review status (omit this section entirely if step 0 found nothing)
| Prior point | Status | Note |
|---|---|---|

## Summary
<2–4 sentences>

## Dimension findings
| # | Dimension | Status | Note |
|---|---|---|---|
| 1 | Coverage audit | pass / concern / block | |
| 2 | Convention fit | pass / concern / block | |
| 3 | Cross-repo idiom check | pass / concern / block | |
| 4 | Scope & independence | pass / concern / block | |
| 5 | Blockers | pass / concern / block | |

## Specific suggestions
- file:line — what to change and why (cite the target-repo file or the
  reference-repo file/line the suggestion is modeled on).

## What I did not check
<anything not verifiable read-only, e.g. whether it actually passes in CI>
```

Every claim in "Specific suggestions" must cite a concrete file:line —
either in the target repo or in a reference repo. No unattributed "best
practice" advice. "I cannot verify X" is a valid and expected output;
never fabricate coverage numbers or behavior you have not read.

Do not write code. Do not edit files. Do not run any GitHub write command.
Do not chain into further tool runs beyond reading, grepping, and
read-only `gh`/`curl` calls.
```

- [ ] **Step 2: Verify the file's structure mechanically**

Run:
```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  head -5 .github/agents/pr-test-reviewer.agent.md && \
  grep -c "^## " .github/agents/pr-test-reviewer.agent.md && \
  awk '/^```/{f=!f; next} f' .github/agents/pr-test-reviewer.agent.md | grep -n "gh pr comment\|gh pr review\|gh pr merge"
```
Expected:
- `head -5` shows the frontmatter block (`---`, `name: pr-test-reviewer`, `description: ...`, `tools: [...]`, `---`).
- The `grep -c "^## "` count is 3 (`## What to load before reviewing`, `## Review pipeline (apply in order)`, `## Output format` — the `### Step N` lines have three hashes and do not match this pattern, so they're excluded by design; this count confirms no extra or missing top-level section).
- The last command finds **zero** matches **inside fenced code blocks** (confirms no GitHub write command is ever instructed as an actual invocation). Note this deliberately does NOT scan prose: the file's read-only declaration names `gh pr comment`/`gh pr review`/`gh pr merge` inline, as illustrative examples of what's forbidden — that mention is correct and expected, not a violation. Only a match inside a ` ```...``` ` block (an actual instructed command) would mean Step 1's content is wrong.

- [ ] **Step 3: Commit**

```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  git add .github/agents/pr-test-reviewer.agent.md && \
  git commit -m "feat: add pr-test-reviewer agent

Read-only subagent that reviews test PRs (Cypress/e2e/Selenium/unit) in
any Jahia repo: coverage audit, convention fit against the target repo,
a weighted cross-repo idiom check (jahia-cypress, mail-service, jcontent,
jahia-ee), scope/independence, blockers, and prior-review tracking on
re-review. Sibling to qa-reviewer, which stays scoped to qa-tool itself."
```

---

### Task 2: Wire the new agent into `README.md`

**Files:**
- Modify: `README.md:20` (pillar 3 row), `README.md:37` (insert new row directly after)

**Interfaces:**
- Consumes: `.github/agents/pr-test-reviewer.agent.md` (Task 1's output — the link target).
- Produces: nothing consumed by later tasks; this is a leaf documentation update.

- [ ] **Step 1: Update the pillar 3 row**

In `README.md`, the current line 20 reads:

```
| 3 | **Test-case identification** | Draft/challenge test cases for a ticket; ask clarifying questions; flag missing requirements | **Prompt + skill** — no app UI yet | **`/define-testcases`** for a single ticket; the **`test-case-design`** skill for an epic or a regression-prone area |
```

Replace it with:

```
| 3 | **Test-case identification** | Draft/challenge test cases for a ticket; ask clarifying questions; flag missing requirements; review an already-open test PR | **Prompt + skill + agent** — no app UI yet | **`/define-testcases`** for a single ticket; the **`test-case-design`** skill for an epic or a regression-prone area; the **`pr-test-reviewer`** agent for reviewing an already-open test PR |
```

- [ ] **Step 2: Insert the new quick-reference row**

The current lines 36-38 read:

```
| [`bootstrap-qa-tool`](.github/prompts/bootstrap-qa-tool.prompt.md) | prompt | Reference only — records the original scaffold decisions | Not something you run day-to-day |
| [`qa-reviewer`](.github/agents/qa-reviewer.agent.md) | agent | Reviewing a PR or staged changes to qa-tool itself | A read-only structured review against the four pillars and the hard constraints in `AGENTS.md` |

```

Replace with (adding one new row directly after `qa-reviewer`, keeping the blank line after):

```
| [`bootstrap-qa-tool`](.github/prompts/bootstrap-qa-tool.prompt.md) | prompt | Reference only — records the original scaffold decisions | Not something you run day-to-day |
| [`qa-reviewer`](.github/agents/qa-reviewer.agent.md) | agent | Reviewing a PR or staged changes to qa-tool itself | A read-only structured review against the four pillars and the hard constraints in `AGENTS.md` |
| [`pr-test-reviewer`](.github/agents/pr-test-reviewer.agent.md) | agent | Reviewing an open PR that adds/changes tests (Cypress/e2e, Selenium, unit) in any Jahia repo | A read-only structured review: coverage fit, convention fit, cross-repo idiom check, scope, and prior-feedback tracking on re-review |

```

- [ ] **Step 3: Verify**

Run:
```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  grep -n "pr-test-reviewer" README.md
```
Expected: two matches — one in the pillar 3 row (around line 20), one in the quick-reference table (around line 38).

- [ ] **Step 4: Commit**

```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  git add README.md && \
  git commit -m "docs: list pr-test-reviewer in README"
```

---

### Task 3: Wire the new agent into `AGENTS.md`

**Files:**
- Modify: `AGENTS.md:53` (harness table, insert new row after), `AGENTS.md:102-103` (directory tree, insert new leaf after)

**Interfaces:**
- Consumes: `.github/agents/pr-test-reviewer.agent.md` (Task 1's output).
- Produces: nothing consumed by later tasks; leaf documentation update.

- [ ] **Step 1: Add a harness-table row**

The current line 53 reads:

```
| `.github/agents/qa-reviewer.agent.md` | sensor / inferential | subagent | Reviews changes against QA-pillar goals |
```

Replace with (adding a new row directly after):

```
| `.github/agents/qa-reviewer.agent.md` | sensor / inferential | subagent | Reviews changes against QA-pillar goals |
| `.github/agents/pr-test-reviewer.agent.md` | sensor / inferential | subagent | Reviews test PRs in any Jahia repo for coverage fit, convention fit, and cross-repo idiom |
```

- [ ] **Step 2: Add the tree leaf**

The current lines 102-103 read:

```
    └── agents/
        └── qa-reviewer.agent.md
```

Replace with:

```
    └── agents/
        ├── qa-reviewer.agent.md
        └── pr-test-reviewer.agent.md
```

- [ ] **Step 3: Verify**

Run:
```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  grep -n "pr-test-reviewer" AGENTS.md
```
Expected: two matches — one in the harness table, one in the directory tree.

- [ ] **Step 4: Commit**

```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  git add AGENTS.md && \
  git commit -m "docs: list pr-test-reviewer in AGENTS.md harness table"
```

---

### Task 4: Validate the agent against `Jahia/serverSettings#224`

**Files:**
- Read only: `.github/agents/pr-test-reviewer.agent.md` (Task 1's output)
- Modify (only if a gap is found): `.github/agents/pr-test-reviewer.agent.md`

**Interfaces:**
- Consumes: Task 1's finished agent file content, verbatim.
- Produces: a pass/fail validation record (this task's own output) — nothing later depends on it structurally, but a failure here means Task 1 is not actually done and must be revised.

This task has no automated test harness — `.github/agents/*.agent.md` files are GitHub Copilot's agent format, not directly invocable through Claude Code's own subagent registry. The "test" is a manual dry run: dispatch a general-purpose subagent instructed to adopt the new file's instructions verbatim, point it at the real PR, and check its output against a concrete expected-findings checklist derived from the manual review already produced for this PR earlier in this project's history.

- [ ] **Step 1: Read the finished agent file**

Read `.github/agents/pr-test-reviewer.agent.md` in full (it was just written in Task 1) so its exact current text can be pasted into the dry-run prompt in Step 2.

- [ ] **Step 2: Dry-run against the PR's current (already-fixed) state**

Dispatch a subagent (Agent tool, `subagent_type: general-purpose`, run in the foreground since the result is needed immediately) with a prompt of this shape:

```
Adopt exactly the following agent definition as your operating
instructions for this task. Do not deviate from its pipeline or output
format.

<paste the full content of .github/agents/pr-test-reviewer.agent.md here>

---

Now review this PR using the pipeline above: https://github.com/Jahia/serverSettings/pull/224

Return only the markdown report the instructions specify.
```

- [ ] **Step 3: Check the output against this expected-findings checklist**

The PR is currently in its post-fix state (the "test: remove cy.wait()" commit already landed). Confirm the returned report:

- [ ] Step 0 runs (prior review comments/reviews exist on this PR from earlier manual review in this project, if any were left as actual GitHub PR comments — if none were ever posted to GitHub itself, the report should say so and correctly skip to Step 1, not fabricate a prior-review table).
- [ ] Dimension 1 (Coverage audit) concludes this is new, non-duplicated coverage — no existing canonical/enumeration test for `manageUsers` in `serverSettings` to extend, and the Selenium `createServerAdminUserTest` in `Jahia/selenium` is correctly identified as a narrow fixture, not overlapping coverage.
- [ ] Dimension 2 (Convention fit) cites `tests/cypress/e2e/page-object/PasswordPolicyPage.ts` as the existing pattern `ManageUsersPage.ts` matches (`extends BasePage`, static `visit()`, fluent chaining).
- [ ] Dimension 3 (Cross-repo idiom check) recognizes that `ManageUsersPage.ts`'s `waitForIframeElement` helper (using `cy.waitUntil`) already matches the established idiom in `Jahia/jahia-cypress` and `Jahia/jcontent`, rather than flagging it as a problem — i.e. it must not repeat outdated feedback about `cy.wait(2000)`, since that was already fixed.
- [ ] Dimension 5 (Blockers) notes the PR body's reference to `Jahia/serverSettings#223` and checks/reports that PR's current state (open or merged).
- [ ] Every "Specific suggestions" bullet cites a real `file:line`.

- [ ] **Step 4: Reconcile discrepancies**

If the subagent's output diverges materially from the checklist in Step 3 (e.g. it fails to find `PasswordPolicyPage.ts` as the convention match, or it doesn't correctly weight `jahia-ee` below `jahia-cypress`/`mail-service`), treat this as a gap in the Task 1 instructions, not a one-off fluke. Edit `.github/agents/pr-test-reviewer.agent.md` to close the gap (e.g. add a more explicit instruction to search `page-object/*.ts` files specifically in Step 2 of the pipeline, if that's what was missed). Re-run Step 2 once after any edit.

- [ ] **Step 5: Commit any fixes**

Only if Step 4 required an edit:

```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  git add .github/agents/pr-test-reviewer.agent.md && \
  git commit -m "fix: tighten pr-test-reviewer instructions after dry-run against serverSettings#224

<one line on what the dry-run against the real PR revealed and what changed>"
```

If Step 3's checklist passed without needing Step 4, skip this commit — there is nothing new to commit.

---

### Task 5: Open the PR

**Files:** none (repository-level action)

**Interfaces:**
- Consumes: all commits from Tasks 1–4 on branch `feature/pr-test-reviewer-agent`.
- Produces: an open GitHub PR the user reviews and merges.

- [ ] **Step 1: Push the branch**

```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  git push -u origin feature/pr-test-reviewer-agent
```

- [ ] **Step 2: Open the PR**

```bash
cd "/Users/debenberger/Documents/RESOURCES/07jahiaqa/qa-tool" && \
  gh pr create --title "feat: add pr-test-reviewer agent" --body "$(cat <<'EOF'
## Summary
- Adds `pr-test-reviewer`, a read-only subagent for reviewing test PRs (Cypress/e2e/Selenium/unit) in any Jahia repo: coverage audit, convention fit, a weighted cross-repo idiom check (jahia-cypress, mail-service, jcontent, jahia-ee), scope/independence, blockers, and prior-review tracking on re-review.
- Wires it into README.md's pillar-3 row and quick-reference table, and AGENTS.md's harness table/tree.
- Generalizes the manual review process used on Jahia/serverSettings#224; dry-run validated against that PR.

## Test plan
- [x] Dry-run against Jahia/serverSettings#224 (post-fix state) matched the expected-findings checklist in docs/superpowers/plans/2026-07-22-pr-test-reviewer-agent.md, Task 4.
EOF
)"
```

Do not run this task without explicit user go-ahead at execution time — pushing a branch and opening a PR are the first repository-visible actions in this plan.
