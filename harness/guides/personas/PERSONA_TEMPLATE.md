# Persona Template

> Copy this file to create a new persona.
> File naming convention: `<slug>.md` (e.g., `content-editor.md`)
> Keep each field concise but specific. Vague personas create vague test scenarios.

---

## Persona: [PERSONA NAME]

### Identity

| Attribute         | Value |
|-------------------|-------|
| **Role**          | [Job title / role in the Jahia ecosystem] |
| **Experience**    | [novice / intermediate / expert] with Jahia |
| **Technical level** | [non-technical / low-code / developer] |
| **Permission scope** | [read-only / editor / admin / superadmin / custom] |
| **Urgency**       | [low (exploratory) / medium (routine task) / high (deadline pressure)] |
| **Risk level**    | [low / medium / high — impact if this persona is confused or misled] |

---

### Goals

What this persona is trying to achieve when they encounter this feature:

1. [Primary goal]
2. [Secondary goal]
3. [Edge goal — what they might attempt that is out of intended scope]

---

### Vocabulary

Terms this persona uses and understands:

- **Uses**: [list of familiar terms]
- **Does NOT use / understand**: [list of terms to avoid when assessing UX clarity]

---

### Likely misunderstandings

What this persona is most likely to misinterpret about a feature:

- [Misunderstanding 1]
- [Misunderstanding 2]
- [Misunderstanding 3]

---

### Core tasks (for scenario generation)

Concrete tasks this persona performs when using a feature. These become the basis
for scenario generation in Pillar C (persona-based UAT).

| Task ID | Task description | Expected outcome |
|---------|-----------------|------------------|
| T1 | [task] | [what success looks like] |
| T2 | [task] | [what success looks like] |
| T3 | [task] | [what success looks like] |

---

### Failure signals (unacceptable outcomes)

Outcomes that represent a failure from this persona's viewpoint,
even if the implementation is technically correct:

- [Failure signal 1]
- [Failure signal 2]
- [Failure signal 3]

---

### Success signals

What "done" looks like from this persona's perspective:

- [Success signal 1]
- [Success signal 2]

---

### Scenario evaluation hints

When the QA agent evaluates scenarios for this persona, it should pay special attention to:

- [Hint 1 — e.g., "check that error messages use plain language, not technical codes"]
- [Hint 2 — e.g., "verify the workflow doesn't require navigating more than N steps"]
- [Hint 3]

---

### Change history

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial definition | [name] |

> **Extensibility note**: Add new rows to the change history when refining this persona.
> When a new Jahia feature introduces a new user archetype, copy PERSONA_TEMPLATE.md
> and add the file to this folder. The `qa-persona-uat` skill auto-discovers all
> `*.md` files in this directory (excluding this template).
