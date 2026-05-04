---
description: "Help a QA engineer identify, draft, and challenge test cases for a Jahia story or bug ticket. Use during refinement or the test phase of a ticket."
mode: agent
---

# Define / challenge test cases for a ticket

Inputs the user should provide (ask if missing):
- Ticket text (story or bug), acceptance criteria, link to the ticket.
- Affected Jahia area: core platform vs. specific module(s).
- Any existing tests for the area (paths or file references).
- The phase: **refinement** (cases not yet written) or **test phase**
  (cases exist; we are looking for gaps).

## What to do

Load [.github/instructions/qa-domain.instructions.md](../instructions/qa-domain.instructions.md)
first.

Then produce, in this order:

1. **Clarifying questions (max 5).** Things a human must answer before
   meaningful test cases can be written. Cite the part of the ticket each
   question targets. If the ticket is fully unambiguous, say so.
2. **Risk view.** A short bullet list of what could plausibly break in
   Jahia — at the core platform layer, at the module layer, and at
   integration points (search, workflows, headless APIs, persistence).
   One bullet per risk, each tagged `[functional]`, `[non-functional]`, or
   `[regression]`.
3. **Test cases.** One per row, in the table below. **Default to plain
   markdown table format**, not Gherkin — the wider Jahia org uses
   Gherkin only for a small subset of tests. Use Gherkin only if the user
   confirms this ticket falls in that subset.

   | # | Title | Type (unit / int / e2e / manual) | Priority | Preconditions | Steps | Expected | Covers risk |
   |---|---|---|---|---|---|---|---|

4. **Coverage check.** Cross-reference against any existing tests the user
   shared. Mark each new case as `new`, `extends <existing test>`, or
   `replaces <existing test>` with reasoning.
5. **Missing requirements.** Anything the ticket assumes but does not
   state. Phrase as a request the QA engineer can take back to product.

## Output rules

- Plain markdown. The QA engineer copies this into the ticket; do not use
  collapsible sections or proprietary syntax.
- Every test case must trace to at least one acceptance criterion **or**
  one risk you listed in step 2. If it doesn't, drop it.
- Prefer fewer, sharper cases over a long list. Eight focused cases beat
  twenty repetitive ones.
- Do not invent product behaviour. If you don't know how a Jahia feature
  works, say so and add it to clarifying questions.
