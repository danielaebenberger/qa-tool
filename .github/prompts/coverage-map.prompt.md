---
description: "Build a coverage map for one Jahia repository — a per-area view, not a single coverage number."
mode: agent
---

# Coverage map for a single Jahia repo

Coverage in this product is **built repo-by-repo** because there is no
global requirements catalogue. The output is a *map*: which areas of the
codebase are exercised by which kinds of tests, and where the gaps are.

## Inputs (ask if missing)

- The target repository (path or URL). Confirm it is a Jahia core/module
  repo, not this `qa-tool` repo.
- The kinds of tests present (unit, integration, Selenium, Cypress, etc.)
  and where they live.
- Any existing coverage report (JaCoCo XML, lcov, etc.). If none, say so;
  do not fabricate numbers.

## What to do

Load [.github/instructions/qa-domain.instructions.md](../instructions/qa-domain.instructions.md).

Then:

1. **Identify functional areas.** Use the repo's package / module structure
   as the spine. Group small leaves; don't list every package. Aim for
   8–25 areas.
2. **Tag each area** with what tests exist for it:
   - `unit`, `integration`, `e2e`, `manual-only`, `none`.
   - If a coverage report is available, add the % from the report; round
     to whole numbers; mark stale data as `stale (<date>)`.
3. **Produce the map** as a markdown table:

   | Area | Test kinds present | Coverage % (if any) | Last touched | Risk hint |
   |---|---|---|---|---|

   `Risk hint` is a one-line judgement: `low / medium / high / unknown`
   with a reason. `unknown` is a valid and expected answer.
4. **Gap call-outs.** Three bullets max:
   - Highest-risk area with the weakest tests.
   - Area where coverage % looks healthy but kinds of tests look thin
     (e.g. 90% unit, no integration).
   - Area marked `unknown` that is most worth investigating first.
5. **Next-step proposals.** For each call-out, propose one concrete next
   action a single QA engineer could pick up this week.

## Output rules

- Be honest about unknowns. "I cannot tell" is a valid cell value.
- Do not invent file paths, package names, or coverage numbers.
- Keep the map in one markdown file the user can paste into a wiki.
- If the user asks to persist this into `qa-tool`, hand off
  with a clear schema suggestion; do not write app code in this prompt.
