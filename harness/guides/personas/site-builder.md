# Persona: Site Builder

> **Slug**: `site-builder`
> **Jahia context**: Builds page structure, templates, navigation, and component layouts
> using Jahia's page builder / drag-and-drop tooling. Often a digital marketer or
> web producer with some technical literacy.

---

## Identity

| Attribute           | Value |
|---------------------|-------|
| **Role**            | Site Builder / Web Producer / Digital Marketer |
| **Experience**      | Intermediate to advanced with Jahia |
| **Technical level** | Low-code (comfortable with configuration, not with code) |
| **Permission scope**| Editor + template/page management in assigned sites |
| **Urgency**         | Medium (project-driven, campaign launches) |
| **Risk level**      | High — site structure changes affect all content editors and end users |

---

## Goals

1. Assemble pages from components without writing code
2. Configure component settings and layouts visually
3. Manage site navigation, page hierarchy, and URL structure
4. Roll out structural changes across pages efficiently
5. Understand impact of platform changes on existing site configurations

---

## Vocabulary

- **Uses**: page builder, component, slot, layout, template, row, column, navigation,
  sitemap, hero, banner, widget, breakpoint, responsive, anchor, redirect, SEO,
  drag and drop, preview, variant
- **Does NOT use / understand**: CSS class internals, JSP/React code, JCR path,
  bundle deployment, Groovy script, REST endpoint

---

## Likely misunderstandings

- Does not distinguish between a component configuration change and a module update
- Assumes visual changes in the builder are immediately live (not realising staging exists)
- May not notice that a component was deprecated and replaced — will try to use the old one
- Interprets missing component as "the page builder is broken"
- Confused by permission-scoped vs. globally available components

---

## Core tasks (for scenario generation)

| Task ID | Task description | Expected outcome |
|---------|-----------------|------------------|
| T1 | Add a new component to an existing page | Component appears in the palette; drag-and-drop works; settings open correctly |
| T2 | Configure a component's display settings | All options are labelled clearly; changes preview instantly |
| T3 | Change page template or layout | Confirmation of impact on existing content; no silent data loss |
| T4 | Set up a new navigation item | Navigation updates are reflected in preview and across affected pages |
| T5 | Reproduce an existing page structure on a new page | Template or copy mechanism works without unexpected constraints |
| T6 | Identify what changed after a platform update | Changelog or in-product notice exists; changed components are flagged |

---

## Failure signals (unacceptable outcomes)

- Component previously used is gone or broken after update with no migration path noted
- Page builder layout changes in an unexpected way after a platform update
- A configuration option silently has no effect
- Saving a page layout discards changes with no error message
- A component's settings panel shows technical identifiers instead of friendly labels

---

## Success signals

- Can build and configure a page without reading technical documentation
- Component palette shows consistent, labelled options
- Changes are previewed before going live
- Platform update does not silently break existing page structures

---

## Scenario evaluation hints

- Check for **component palette completeness** — are all expected components present?
- Verify **visual feedback** after saving or publishing layout changes
- Test **template changes with existing content** — does content survive a layout switch?
- Assess **discoverability of new components** introduced by the feature
- Look for **in-product guidance** when a feature changes a workflow the site builder depends on

---

## Change history

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial definition | QA Harness bootstrap |
