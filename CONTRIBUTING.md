# Contributing to qa-tool

This repo's `.claude/` directory is a shared harness for the Jahia QA squad.
Anyone on the team can add to it. This page is the whole process — it's
deliberately short.

## Adding a new skill, agent, or sensor

1. **Check `docs/CAPABILITIES.md` first**, or run `qa-capture` (it checks
   for you) — don't build something that already exists under a different
   name.
2. Create the file:
   - Skill: `.claude/skills/qa-<name>/SKILL.md`
   - Agent: `.claude/agents/qa-<name>.agent.md`
   - Sensor: implementation in `src/harness/sensors/<name>/<name>.ts`, plus a
     `SENSOR.md` alongside it for the catalog.
3. Give it frontmatter with all of: `name` (prefixed `qa-`, kebab-case),
   `description` (one line, specific enough to disambiguate it from
   anything similar), `kind` (`skill` | `agent` | `sensor`), `pillar` (one
   of the five groups in `CLAUDE.md` §1), `version` (start at `"1.0"`).
   Add `see_also` (a bracketed list of other capability names) if something
   in the catalog is easily confused with this one — say why they're
   different in each one's description, not just in the list.
4. Run `pnpm capabilities:generate` and commit the updated
   `docs/CAPABILITIES.md` alongside your new file — CI rejects a PR where
   they're out of sync.
5. Open a PR. A second person reviews it — same as any code change. Explain
   *why* in the PR description, not just what.
6. Bump `version` (minor for a behavior tweak, major for a breaking change
   to the expected input/output) whenever you edit an existing capability.

## What NOT to do

- Don't hand-edit `docs/CAPABILITIES.md` — it's generated, and CI will
  reject a hand-edited version that doesn't match a fresh
  `pnpm capabilities:generate` run.
- Don't skip the `qa-` prefix — every skill/agent name is a candidate for
  eventually moving into `Jahia/cortex`'s `.claude/skills/`, which prefixes
  everything `jahia-*`. A consistent `qa-` prefix means zero renaming or
  collision risk if/when that happens.
- Don't merge two similar-but-different tools into one just because they
  sound alike — if they solve different-weight problems (a fast daily tool
  vs. a formal traceable one, say), keep them distinct and cross-link them
  with `see_also` instead.

## When this process needs to grow up

This is deliberately lightweight for a team under 10 contributors. If either
of these happens, it's time to revisit (add ADRs, per-tool contract docs,
CI-enforced frontmatter linting):

- The catalog passes **15 skills/agents/sensors** (currently at the count
  from `docs/CAPABILITIES.md`'s total after this task).
- `scripts/generate-capabilities.ts` itself needs a stable interface because
  something external starts depending on `CAPABILITIES.md`'s exact shape.
