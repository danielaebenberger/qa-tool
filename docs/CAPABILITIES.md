<!-- GENERATED FILE — do not hand-edit. Run `pnpm capabilities:generate` after adding or changing a skill, agent, or sensor. -->

# qa-tool capability catalog

## Pillar 2 — Feature Validation

| Name | Kind | Description | Version | See also |
|---|---|---|---|---|
| `qa-ac-validate` | skill | > | 1.0 | qa-define-testcases, qa-coverage-map |
| `qa-coverage-map` | skill | Build a coverage map for one Jahia repository — a per-area view, not a single coverage number. | 1.0 | qa-cypress-analyze, qa-ac-validate |
| `qa-cypress-analyze` | skill | > | 1.0 | qa-coverage-map |
| `qa-doc-review` | skill | > | 1.0 | — |
| `qa-persona-uat` | skill | > | 1.0 | — |
| `qa-report` | skill | > | 1.0 | — |
| `qa-run` | skill | > | 1.0 | — |
| `qa-sensor-ac-validator` | sensor | Scans a Cypress test suite and produces a structured evidence inventory used by qa-ac-validate's VALIDATION mode. | 1.0 | — |
| `qa-sensor-cypress-analyzer` | sensor | Analyses a Cypress suite for test adequacy — scenario, assertion, persona, multilingual, and error-path coverage plus structural smells. Exits non-zero if .only is present, gating CI. | 1.0 | — |
| `qa-sensor-doc-reviewer` | sensor | Scans local docs (README/CHANGELOG/MIGRATION) and declared remote sources for terms extracted from a diff, flagging stale or auth-gated documentation. | 1.0 | — |

## Pillar 3 — Test-Case Identification

| Name | Kind | Description | Version | See also |
|---|---|---|---|---|
| `qa-bug-brief` | skill | Rewrite a verbose bug ticket — or draft a new one from a raw report — into a compact, accurate brief with a scannable 'At a glance' summary plus the standard bug structure, so a time-constrained QA/PO can judge relevance and priority in seconds. | 1.0 | — |
| `qa-define-testcases` | skill | Help a QA engineer identify, draft, and challenge test cases for a Jahia story or bug ticket. Use during refinement or the test phase of a ticket. | 1.0 | qa-test-case-design |
| `qa-test-case-design` | skill | Multi-step workflow for designing a coherent set of test cases for a Jahia feature: risk storming → case generation → trace matrix → review checklist. Use when a QA engineer needs more than a one-shot list, or when qa-define-testcases needs to be expanded into a deeper artefact set. | 1.0 | qa-define-testcases |
| `qa-tldr` | skill | Digest a verbose GitHub issue/PR, Jira ticket, or AI-generated description into a fast, practical summary before deciding what QA work it actually needs. | 1.0 | — |

## Harness Engineering

| Name | Kind | Description | Version | See also |
|---|---|---|---|---|
| `qa-dashboard-widget` | skill | End-to-end workflow for adding a new widget to the qa-tool dashboard: data source → typed contract → component → tests → wiring. Use when implementing a new metric, stability indicator, or motivation surface inside qa-tool/src/dashboard/. | 1.0 | — |
| `qa-pr-test-reviewer` | agent | Read-only subagent that reviews test PRs across any Jahia repo for coverage fit, convention fit, and cross-repo idiom consistency. | 1.0 | — |
| `qa-self-reviewer` | agent | Read-only subagent that reviews changes to qa-tool itself against the five pillar goals and CLAUDE.md's hard constraints. | 1.0 | — |
