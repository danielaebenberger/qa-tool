# Persona: Compliance & Governance User

> **Slug**: `compliance-user`
> **Jahia context**: Responsible for data governance, privacy compliance (GDPR, CCPA),
> accessibility (WCAG), and audit/reporting requirements. Interacts with Jahia to
> verify policy adherence, review audit logs, and ensure content governance rules are met.
> Often a cross-functional stakeholder (Legal, DPO, Accessibility Lead, Risk Officer).

---

## Identity

| Attribute           | Value |
|---------------------|-------|
| **Role**            | Data Protection Officer / Compliance Officer / Accessibility Lead |
| **Experience**      | Low to intermediate with Jahia (uses reports, audits, governance features) |
| **Technical level** | Non-technical (report consumers, not feature builders) |
| **Permission scope**| Read-only audit access + governance settings (limited write) |
| **Urgency**         | Low for routine reviews; critical during audits or incidents |
| **Risk level**      | Very high — non-compliance has regulatory, legal, and reputational consequences |

---

## Goals

1. Verify that personal data handling complies with GDPR / CCPA obligations
2. Confirm that content and features meet accessibility standards (WCAG 2.1 / 2.2)
3. Review audit trails to verify who changed what and when
4. Ensure data retention and deletion policies are enforced by the platform
5. Produce evidence for external audits without needing developer assistance

---

## Vocabulary

- **Uses**: data subject, consent, retention, deletion, audit log, GDPR, CCPA,
  personal data, access request, data export, WCAG, ARIA, screen reader,
  report, evidence, policy, role-based access, least privilege
- **Does NOT use / understand**: technical implementation details — evaluates
  **outcomes and evidence**, not code or architecture

---

## Likely misunderstandings

- Assumes "deleted in the UI" means fully purged from the system (may still exist in JCR history)
- Conflates "anonymised" with "deleted" in data subject requests
- Does not know which platform changes require a Data Protection Impact Assessment (DPIA)
- Assumes accessibility is only a front-end concern, missing server-generated content
- May not realise that audit logs have a retention period that itself needs governance

---

## Core tasks (for scenario generation)

| Task ID | Task description | Expected outcome |
|---------|-----------------|------------------|
| T1 | Export personal data for a data subject access request | Export is complete, machine-readable, and covers all data stores |
| T2 | Delete / anonymise personal data on request | Deletion is verifiable; confirmation exists; JCR history is considered |
| T3 | Review audit log for a content or user change | Log is filterable by user, date, action, and resource type |
| T4 | Verify consent management settings for a site | Consent configuration is accessible and auditable without developer help |
| T5 | Check that a new feature's UI meets WCAG 2.1 AA | Keyboard navigation, contrast ratios, ARIA labels, screen-reader output are correct |
| T6 | Produce a compliance report for an external auditor | Exports and reports are complete, dated, and require no manual data assembly |

---

## Failure signals (unacceptable outcomes)

- Data deletion confirmation exists in the UI but data persists in JCR history silently
- Audit log has gaps — user actions are untraced
- A new UI feature is inaccessible via keyboard or screen reader
- Personal data export is incomplete or inconsistently formatted
- Compliance settings require developer intervention to configure or verify

---

## Success signals

- Data subject requests can be completed end-to-end by a non-technical user
- Every significant platform action is auditable with clear evidence
- New features meet WCAG 2.1 AA without additional remediation
- Compliance workflows are self-contained in the platform, not dependent on workarounds

---

## Scenario evaluation hints

- Check for **data completeness** in export / deletion flows — not just UI confirmation
- Verify **audit log coverage**: does every relevant action leave a traceable record?
- Test **keyboard-only navigation** for any new UI introduced by the feature
- Assess **colour contrast and ARIA labelling** for all interactive elements
- Look for **consent gate correctness** — does the feature respect user consent state?
- Confirm **data retention settings** are visible and configurable without code access

---

## Change history

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial definition | QA Harness bootstrap |
