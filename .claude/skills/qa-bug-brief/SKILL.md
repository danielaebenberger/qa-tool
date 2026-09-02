---
name: qa-bug-brief
description: "Rewrite a verbose bug ticket — or draft a new one from a raw report — into a compact, accurate brief with a scannable 'At a glance' summary plus the standard bug structure, so a time-constrained QA/PO can judge relevance and priority in seconds."
kind: skill
pillar: test-case-identification
version: "1.0"
---

# Bug ticket brief

A companion to `/tldr` for two related cases: rewriting an existing
**bug ticket** that is too verbose, unclear, or padded with
implementation narrative, and drafting a **new** one from whatever a
reporter (service, support, QA) types in. Either way the goal is the
same — let a QA engineer or PO quickly judge real-world impact and set
priority/severity. Unlike `/tldr`, the output structure is **fixed**,
because the point here is to preserve (or establish) the ticket's own
shape while cutting the noise — not to pick whatever headers fit.

This brief has two readers with very different needs, and everything
below is built around that split:
- A **human** decides whether the fix is relevant and how urgent it is.
  They have limited time and switch between many tickets — the
  `At a glance` block and the four main sections exist for them, and
  must stay ruthlessly concise. No pamphlet-text: no filler, no restated
  points, no padding to sound thorough.
- Whoever **implements** the fix — possibly an AI — needs the deep
  technical detail: code/class references, exact mechanism, edge cases.
  That belongs in the trailing `More AI description` section, where
  density and length are fine.

## Inputs (ask if missing)

- A URL (GitHub issue, Jira ticket), pasted text (ticket body, Slack
  report, AI-drafted description) of an **existing** ticket to rewrite —
  or a reporter's raw, possibly-incomplete description of a bug they
  want **filed as a new ticket**. Prefer a link over a paraphrase when
  rewriting.
- For GitHub: fetch with `gh issue view <url> --json title,body,labels,comments,state`.
  If comments exist, fetch the whole thread — later comments often
  supersede the original report (repro narrowed down, workaround found,
  root cause identified). `state` (open/closed) grounds the `At a
  glance` Status bullet.
- If the fetch fails (404, no access), say so and ask for the text to be
  pasted instead. Never guess at content.
- **Creating a new ticket**: treat the reporter's message as the seed.
  There's no existing ticket to fall back on, so see "Never guess" below
  for how gaps are handled differently here — asking is the default, not
  the exception.

## What to do

Load [.github/instructions/qa-domain.instructions.md](../instructions/qa-domain.instructions.md).

Rewrite the source into **exactly these four sections, in this order,
using these headers verbatim**:

1. `### Environment and versions used`
2. `### Steps to reproduce`
3. `### Current behaviour`
4. `### Desired behaviour`

A section can legitimately be empty in the source — that's fine. Keep the
header anyway and write `_Not specified in source._` under it. Never
delete a header and never invent content to fill a gap; the whole point is
an accurate rewrite, not a fabricated one.

### At a glance (write this first)

Before the four sections, write a compact block, header `### At a
glance`, exactly three bullets, one sentence each:

- **Impact:** — the same real-world-consequence sentence required as
  Current behaviour's lead (see point 1 below) — reuse it verbatim here,
  don't paraphrase a second version; there should be one sentence, not
  two slightly different ones.
- **Status:** — confirmed root cause vs. unresolved; fixed/merged vs.
  still open, with a tracking issue if work split off elsewhere (e.g.
  "fix merged, follow-up tracked in #1482"). Ground this in the fetched
  `state` (open/closed) when available. For a brand-new ticket being
  drafted, this is usually just "root cause not yet investigated" —
  don't invent a status that hasn't happened yet.
- **Scope:** — which installs/versions/deployment types are actually
  affected, distilled from Environment — not the raw version list, the
  answer to "does this affect me."

Same rules as everywhere else: one clause per bullet, no em-dash-chained
facts, and `_Unclear from source: ..._` (or ask, per "Never guess" below)
rather than a confident-sounding guess. This block is the 10-second read
— if a bullet needs a second sentence to make sense, that sentence
belongs in the detailed section below, not here.

### Per-section rules

- **Environment and versions used** — product/module version(s), OS/
  browser, deployment topology, prerequisite config. Only what's actually
  needed to reproduce or to judge which installs are affected — not
  padding. See "Module versions and deployment type" below.
