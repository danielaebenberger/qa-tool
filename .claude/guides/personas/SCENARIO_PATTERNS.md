# Scenario Patterns — Jahia QA Harness

> **Feedforward guide for Pillar C — Persona-based UAT**
> This guide provides reusable scenario patterns for common Jahia feature types.
> The `qa-persona-uat` skill uses these patterns to generate persona-specific
> scenarios that are concrete, reproducible, and not "fluffy roleplay."

---

## 1. Scenario design principle

> A scenario is NOT a test case. It is a **user story in motion**.

A scenario describes what a specific persona tries to accomplish, what they
expect to happen, what confusion they might have, and what would make them
trust or distrust the feature.

Scenarios answer: *"What does this feel like from the inside?"*
Tests answer: *"Does the code behave correctly?"*

Both are needed. Neither replaces the other.

---

## 2. Scenario anatomy

```
SCN-[PERSONA]-[NNN]: [short label]
─────────────────────────────────
Persona:     [slug]
Context:     [what the persona is trying to accomplish — their goal, not the feature]
Precondition:[what state the system must be in; what the persona knows]
Steps:       [numbered steps in the persona's vocabulary — not technical]
Expected:    [what the persona expects to see / experience]
Failure:     [what would make this persona confused, stuck, or mistrustful]
Execution:   [automated | synthetic-walkthrough | manual]
Evidence:    [Cypress test file/case | "none — manual" | "inferred from PR diff"]
```

---

## 3. Scenario patterns by Jahia feature type

### Pattern: New sub-panel in Advanced Options (e.g., Versioning, Visibility, Usages)

**Content Editor scenarios:**
```
SCN-CE-001: Discover the new panel without help
  Context:   The editor has never used the new panel before. No documentation read.
  Steps:     1. Open any content item in edit mode
             2. Click "Advanced Options" tab
             3. Look for a way to access the new feature
  Expected:  The new nav item is visible and its label is self-explanatory
  Failure:   Label uses a technical term; panel is hidden behind an unintuitive click;
             the editor gives up without finding it

SCN-CE-002: Use the panel and return to editing
  Context:   The editor opened the panel to check something, then wants to edit again
  Steps:     1. Navigate to the new panel
             2. Read the information displayed
             3. Navigate back to the Edit tab
  Expected:  Navigation is smooth; unsaved edits are not lost; state is preserved
  Failure:   Navigating away triggers unexpected save/discard prompts or clears form data
```

**Site Builder scenarios:**
```
SCN-SB-001: Check if the new panel affects page layout tooling
  Context:   Site builder notices an update and checks whether their workflow changed
  Steps:     1. Open a page in the page builder
             2. Check the Advanced Options tab for unexpected changes
             3. Verify existing layout tools still behave as before
  Expected:  No visible disruption to existing page builder workflow
  Failure:   A previously working panel is missing; layout tools behave differently
```

---

### Pattern: API or GraphQL schema change

**Developer scenarios:**
```
SCN-DEV-001: Consume the new/changed API from a module
  Context:   Developer is updating a module to use the new API endpoint or field
  Steps:     1. Read the API documentation / schema
             2. Write a query or call to the new endpoint
             3. Inspect the response
  Expected:  Schema is documented; response matches spec; error messages are actionable
  Failure:   Field names differ from docs; response format is undocumented;
             error messages are opaque (e.g., "500 Internal Server Error" only)

SCN-DEV-002: Upgrade a module that uses the changed API
  Context:   Developer is migrating an existing module after an API change
  Steps:     1. Read the migration guide or changelog
             2. Apply the documented changes
             3. Rebuild and redeploy the module
  Expected:  Migration guide covers all necessary changes; module deploys without errors
  Failure:   Migration guide is missing a step; deprecated call still silently succeeds
             but produces wrong data; no deprecation warning in tooling
```

**Admin scenarios:**
```
SCN-ADM-001: Install a module that uses the new API after a platform update
  Context:   Admin is applying a platform update in a staging environment
  Steps:     1. Apply the platform update
             2. Install or redeploy an existing module
             3. Check module status in the admin console
  Expected:  Module installs cleanly; health check confirms module is active
  Failure:   Module fails silently; health check shows green but feature is broken;
             error log is ambiguous about root cause
```

---

### Pattern: Content workflow change (publish, draft, approval)

**Content Editor scenarios:**
```
SCN-CE-010: Publish content through the changed workflow
  Context:   Editor has been publishing content the same way for months; workflow changed
  Steps:     1. Create or edit a content item
             2. Attempt to publish using the familiar steps
  Expected:  Familiar workflow still works, OR the change is clearly signalled with guidance
  Failure:   An expected button is missing; the publish action silently fails;
             a new required step was added without in-product guidance

SCN-CE-011: Understand why a publish was rejected or queued
  Context:   Editor submits for publish and gets an unexpected response
  Steps:     1. Submit for publish
             2. Read the response message
             3. Attempt to resolve the issue independently
  Expected:  Message is in plain language; resolution steps are given; no jargon
  Failure:   Error message contains technical codes; editor cannot determine next step
             without asking a developer
```

---

### Pattern: Permission / role change

