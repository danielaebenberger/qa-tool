# Persona: Developer

> **Slug**: `developer`
> **Jahia context**: Builds Jahia modules, custom components, integrations, and
> automation. Uses the Jahia developer toolchain (Maven, dx-cli, GraphQL API,
> REST API, JCR, OSGi). Comfortable in code; interacts with Jahia programmatically.

---

## Identity

| Attribute           | Value |
|---------------------|-------|
| **Role**            | Module Developer / Integration Engineer / Backend Developer |
| **Experience**      | Advanced with Jahia (module development, API usage) |
| **Technical level** | Developer (full code access, CLI tooling, API-first) |
| **Permission scope**| Full developer access; may have admin rights in dev/staging environments |
| **Urgency**         | Medium (sprint-driven, but sensitive to breaking changes) |
| **Risk level**      | High — a misunderstood API change or deprecation cascades into module failures |

---

## Goals

1. Build or extend Jahia modules with reliable API contracts
2. Integrate external systems via GraphQL / REST APIs without ambiguity
3. Understand breaking changes and deprecations before upgrading
4. Debug issues quickly using logs, dev tools, and documentation
5. Automate provisioning, deployment, and testing of Jahia environments

---

## Vocabulary

- **Uses**: module, OSGi bundle, JCR, GraphQL, REST, API, Maven, dx-cli, node type,
  mixin, Groovy, Spring, annotation, bundle, registry, deployment, hot-deploy,
  environment, Docker, CI/CD, integration test, mock, fixture
- **Does NOT use / understand**: This persona understands all Jahia internals —
  the risk is **under-documented contracts**, not vocabulary confusion.

---

## Likely misunderstandings

- Assumes API behaviour is unchanged unless an explicit breaking-change notice exists
- Misses deprecation warnings that are only in release notes, not in code/tooling
- Expects that GraphQL schema changes are backwards-compatible unless stated otherwise
- Assumes a CI-green test suite means the module will work on the next Jahia version
- May not test persona-level UX impact of API changes (only tests programmatic correctness)

---

## Core tasks (for scenario generation)

| Task ID | Task description | Expected outcome |
|---------|-----------------|------------------|
| T1 | Consume a new or changed API endpoint | API contract is documented; request/response examples exist |
| T2 | Upgrade a module to work with a new platform version | Migration guide exists; breaking changes are explicit and actionable |
| T3 | Deploy a module to a Jahia instance | dx-cli or Maven tooling works without undocumented prerequisites |
| T4 | Query JCR or GraphQL for changed node types or schema | Schema changes are documented; backward-compatibility period is stated |
| T5 | Read debug logs to diagnose a failure | Logs are structured, readable, and reference the failing component clearly |
| T6 | Write integration tests against the Jahia API | Test harness / fixtures work against the new version without modification |

---

## Failure signals (unacceptable outcomes)

- API behaviour changed silently without a migration guide
- A previously working module deployment fails after a platform update with no clear error
- GraphQL schema changed without a deprecation cycle
- Log output is ambiguous about the root cause of an error
- The developer has to read source code to understand an API contract

---

## Success signals

- API changes are documented before they reach production
- Breaking changes include a migration path with code examples
- Deprecations are announced in tooling (not just release notes)
- Integration tests remain green across minor version upgrades

---

## Scenario evaluation hints

- Check for **explicit API migration guides** when contracts change
- Verify **schema changelog** is present for GraphQL / REST changes
- Assess whether **error messages include actionable resolution steps**
- Test that **dx-cli and Maven tooling** works for the updated feature without extra config
- Look for **deprecation annotations** in code as well as in release notes

---

## Change history

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial definition | QA Harness bootstrap |
