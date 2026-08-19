# Agent Harness — `qa-tool`

This file is the universal entry point for any AI coding agent (GitHub Copilot,
Claude Code, Cursor, Codex, etc.) working in this repository. Read it first.

## 1. What this repo is

`qa-tool` is a standalone TypeScript QA assistant for the
[Jahia](https://www.jahia.com/) DXP suite. It is maintained by the Jahia QA
squad and organised around four pillars:

1. **CI test results dashboard** — surfaces metrics, stability analysis
   (flaky / new / always-failing tests).
2. **Test coverage analysis** — per-repo coverage maps, since exhaustive
   requirements do not exist.
3. **Test-case identification** — assistive workflow used during refinement /
   ticket testing to define cases, surface missing requirements, ask
   clarifying questions.
4. **Team motivation** — small, sincere motivational mechanics inside the tool
   so a small squad keeps using and improving it.

## 2. Hard constraints (do not violate)

- **Ask before installing new dependencies** (npm package, system package).
  Propose the package + version + reason; wait for approval.
- **Strict TypeScript only.** No `any` without an inline justification
  comment. Prefer `unknown` + narrowing.
- **No documentation churn.** Do not write status / change-log markdown files
  unless the user asks for them. Real changelog notes go to `.chachalog/`
  (see [.github/instructions/changelog.instructions.md](.github/instructions/changelog.instructions.md)).
- **No silent fallbacks.** Surfaces that depend on CI data must clearly show
  empty / error / loading states; never fake numbers.
- **Keep the four product pillars visible.** Before merging, name which
  pillar(s) the change advances: dashboard, coverage analysis,
  test-case identification, motivation. If none, justify the change.

## 3. The harness model (why the files in `.github/` exist)

This harness follows the model in
[Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html)
(Birgitta Böckeler, 2026): an **outer harness** of *guides* (feedforward) and
*sensors* (feedback), distributed **computational** (deterministic) and
**inferential** (LLM-based).

| Control | Type | Where | Purpose |
|---|---|---|---|
| `AGENTS.md` (this file) | guide / inferential | repo root | Single source of truth for any agent |
| `.github/copilot-instructions.md` | guide / inferential | `.github/` | GitHub Copilot entry; defers to AGENTS.md |
| `.github/instructions/typescript.instructions.md` | guide / inferential | scoped to `src/**` | TS conventions and architecture guardrails |
| `.github/instructions/qa-domain.instructions.md` | guide / inferential | description-triggered | Jahia + QA pillar context |
| `.github/prompts/*.prompt.md` | guide / inferential | slash commands | Parameterised, focused workflows |
| `.github/skills/*/SKILL.md` | guide / inferential | on-demand | Multi-step workflows with assets |
| `.github/agents/qa-reviewer.agent.md` | sensor / inferential | subagent | Reviews changes against QA-pillar goals |
| `.github/agents/pr-test-reviewer.agent.md` | sensor / inferential | subagent | Reviews test PRs in any Jahia repo for coverage fit, convention fit, and cross-repo idiom |
| `pnpm lint && pnpm typecheck` | sensor / computational | pre-commit + CI | Type and lint ground truth |
| `pnpm test:run` | sensor / computational | pre-commit + CI | Unit test ground truth |
| `pnpm e2e:smoke` | sensor / computational | CI on PR | E2E smoke ground truth |

The **steering loop**: when an agent or human notices a recurring failure
mode, the response is to update the harness (a guide or a sensor), not to
just re-prompt. Suggested changes to the harness should be raised explicitly.

## 4. Default workflow for any task

1. Read this file. Read the path-scoped instruction(s) that match the files
   you intend to touch. If the task touches a QA pillar, also read
   [.github/instructions/qa-domain.instructions.md](.github/instructions/qa-domain.instructions.md).
2. State your plan in one paragraph before editing.
3. Implement the smallest change that satisfies the request.
4. Run the relevant computational sensor before reporting done:
   - TypeScript changes → `pnpm lint && pnpm typecheck && pnpm test:run`
5. Surface anything you skipped, anything you guessed, and any new dependency
   you would need.

## 5. Where things go

```
qa-tool/
├── AGENTS.md                          ← you are here
├── src/
│   ├── dashboard/                     ← CI results dashboard pillar
│   ├── coverage/                      ← test coverage analysis pillar
│   ├── test-cases/                    ← test-case identification pillar
│   ├── motivation/                    ← team motivation pillar
│   ├── core/                          ← shared contracts + CIProvider adapter
│   └── server/                        ← Hono API server
├── tests/
│   ├── unit/
│   └── e2e/
├── .chachalog/                        ← changelog notes
└── .github/
    ├── copilot-instructions.md
    ├── instructions/
    │   ├── typescript.instructions.md
    │   └── qa-domain.instructions.md
    ├── prompts/
    │   ├── bootstrap-qa-tool.prompt.md
    │   ├── tldr.prompt.md
    │   ├── bug-brief.prompt.md
    │   ├── define-testcases.prompt.md
    │   └── coverage-map.prompt.md
    ├── skills/
    │   ├── test-case-design/SKILL.md
    │   └── qa-dashboard-widget/SKILL.md
    └── agents/
        ├── qa-reviewer.agent.md
        └── pr-test-reviewer.agent.md
```
