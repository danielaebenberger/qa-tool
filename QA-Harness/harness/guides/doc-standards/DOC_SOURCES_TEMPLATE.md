# Documentation Sources — [Feature Name]

> **Fill this form before running `qa-doc-review`.**
> The QA harness cannot discover all documentation sources automatically.
> This form is the human's contribution to Pillar D.
>
> Instructions: fill in each section that applies. Mark sections that do not apply
> as `N/A — [reason]`. Leave no section blank — a blank entry cannot be evaluated.

---

## Feature reference

- **Feature name**: [e.g., Content Editor Versioning Panel]
- **Issue / PR**: [URL]
- **PRP plan**: [file path, if available]
- **Completed by**: [name, date]

---

## Documentation sources

### 1. Repository README / technical docs

> Local documentation in the repository being changed.

| Field | Value |
|-------|-------|
| **Primary README** | `README.md` (root of repo) |
| **Additional doc files** | `docs/`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, etc. |
| **API docs location** | [e.g., `src/main/resources/META-INF/graphql/schema.graphql`] |
| **CHANGELOG location** | [e.g., `CHANGELOG.md` or GitHub Releases page URL] |
| **MIGRATION guide location** | [e.g., `MIGRATION.md` or `N/A — no breaking changes`] |
| **Known stale sections** | [anything the team knows is out of date before this PR] |

---

### 2. Academy article (end-user documentation)

> `academy.jahia.com` — the primary source for end-user and admin documentation.

| Field | Value |
|-------|-------|
| **Existing article URL** | [e.g., `https://academy.jahia.com/documentation/developer/...`] |
| **Article title** | [title of the relevant academy article] |
| **Article section** | [e.g., "Using Content Editor > Advanced Options"] |
| **Is this a new topic?** | YES — new article needed / NO — update to existing article |
| **Screenshot locations** | [where screenshots are stored, if applicable] |
| **Last known update** | [date or "unknown"] |
| **Notes for the reviewer** | [e.g., "Section 3.2 references the old navigation structure"] |

---

### 3. Release notes / CHANGELOG entry

| Field | Value |
|-------|-------|
| **CHANGELOG file** | [file path or URL] |
| **Target version** | [e.g., `8.2.0`] |
| **Entry drafted?** | YES — [paste or link draft] / NO — needs to be written |
| **Format used in this repo** | [e.g., Keep a Changelog / GitHub Release notes / custom] |
| **Breaking change?** | YES / NO |
| **Notes** | |

---

### 4. Migration guide (only if breaking changes exist)

| Field | Value |
|-------|-------|
| **Breaking change summary** | [brief description of what developers must change] |
| **Migration guide location** | [file path or URL, or "needs to be created"] |
| **Affected version range** | [from version X to version Y] |
| **Code example available?** | YES / NO — needs writing |
| **Notes** | |

---

### 5. API documentation (only if API surface changed)

| Field | Value |
|-------|-------|
| **Schema / spec file location** | [e.g., `schema.graphql`, OpenAPI YAML, or external URL] |
| **Changed endpoints / fields** | [list of new, changed, or deprecated fields] |
| **Deprecation notice added?** | YES / NO / N/A |
| **API changelog updated?** | YES / NO / N/A |
| **Notes** | |

---

### 6. Internal documentation

> Confluence, Notion, internal wiki, or equivalent.

| Field | Value |
|-------|-------|
| **Internal doc URL** | [Confluence page URL or "none — create new page"] |
| **Target space / section** | [e.g., "Product > Release X.Y" or "Support > Known Behaviours"] |
| **Audience** | [support team / CSMs / engineering management / other] |
| **Content needed** | [brief description of what must be documented internally] |
| **Notes** | |

---

### 7. Support documentation / runbook

> Knowledge base articles used by the support team to handle user questions.

| Field | Value |
|-------|-------|
| **Existing KB article URL** | [URL or "none — create new article"] |
| **Support-impacting behaviour** | [what support should know: edge cases, known limitations, workarounds] |
| **FAQ candidate?** | YES — [draft the Q&A] / NO |
| **Notes** | |

---

### 8. Additional sources (free-form)

> Any documentation not covered above (e.g., in-product help text, tooltips,
> on-boarding flows, video tutorials, partner documentation).

| Source | URL / location | Action needed | Owner |
|--------|---------------|---------------|-------|
| [source name] | [URL] | [UPDATE / CREATE / VERIFY / N/A] | [name] |

---

## Pre-review notes for the QA agent

> Use this space to highlight anything the automated analysis is unlikely to detect:
> - Parts of the documentation that are known to be stale
> - Areas where content is technically correct but misleading to users
> - Documentation that exists in a language other than English
> - Docs that are gated behind login (and cannot be fetched automatically)

```
[Your notes here]
```

---

## Completeness check

> The QA engineer confirms this form is complete before handing it to the harness.

- [ ] All applicable sections are filled in
- [ ] Sections marked N/A have a reason
- [ ] Internal docs with auth-gating have been manually reviewed and a summary provided
- [ ] Breaking changes are explicitly declared (or absence confirmed)

Signed off by: _____________ Date: _____________
