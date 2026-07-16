---
name: test-case-design
description: "Multi-step workflow for designing a coherent set of test cases for a Jahia feature: risk storming → case generation → trace matrix → review checklist. Use when: a QA engineer needs more than a one-shot list (e.g. a sizeable epic, a regression-prone area, a release candidate), or when /define-testcases needs to be expanded into a deeper artefact set."
---

# Skill — Test Case Design (Jahia)

This skill expands the lighter `/define-testcases` prompt into a fuller
artefact set when a feature warrants it. Use the prompt for tickets; use
this skill for epics, releases, or regression-prone modules.

## Inputs to gather

- The feature / epic scope (one paragraph from the user).
- The Jahia surfaces it touches: core, modules, headless APIs, UI, jobs.
- Existing tests in the area (paths or repo links).
- Case format: **default to plain markdown tables.** Gherkin is used in
  the Jahia org only for a small subset of tests; only switch to Gherkin
  if the user confirms this area is part of that subset.

## Steps

### 1. Risk-storm (10 min equivalent)

Produce a risk register, one row per risk:

| ID | Risk | Likelihood (L/M/H) | Impact (L/M/H) | Category | Source |
|---|---|---|---|---|---|

Categories: `functional`, `data`, `security`, `performance`, `compat`,
`regression`, `ux`. `Source` cites the input that revealed the risk
(ticket text, code area, prior incident).

Stop and present this register to the user before proceeding. They may
prune or add.

### 1b. Coverage discovery (before generating any case)

Search the repo for tests that already touch this feature/area — search
by code-level identifiers (action ids, function/prop names) **and** by
the human-visible text a user would see (labels, titles); a canonical
enumeration/"sanity" test for a surface (e.g. "Displays X actions") often
asserts rendered labels only, and a code-token-only search misses it.
List what exists per surface before generating anything new. Also flag
any shared component/action already exercised elsewhere — its behavior
doesn't need re-proving from a new call site.

### 2. Generate cases per risk

For each surviving risk, generate 1–3 cases. Use the table format from
[/define-testcases](../../prompts/define-testcases.prompt.md). Add a
`Risk ID` column linking back to step 1.

**Cypress/e2e is the default type — that's the QA-owned deliverable.**
Propose a unit case only for a logic-heavy risk with no observable e2e
behavior, mark it `(dev-owned)`, and keep it terse; developers own whether
and how it gets added, so it shouldn't carry the same level of detail as
the e2e cases. Do not duplicate cases that already exist, and do not
propose a case whose only purpose is re-verifying a shared component
found in step 1b — mark those `extends <path>` instead, or drop them.
Prefer extending a canonical enumeration test found in 1b over adding a
new spec, whenever the case is a presence/reachability check.

### 3. Trace matrix

A small markdown matrix mapping `Risk ID × Test ID`. Every risk must have
at least one cell. Empty rows are unacceptable; if no test exists for a
risk, surface it explicitly under "Coverage gaps".

### 4. Review checklist (self-applied)

Before handing off, verify:

- [ ] Every test case maps to either an acceptance criterion or a risk.
- [ ] No two cases verify the same condition with the same inputs.
- [ ] Manual cases are marked `manual` and justified (why automation is
      not viable today).
- [ ] Every unit case is marked `(dev-owned)` and stays terse; e2e is the
      default and carries the detail.
- [ ] No case re-verifies a shared component/action already covered by an
      existing spec found in the coverage discovery step.
- [ ] Coverage discovery searched both code identifiers and human-visible
      label text before any case was drafted.
- [ ] Test data needs are listed once at the top, not duplicated per case.
- [ ] Accessibility cases exist for any UI surface.
- [ ] The artefact is plain markdown the QA engineer can paste into the
      ticket / wiki.

### 5. Handoff

Output a single markdown document with sections:
1. Scope
2. Risk register
3. Test cases
4. Trace matrix
5. Coverage gaps
6. Open questions for product / dev

Plus a one-paragraph "what I assumed" summary so the QA engineer can
correct your context cheaply.

## Anti-patterns

- Dumping 40+ shallow cases. Quality > quantity.
- Inventing Jahia behaviour you cannot point to in the inputs.
- Producing a document that requires further AI to understand. The QA
  engineer owns it after handoff.
- Searching only by code-level identifiers and missing an existing test
  that asserts the human-visible label instead.
- Adding a new spec file when an existing canonical/enumeration test for
  the same surface could be extended instead.
- Proposing a case that re-tests a shared component/dialog already
  covered by another spec, instead of testing the new wiring/reachability.
- Giving a `(dev-owned)` unit case the same depth as an e2e case — it
  isn't the QA team's artefact to develop.
