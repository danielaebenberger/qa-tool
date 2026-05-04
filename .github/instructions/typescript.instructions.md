---
description: "Conventions for the TypeScript-based QA tool. Use when: editing or scaffolding files inside src/, designing the dashboard, coverage analyser, test-case-identification UX, or motivation features."
applyTo: "src/**"
---

# TypeScript conventions

This repository is the standalone QA assistant for the Jahia DXP.

## Stack defaults (proposed; confirm before installing)

These are sensible defaults for a small QA squad. Treat them as a baseline
to confirm with the user, not as fixed decisions:

- **Language**: TypeScript in `strict` mode.
- **Runtime**: Node.js LTS.
- **Package manager**: pnpm (lockfile committed).
- **App shell**: single repo; introduce an `apps/` + `packages/` split only
  if the tool grows to warrant it.
- **Web framework**: **Vite + React** (TypeScript). Chosen to align with
  other parts of the Jahia organisation. Add a thin server only when a
  pillar genuinely needs one (e.g. CI ingestion); otherwise stay
  client-only with file-based persistence.
- **Testing**: Vitest for unit + integration, Playwright for end-to-end.
  **Gherkin is not the default** — the wider org uses it only for a small
  subset of tests. Do not introduce Cucumber / `.feature` files in
  `qa-tool/` unless the user explicitly asks.
- **Lint / format**: ESLint + Prettier; one config at `qa-tool/`.
- **Type-checking**: `tsc --noEmit` runs in CI.

## Hard rules

- **Strict TypeScript only.** No `any` without an inline justification
  comment. Prefer `unknown` + narrowing.
- **Tests are first-class.** Every new feature ships with at least one
  Vitest test that fails before the implementation. End-to-end coverage is
  added when the feature reaches the dashboard.
- **No silent fallbacks.** Surfaces that depend on CI data must clearly
  show empty / error / loading states; never fake numbers.
- **Accessibility is not optional.** The dashboard UI follows WCAG 2.2 AA;
  every interactive Playwright test asserts on accessible names, not CSS
  selectors.
- **Telemetry is opt-in.** Anything tracking how the QA team uses the tool
  ships with an opt-in toggle and a docs entry.
- **Keep the four product pillars visible.** Before merging, name which
  pillar(s) the change advances: dashboard, coverage analysis,
  test-case identification, motivation. If none, justify the change.

## Architectural guardrails

- One module per pillar (`src/dashboard/`, `src/coverage/`,
  `src/test-cases/`, `src/motivation/`). Cross-pillar imports go through
  a shared `src/core/` layer; pillars do not import each other directly.
- Persistence: file-based store (SQLite or JSON) so a QA engineer can run
  the tool locally without infra. Defer a server DB until there is real
  demand.
- CI integrations (Bamboo / GitHub Actions / etc.) live behind a
  `CIProvider` interface in `src/core/ci/`. Each integration is a separate
  adapter so we can grow repo-by-repo.

## Sensors that should be wired up early

In Fowler's terms, these are the **computational feedback sensors** that
keep quality left:

| Sensor | Command | Runs when |
|---|---|---|
| Type check | `pnpm typecheck` | pre-commit + CI |
| Lint | `pnpm lint` | pre-commit + CI |
| Unit tests | `pnpm test:run` | pre-commit + CI |
| Coverage | `pnpm coverage` | CI (uploaded as artefact) |
| E2E smoke | `pnpm e2e:smoke` | CI on PR |

## Verifying changes

Before reporting done on a `qa-tool/` change, run (or state why you skipped):

```bash
pnpm -C qa-tool lint
pnpm -C qa-tool tsc --noEmit
pnpm -C qa-tool test --run
```
