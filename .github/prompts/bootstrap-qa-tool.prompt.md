---
description: "Reference prompt capturing the original scaffold decisions for qa-tool. Useful context when adding major new structure."
mode: agent
---

# Bootstrap reference — `qa-tool`

This prompt records the decisions made when the tool was first scaffolded.
Use it as context when adding large new structural pieces.

## Decisions already made

- **Web framework**: Vite + React (TypeScript).
- **Server**: Hono with `@hono/node-server`.
- **Package manager**: pnpm.
- **Test stack**: Vitest (unit + integration) + Playwright (e2e).
- **Lint / format**: ESLint + Prettier.
- **Persistence**: TestRail as data source via `TestRailAdapter`; file-based
  fixtures for tests.
- **Four pillars**: `src/dashboard/`, `src/coverage/`, `src/test-cases/`,
  `src/motivation/` — shared layer in `src/core/`.

Honour everything in [`AGENTS.md`](../../AGENTS.md) and
[.github/instructions/typescript.instructions.md](../instructions/typescript.instructions.md).
├── README.md                 ← short, dev-focused; no marketing copy
├── src/
│   ├── core/
│   │   ├── ci/               ← CIProvider interface + a fake adapter
│   │   ├── persistence/
│   │   └── index.ts
│   ├── dashboard/
│   ├── coverage/
│   ├── test-cases/
│   └── motivation/
└── tests/
    ├── unit/
    └── e2e/
```

Each pillar folder gets a one-line `README.md` referencing the relevant
section of [.github/instructions/qa-domain.instructions.md](../instructions/qa-domain.instructions.md).

## Step 4 — Install (with approval)

Run the install. Capture the lockfile. Run `pnpm tsc --noEmit`,
`pnpm lint`, and `pnpm test --run` to prove the scaffold is green.

## Step 5 — Hand off

Report:
- Exact commands run.
- Anything you skipped or deferred.
- The first three concrete tickets a QA engineer could pick up next, one
  per pillar (excluding motivation, which should follow real usage).

Do not start implementing pillar features in this prompt.
