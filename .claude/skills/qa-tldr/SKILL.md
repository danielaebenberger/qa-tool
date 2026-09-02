---
name: qa-tldr
description: "Digest a verbose GitHub issue/PR, Jira ticket, or AI-generated description into a fast, practical summary before deciding what QA work it actually needs."
kind: skill
pillar: test-case-identification
version: "1.0"
---

# TL;DR a ticket, PR, or description

A pre-triage step for the **test-case identification** pillar: before
spending a `/define-testcases` or `test-case-design` pass on something,
get oriented in under a minute. Not every ticket needs the fuller
workflow — this is what tells you that.

## Inputs (ask if missing)

- A URL (GitHub issue/PR, Jira ticket) or pasted text (Slack message, AI
  draft, ticket body). Prefer a link over a paraphrase — see the top-level
  README on why.
- For GitHub: fetch with `gh issue view <url> --json title,body,labels,comments`
  or `gh pr view <url> --json title,body,comments,files`. If a specific
  comment is linked, fetch the whole thread — later comments often already
  build on or supersede it.
- If the fetch fails (404, no access), say so and ask for the text to be
  pasted instead. Never guess at content.

## What to do

Load [.github/instructions/qa-domain.instructions.md](../instructions/qa-domain.instructions.md).

Don't use a fixed template — pick whatever 3-5 short headers actually fit
*this* item. A bug ticket, a PR, and a design doc all deserve different
shapes. Keep the whole thing scannable in under a minute. Two things are
worth actively digging for, not just restating from the source:

- **Real user impact** — what actual real-world use case is affected,
  stated concretely, not the ticket's own abstract framing. If it's
  vague, say so. On this repo's Jahia issues, a `customer` label means a
  linked customer-support ticket holds the real use case — that ticket
  lives in an external system with no access from here. Say that
  explicitly rather than treating the label itself as evidence of impact,
  and suggest checking the linked ticket if the use case matters for the
  decision at hand.
- **Intended use vs. workaround** — flag when this looks like the tool
  being used outside its intended purpose (a workaround for something
  unsupported) rather than a genuine defect in supported usage. This is
  often the crux of whether it's really a bug — and, per the domain
  instructions, whether it deserves a test case at all.

If the source includes a concrete example — repro steps, sample data, a
real scenario — pull it out as its own line, condensed but not paraphrased
into mush. It's usually what makes the abstract description click.

Include a QA/testability angle (what to verify, what's at risk) only when
actually relevant — don't force it into every digest.

For long comment threads, skip back-and-forth chatter; pull in only
comments that change the picture (clarifications, scope changes, "actually
it turned out to be X").

## Output rules

- Plain text in the chat. No file, no artefact — this is for reading now,
  not filing away.
- Lead with one line naming what the item fundamentally is, then the
  adaptive sections, then stop. No padding, no "let me know if you'd like
  more detail" close.
- Note how much was skipped from a massive thread rather than silently
  dropping context.
- Say what's unclear or contradictory instead of smoothing it into a
  confident-sounding summary.
- AI-generated source text (including tickets/comments authored with an
  AI assistant): watch for filler and unsupported claims dressed up as
  facts — call these out rather than repeating them at face value.
- If the digest surfaces a real, scoped QA need, hand off to
  `/define-testcases` or the `test-case-design` skill — don't do that
  work here.
