# qa-tool

TypeScript-based QA dashboard for the Jahia DXP suite. Surfaces CI test
metrics, stability analysis, coverage maps, and team motivation mechanics.

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