**Admin scenarios:**
```
SCN-ADM-010: Assign a new permission to a user without unintended side effects
  Steps:     1. Open user management
             2. Grant the new permission/role to a test user
             3. Log in as that user and verify access
  Expected:  Permission takes effect; no other unrelated access is granted or revoked
  Failure:   Permission grants more access than documented (privilege escalation)
             or has no visible effect

SCN-ADM-011: Verify read-only users cannot access new feature
  Steps:     1. Log in as a user with read-only permissions
             2. Navigate to the new feature
  Expected:  Feature is not accessible or is shown in a non-interactive, read-only form
  Failure:   Feature is accessible; read-only user can trigger write operations
```

**Compliance scenarios:**
```
SCN-COMP-010: Verify the permission change is reflected in the audit log
  Steps:     1. An admin grants the new permission
             2. Compliance user checks the audit log
  Expected:  Audit log entry shows: actor, action (granted X to Y), timestamp, affected resource
  Failure:   Action is absent from the audit log
```

---

### Pattern: New or changed UI form / field

**Content Editor scenarios:**
```
SCN-CE-020: Fill in a new required field without reading docs
  Context:   Editor encounters a new required field in a familiar form
  Steps:     1. Open the form
             2. Attempt to save without filling the new field
             3. Read the validation message
             4. Fill the field and save
  Expected:  Field is labelled clearly; validation message identifies the field by name;
             help text explains the expected input format
  Failure:   Error message says "required field" without identifying which one;
             label uses a technical identifier (e.g., "jcr:title" instead of "Title");
             no help text for non-obvious expected values
```

**Novice / edge user scenarios (map to content-editor persona at low experience level):**
```
SCN-EDGE-020: Misuse a new field in an expected but unintended way
  Context:   User enters data in the wrong format (e.g., HTML in a plain text field)
  Steps:     1. Enter clearly invalid data in the new field
             2. Attempt to save
  Expected:  Graceful validation; clear correction guidance
  Failure:   Data is silently accepted and causes rendering issues elsewhere;
             or system crashes / throws an unhandled exception
```

---

### Pattern: Accessibility (all feature types)

```
SCN-A11Y-001: Navigate the new feature using keyboard only
  Persona:   compliance-user (accessibility-constrained context)
  Steps:     1. Open the feature using only Tab, Enter, Escape, and arrow keys
             2. Perform the core task
             3. Return to previous state
  Expected:  All interactive elements are reachable; focus order is logical;
             focus is not trapped; Escape closes modals/panels
  Failure:   A required button cannot be reached by keyboard;
             focus jumps to an unexpected location; element has no visible focus ring

SCN-A11Y-002: Screen reader announces the new feature correctly
  Persona:   compliance-user
  Steps:     1. Navigate to the new UI element with a screen reader enabled
             2. Activate/interact with it
  Expected:  Role, label, and state are announced correctly (e.g., "Versioning, button"
             or "Version item, greyed out, English version unavailable")
  Failure:   Element is announced as unlabelled; disabled state is not communicated;
             list items have no semantic structure
```

---

## 4. Persona × feature type matrix

Use this to quickly identify which scenario patterns apply:

| Feature type | CE | SB | DEV | ADM | COMP |
|-------------|----|----|-----|-----|------|
| New sub-panel (Advanced Options) | ✅ SCN-CE-001/002 | ✅ SCN-SB-001 | — | — | ✅ SCN-A11Y |
| API / schema change | — | — | ✅ SCN-DEV-001/002 | ✅ SCN-ADM-001 | — |
| Content workflow change | ✅ SCN-CE-010/011 | ✅ SCN-SB-001 | — | — | ✅ SCN-A11Y |
| Permission / role change | — | — | — | ✅ SCN-ADM-010/011 | ✅ SCN-COMP-010 |
| New form / field | ✅ SCN-CE-020 | ✅ SCN-CE-020 | — | — | ✅ SCN-A11Y |
| Any UI change | ✅ | ✅ | — | — | ✅ SCN-A11Y-001/002 |

CE = content-editor, SB = site-builder, DEV = developer, ADM = admin, COMP = compliance-user

---

## 5. Synthetic walkthrough evaluation

When a scenario cannot be automated (no Cypress test exists or the scenario
requires subjective judgment), the `qa-persona-uat` skill performs a
**synthetic walkthrough**:

1. Load the persona definition (goals, vocabulary, misunderstandings)
2. Load the feature implementation (PR diff, UX design, component code)
3. Step through the scenario mentally, applying the persona's attributes:
   - Would this persona understand the label / message at step N?
   - Would this persona know what to do next?
   - Does the feature respect the persona's permission scope?
4. Flag any step where the answer is "uncertain" or "probably not"
5. Mark the scenario verdict: `SYNTHETIC-PASS`, `SYNTHETIC-PARTIAL`, or `MANUAL-REQUIRED`

`SYNTHETIC-PASS` means the skill found no evidence of failure from the persona's perspective.
It does NOT replace human QA — it filters out obvious failures cheaply.

---

## 6. Adding new patterns

When a new Jahia feature type appears that doesn't match existing patterns:
1. Define 2–3 scenarios for each affected persona
2. Add them to the relevant pattern section above
3. Add a row to the matrix in section 4
4. Commit to this file with a change note at the bottom

| Date | Change |
|------|--------|
| 2026-05-28 | Initial patterns: sub-panel, API change, workflow, permission, form, a11y |
