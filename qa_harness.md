

Description of the idea for a **two-harness model** or **jahia-harness with 2 different focus**:

- **Developer harness**  | developer-focus
  validates implementation correctness in the **code/system-internal** sense
  → compilation, unit/integration tests, static analysis, architecture constraints, code review, maybe generated tests

- **QA harness**  | qa-focus
  validates change correctness in the **product/system-external** sense
  → user intent, acceptance criteria, scenario coverage, persona-based UAT, regression risk, documentation, release confidence

That is a strong engineering idea, and in 2026 it is more mature than the buzzwords suggest — even if there are still not many papers using exactly your terminology.

---

# 1. The structure and the idea

The key insight is:

> A feature can be “correct” in code terms and still fail in product terms.

Examples:
- tests pass, but the user workflow is broken
- implementation matches ticket text but violates real user expectations
- edge cases for a non-technical user were never exercised
- docs are missing or misleading
- acceptance criteria are superficially addressed but not actually satisfied in realistic flows

So a QA harness is not a duplicate of the developer harness. It is a **different validation layer with a different unit of truth**.

---

# 2. The clean mental model

## Developer harness answers:
- Does the code work?
- Is the implementation internally sound?
- Are architecture constraints respected?
- Are automated tests green?
- Is the patch technically defensible?

## QA harness answers:
- Does the feature solve the user problem?
- Are the acceptance criteria truly satisfied?
- Is behavior acceptable across realistic personas and workflows?
- Is the feature understandable and documented?
- Is the change safe in application context?

This distinction is powerful because it prevents the common anti-pattern:
**“All tests passed, therefore we are done.”**

---

# 3. The QA harness could have 4 validation domains

## A. Acceptance criteria validation
This is the most direct layer.

The QA harness should take:
- issue / story / spec / PR description
- explicit acceptance criteria
- perhaps inferred quality expectations from surrounding docs

And then verify:
- each criterion is addressed
- criteria are validated in realistic flows, not only happy-path assertions
- ambiguous criteria are flagged
- partial compliance is separated from full compliance

### Practical output
A good QA harness should produce something like:
- criterion A: pass
- criterion B: partial pass
- criterion C: untestable from current evidence
- missing criterion coverage: X
- contradictions found: Y

---

## B. User acceptance testing via personas
This is probably the most distinctive part of your proposal.

Instead of asking only “did the UI/API behave as specified?”, the QA harness asks:
- how does this behave for a novice user?
- what about an expert user?
- what about a user under time pressure?
- what about a user with accessibility needs?
- what about a user with incomplete context?

This creates **application-context validation**, not just code-context validation.

### Persona-based UAT can validate:
- clarity of behavior
- discoverability
- expected workflow continuity
- failure handling
- confusing wording / UX mismatches
- documentation sufficiency
- whether the feature is actually usable

This is especially important because developer harnesses often optimize for technical success, not user comprehensibility.

---

## C. Test coverage review
Not test execution — **test adequacy review**.

That means your QA harness should inspect:
- what scenarios are covered by automated tests
- which acceptance criteria have no direct evidence
- whether edge cases are missing
- whether tests are too implementation-coupled
- whether end-to-end or workflow-level coverage is missing

This is a huge blind spot in many dev workflows:
the developer harness may generate lots of tests, but they can still be the wrong tests.

### QA-harness perspective on coverage
Coverage is not just:
- line coverage
- branch coverage

It is also:
- acceptance coverage
- scenario coverage
- persona coverage
- workflow coverage
- documentation coverage
- failure-mode coverage

That is exactly where a QA harness adds value.

---

## D. Documentation validation

A feature isn’t really done if:
- user-facing behavior changed and docs were not updated
- operational notes are missing
- support-facing guidance is missing
- new caveats or constraints are undocumented
- examples/screenshots/API docs are stale

The QA harness can check:
- what user-visible behavior changed
- what docs ought to change
- whether they did change
- whether release notes / migration notes are needed

This is often ignored by developer-focused harnesses.

---

# 4. Suggested architecture: a dedicated QA harness sitting above the developer harness

I’d recommend this flow:

## Input artifacts
The QA harness consumes:
- feature spec / issue / acceptance criteria
- implementation diff / PR summary
- automated test results from developer harness
- relevant docs and existing product context
- possibly UI states / screenshots / traces / logs

## QA harness stages

### Stage 1: Change understanding
Build a structured change model:
- what feature changed?
- what user-visible behavior changed?
- which workflows are touched?
- what assumptions does the implementation make?
- what parts of the app are affected?

### Stage 2: Acceptance mapping
Map:
- acceptance criteria
→ code changes
→ tests
→ observable user behavior

