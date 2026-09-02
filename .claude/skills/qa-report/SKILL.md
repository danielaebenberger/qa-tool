---
description: >
  Stage 6 — QA Decision and Report Assembly.
  Assembles outputs from all four pillars (A: AC, B: Cypress, C: Persona UAT, D: Docs)
  into a final QA Harness Report and issues a release recommendation.
  Contains the final mandatory human checkpoint before the recommendation is acted upon.
name: qa-report
kind: skill
pillar: feature-validation
version: "1.0"
---

# QA Harness — Stage 6: QA Decision

You are assembling the final QA Harness Report. Your job is to synthesise all pillar
outputs into a single, structured, decision-quality document that tells the QA engineer
and release manager exactly what they need to know.

> This report is not a summary of what was tested.
> It is **decision-quality evidence** for a release judgement.

---

## Step 1 — Collect pillar outputs

Look for these files (use the feature slug to find them):

| Pillar | Expected file |
|--------|--------------|
| A | `*-ac-matrix.md` |
| B | `*-test-adequacy-review.md` |
| C | `*-persona-ucat-pack.md` |
| D | `*-doc-review.md` |

If any pillar output is missing, note it as `NOT RUN` — do NOT fabricate results.
A missing pillar output reduces confidence in the overall recommendation.

Also collect raw sensor outputs if present:
- `cypress-adequacy-raw.json`
- `doc-review-raw.json`

---

## Step 2 — Extract verdicts and blocking issues

From each pillar output, extract:

**Pillar A (AC matrix)**:
- Count: PASS / PARTIAL / MISSING / CONFIRMED (exclusions)
- Blocking: any MISSING functional AC with no accepted risk
- Overall verdict: PASS / PASS WITH GAPS / INSUFFICIENT EVIDENCE / FAIL

**Pillar B (Test adequacy)**:
- Quality score and grade (GOOD / FAIR / POOR)
- Any `.only` present (automatic blocker)
- Missing critical coverage gaps
- Overall verdict: ADEQUATE / GAPS PRESENT / INADEQUATE

**Pillar C (Persona UAT)**:
- Per-persona verdict
- Count: PASS / PARTIAL / FAIL / MANUAL-REQUIRED / NOT-VERIFIED
- Release-blocking persona failures (any scenario verdict FAIL for a blocking scenario)
- Overall verdict: PASS / PASS WITH MANUAL ITEMS PENDING / FAIL

**Pillar D (Documentation)**:
- Per-doc-type status
- Count of blocking gaps (missing migration guide, etc.)
- Overall verdict: COMPLETE / INCOMPLETE — GAPS PRESENT / INCOMPLETE — BLOCKING

---

## Step 3 — Assess residual risks

From all four pillars, compile the list of accepted gaps (items that are not PASS but
have been explicitly risk-accepted by the QA engineer during pillar reviews).

For each accepted risk, confirm:
- Was it explicitly accepted by the QA engineer? (Look for sign-off notes in the pillar outputs)
- Is it documented with a severity and owner?

Any gap that is NOT accepted and NOT resolved is a blocking item.

---

## Step 4 — Identify open manual items

Compile all items that require human action before the report is final:
- `MANUAL-REQUIRED` persona scenarios not yet executed
- `MANUAL_REVIEW_REQUIRED` documentation sources not yet reviewed
- Any `NOT_VERIFIED` AC that was assigned `manual` automation type

For each: note who needs to complete it and whether it is blocking.

---

## Step 5 — Compute the release recommendation

Apply this decision logic in order (first matching condition wins):

| Condition | Recommendation |
|-----------|---------------|
| Any pillar NOT RUN | `INSUFFICIENT EVIDENCE` |
| `.only` in any Cypress test file | `NOT READY — remove .only before CI` |
| Any exclusion AC CONFIRMED violated | `NOT READY — NOT building constraint violated` |
| Any functional AC `FAIL` (feature regresses behaviour) | `NOT READY — [AC ID] regressed` |
| Any `SYNTHETIC-FAIL` or `FAIL` persona scenario, not accepted | `NOT READY — [persona] scenario failed` |
| Any BLOCKING documentation gap (missing migration guide for breaking change) | `NOT READY — missing migration guide` |
| All above pass AND no open blocking manual items | evaluate further: |
| → All ACs PASS, test ADEQUATE, all personas PASS, docs COMPLETE | `READY` |
| → ≤2 PARTIAL ACs, GAPS PRESENT tests, no FAIL personas, docs INCOMPLETE non-blocking | `READY WITH KNOWN CAVEATS` |
| → Open MANUAL-REQUIRED items not yet executed | `INSUFFICIENT EVIDENCE — manual items pending` |
| → Anything else | `NOT READY — [primary reason]` |

The recommendation must cite the **primary reason** in one sentence. Do not list all
issues — identify the single most important gate that is blocking or qualifying release.

---

## Step 6 — ⚠️ FINAL HUMAN CHECKPOINT

After computing the recommendation, **stop** and present the full QA report to the
QA engineer before it is finalised.

Present:
1. The pillar verdict table
2. The complete artefact index
3. The residual risks list
4. All open manual items
5. The release recommendation with its primary reason

Ask:
> "This is the QA Harness report for [feature].
> The release recommendation is: [RECOMMENDATION]
> [Primary reason]
>
> Before I finalise this report, please confirm:
> 1. Are you satisfied with the residual risks as documented?
> 2. Have all manual testing items been completed or explicitly deferred?
> 3. Do you agree with the release recommendation?"

Adjust the recommendation if the QA engineer provides additional context or overrides.
A QA engineer override must be noted in the report with their name and rationale.

---

## Step 7 — Output

Fill in `.claude/templates/qa-report.md` and save to:
`[feature-slug]-qa-report.md`

Print the final verdict banner:
```
╔══════════════════════════════════════════════════════════════╗
║  QA HARNESS REPORT — [FEATURE NAME]                          ║
╠══════════════════════════════════════════════════════════════╣
║  Pillar A (AC):         [verdict]                            ║
║  Pillar B (Tests):      [verdict]                            ║
║  Pillar C (Personas):   [verdict]                            ║
║  Pillar D (Docs):       [verdict]                            ║
╠══════════════════════════════════════════════════════════════╣
║  RELEASE RECOMMENDATION: [READY | CAVEATS | INSUFFICIENT |   ║
║                           NOT READY]                         ║
║  [Primary reason, one line]                                  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Reference files

- `.claude/templates/qa-report.md` — output template
- All pillar templates for cross-reference
