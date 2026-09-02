# Persona: Platform Admin

> **Slug**: `admin`
> **Jahia context**: Manages Jahia system configuration, user provisioning, permissions,
> site creation, module lifecycle, and operational health. Works across all sites and
> all modules. Often the first responder to operational issues.

---

## Identity

| Attribute           | Value |
|---------------------|-------|
| **Role**            | Platform Administrator / System Administrator |
| **Experience**      | Expert with Jahia (all modules, all sites, system-level) |
| **Technical level** | Low-code to technical (config files, admin UI, some CLI usage) |
| **Permission scope**| Superadmin — full access across all sites, modules, and system settings |
| **Urgency**         | Variable (routine tasks are low urgency; incidents are critical) |
| **Risk level**      | Very high — misconfiguration affects all users and all sites simultaneously |

---

## Goals

1. Manage users, roles, and permissions accurately and at scale
2. Install, update, and deactivate modules safely without downtime
3. Monitor system health and respond to operational alerts
4. Configure site-level and system-level settings reliably
5. Understand the blast radius of a platform update before applying it

---

## Vocabulary

- **Uses**: permissions, roles, groups, site, module, bundle, health check, cache,
  reindex, backup, restore, cluster, provisioning, LDAP, SAML, SSO, audit log,
  maintenance mode, JVM, heap, thread dump, log level
- **Does NOT use / understand**: Expects full control but may not read developer-level
  API docs — prefers operational runbooks and admin UI over code-level documentation.

---

## Likely misunderstandings

- May apply a system-wide config change without realising it affects all sites
- Assumes a module update is safe if it installs without error (ignores runtime regressions)
- May conflate "user deactivated" with "user deleted" in permission management
- Expects that cache clearing is safe at any time without service impact
- May not realise that a UI permission change has a corresponding API permission that was not updated

---

## Core tasks (for scenario generation)

| Task ID | Task description | Expected outcome |
|---------|-----------------|------------------|
| T1 | Install or update a module via the admin console | Clear success/failure status; no partial installs; rollback option if available |
| T2 | Create a new site with baseline configuration | Site wizard is complete; no hidden dependencies on manual steps |
| T3 | Assign roles and permissions to a user or group | Permission model is clear; changes take effect predictably |
| T4 | Clear cache after a content or config update | Cache clear is targeted or system-wide as expected; no unintended side effects |
| T5 | Review audit logs for a change that caused an issue | Logs are traceable to user, action, timestamp, and affected resource |
| T6 | Apply a platform update in a production-like environment | Update checklist exists; rollback path is documented; health checks confirm success |

---

## Failure signals (unacceptable outcomes)

- A module update succeeds silently but causes a runtime regression with no log entry
- Permission changes take effect immediately without a confirmation step for high-impact actions
- Cache operations produce inconsistent state that is not surfaced in the UI
- An admin action is irreversible without warning (e.g., permanent user deletion)
- Audit logs are missing entries for actions that should be traceable

---

## Success signals

- Every admin action has a visible, logged outcome
- Destructive or high-impact actions require explicit confirmation
- Module lifecycle operations are atomic (all-or-nothing, with clear status)
- Platform update documentation is complete enough for a runbook

---

## Scenario evaluation hints

- Check for **confirmation prompts** on any destructive action (delete, disable, clear)
- Verify **audit trail completeness** — every system change should be logged with actor and timestamp
- Test **module update rollback** path — is it documented and does it work?
- Assess whether **health checks** reflect the true post-update state
- Look for **blast-radius warnings** when a change affects multiple sites or all users

---

## Change history

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial definition | QA Harness bootstrap |
