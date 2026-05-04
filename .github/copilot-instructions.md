# GitHub Copilot — repo-wide instructions

Read [`AGENTS.md`](../AGENTS.md) first. It is the canonical agent guide for
this repository and applies to every interaction.

## Quick reminders (the things most often forgotten)

- **TypeScript only.** This is a single-language repo. No Java, no shell
  scripts mixed in.
- **Ask before adding any dependency** (npm package, system package).
  State name, version, and why.
- **Match the existing style.** Follow [.github/instructions/typescript.instructions.md](instructions/typescript.instructions.md).
- **Changelog notes** go in `.chachalog/` and follow [.github/instructions/changelog.instructions.md](instructions/changelog.instructions.md).
  Do not invent other status / changelog markdown files.
- **Path-scoped instructions** in [.github/instructions/](instructions/) load
  automatically when matching files are in context. The QA-domain
  instructions are description-triggered — pull them in for any task touching
  the dashboard, coverage, test-case-identification, or motivation pillars.
- **Slash commands** live in [.github/prompts/](prompts/) and
  [.github/skills/](skills/). Prefer these over re-deriving a workflow.
- **Subagents**: for review-style work, hand off to the `qa-reviewer`
  subagent ([.github/agents/qa-reviewer.agent.md](agents/qa-reviewer.agent.md))
  to keep the main thread clean.

## When in doubt

Re-read `AGENTS.md` §2 (Hard constraints) and §4 (Default workflow). When the
harness gets in the way of a real task, the answer is to update the harness,
not to ignore it — surface the friction in your reply.