Find:
- covered criteria
- weakly evidenced criteria
- uncovered criteria
- criteria that require manual or persona validation

### Stage 3: Persona scenario generation
Generate or select scenarios for representative personas:
- primary persona
- secondary persona
- edge persona
- accessibility / high-risk persona
- support / admin persona if relevant

### Stage 4: Scenario execution / simulation
Use:
- staging environment
- UI automation
- API calls
- synthetic walkthroughs
- LLM-assisted scenario evaluation
- human review for selected high-risk cases

### Stage 5: Documentation review
Check whether:
- user docs
- release notes
- support docs
- developer docs
- admin docs

need updates and whether updates are sufficient.

### Stage 6: QA decision
Output:
- release confidence
- open risks
- missing evidence
- recommended manual follow-up
- acceptance verdict per criterion

---

# 5. What the QA harness should produce
I would make the output very explicit and structured.

For example:

## QA Harness Report
- **Feature intent**
- **User-visible changes**
- **Acceptance criteria status**
- **Persona scenario results**
- **Coverage adequacy review**
- **Documentation review**
- **Residual risks**
- **Release recommendation**

This is important because the QA harness is not just testing — it is creating **decision-quality evidence**.

---

# 6. What “persona-based UAT” should actually mean in engineering terms
To keep it rigorous, persona testing should not be fluffy roleplay.

A persona should be a test dimension with explicit attributes:

- domain knowledge level
- urgency / patience
- vocabulary level
- permission scope
- goal
- likely misunderstandings
- risk if misled

Example personas:
- first-time user
- power user
- support agent
- compliance-sensitive business user
- accessibility-constrained user
- admin with cross-feature workflow

Then for each persona:
- define core tasks
- define likely mistakes
- define expected success signals
- define unacceptable failures

This makes persona testing reproducible enough for a harness.

---

# 7. Where the current literature helps
There are not many strong papers saying exactly:
**“Build a QA harness to validate the output of a developer harness.”**

But the idea is supported by adjacent evidence from several directions:

## Strongly relevant source categories
### 1. Benchmark quality / evaluation methodology
Useful for making your QA harness rigorous:
- BetterBench:   https://arxiv.org/html/2411.12990v1

### 2. Deployment validation
Useful for the idea that offline/internal success is insufficient:
- Towards Reliable Agents: https://aclanthology.org/2025.naacl-industry.53.pdf

### 3. System-level agent evaluation
Useful for separating model success from workflow/system success:
- AI Agent Systems:
- AstaBench: https://allenai.org/blog/astabench

### 4. Engineering assurance mindset
Useful for your two-harness framing:
- Learning from other domains to advance AI evaluation and testing: https://www.microsoft.com/en-us/research/wp-content/uploads/2025/08/Learning-from-other-Domains-to-Advance-AI-Evaluation-and-Testing_-v3-1.pdf

### 5. Production evaluation practice
Useful for how to combine automated and human evaluation:
- Amazon article: https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/


---

# 8. The closest conceptual fit to the idea
The strongest underlying principle is:

> **Validation should be decomposed by concern and viewpoint.**

Your developer harness validates from the perspective of:
- code
- architecture
- correctness
- maintainability

Your QA harness validates from the perspective of:
- user
- workflow
- product intent
- release confidence

This is analogous to how mature engineering separates:
- unit verification
- system verification
- operational validation
- acceptance testing



---

# 9. Biggest design risks to avoid
If you build such a QA harness, watch out for these traps:

## A. Duplicating developer harness checks
Don’t spend QA harness energy re-linting or re-reviewing code unless it directly affects user-facing risk.

## B. Persona theater
If personas are too vague, the harness becomes storytelling instead of testing.

## C. Overtrusting LLM judges
LLM-based evaluation can help, but should not be the only basis for acceptance decisions.

## D. No explicit traceability
The harness must map:
- criterion → scenario → evidence → verdict

## E. No product context
The QA harness must understand existing workflows and neighboring features, otherwise it will validate in isolation.

---

# 10. What AI would recommend as a concrete minimal design
If you want this to be real and useful, start with this:

## Minimal QA harness v1
For every feature, require the QA harness to produce:

### 1. Acceptance criteria matrix
- criterion
- evidence found
- status
- confidence
- missing evidence

### 2. Test adequacy review
- what dev tests exist
- what user scenarios remain untested
- what edge cases are missing

### 3. Persona UAT pack
Use 3–5 personas max:
- primary user
- novice user
- edge/high-risk user
- admin/support persona if relevant

### 4. Documentation delta review
- which docs should change
- whether they changed
- what remains unclear

### 5. Release recommendation
- ready
- ready with known caveats
- not enough evidence
- not ready
