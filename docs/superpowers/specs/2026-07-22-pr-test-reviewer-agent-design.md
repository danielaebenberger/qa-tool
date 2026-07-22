# `pr-test-reviewer` agent — design spec

**Date:** 2026-07-22
**Status:** approved, ready for implementation plan

## Problem

Pillar 3 (test-case identification) covers drafting/challenging test cases
for a ticket (`/define-testcases`, `test-case-design` skill) and reviewing
changes to `qa-tool` itself (`qa-reviewer` agent). It has no tool for a
recurring, distinct job we've now done twice by hand for
`Jahia/serverSettings#224`: **reviewing an already-written test PR** in an
arbitrary Jahia repo — is the implementation good, is the scope right, does
it duplicate existing coverage, does it follow the conventions the rest of
the Jahia Cypress ecosystem has already converged on (e.g. `cy.waitUntil`
instead of bare `cy.wait(ms)`), and — on a second pass — was prior feedback
actually addressed?

That second pass on #224 (checking the "remove cy.wait()" follow-up commit)
required the reviewer to notice something had changed, refetch the diff,
and re-derive whether the fix was real or cosmetic. That should be a
built-in capability, not something the user has to prompt for each time.

## Goal

Add a new subagent, **`pr-test-reviewer`**, that performs this review
end-to-end from a PR link: fetch, audit existing coverage, check convention
fit against both the target repo and a curated set of reference repos,
check scope/independence, check for open blockers, and — if the PR was
reviewed before — check whether prior points were addressed. Output is a
single structured markdown report, read-only, no GitHub writes.

## Non-goals

- Not a general code reviewer. Scoped to PRs that add/modify tests
  (Cypress/e2e, Selenium, unit). Non-test source changes are out of scope —
  the agent should say so and stop rather than reviewing implementation
  code it wasn't built to judge.
- Does not post to GitHub. Never runs `gh pr comment`, `gh pr review`, or
  any write command. Output is a markdown artefact the user pastes
  themselves, consistent with the tool's "output is editable artefacts a
  human owns" principle.
- Does not generate new test cases. That's `/define-testcases` and
  `test-case-design`'s job. This agent judges what's already written.

## Where it lives

New file: `.github/agents/pr-test-reviewer.agent.md`, sibling to the
existing `.github/agents/qa-reviewer.agent.md`. Same subagent shape
(frontmatter + read-only tool grant + structured output contract), scoped
to external test PRs instead of qa-tool's own code.

```yaml
---
name: pr-test-reviewer
description: "Read-only review of a test PR (Cypress/e2e/Selenium/unit) in any Jahia repo — coverage fit, convention fit, cross-repo idiom check, scope, and prior-feedback tracking. Use when: reviewing a PR that adds/changes tests."
tools: ["read", "search", "grep", "bash", "webfetch"]
---
```

`bash` is granted but constrained in the agent's own body to read-only
`gh`/`curl` operations (PR view/diff/api-GET, repo content reads). The
agent instructions state explicitly: never run a GitHub write command.

## Inputs

- PR link or `owner/repo#number` (required).
- Optionally, additional reference repos to check beyond the default
  allowlist ("also check jahia-forms").

If no PR link is given, ask for one rather than guessing which PR is meant.

## Pipeline

Loads `.github/instructions/qa-domain.instructions.md` first, same as
every other pillar-3 tool — that's where the coverage-audit, no-duplicate,
group-by-feature, and no-test-chaining rules already live; this agent
applies them to code that already exists instead of cases not yet written.

### Step 0 — Prior-review check (skip if none exist)

- `gh api repos/{owner}/{repo}/pulls/{n}/reviews`
- `gh api repos/{owner}/{repo}/pulls/{n}/comments`
- For each prior point raised, classify against the **current** diff:
  `addressed` / `not addressed` / `superseded` (the underlying code changed
  enough that the original point no longer applies as stated).
- Only after this classification does the agent move to steps 1–6, and
  only for what's new or still open.

### Step 1 — Fetch the PR

