# Persona: Content Editor

> **Slug**: `content-editor`
> **Jahia context**: Works in jContent / jExperience — creates, edits, publishes content.
> Primary day-to-day user of the Jahia platform.

---

## Identity

| Attribute           | Value |
|---------------------|-------|
| **Role**            | Content Editor / Content Manager |
| **Experience**      | Intermediate with Jahia |
| **Technical level** | Non-technical to low-code |
| **Permission scope**| Editor (create, edit, publish within assigned spaces) |
| **Urgency**         | Medium-high (publishing deadlines, campaign timelines) |
| **Risk level**      | High — content errors reach end users directly |

---

## Goals

1. Create or update content (articles, pages, media, structured data) accurately and quickly
2. Publish content on schedule without needing technical help
3. Preview how content looks before publishing
4. Understand what changed after a platform update without reading release notes in detail

---

## Vocabulary

- **Uses**: page, content, publish, workflow, draft, live, preview, form, field, image, tag,
  category, site, language, translation, SEO, schedule, approve
- **Does NOT use / understand**: API, module, GraphQL, JCR node, mixin, deployment pipeline,
  environment variable, cache invalidation, CI/CD

---

## Likely misunderstandings

- Confuses "save as draft" with "publish" — assumes saving is the same as going live
- Does not understand the difference between staging and production environments
- Interprets any permission error as "the feature is broken"
- Assumes a translated page is automatically published in all languages
- Does not understand content inheritance or page template constraints

---

## Core tasks (for scenario generation)

| Task ID | Task description | Expected outcome |
|---------|-----------------|------------------|
| T1 | Create a new content item using the default form | Form is intuitive, required fields are clearly marked, save confirms success |
| T2 | Edit an existing published piece of content | Edit doesn't accidentally unpublish; changes are reflected in preview |
| T3 | Publish content and verify it is live | Clear confirmation; no ambiguity about which environment was targeted |
| T4 | Use a new or changed field introduced by a feature | Field label and help text are self-explanatory without reading docs |
| T5 | Recover from a validation error on a form | Error message uses plain language and indicates exactly what to fix |
| T6 | Find content using search or navigation | Discovery path is unchanged after feature update |

---

## Failure signals (unacceptable outcomes)

- Published content does not appear live, with no explanation
- Form validation error message contains technical jargon or stack trace
- A workflow step was silently removed or reordered after update
- A previously available field or option is gone without notice
- Preview shows different result than live without explanation

---

## Success signals

- Content created and published without requiring technical assistance
- New or changed UI is self-explanatory on first encounter
- Errors are actionable and expressed in plain language
- The workflow matches the editor's mental model (draft → review → publish)

---

## Scenario evaluation hints

- Check that **all user-facing labels and messages** avoid technical vocabulary
- Verify that the **publish/draft distinction** is unambiguous after any UI change
- Confirm that **workflow steps are clearly indicated** (what happens next)
- Test form behaviour with **missing required fields, invalid inputs, and concurrent edits**
- Assess whether **new features are discoverable** without reading documentation

---

## Change history

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial definition | QA Harness bootstrap |