- **Steps to reproduce** — numbered, clear, and actionable. Keep exact
  values that appear in the source (versions, file sizes, entry counts,
  error codes, thresholds) — don't launder "4.94GB, 7,899 ZIP entries"
  into "a large file." Precision here is what makes a report
  reproducible; do not add steps the source doesn't imply. See
  "Real-world usage vs. engineered reproducer", "Reproduction steps vs.
  diagnostic/verification steps", and "Test/reproducer modules
  referenced in steps to reproduce" below.
- **Current behaviour** — ground abstract or placeholder terminology,
  then lead with the real-world consequence, the concrete observable
  symptom, and the confirmed-vs-unresolved status of any causal claim.
  See "Current behaviour: what to lead with" below.
- **Desired behaviour** — mirror Current behaviour's grounding, then
  lead with the real-world consequence of the fix and the concrete
  desired outcome. If the source states none, write `_Not specified in
  source._` for both. See "Desired behaviour: what to lead with" below.

### Module versions and deployment type

If the source mentions a real, independently-shipped Jahia **module**
that the affected environment actually runs (workflow, content editor,
a third-party or customer module — anything distinct from the Jahia
platform/core itself) — as opposed to a disposable module built purely
to isolate the bug (see "Test/reproducer modules" below, which is a
separate concern) — actively check whether both of these are stated,
since real modules version independently of the platform and can
behave differently across hosting models:

- **The module's own version** — not just the Jahia platform version.
- **The deployment type** — on-premise, Jahia Cloud, or another specific
  hosting model.

If either is missing:
- **Ask the user running this skill for it** before finalizing the
  brief — it can change which installs are actually affected, the same
  bar as other significant gaps under "Never guess" below.
- If they don't know, or the brief needs to ship without it, don't drop
  it silently: write it into "Environment and versions used" as an
  explicit gap — e.g. `_Module version: not specified — please
  confirm._` or `_Deployment type: not specified — please confirm._` —
  so the reader knows it was flagged, not overlooked.

### Real-world usage vs. engineered reproducer

Steps to reproduce should stay as close to **real environment usage** as
the source supports, while staying as easy to execute for a tester as
necessary — not the other way around. Before finalizing this section:

1. **Look at what the source's steps actually are.** Some tickets
   describe a real user/admin/editor action (browse a page, publish
   content, import an export). Others describe an engineered reproducer:
   a custom test module, a JSP built to intentionally throw, direct calls
   to internal render/API endpoints — built to isolate the bug, not to
   represent how anyone actually uses the product.
2. **If it's an engineered reproducer, check whether the source itself
   also describes (or implies) the real-world scenario it stands in for**
   (a production incident narrative, a customer workflow, an on-premise
   import from Cloud, etc.). If so, lead the section with that plain,
   real-usage framing, so a QA/PO reader sees this in terms of what
   actually happens in the field — not only as an artificial repro rig.
3. **Never silently substitute your own guess at a "more natural" path**
   for the ticket's own steps. If you think a more user-like way to
   trigger the same bug might exist beyond what the source states, name
   it explicitly and **ask the user running this skill to confirm it
   still matches the intended scenario** before treating it as
   equivalent — swapping in an unconfirmed simplification risks changing
   what's actually being tested.
4. **Whatever framing is used, if the source supplies commands, code, or
   a module needed to reliably reproduce the issue, keep them** — see
   "Commands, code, and config are copied verbatim" and "Test/reproducer
   modules" below. A provided module/definition or exact command set
   makes re-testing far easier; don't drop it in favor of a paraphrased
   description that looks simpler but is actually harder to execute
   precisely.

### Reproduction steps vs. diagnostic/verification steps

Sources often list, as numbered steps, actions that aren't actually
needed to *reproduce* the symptom — they're how the reporter *confirmed
why* it happens. A step belongs in "Steps to reproduce" only if doing it
produces or reveals the reported symptom itself (an error, a slow/failed
operation, wrong output a tester would see). A step that instead compares
internal data layouts, analyzes file/memory ordering, or monitors
internals for root-cause evidence is a **diagnostic/verification
technique**, not a reproduction step — move it to "More AI description"
(e.g. under "How this was diagnosed/measured"), even when the source
numbers it alongside the real repro actions. This matters most when the
diagnostic step is vague about method (no concrete tool/command given,
just "compare X against Y") — leaving it in Steps to reproduce as if a
tester could just follow it makes the section harder to execute, not
easier. Don't silently drop it, though: relocate it with attribution,
since it's still useful supporting evidence for engineers reviewing the
brief.

