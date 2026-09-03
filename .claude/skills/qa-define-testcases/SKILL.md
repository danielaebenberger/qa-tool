---
name: qa-define-testcases
description: "Help a QA engineer identify, draft, and challenge test cases for a Jahia story or bug ticket. Use during refinement or the test phase of a ticket."
kind: skill
pillar: test-case-identification
version: "1.0"
see_also: [qa-test-case-design]
---

# Define / challenge test cases for a ticket

Inputs the user should provide (ask if missing):
- Ticket text (story or bug), acceptance criteria, link to the ticket.
- Affected Jahia area: core platform vs. specific module(s).
- Any existing tests for the area (paths or file references).
- The phase: **refinement** (cases not yet written) or **test phase**
  (cases exist; we are looking for gaps).

## What to do

Load [.claude/guides/jahia-qa-domain.md](../../guides/jahia-qa-domain.md)
first.

Then produce, in this order:

1. **Coverage audit — do this before drafting anything.** Search the repo
   for existing tests that already touch this topic. Search twice: once by
   the code-level identifiers involved (action ids, function/prop names),
   and once by the human-visible text a user would see (button/menu
   labels, page titles) — a canonical enumeration/"sanity" test for the
   surface (e.g. a "Displays X actions" spec) usually asserts against
   rendered labels, not internal names, and a code-token-only search will
   miss it. Also identify whether the behavior behind this ticket routes
   through a component/action already exercised by another spec (a shared
   dialog, a shared registered action) — if so, that behavior doesn't need
   re-proving. Note what you found; it drives steps 3 and 4.
2. **Clarifying questions (max 5).** Things a human must answer before
   meaningful test cases can be written. Cite the part of the ticket each
   question targets. If the ticket is fully unambiguous, say so.
3. **Risk view.** A short bullet list of what could plausibly break in
   Jahia — at the core platform layer, at the module layer, and at
   integration points (search, workflows, headless APIs, persistence).
   One bullet per risk, each tagged `[functional]`, `[non-functional]`, or
   `[regression]`.
4. **Test cases.** One per row, in the table below. **Default to plain
   markdown table format**, not Gherkin — the wider Jahia org uses
   Gherkin only for a small subset of tests. Use Gherkin only if the user
   confirms this ticket falls in that subset. **Cypress/e2e is the default
   Type** — that's the artefact the QA team owns and acts on. Propose a
   unit-test row only for a genuine logic gap with no observable e2e
   behavior; mark it `(dev-owned)` in Type and keep its Steps/Expected
   terse — developers decide whether and how to add it, so it doesn't earn
   the same level of detail as a Cypress case. Don't propose a case that
   only re-verifies a shared component already covered per step 1.

   | # | Title | Type (e2e / unit (dev-owned) / manual) | Priority | Preconditions | Steps | Expected | Covers risk |
   |---|---|---|---|---|---|---|---|

5. **Coverage check.** Cross-reference against what step 1 found (plus
   anything else the user shared). Mark each new case as `new`, `extends
   <existing test>`, or `replaces <existing test>` with reasoning. Prefer
   `extends <canonical enumeration test>` over `new` whenever step 1 found
   one for this surface.
6. **Missing requirements.** Anything the ticket assumes but does not
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
