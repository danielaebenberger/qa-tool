---
name: qa-capture
description: "Turn a lesson you just learned the hard way into a proposed skill, guide, or sensor — the on-ramp for contributing to this harness instead of solving the same problem alone next time."
kind: skill
pillar: harness-engineering
version: "1.0"
---

# Skill — Capture a lesson

Use this when you just worked something out the hard way and think
"someone else on the QA squad is going to hit this too."

## What this skill does

1. Asks you three questions:
   - What was the problem? (one or two sentences)
   - What did you do to solve it? (the actual steps/commands/prompt you used)
   - How often do you expect this to come up again? (one-off vs. recurring)
2. Based on the answers, proposes where it belongs:
   - **New skill** (`.claude/skills/qa-<name>/SKILL.md`) — if it's a
     repeatable, parameterised workflow.
   - **New guide** (`.claude/guides/<name>.md`) — if it's reference
     knowledge someone should read before doing a task, not a workflow
     someone runs.
   - **An addition to an existing skill/guide** — if it's a variant or edge
     case of something already in the catalog. Check
     [`docs/CAPABILITIES.md`](../../../docs/CAPABILITIES.md) first — this
     skill does that check for you and tells you if something close already
     exists.
   - **Not worth capturing** — a genuine one-off. Say so plainly; don't
     force a capture that isn't useful again.
3. Drafts the file with correct frontmatter (`name` with the `qa-` prefix,
   `description`, `kind`, `pillar` — ask which of the five groups in
   `CLAUDE.md` §1 fits — `version: "1.0"`).
4. Tells you to review the draft, run `pnpm capabilities:generate`, and open
   a PR. **This skill never opens a PR itself** — a human reviews every new
   or changed capability before it ships (see `CONTRIBUTING.md`).

## When to use

- You just spent 20 minutes figuring out a prompt/workaround that worked.
- You're about to write a one-off script and suspect you've done something
  like it before (this skill will tell you if a matching skill already
  exists, so you don't reinvent it).
- You noticed the catalog is missing something QA-relevant that the whole
  squad would benefit from.
