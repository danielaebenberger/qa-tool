# Personas — Jahia QA Harness

This folder contains the **persona definitions** used by Pillar C (Persona-based UAT)
of the QA harness. Each persona represents a distinct user archetype with specific
goals, vocabulary, permission scope, and risk profile.

---

## Current personas

| File | Persona | Role | Risk |
|------|---------|------|------|
| `content-editor.md` | Content Editor | Creates/publishes content in jContent | High |
| `site-builder.md` | Site Builder | Builds page layouts and component configurations | High |
| `developer.md` | Developer | Builds modules and integrations via API/CLI | High |
| `admin.md` | Platform Admin | Manages system config, users, modules | Very high |
| `compliance-user.md` | Compliance User | Ensures GDPR, WCAG, audit compliance | Very high |

---

## How personas are used

The `qa-persona-uat` skill reads all `*.md` files in this folder
(excluding `PERSONA_TEMPLATE.md` and this `README.md`) and uses them to:

1. **Select relevant personas** for the feature being evaluated (not all personas are
   relevant for every change)
2. **Generate scenarios** per persona based on `Core tasks`
3. **Evaluate outcomes** against `Failure signals` and `Success signals`
4. **Flag evaluation hints** specific to each persona

---

## Adding a new persona

1. Copy `PERSONA_TEMPLATE.md` to a new file: `<slug>.md`
2. Fill in all sections — especially `Core tasks`, `Failure signals`, and
   `Scenario evaluation hints`
3. Add a row to the table above in this README
4. Commit to the QA harness repository

The skill will automatically discover and use the new persona on the next run.

---

## Updating an existing persona

- Edit the relevant `*.md` file directly
- Add a row to the `Change history` table at the bottom of the persona file
- Keep persona definitions **specific to Jahia** — avoid generic descriptions
  that could apply to any CMS

---

## Persona selection heuristic

When a feature change is evaluated, the QA harness selects personas as follows:

| Change type | Personas always included | Personas conditionally included |
|-------------|-------------------------|--------------------------------|
| UI / UX change | `content-editor`, `site-builder` | `compliance-user` if accessibility-relevant |
| API / schema change | `developer` | `admin` if deployment-related |
| Permission / auth change | `admin`, `compliance-user` | All others if user-facing |
| Data handling change | `compliance-user` | `admin` if audit-related |
| Module lifecycle change | `admin`, `developer` | `site-builder` if component-level |
| Content workflow change | `content-editor` | `site-builder`, `admin` |

A persona can also be **force-included** by adding it to the AC or PR description
with the tag `persona:<slug>` (e.g., `persona:compliance-user`).
