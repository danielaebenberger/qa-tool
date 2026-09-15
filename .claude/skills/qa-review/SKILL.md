---
name: qa-review
description: "Entry point for a 'let's qa-review <PR/ticket/link>' request. Cheaply characterizes the input, then asks the QA engineer which weight of review they actually want, before dispatching into the right existing skill or agent — instead of always defaulting to the full 6-stage qa-run pipeline."
kind: skill
pillar: feature-validation
version: "1.0"
see_also: [qa-run, qa-pr-test-reviewer, qa-cypress-analyze, qa-ac-validate, qa-tldr]
---

# QA Review — triage entry point

`/qa-review` (or a natural-language "can you qa-review this?") is the front
door for reviewing a PR, ticket, or plan. It exists because "review this"
is ambiguous by design, and the previous behavior — always launching the
full `qa-run` pipeline — is frequently overkill: a QA engineer often wants
a two-minute test-coverage gut check, not a 6-stage pipeline with two
mandatory human checkpoints and five markdown artefacts.

**Never silently pick a scope on the user's behalf.** This skill's whole
job is to ask, not to guess well.

## Step 1 — Characterize the input cheaply

Accept whatever is given: a GitHub PR/issue URL, `owner/repo#number`, a Jira
ticket, a PRP plan file, or a bare repo name ("review the state of X").

If nothing points at a specific thing to review, ask for a link before
doing anything else — don't guess at scope from a paraphrase.

For a GitHub PR, do exactly one cheap metadata fetch — **not** the full
diff, no sensor runs, no cloning another repo yet:

```
gh pr view <n> --repo <owner>/<repo> \
  --json title,body,additions,deletions,changedFiles,files,labels,baseRefName,headRefName,author
```

From `files`, derive a few signals to shape (not skip) the question in
Step 2:

- `touches_tests` — any path matches `tests/cypress`, `e2e/`, `*.cy.ts`,
  `*.spec.*`, or the target repo's equivalent test convention.
- `size` — small (roughly <10 files / <150 lines), medium, large.
- `has_ticket` — the PR body links a Jira key or issue number.
- `is_docs_only` / `is_deps_only` — heuristics from touched paths
  (`*.md`, lockfiles/manifests only).

For a ticket or plan (no diff to inspect yet), skip straight to Step 2 —
there's nothing to characterize at this level; that's the point of asking.

## Step 2 — Ask what kind of review is wanted

Always ask, using `AskUserQuestion` — even when a signal makes one option
look obviously right. Use the Step 1 signals to **tailor and order** the
menu, and to drop options that don't fit, but never to skip the question
itself.

Typical menu (reword/drop rows that don't apply to this input):

| Option | Does | Backed by | Fits when |
|---|---|---|---|
| Quick test-coverage check | Fast, read-only pass: do the tests (if any changed) fit conventions and coverage; if none changed, flags what's missing | `qa-pr-test-reviewer` agent if `touches_tests`, otherwise `qa-cypress-analyze` | A fast gut check, no report artefact needed |
| AC validation only | Map PR/ticket to acceptance criteria, produce a verdict matrix | `qa-ac-validate` (VALIDATION mode) | A known AC set exists (ticket or PR description) and that's the only open question |
| Partial pipeline | Any subset of pillars A (AC) / B (Cypress) / C (persona UAT) / D (docs) | `qa-run --pillars <...>` | Something in between full and quick — e.g. AC + Cypress, skip persona/doc |
| Full feature-validation pipeline | All 6 stages, both mandatory human checkpoints, full report + release recommendation | `qa-run` | Feature is user-facing and heading toward a release decision |
| Just get oriented | Fast neutral summary, no verdict | `qa-tldr` | Haven't yet decided whether this needs QA work at all |

If `touches_tests` is false (a PR that changes zero test files), say so
explicitly before presenting the menu — "Quick test-coverage check" means
something different here: whether the changed behavior *should* have
gotten test coverage and didn't, not reviewing existing test changes.
`qa-pr-test-reviewer` is built to read-only-review test PRs and will stop
immediately on a non-test PR, so route a non-test PR's quick check to
`qa-cypress-analyze` (or note the gap directly) instead.

## Step 3 — Dispatch

Once the QA engineer picks, invoke the corresponding skill/agent directly.
Pass along:
- The input reference (PR URL, ticket, repo) exactly as given.
- The signals already gathered in Step 1, so the downstream skill doesn't
  re-fetch what's already known.

Don't re-ask questions the downstream skill owns (e.g. don't ask about doc
sources here — that's `qa-doc-review`'s checkpoint if the full pipeline is
chosen).

## Constraints

- Never default to `qa-run` (or any other single tool) for a bare
  "qa-review this" ask without presenting the Step 2 menu first.
- Never read a full diff, run a sensor, or clone/fetch another repo before
  Step 2 is answered — Step 1 is metadata-only.
- If input is ambiguous or missing, ask for it before anything else.