**Commands, code, and config are copied verbatim — never paraphrased,
truncated, or merged**, whenever they're part of the steps (whether as
the primary path or alongside a real-usage framing from point 2 above).
Any curl call, shell command, code snippet, or config block the source
gives must be reproduced in full, in its own fenced code block with the
source's language if given (`bash`, `properties`, `cnd`, `jsp`, …), exactly
as written:
- Never shorten a URL/command with `...` or "similar" — a QA engineer
  needs to copy-paste it as-is, including hostnames, ports, paths, and
  query params.
- Never collapse several near-identical commands (e.g. three curl calls
  differing only by a query param) into one example — reproduce each
  one; the repetition is not padding, it's what makes the step copy-paste
  ready.
- Never inline a source's fenced config block into backticked prose —
  keep it as its own fenced block so it can be pasted straight into a
  config file.
- The "Writing style" rules further below (one idea per sentence, no
  em-dash-chained facts) govern explanatory prose only. They never apply
  to code/command/config blocks — those are quoted, not written.

### Test/reproducer modules referenced in steps to reproduce

A step like "deploy this module" or "deploy the reproducer module" is
unusable to whoever reads the brief unless they actually have that
module. Handle it explicitly, in this order:

1. **If the source itself includes enough to reconstruct the module**
   (CND, view/properties files, JSP or code snippets) — keep that
   definition attached to the step, inline, as code blocks. Don't move it
   to "More AI description" as if it were optional detail: without it,
   the step can't be executed, so it belongs in "Steps to reproduce"
   itself.
2. **If the source references a module/reproducer by name or behavior
   but doesn't include enough to reconstruct it**, don't silently assume
   the reader has it and don't invent a plausible-looking substitute.
   Ask the user running this skill whether they can provide the module
   (its source, a repo link, an attached artifact).
3. **If it turns out not to be available** (the user says no, or the
   brief needs to ship before they can check), mark the step clearly:
   append `_(test module is missing)_` right after that step, so it's
   obvious at a glance which step can't be reproduced from the brief
   alone.

Never paraphrase around this gap or quietly drop the step — a missing
repro module is itself information a QA engineer needs before spending
time on the ticket.

### Current behaviour: what to lead with

Ground abstract or placeholder terminology first, then cover these,
in order:

