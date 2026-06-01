# Documentation Standards — Jahia QA Harness

> **Feedforward guide for Pillar D — Documentation Review**
> Defines which documentation types are expected for each category of Jahia feature change.
> The `qa-doc-review` skill uses this guide to identify documentation gaps.

---

## 1. The documentation problem in AI-assisted development

Developer harnesses deliver working code. They rarely deliver complete documentation.
The QA harness closes this gap by treating documentation as a **first-class deliverable**,
not an afterthought.

> A feature is not done if a user cannot find out how to use it,
> or if a support agent cannot explain it, or if an admin cannot maintain it.

---

## 2. Documentation types and their owners

| Doc type | Location (typical) | Audience | Owner |
|----------|-------------------|----------|-------|
| **Repository README** | `/README.md` or `/docs/` in the repo | Developers, contributors | Developer |
| **Academy article** | `academy.jahia.com` | End users, content editors, site builders | Product / Technical Writer |
| **Release notes / CHANGELOG** | `CHANGELOG.md` or GitHub Release | Developers, admins | Developer / PM |
| **Migration guide** | `MIGRATION.md` or Academy | Developers upgrading between versions | Developer |
| **API documentation** | GraphQL schema, Swagger/OpenAPI, README | Developers consuming the API | Developer |
| **Internal notes** | Confluence, Notion, internal wiki | Support team, CSMs, internal stakeholders | PM / QA |
| **Admin guide** | Academy admin section or internal docs | Platform admins | Technical Writer |
| **Support runbook** | Internal knowledge base | Support engineers | Support / QA |

---

## 3. Required documentation by change type

Use this table to identify which documentation types must be checked for a given feature.

| Change type | README | Academy | Changelog | Migration | API docs | Internal | Admin | Support |
|-------------|--------|---------|-----------|-----------|----------|----------|-------|---------|
| New user-facing feature | ✅ | ✅ | ✅ | — | if API | ✅ | if admin-facing | ✅ |
| Changed user-facing feature | ✅ if structure changed | ✅ | ✅ | if breaking | if API changed | ✅ | if admin-facing | ✅ |
| Bug fix (no UX change) | — | — | ✅ | — | — | ✅ | — | if support-impacting |
| New API endpoint / field | ✅ | if user-facing | ✅ | — | ✅ | ✅ | — | — |
| Breaking API change | ✅ | if user-facing | ✅ | ✅ | ✅ | ✅ | — | — |
| Permission / role change | — | if user-facing | ✅ | if breaking | — | ✅ | ✅ | ✅ |
| New module | ✅ | ✅ | ✅ | — | if API | ✅ | ✅ | ✅ |
| Deprecation | ✅ | if user-facing | ✅ | ✅ | ✅ | ✅ | — | — |
| Performance / internal only | — | — | ✅ | — | — | ✅ | — | — |

Legend: ✅ = required | — = not required | "if X" = required only if condition applies

---

## 4. Quality criteria per documentation type

### Repository README / technical docs

A README is adequate if it:
- [ ] Describes the feature or module at a level that a developer can integrate it
- [ ] Lists prerequisites, configuration, and usage examples
- [ ] Mentions any new environment variables, configuration keys, or API changes
- [ ] Notes any breaking changes with a migration path
- [ ] Is accurate after the change (no stale references to old behaviour)

### Academy article (end-user documentation)

An Academy article is adequate if it:
- [ ] Describes what the feature does in user terms (not code terms)
- [ ] Includes step-by-step instructions for the primary workflow
- [ ] Includes screenshots or examples that reflect the new/updated UI
- [ ] Covers the most common use cases and any important constraints
- [ ] Does not reference removed UI elements or deprecated workflows
- [ ] Links to related features or prerequisites

### Release notes / CHANGELOG

A CHANGELOG entry is adequate if it:
- [ ] Follows the format used in the repository (e.g., Keep a Changelog)
- [ ] States what changed (not just "improved X")
- [ ] Mentions the affected component (e.g., Content Editor, Admin Console)
- [ ] Links to the relevant issue or PR
- [ ] Notes any breaking changes explicitly (tagged as `[BREAKING]` or equivalent)

### Migration guide

A migration guide is adequate if it:
- [ ] Lists every breaking change a developer must act on
- [ ] Provides a before/after code or config example for each breaking change
- [ ] Mentions the version range affected (from → to)
- [ ] Is findable from the CHANGELOG or README

### API documentation

API docs are adequate if they:
- [ ] Reflect the current schema (no removed or renamed fields without notice)
- [ ] Include examples for new endpoints or fields
- [ ] Note any deprecations with a timeline for removal
- [ ] Are consistent with the actual API behaviour (no mismatch between docs and code)

### Internal documentation

Internal notes are adequate if they:
- [ ] Capture the business rationale behind the change
- [ ] Flag any support-impacting behaviour (edge cases, known limitations)
- [ ] Note open questions or known risks
- [ ] Are findable by the support team (correct space, labelled correctly)

---

## 5. The "doc delta" concept

Pillar D does not ask "does documentation exist?" — it asks:

> **Does the documentation reflect what just changed?**

For each doc source, the reviewer computes a **doc delta**:
- What user-visible behaviours changed
- Which doc sources mention those behaviours
- Whether the doc sources accurately describe the post-change state

A doc delta of zero means the documentation fully reflects the new behaviour.
A doc delta > zero means there is a gap to fill.

---

## 6. Documentation debt patterns to watch for

| Pattern | Risk | Detection signal |
|---------|------|-----------------|
| Screenshots show old UI | Users follow wrong steps | Image filename unchanged; old UI element names in alt text |
| README still references removed configuration | Developers waste time debugging | Old config key name present in README |
| Academy article missing new feature section | Users don't know the feature exists | Feature name absent from article |
| CHANGELOG says "improved X" without detail | Admins can't assess upgrade impact | Vague entries with no component or version reference |
| Migration guide missing a breaking change | Developer upgrades break silently | Breaking change in diff, no mention in MIGRATION.md |
| Internal notes outdated | Support gives wrong advice | Stale version numbers or resolved issues still listed as open |

---

## 7. Documentation sources are human-declared

> **The QA harness cannot discover all documentation sources automatically.**

Documentation for Jahia features is distributed across:
- Multiple GitHub repositories
- academy.jahia.com (external CMS)
- Internal Confluence spaces
- Support knowledge bases

The QA engineer **must declare the relevant documentation sources** using the
`DOC_SOURCES_TEMPLATE.md` form before Pillar D can run.

The harness evaluates what it is given — it cannot evaluate what it doesn't know about.
A missing source declaration is itself a documentation gap.
