# qa-tool

TypeScript-based QA assistant for the Jahia DXP suite, organized around four
pillars: a CI test-results dashboard, per-repo test coverage maps, test-case
identification for tickets, and team motivation mechanics. See
[`.github/instructions/qa-domain.instructions.md`](.github/instructions/qa-domain.instructions.md)
for the full domain context behind all of it.

**New here?** Read "The four pillars" below first — it tells you what's a
running app you open in a browser versus what's an AI-assistant prompt/skill
you invoke, so you don't go looking for a dashboard widget that doesn't exist
yet, or miss a ready-to-use prompt because it isn't in the UI.

## The four pillars — what's built, what you invoke

| # | Pillar | What it's for | Status today | How you use it |
|---|---|---|---|---|
| 1 | **CI test results dashboard** | Pass rate, flaky/new/always-failing/stable classification — "what should I look at today" | **Running app**, backed by TestRail | Open the dashboard (`pnpm dev`, see below). To add a new metric/widget, invoke the **`qa-dashboard-widget`** skill |
| 2 | **Test coverage analysis** | A per-repo coverage *map* (what's tested and how, not a single score) | **Prompt only** — no app UI yet | Run the **`/coverage-map`** prompt, pointed at the target Jahia repo |
| 3 | **Test-case identification** | Draft/challenge test cases for a ticket; ask clarifying questions; flag missing requirements; review an already-open test PR | **Prompt + skill + agent** — no app UI yet | **`/tldr`** to triage a ticket/PR before deciding it's worth the fuller pass; **`/bug-brief`** to rewrite a verbose bug ticket into a fixed, priority/severity-ready structure; **`/define-testcases`** for a single ticket; the **`test-case-design`** skill for an epic or a regression-prone area; the **`qa-pr-test-reviewer`** agent for reviewing an already-open test PR |
| 4 | **Team motivation** | Sincere, non-gamified recognition of stability wins | **Stub only**, waiting on real usage of 1–3 first | Nothing to invoke yet — see `src/motivation/README.md` |

Pillars 2 and 3 don't have a dashboard page: their output is a markdown
document you review and paste into a ticket or wiki, produced by asking your
AI assistant to run the prompt/skill. That's intentional — see "Output is
editable artefacts" in the domain instructions.

## Skills, prompts, and agents — quick reference

| Name | Type | Use it when | What you get |
|---|---|---|---|
| [`tldr`](.github/prompts/tldr.prompt.md) | prompt | You've just been handed a verbose ticket, PR, or AI-generated description and need to get oriented in under a minute, before deciding whether it earns a `/define-testcases` pass | A short, adaptive digest — what it is, the real user impact, whether it's a genuine defect or a workaround for unsupported use, and a concrete example pulled out if the source has one |
| [`bug-brief`](.github/prompts/bug-brief.prompt.md) | prompt | You have an existing bug ticket that's verbose or unclear and need it rewritten so QA/PO can set priority and severity from it alone | The same ticket in a fixed structure (Environment, Steps to reproduce, Current behaviour, Desired behaviour), leading with real-world impact and an explicit confirmed-vs-not-proven call on any causal claim; repro commands/code kept verbatim; extra detail moved to a trailing "More AI description" |
| [`define-testcases`](.github/prompts/define-testcases.prompt.md) | prompt | Refining a story, or in the test phase of a ticket | Coverage audit → clarifying questions → risk view → test-case table (Cypress-first) → coverage check → missing requirements |
| [`coverage-map`](.github/prompts/coverage-map.prompt.md) | prompt | You need an honest picture of what's tested in a Jahia repo before planning work there | A markdown table of functional areas × test kinds present × risk, with gap call-outs and next-step proposals |
| [`test-case-design`](.github/skills/test-case-design/SKILL.md) | skill | The ticket is too big for one prompt pass — an epic, a release candidate, a known regression-prone module | A fuller artefact: risk register → coverage discovery → test cases → trace matrix → coverage gaps → open questions |
| [`qa-dashboard-widget`](.github/skills/qa-dashboard-widget/SKILL.md) | skill | You're adding a new metric/widget to the dashboard pillar (dev task, not a QA-analysis task) | A widget wired through a typed data contract, with loading/empty/error/stale/healthy states and tests |
| [`bootstrap-qa-tool`](.github/prompts/bootstrap-qa-tool.prompt.md) | prompt | Reference only — records the original scaffold decisions | Not something you run day-to-day |
| [`qa-self-reviewer`](.claude/agents/qa-self-reviewer.agent.md) | agent | Reviewing a PR or staged changes to qa-tool itself | A read-only structured review against the four pillars and the hard constraints in `CLAUDE.md` |
| [`qa-pr-test-reviewer`](.claude/agents/qa-pr-test-reviewer.agent.md) | agent | Reviewing an open PR that adds/changes tests (Cypress/e2e, Selenium, unit) in any Jahia repo | A read-only structured review: coverage fit, convention fit, cross-repo idiom check, scope, and prior-feedback tracking on re-review |

All of the above load
[`qa-domain.instructions.md`](.github/instructions/qa-domain.instructions.md)
first — that's where the Jahia-specific ground rules live (honesty over
completeness, no test-case chains that depend on each other, Cypress/e2e as
the default QA-owned artefact, etc.). You don't need to load it yourself;
just be aware it's shaping every answer.

### How to actually invoke one

- **GitHub Copilot Chat** (VS Code): type the prompt as a slash command,
  e.g. `/define-testcases`, or ask for a skill/agent by name, e.g. "use the
  test-case-design skill for the multi-site epic."
- **Claude Code / other agents**: ask directly — "run coverage-map on
  `Jahia/<repo>`" or "use define-testcases for ticket #1234" — the agent
  resolves the name to the file above.
- Either way: **give it the ticket link, PR link, or target repo up front.**
  These prompts ask for missing inputs, but starting with a link instead of
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