0. **If the source's own steps use placeholder/synthetic naming**
   (`optionA`/`optionB`, `repro:fooField`, `GenericType`, or similar
   names invented purely to isolate the bug), don't restate those
   names in your lead sentence — a reader can't picture "boundOption"
   or "j:bindedComponent." First state the general, familiar
   mechanism or feature being exercised, in terms anyone who's used a
   CMS/admin form would recognize (e.g. "a Type dropdown is supposed
   to show only the fields relevant to whichever type you pick").
   Only after that do the placeholder names from the source. If a
   small concrete example would make the mechanism click (e.g. "such
   as a video-URL field only appearing once 'Video' is chosen"), you
   may add one — but mark it explicitly as an example ("for example…",
   "illustratively…"), never presented as the literal reported
   scenario unless the source actually describes one. This keeps the
   lead honest (nothing invented is stated as fact) while making the
   bug map to something the reader has actually seen.
1. **Lead with the real-world consequence**, as its own first sentence,
   in plain language a non-engineer would understand: what does an
   actual site visitor, editor, or admin experience because of this
   bug? State the worst realistic consequence the source actually
   supports (e.g. "one broken page can eventually make the whole site
   stop serving pages to visitors"), not the narrow technical event
   (an exception name, an internal resource name). This sentence is
   what lets a PO set severity — don't bury it in "More AI
   description" or skip it because the source itself never states it
   in these terms; infer it from the mechanism described, but don't
   invent a consequence the source doesn't support.
2. Then the concrete observable symptom a tester would see when
   reproducing it (status codes, counts, what fails and when).
3. **State the assessed likelihood of any causal or diagnostic claim,
   explicitly**, whenever the source lets you tell confirmed apart
   from unresolved. If the source says a mechanism was verified by
   direct evidence (e.g. thread-dump analysis ruling out an
   alternative explanation, logs, a reproducible test), say it's
   confirmed. If the source explicitly says a cause, trigger, or
   mechanism was not identified or not proven, carry that qualifier
   into the brief in plain terms — don't let it evaporate into a
   flat, confident-sounding sentence. A short explicit line — e.g.
   "Confirmed: the capacity was genuinely lost, not legitimately held
   (verified by thread-dump analysis). Not proven: what originally
   caused the first slot to be lost." — is preferred over blending
   the two into one narrative. Never state a suspected/unresolved
   cause with the same confidence as a proven one.

Avoid internal-only vocabulary in this section — internal resource/
permit names, exception class names, thread/queue terminology. Say "a
slot of the server's page-rendering capacity" rather than "a
module-generation permit"; the literal internal names still belong in
"More AI description" for engineers. Push deep root-cause narrative
(class/method names, internal call chains, algorithmic explanation) to
"More AI description" entirely.

### Desired behaviour: what to lead with

Ground abstract or placeholder terminology first (same as Current
behaviour's point 0 above), then cover these two, mirroring Current
behaviour:

0. **If Current behaviour needed grounding, mirror it here too** —
   don't let the fixed-state description revert to the source's raw
   placeholder names as its lead. Describe the fixed behavior in terms
   of the same familiar mechanism/example used in Current behaviour
   (e.g. "the video-URL field should only appear once 'Video' is
   chosen" rather than restarting from `j:bindedComponent`), so the
   before/after reads as one continuous story a reader can follow
   without re-decoding identifiers.
1. **Lead with the real-world consequence of the fix**, as its own
   first sentence, in plain language: what would an actual site
   visitor, editor, or admin experience once this is fixed, that they
   don't get today? Only state this if the source (or the mechanism
   described in Current behaviour) solidly supports it — see "Never
   guess" below if it doesn't.
2. Then the concrete technical desired behaviour, per the source (what
   the system/code should do instead).

If the source doesn't state a desired behaviour at all, write
`_Not specified in source._` for both parts. You may propose one, but
only inside "More AI description," clearly marked as inferred, not
stated as fact.

### Never guess — ask, or mark it unknown

The lead-with-consequence sentences in Current behaviour and Desired
behaviour are the most tempting places to smooth over a gap with a
plausible-sounding invention. Don't. If the real-world consequence, a
repro detail, an environment fact, or the desired outcome isn't clearly
stated or clearly implied by the source's own mechanism:

- If the gap is significant enough that guessing wrong would change the
  read (e.g. it would change the apparent severity, or change what a
  tester would need to do to reproduce it), **stop and ask the user**
  before finalizing that section, instead of filling it in.
- If it's a smaller gap that doesn't block finalizing the brief, mark it
  inline as `_Unclear from source: <what's missing>_` rather than writing
  a confident-sounding guess.

An inference is only acceptable when it's a direct, low-risk restatement
of a mechanism the source already fully describes (e.g. "permits run out
→ other pages fail" is a direct restatement, not a guess). Anything less
certain than that gets a question or an explicit "unclear" marker — never
a smoothed-over sentence that reads as fact.

### Rewriting an existing ticket vs. creating a new one

The escalate-only-for-significant-gaps rule above is calibrated for
**rewriting** — the source ticket already exists, so a smaller gap can
just be marked unclear without slowing anything down.

When there's no existing ticket — a reporter is typing a description so
one can be **created** — flip the default: ask for whatever's needed to
fill Environment, Steps to reproduce, Current behaviour, and Desired
behaviour, not just the severity-changing gaps. There's no cost to
asking now, before the ticket is filed, and a ticket that ships full of
`_Unclear from source_` markers that could've been answered in the same
conversation wastes the next reader's time more than one well-placed
question would have. Still don't interrogate for things that don't
change the read (e.g. don't ask for a stack trace on a cosmetic CSS
bug). Whatever the reporter genuinely doesn't know after being asked
still gets marked `_Not specified — please confirm._`, never guessed.

### Economy — cut restatement, don't just shorten sentences

"One idea per sentence" (below) controls sentence-level density, but it's
not license to say the same idea twice in different words. Total length
is what the reader feels, not just per-sentence clarity — a section made
of five short, clear sentences that all make the same point is still too
long. Before finalizing Current/Desired behaviour in particular:
- If a grounding example (per point 0 above) makes the mechanism click,
  use **one** example, not two parallel ones (e.g. "Video" is enough;
  don't also add "Image" to say the same thing twice).
- Cut a clause that only restates the previous one in different words
  (e.g. "no matter what's picked" and "even before anything is picked at
  all" are the same claim — keep whichever is clearer, drop the other).
- After drafting a section, reread it once specifically hunting for a
  sentence that could be deleted without losing information. Delete it.

### Writing style for the four main sections

One idea per sentence. If a sentence needs an em dash, semicolon, or
"and"/"with" to bolt a second (or third) fact onto the main claim, split it
— a run-on reads as technical, not clear, even when every fact in it is
accurate.

Bad (real example — one sentence carrying a condition, a mechanism, and
two data points at once):
> Each failed render of a fragment with skip.aggregation=true permanently
> leaks one module-generation permit — locally, 2 permits are gone after 2
> failed renders, and the 3rd request then gets HTTP 503.

Good (same facts, one claim per sentence/bullet, numbers pulled out of the
prose):
> Each failed render leaks one permit that never gets released.
> Locally, with a limit of 2: two failed renders exhaust both permits, and
> the third request fails outright with HTTP 503.

Concretely:
- Lead with the plain-English observable fact as its own short sentence.
  A technical qualifier (a config flag, an internal condition) can follow
  in a second sentence or a parenthetical — never stacked into the same
  clause as the main claim.
- When a claim is backed by multiple concrete data points (before/after
  counts, a sequence of request outcomes, repeated measurements), pull
  them out of the sentence into a short list, or at minimum give them
  their own sentence — don't chain them onto the claim with a dash.
- Prefer short declarative sentences. If re-reading a sentence takes a
  second pass to find the subject, split it.
- Test: each sentence in these four sections should be readable in one
  breath. If it isn't, that sentence is a candidate for "More AI
  description" instead, or needs splitting.

## More AI description (optional trailing section)

This section's reader is whoever implements the fix — possibly an AI,
per the audience split at the top of this doc — not the time-constrained
human deciding relevance. Technical density and length are fine here in
a way they aren't above.

Anything that's genuinely useful but not needed for a first read goes
under a trailing `### More AI description` section: root-cause mechanism,
code/class references, measured statistics beyond the minimal repro
numbers, related docs, workaround notes. Omit this section entirely if
nothing survives the trim — don't force an empty one.

Two things are worth actively digging for here, same as `/tldr`:

- **Real user impact** — concrete, not the ticket's own abstract framing.
  A `customer` label on a Jahia issue means a linked customer-support
  ticket holds the actual use case, in an external system this repo can't
  access — say that explicitly rather than treating the label as impact
  evidence itself, and suggest checking the linked ticket if impact
  matters for the priority call.
- **Intended use vs. workaround** — flag if this looks like a workaround
  for unsupported usage rather than a genuine defect in supported usage;
  this is often the actual crux of severity.

## Also fix the title

If the ticket title is unclear, buries the observable symptom behind an
internal cause, or is otherwise not something a PO could triage from the
subject line alone, propose a replacement as the very first line:

`Suggested title: <plain, symptom-first title>` — followed by `(original:
"<the source title>")` so the change is traceable, not silent.

When creating a new ticket from scratch, there's no original to compare
against — just propose the title the same way, without the `(original:
...)` suffix.

## Output rules

- **Default output is a single fenced markdown code block** (` ```markdown `
  … ` ``` `) containing the rewritten body — `At a glance`, the four
  sections, and the optional "More AI description" — exactly as it should
  read if pasted into the ticket's description field, whether filing a
  new ticket or updating an existing one, headers and all. No file, no
  artefact. Put `Suggested title: …` (if any) as a plain line above the
  block, since a ticket's title field is separate from its body. This is
  the default for every run, not something to be asked for.
- Two acceptance tests, one per audience: `At a glance` must be readable
  in about 10 seconds — can the human reader judge relevance and urgency
  from those three bullets alone. The four main sections must be readable
  well under a minute — can a QA/PO reader set priority and severity from
  them alone, without needing "More AI description."
- Never compress away exact reproduction values — that's the one place
  this differs from `/tldr`'s looser, adaptive digest.
- Say what's unclear or contradictory instead of smoothing it into a
  confident-sounding narrative.
- If the source is AI-drafted, watch for filler and unsupported claims
  dressed up as facts; call these out rather than repeating them at face
  value.
- If a real QA need surfaces (a missing repro case, a needed regression
  test), hand off to `/define-testcases` or the `test-case-design` skill —
  don't do that work here.
