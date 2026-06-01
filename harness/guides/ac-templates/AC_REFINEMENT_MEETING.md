# AC Refinement Meeting Guide

> This guide is used by the QA Engineer to facilitate the AC refinement meeting.
> It is triggered when the `qa-ac-validate` skill runs in **REFINEMENT mode** —
> i.e., when the input is a raw ticket or PRP plan, before development begins.

---

## Purpose of the refinement meeting

The refinement meeting converts a ticket or plan into a **QA-ready AC set**:
- Every acceptance criterion is testable
- Scope is explicit (including exclusions)
- Automation type is assigned per criterion
- Personas are identified
- Ambiguities are resolved, not postponed

The QA harness produces the **draft input** for this meeting.
The **QA engineer + team** produce the **finalised AC set** as output.

---

## Meeting input (produced by `qa-ac-validate --mode=refine`)

Before the meeting, share with participants:
1. The original ticket or PRP plan
2. The harness-generated draft AC list
3. The gap report (missing criteria flagged by the harness)
4. The QA readiness score

---

## Meeting agenda (suggested 30–45 min)

### Step 1 — Feature intent alignment (5 min)
> Goal: confirm everyone shares the same understanding of what is being built.

QA Engineer reads aloud the **feature intent statement** from the harness output.
The team confirms or corrects it.

Key question: *"Is there anything this feature does that is NOT captured in the intent statement?"*

---

### Step 2 — Draft AC walkthrough (10–15 min)
> Goal: validate, adjust, and approve the harness-drafted ACs.

Walk through each draft criterion:
- Is the **Given** reproducible? (Can we set up this state in a test?)
- Is the **Then** observable? (Can we assert this in Cypress, a unit test, or manually?)
- Is the **Not** accurate? (Are we comfortable with this exclusion?)

Flag any criterion rated `LOW` quality — these must be rewritten before sign-off.

---

### Step 3 — Gap review (5–10 min)
> Goal: decide whether to add, defer, or accept the gap.

For each gap flagged by the harness:

| Gap type | Decision options |
|----------|-----------------|
| Missing edge case | Add an AC now / defer to regression / accept risk |
| Missing error handling | Add an AC now / note as known gap |
| Missing multilingual AC | Add if the feature touches language-aware content |
| Missing permission AC | Add if the feature has role-based behaviour |
| UNTESTABLE criterion | Assign to manual QA / request design clarification |

---

### Step 4 — Automation assignment (5 min)
> Goal: every AC has an assigned automation type before development starts.

Go through the final AC list and assign:
- `cypress-e2e` — UI/workflow behaviour
- `unit-test` — logic, filtering, edge cases
- `api-test` — GraphQL/REST contract
- `manual` — accessibility, visual, UX judgment
- `untestable` — document reason; QA expert decides risk acceptance

---

### Step 5 — Sign-off (2 min)
> QA Engineer confirms the AC set is ready for development.

The signed-off AC set is committed to the ticket (or appended to the PRP plan).
The harness uses this signed-off set for Stage 2 (Acceptance Mapping) post-development.

---

## QA readiness score interpretation

The harness assigns a **QA readiness score** to the input ticket/plan:

| Score | Meaning | Action |
|-------|---------|--------|
| **GREEN** (≥80%) | AC set is largely complete; refinement meeting is a light review | Proceed to development |
| **AMBER** (50–79%) | Significant gaps; meeting is needed to fill them | Hold development until meeting completes |
| **RED** (<50%) | Input is too incomplete for safe development | Return ticket for more definition |

A RED score means the developer harness should **not start** until ACs are refined.

---

## Output of the refinement meeting

The QA engineer commits or records:

```markdown
## Acceptance Criteria — [Feature Name]
> Refined: YYYY-MM-DD | Participants: [names]

| ID | Type | Given | When | Then | Not | Automation | Persona | Quality |
|----|------|-------|------|------|-----|------------|---------|---------|
| AC-001 | functional | ... | ... | ... | ... | cypress-e2e | content-editor | HIGH |
| AC-002 | multilingual | ... | ... | ... | ... | cypress-e2e | content-editor | HIGH |
| AC-EXC-001 | exclusion | — | — | Feature X is out of scope | — | — | — | HIGH |
```

This output becomes the **ground truth** for the `qa-ac-validate --mode=validate`
run after the developer harness delivers its output.
