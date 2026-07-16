---
description: "Jahia DXP product context and the four QA-tool pillars (CI dashboard, coverage analysis, test-case identification, team motivation). Use when: planning, designing, or implementing any feature of qa-tool/, writing test strategy, talking about Jahia modules / core platform, or shaping QA workflows."
---

# Jahia QA — product & domain context

## Jahia in one paragraph

Jahia is a **Digital Experience Platform (DXP)**: a content + experience
server (the *core platform*) plus a large set of **modules** that extend it
(workflows, search, personalization, headless APIs, integrations, etc.).
Modules are versioned independently and live in many repositories. QA
therefore deals with a **large, federated codebase** with no single source
of test requirements.

## Who the tool is for

A **small QA squad** with QA Engineer and QA Manager roles. They cannot
manually maintain an exhaustive requirements map, cannot review every CI
run by hand, and cannot keep flaky-test triage moving without help. The
tool's job is to **compensate for squad size**, not to replace judgement.

## The four pillars (and what "good" looks like for each)

### 1. CI test results dashboard
- Aggregates CI runs across the relevant Jahia repositories.
- Surfaces, at minimum: pass rate, mean duration, top failing tests, and a
  **stability classification** per test: `flaky`, `new`, `always-failing`,
  `stable`. Definitions live in code and are testable.
- Default view is "what should I look at *today*?", not a generic chart wall.
- Stretch: compare two time windows (e.g. before/after a release).

### 2. Test coverage analysis
- Built **repo-by-repo** because there is no global requirements map.
- For each repo, produces a coverage *map* (what areas of the product the
  existing tests touch), not just a coverage *number*.
- Honest about unknown unknowns: tells the user "I cannot infer coverage
  for X" instead of silently scoring it 0 or 100.
- Stretch: link coverage gaps to recent production incidents or recent
  changes in the repo.

### 3. Test-case identification
- Used during **refinement meetings** and during the **test phase** of a
  story / bug ticket.
- Helps a QA engineer (a) draft additional test cases, (b) ask clarifying
  questions about how to test, (c) flag missing or ambiguous requirements.
- Output is *editable artefacts* a human owns (markdown / Gherkin /
  whatever the team uses), not opaque AI output.
- Conversational, but every suggestion cites the input it was based on
  (ticket text, code snippet, prior test).
- **Audit existing coverage before drafting anything new.** Search by both
  the code-level identifiers involved (action ids, function/prop names)
  *and* the human-visible text a user would see (button/menu labels, page
  titles) — many teams already maintain a canonical "sanity"/enumeration
  test per surface (e.g. a "Displays X actions" spec) that asserts against
  rendered labels, not internal names; a code-token-only search will miss
  it. If such a test exists, extend it — don't add a parallel new file.
- **Don't re-test a shared component/action that's already covered
  elsewhere.** When several menus/surfaces route through the same
  underlying component (a shared dialog, a shared action registration),
  that component's own behavior only needs proving once. A new test that
  wires the same action into a new surface should assert *presence/
  reachability from that surface*, not re-verify what the component does.
- **Cypress/e2e is the primary, QA-owned deliverable.** Default every
  proposed case to e2e/Cypress — that's what the QA team actually acts on
  and maintains. Propose a unit test only for a genuine logic gap with no
  observable e2e behavior (e.g. a pure calculation), mark it `(dev-owned)`,
  and keep it brief: developers decide whether and how to add it, so it
  isn't worth the same level of detail as the Cypress proposals.
- **Group by feature/capability, not by changed file or method.** When a
  change spans several call sites (a new config service, its consumers, a
  migration patch, a rewritten integration), propose one test topic for the
  *capability* they jointly implement — asserting the end-to-end, observable
  behavior a user or downstream feature depends on — rather than one test
  per mechanical unit. A test whose only claim is "this no-op/log-only method
  doesn't do anything" restates the source, not a requirement; fold it into
  the feature-level test instead of listing it separately.
- **But grouping by feature is not license to chain steps.** Don't turn a
  feature topic into one long scenario of dependent steps (e.g. a single
  test walking start → correction → resubmit → accept, where a failure at
  step 1 hides whether the later steps would have worked) or into test
  cases that only make sense if an earlier one already passed. Each test
  case should stay independently runnable with one clear failure signal.
  Sequence multiple steps in one test only when the *sequencing itself* is
  the behavior under test (e.g. a state machine's transitions); otherwise
  split by behavior, even within the same feature topic. Balance matters in
  both directions — neither one-test-per-method nor one-mega-test-per-feature.
- **Match write-up length to the size of the change.** A small/config-only
  fix (a few lines, one file) earns a compact note: fix in one line, gap in
  one line, tests as a short list, one line on what's deliberately not
  proposed. Save full sections (context, rationale, effort/value discussion)
  for changes where the size or risk actually justifies the reading time.
  Team acceptance of this kind of feedback depends on it being quick to
  read, not on how thorough it looks — cut prose before cutting technical
  accuracy, never the reverse.

### 4. Team motivation
- Sincere, not gimmicky. The squad must *want* to keep using and improving
  the tool.
- Examples to consider (validate with the user): visible streaks for
  flaky-test cleanup, weekly "QA wins" digest, small celebratory moments
  on the dashboard when a long-failing test goes green, opt-in
  acknowledgements when a teammate's test catches a real bug.
- Hard constraint: **never gamify volume of tests written or tickets
  closed**. Reward outcomes (stability improvements, bugs caught early,
  flaky reductions), not output.
- Accessibility and tone matter — a feature that lands flat is worse than
  no feature.

## Cross-cutting principles for any QA-tool work

- **Honesty over completeness.** If the data is partial or stale, say so
  in the UI; don't smooth it over.
- **Repo-by-repo growth.** New CI sources or new Jahia repos are added
  through the `CIProvider` adapter pattern; nothing assumes a single repo.
- **Small-squad ergonomics.** Defaults beat configuration. A new QA
  engineer should get value in <10 minutes of setup.
- **Boring infra.** Prefer file-based persistence and standard tooling
  until real load justifies otherwise.

## Anti-patterns to refuse

- Adding "AI test generation" that writes tests with no human in the loop.
- Coverage scores without a coverage *map*.
- Motivation features that rank engineers against each other.
- Anything that requires QA to maintain a parallel requirements database.
- Tying tool adoption to mandatory metrics submitted upward.
- Test-case suggestions scoped to a single trivial/no-op code path (e.g.
  verifying a log-only method "does nothing") instead of the feature or
  capability it's part of.

## Pointers

- Jahia modules and the core platform: see Jahia's public docs
  (academy.jahia.com).
- Existing CI substrate: this repo's `README.md`, `deployments/`, and the
  Bamboo / `dx-tests-specs` references therein.
- Changelog tone for any user-visible change: [.github/instructions/changelog.instructions.md](changelog.instructions.md).
