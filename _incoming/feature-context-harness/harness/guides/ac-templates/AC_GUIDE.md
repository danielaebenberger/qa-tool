# AC Guide — Writing Acceptance Criteria for Jahia Features

> **Feedforward guide for Pillar A — Acceptance Criteria Validation**
> This guide is consumed by the `qa-ac-validate` skill and by the QA team during
> the AC refinement meeting. It defines what a complete, testable AC looks like
> for the Jahia platform.

---

## 1. Why AC quality matters upstream

Bad acceptance criteria are the single most expensive source of QA harness failures.
If the criterion is vague, the validator cannot produce a meaningful verdict.

> **A criterion that cannot be tested is not a criterion — it is an assumption.**

The goal of AC refinement is to make all assumptions explicit and testable **before**
development begins. The QA harness can validate ACs, but it cannot invent them.

---

## 2. AC anatomy for Jahia features

Every acceptance criterion should have five elements:

```
AC-XXX: [short label]
  Given: [context / precondition — user role, data state, environment]
  When:  [the user or system action]
  Then:  [the expected observable outcome]
  Not:   [explicit exclusion — what this criterion does NOT cover]
```

### Example (from a versioning feature)

```
AC-001: Versioning nav item appears in edit mode
  Given: A content editor is editing a content node (not creating)
  When:  They open the Advanced Options tab
  Then:  A "Versioning" item appears in the left navigation panel
  Not:   Does not apply in create mode; does not apply to site nodes
```

---

## 3. AC types — cover all dimensions

Each feature should have ACs across these types. Not all are always required,
but the QA expert should consciously decide which to include/exclude:

| Type | Description | Example trigger |
|------|-------------|-----------------|
| **Functional — happy path** | Core workflow works as specified | "User can do X" |
| **Functional — edge case** | Boundary conditions, empty states, large data | "0 versions", "100+ versions" |
| **Functional — error handling** | System responds gracefully to failure | "API unavailable", "no permission" |
| **Multilingual** | Behaviour is correct per language context | "Shows only current-lang versions" |
| **Permission / role-based** | Feature respects permission scope | "Read-only user cannot trigger Y" |
| **Accessibility (WCAG)** | UI is operable by keyboard + screen reader | ARIA attributes, tab order |
| **Non-functional — performance** | Response time acceptable under load | "Loads within 2 seconds" |
| **Exclusion (NOT building)** | Explicit statement of out-of-scope | "Restoration not included" |

---

## 4. The "NOT building" AC

Every feature **must** have at least one explicit exclusion criterion. This prevents
scope creep during development and reduces ambiguous "partial pass" verdicts in QA.

```
AC-EXC-001: Version restoration is out of scope
  This release shows version history for inspection only.
  Users cannot restore a node to a previous version via this feature.
```

---

## 5. Testability checklist (per criterion)

Before finalising an AC, confirm:

- [ ] The criterion refers to a **user-visible outcome** (not an implementation detail)
- [ ] The **precondition** (Given) is reproducible in a test environment
- [ ] The **outcome** (Then) can be observed via UI, API response, or log/audit
- [ ] The criterion is **independent** — it does not implicitly depend on another unwritten AC
- [ ] An **automation type** can be assigned (Cypress E2E / unit test / API test / manual)
- [ ] A **persona** is identifiable (who experiences this outcome?)

---

## 6. Automation coverage mapping

When writing ACs, assign an expected automation type:

| Automation type | When to use |
|----------------|-------------|
| **Cypress E2E** | User-visible UI behaviour, workflow steps, navigation |
| **Unit test** | Component logic, filtering logic, utility functions |
| **API / GraphQL test** | Data returned by queries, mutation correctness |
| **Manual** | Accessibility (screen reader output), visual regression, UX judgment |
| **Untestable** | Document why — flag for QA expert decision |

---

## 7. Multilingual AC patterns (Jahia-specific)

Jahia features that touch content fields or UI often need language-aware ACs:

```
AC-LANG-001: Version list filters by current editor language
  Given: The editor has English (en) selected as the active language
  When:  The Versioning panel loads
  Then:  Versions with changes in 'en' or 'shared' fields are selectable (enabled)
         Versions with changes only in other languages are greyed out

AC-LANG-002: Language switch updates version list
  Given: The editor switches from English to French
  When:  The Versioning panel is visible
  Then:  The selectability of version items updates to reflect the French language context
```

---

## 8. Permission-scoped AC patterns (Jahia-specific)

```
AC-PERM-001: Versioning panel is not shown in create mode
  Given: A content editor is in create mode (new content item, not yet saved)
  When:  They open the Advanced Options tab
  Then:  The "Versioning" nav item is NOT present
  Not:   This is a UX protection — the panel has no meaningful data before first save

AC-PERM-002: Read-only user cannot access versioning panel
  Given: A user with read-only permission views a content item
  Then:  The Advanced Options tab and Versioning panel are not accessible
```

---

## 9. AC quality scoring

The QA harness rates each AC on three dimensions:

| Dimension | Good | Bad |
|-----------|------|-----|
| **Specificity** | References concrete UI element, API field, or data state | Vague ("works correctly") |
| **Testability** | Assignable to an automation type | Requires subjective judgment only |
| **Completeness** | Covers Given / When / Then / Not | Missing precondition or exclusion |

Score: `HIGH` (all three), `MEDIUM` (two of three), `LOW` (one or zero) → LOW triggers
a team meeting flag before development starts.

---

## 10. AC refinement ownership

| Role | Responsibility |
|------|---------------|
| **QA Engineer** | Drives the refinement meeting; validates completeness; owns the AC matrix |
| **Developer** | Confirms technical feasibility; identifies implementation constraints |
| **Product Owner** | Confirms user intent; resolves ambiguity in scope |
| **QA Harness** | Drafts initial ACs from ticket/plan; flags gaps; does NOT finalise ACs alone |

> The QA harness produces a **draft for human review**, not a final specification.
