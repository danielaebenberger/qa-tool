# qa-tool

TypeScript-based QA assistant for the Jahia DXP suite, organized around five
groups: four product pillars (a CI test-results dashboard, feature
validation, test-case identification for tickets, and team motivation
mechanics) plus a harness-engineering group for meta-tooling. See
[`.github/instructions/qa-domain.instructions.md`](.github/instructions/qa-domain.instructions.md)
for the full domain context behind all of it.

As of 2026-09, this repo also absorbs what was `feature-context-harness` —
its persona-based UAT, doc-review, and Cypress-adequacy sensor now live here
as the Feature Validation pillar.

**New here?** Read "The five groups" below first — it tells you what's a
running app you open in a browser versus what's an AI-assistant skill/agent
you invoke, so you don't go looking for a dashboard widget that doesn't exist
yet, or miss a ready-to-use skill because it isn't in the UI.

## The five groups — what's built, what you invoke

| # | Group | What it's for | Status today | How you use it |
|---|---|---|---|---|
| 1 | **CI Insight** | Pass rate, flaky/new/always-failing/stable classification — "what should I look at today" | **Running app**, backed by TestRail | Open the dashboard (`pnpm dev`, see below). To add a new metric/widget, invoke the **`qa-dashboard-widget`** skill |
| 2 | **Feature Validation** | Six-stage pipeline (`qa-run` → `qa-ac-validate` → `qa-cypress-analyze` → `qa-persona-uat` → `qa-doc-review` → `qa-report`) plus `qa-coverage-map`. Validates that a delivered feature satisfies acceptance criteria, has adequate Cypress coverage, passes persona-based UAT, and has current docs | **Skill pipeline + computational sensors** — no app UI yet | Run **`qa-run`** for the full pipeline (or pass `--pillars` for a subset), or invoke a single stage skill directly, e.g. **`qa-coverage-map`** pointed at the target Jahia repo |
| 3 | **Test-Case Identification** | Draft/challenge test cases for a ticket; ask clarifying questions; flag missing requirements | **Skills** — no app UI yet | **`qa-tldr`** to triage a ticket/PR before deciding it's worth the fuller pass; **`qa-bug-brief`** to rewrite a verbose bug ticket into a fixed, priority/severity-ready structure; **`qa-define-testcases`** for a single ticket; **`qa-test-case-design`** for an epic or a regression-prone area |
| 4 | **Team Motivation** | Sincere, non-gamified recognition of stability wins | **Stub only**, waiting on real usage of 1–3 first | Nothing to invoke yet — see `src/motivation/README.md` |
| 5 | **Harness Engineering** | Meta-tools that work on the harness itself | **Skills + agents** | **`qa-dashboard-widget`** when adding a dashboard metric; **`qa-self-reviewer`** and **`qa-pr-test-reviewer`** agents for reviewing changes; **`qa-capture`** to route a freshly-learned lesson into the harness |

Groups 2 and 3 don't have a dashboard page: their output is a markdown
document you review and paste into a ticket or wiki, produced by asking your
AI assistant to run the skill. That's intentional — see "Output is
editable artefacts" in the domain instructions.

## Skills, agents, and sensors — quick reference

See the full, generated list in
[`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — regenerate it after any
change with `pnpm capabilities:generate`.

Every skill in that catalog loads
[`qa-domain.instructions.md`](.github/instructions/qa-domain.instructions.md)
first — that's where the Jahia-specific ground rules live (honesty over
completeness, no test-case chains that depend on each other, Cypress/e2e as
the default QA-owned artefact, etc.). You don't need to load it yourself;
just be aware it's shaping every answer.

### How to actually invoke one

- **Claude Code**: ask directly — "run `qa-coverage-map` on `Jahia/<repo>`"
  or "use `qa-define-testcases` for ticket #1234" — the agent resolves the
  name to the skill/agent file catalogued in `docs/CAPABILITIES.md`.
- **GitHub Copilot Chat** (VS Code): ask for a skill/agent by name, e.g.
  "use the `qa-test-case-design` skill for the multi-site epic."
- Either way: **give it the ticket link, PR link, or target repo up front.**
  These skills ask for missing inputs, but starting with a link instead of
  a paraphrase gets you a more grounded result.

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Node.js | 20 LTS |
| pnpm | 10 (managed via `packageManager` field) |

Install pnpm if you don't already have it:

```sh
npm install -g pnpm
```

## Installation

From the `qa-tool/` directory:

```sh
pnpm install
```

## Environment variables

The server requires a connection to TestRail. Copy the example file and fill in
your credentials:

```sh
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `TESTRAIL_URL` | yes | — | Base URL of your TestRail instance |
| `TESTRAIL_USER` | yes | — | TestRail username (email) |
| `TESTRAIL_PASSWORD` | yes | — | TestRail password or API key |
| `TESTRAIL_PROJECT_ID` | no | `45` | Default TestRail project to query |
| `PORT` | no | `3001` | Port for the API server |

Never commit `.env` — it is already listed in `.gitignore`.

## Running in development

```sh
pnpm dev
```

This starts both processes concurrently:

| Process | URL | Description |
|---|---|---|
| Vite dev server (client) | <http://localhost:5173> | React front-end with HMR |
| Hono API server | <http://localhost:3001> | REST API backed by TestRail |

The client proxies all `/api` requests to the API server automatically, so you
only need to open <http://localhost:5173> in your browser.

To start each process separately:

```sh
pnpm dev:client   # Vite only  → http://localhost:5173
pnpm dev:server   # Hono only  → http://localhost:3001
```

## Building for production

```sh
pnpm build
```

Output lands in `dist/`. Serve it together with the API server:

```sh
pnpm start        # starts the Hono server on $PORT (default 3001)
```

Serve the static `dist/` directory from the same origin or configure a reverse
proxy to route `/api` to the Hono server.

## Linting and formatting

```sh
pnpm lint         # ESLint
pnpm format       # Prettier (writes in place)
pnpm typecheck    # tsc — no emit
```

## Tests

### Unit tests (Vitest)

```sh
pnpm test         # watch mode
pnpm test:run     # single run
pnpm coverage     # single run + V8 coverage report
```

### End-to-end tests (Playwright)

Playwright requires its browsers to be installed once:

```sh
pnpm exec playwright install --with-deps chromium
```

Then:

```sh
pnpm e2e           # full suite (auto-starts dev server if not running)
pnpm e2e:smoke     # @smoke-tagged tests only
```

Playwright reports are written to `playwright-report/` after each run.

## Port summary

| Port | Service |
|---|---|
| `5173` | Vite dev server (front-end) |
| `3001` | Hono API server (configurable via `PORT`) |