`gh pr view` (title, body, description, checklist state) + `gh pr diff`
(full diff) + changed-files list. If the PR body references another PR as
a blocker (as #224 did with #223), note its current state
(`gh pr view <n> --json state,mergedAt`).

### Step 2 — Coverage audit (target repo)

Search the target repo for existing tests touching this area — **twice**:
once by code-level identifiers (action ids, function/prop names), once by
human-visible text (button/menu labels, page titles), per the domain
instructions' existing rule that a canonical enumeration/"sanity" spec
often asserts rendered labels only. Identify:
- Whether the PR extends a canonical test that should have been extended
  instead of adding a parallel new file.
- Whether the PR re-tests a shared component/action already proven
  elsewhere (should assert reachability only, not re-verify the shared
  behavior).
- If neither applies, say explicitly that this is new, non-duplicated
  coverage — don't manufacture a false "extends" finding.

### Step 3 — Convention fit (target repo, self-consistency)

Does the new page-object/spec match this repo's own existing style?
Concretely: class shape (e.g. `extends BasePage`, static `visit()`,
fluent chaining returning `this`), fixture setup/teardown pattern
(`before`/`after` with the repo's own create/delete helpers), naming.
Cite the existing file(s) it was compared against.

### Step 4 — Cross-repo idiom check

Search a default allowlist of reference repos for established patterns
the PR should be reusing rather than reinventing (waits, common
interactions, helper commands). Each repo is weighted, not treated as
equally authoritative:

```
1. Jahia/jahia-cypress — the shared @jahia/cypress package (custom
   commands, page-object base classes, plugins). Check FIRST: if a
   helper/command already exists here, the PR should use it, not
   reinvent it.
2. Jahia/mail-service — most recent, highest-coverage suite in the org.
   Treat as the current gold standard for structure and wait-strategy
   when repos disagree. Its own cy.wait() usage is only ever the
   sleep-between-attempts inside a bounded hand-rolled poll helper
   (support/mailpit.ts, support/mailService.ts) — never a bare
   fire-and-hope wait. That distinction (cy.wait as a poll-loop
   primitive vs. cy.wait as the entire wait strategy) is worth
   surfacing when relevant.
3. Jahia/jcontent — largest, most mature Cypress e2e suite. Strong
   source of real-world precedent for UI/iframe-heavy flows
   (cy.waitUntil polling iframe content is the recurring idiom there).
4. Jahia/jahia-ee — covers essential/core flows but is older and
   inconsistent: mixes cy.waitUntil with legacy bare cy.wait(ms), some
   with explanatory comments, some without. Useful for "does an
   essential flow like this already exist," NOT for wait-strategy or
   style precedent. If jahia-ee's convention conflicts with
   jahia-cypress/mail-service, say so explicitly and prefer the latter
   — never silently pick one without flagging the conflict.
```

The user may name additional repos per-invocation; always include those
in the search with the same "cite what you found, don't assume" rigor.

### Step 5 — Scope & independence

Straight from the domain instructions, applied to code instead of
proposed cases:
- Grouped by feature/capability, not by file or method.
- No test chains — each `it()` independently runnable, one clear failure
  signal; fixture setup in `before`/`beforeEach` is fine, dependency
  between `it()` blocks is not.
- Write-up length (this report's own length) matches the size of the
  change — a two-file, single-feature PR gets a compact report, not a
  multi-page one.

### Step 6 — Blockers

- Referenced open PRs / unresolved dependencies (from step 1).
- Unchecked PR checklist items that look substantive vs. cosmetic.
- Anything that would make CI red on merge as-is.

## Output format

One markdown document, mirroring `qa-reviewer`'s existing shape so the
two agents feel like one family:

```
# pr-test-reviewer report

**Target PR:** <link>
**Verdict:** <approve | request changes | block>

## Prior-review status (omit this section if step 0 found nothing)
| Prior point | Status | Note |
|---|---|---|

## Summary
<2-4 sentences>

## Dimension findings
| # | Dimension | Status | Note |
|---|---|---|---|
| 1 | Coverage audit | pass/concern/block | ... |
| 2 | Convention fit | ... | ... |
| 3 | Cross-repo idiom check | ... | ... |
| 4 | Scope & independence | ... | ... |
| 5 | Blockers | ... | ... |

## Specific suggestions
- file:line — what to change and why (cite the target-repo file or the
  reference-repo file/line the suggestion is modeled on).

## What I did not check
<anything not verifiable read-only, e.g. whether it actually passes in CI>
```

Every claim in "Specific suggestions" must cite a concrete file:line —
either in the target repo (for convention-fit claims) or in a reference
repo (for cross-repo idiom claims). No unattributed "best practice" advice.

## Constraints (hard, same tier as qa-reviewer's)

- Read-only. No edits to the target repo. No GitHub write commands ever.
- No fabricated behavior or coverage numbers — "I cannot verify X" is a
  valid and expected output.
- Does not review non-test source changes; says so and stops if the PR
  under review isn't a test PR.

## Documentation updates

- Add one row to `README.md`'s "Skills, prompts, and agents — quick
  reference" table, directly under the existing `qa-reviewer` row:

  | Name | Type | Use it when | What you get |
  |---|---|---|---|
  | [`pr-test-reviewer`](.github/agents/pr-test-reviewer.agent.md) | agent | Reviewing an open PR that adds/changes tests (Cypress/e2e, Selenium, unit) in any Jahia repo | A read-only structured review: coverage fit, convention fit, cross-repo idiom check, scope, and prior-feedback tracking on re-review |

- No changes needed to the "four pillars" table itself — this is a new
  tool under pillar 3, not a new pillar; pillar 3's row already says
  "Prompt + skill," which becomes "Prompt + skill + agent" as a small
  wording tweak in that row's "How you use it" cell.

## Validation plan

Dry-run the new agent against `Jahia/serverSettings#224` in both states
we've already reviewed by hand:
1. The original diff (before the wait fix) — expect it to independently
   surface the coverage-audit result (new coverage, no duplication), the
   convention-fit match to `PasswordPolicyPage.ts`, and flag the
   `cy.wait(2000)` pattern against the jahia-cypress/mail-service/jcontent
   precedent.
2. The revised diff (after "test: remove cy.wait()") — expect step 0 to
   correctly classify the wait-strategy point as `addressed`, and the new
   `waitForIframeElement` helper to be recognized as matching the
   established `cy.waitUntil` idiom.

Compare its output against the manual reviews already produced in this
conversation. Treat any material discrepancy as a spec/agent-instruction
gap to fix before considering this done, not as something to silently
accept.

## Open items for the implementation plan

- Exact wording/verbosity budget for the agent instructions file (should
  stay comparable in length/density to `qa-reviewer.agent.md`).
- Whether `AGENTS.md` (repo root) needs a mention alongside the existing
  agent listing — check its current contents before assuming yes or no.
