---
name: qa-dashboard-widget
description: "End-to-end workflow for adding a new widget to the qa-tool dashboard: data source → typed contract → component → tests → wiring. Use when implementing a new metric, stability indicator, or motivation surface inside qa-tool/src/dashboard/."
kind: skill
pillar: harness-engineering
version: "1.0"
---

# Skill — Add a QA Dashboard Widget

A dashboard widget is the unit of value for the dashboard pillar. This
skill keeps widgets honest: every one ships with a typed data contract,
clear loading / empty / error states, and tests.

Prereq: the repo is bootstrapped (it is). Load [.claude/guides/typescript-conventions.md](../../guides/typescript-conventions.md)
and [.claude/guides/jahia-qa-domain.md](../../guides/jahia-qa-domain.md).

## Steps

### 1. Define the question the widget answers

One sentence, in the voice of a QA engineer at standup. Examples:
- "Which tests started failing in the last 24 hours?"
- "Is the flaky-test backlog shrinking this sprint?"

If you cannot phrase it this way, the widget is not ready to be built.

### 2. Define the data contract first

Create or extend a Zod (or equivalent) schema in
`src/dashboard/contracts/`. Export both the schema and the
inferred TypeScript type. The schema is the single source of truth; the
component and the data source both depend on it.

### 3. Implement the data source behind `CIProvider`

Add a method to the `CIProvider` interface in `src/core/ci/` if
needed. Provide a real implementation **and** a fake fixture
implementation under `tests/fixtures/`. The fake is what the widget's
tests use.

### 4. Build the widget component

Location: `src/dashboard/widgets/<widget-name>/`. Required
exports:

- `Widget` — the React component.
- `meta` — `{ id, title, question, pillars }` for registration.
- `loader` — a function returning the typed data, used in tests.

Required UI states, each visible in Storybook or a smoke test:
1. **Loading** (skeleton, no fake numbers).
2. **Empty** ("no data yet" with a one-line reason).
3. **Error** (actionable message, link to logs).
4. **Stale** (banner if data older than the widget's freshness budget).
5. **Healthy** (the actual rendered metric).

### 5. Tests

- Unit test for the loader against the fake provider (Vitest).
- Component test for each of the five UI states (Vitest + Testing Library).
- Playwright smoke test: widget renders on the dashboard route and is
  reachable by accessible name.

Run, before handing off:
```bash
pnpm tsc --noEmit
pnpm lint
pnpm test:run
pnpm e2e:smoke
```

### 6. Register and document

- Register `meta` in `src/dashboard/registry.ts`.
- Add one bullet to `src/dashboard/README.md` linking to the
  widget folder. No marketing copy.
- If the widget surfaces a stability classification (`flaky`, `new`,
  `always-failing`, `stable`), the classifier itself must have unit tests
  in `src/dashboard/stability/`. Do not inline classification
  rules inside the widget.

## Anti-patterns

- Widgets that compute their own metrics inline. Move computation behind a
  named, tested function.
- Widgets that hide their data source. Provider must be injectable for
  tests.
- Widgets that fake numbers in the loading or empty state.
- Motivation widgets that compare engineers against each other (see the
  domain instructions).
