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

## Pointers

- Jahia modules and the core platform: see Jahia's public docs
  (academy.jahia.com).
- Existing CI substrate: this repo's `README.md`, `deployments/`, and the
  Bamboo / `dx-tests-specs` references therein.
- Changelog tone for any user-visible change: [.github/instructions/changelog.instructions.md](changelog.instructions.md).
