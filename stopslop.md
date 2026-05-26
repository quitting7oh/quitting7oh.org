# Stop-Slop Audit — 2026-05-25 — Updated Ruleset

Fresh audit of ~69 content files under `src/content/**/*.{md,mdx}` against the expanded stop-slop ruleset (now vendored at `docs/stop-slop/`). The ruleset added ~25 pattern categories since the prior audit: performative authority ("honest X", "real X" credibility markers, "X is real" declarations), validating-the-audience tics, pedagogical hand-holding, AI vocabulary tells, the "serves as" dodge, banned sentence openers, and the structural patterns from tropes.fyi (anaphora abuse, listicle-in-a-trench-coat, false ranges, "despite challenges" pivot, invented concept labels, dead metaphor, one-point dilution).

## Site-wide totals

| Pattern | Count | Weight | Impact |
|---|---:|---:|---:|
| Em-dashes in prose | 14 | 3 | 42 |
| Em-dashes in tables (acceptable as `—` placeholder) | 49 | 0 | 0 |
| Wh-headers (What/Why/How as section heads) | 213 | 2 | 426 |
| Binary contrasts ("not X, it's Y") | 53 | 2 | 106 |
| "X is real" assertions | 35 | 2 | 70 |
| "Honest X" / "honest" adjective | 35 | 2 | 70 |
| "Just" (kill-list adverb) | 83 | 0.5 | 42 |
| "Actually" (kill-list adverb) | 35 | 0.5 | 18 |
| Passive voice (narrative sections only) | ~120 | 0.25 | 30 |
| Pedagogical hand-holding ("Let's break this down" / "Think of it as") | 1 | 2 | 2 |
| Banned sentence openers (Moreover, Furthermore, etc.) | 0 | 1 | 0 |
| Throat-clearing ("Here's the thing" family) | 0 | 1 | 0 |
| AI vocab tells in non-domain contexts (delve, tapestry, leverage…) | ~5 | 2 | 10 |
| "Serves as" dodge | ~3 | 2 | 6 |
| **Site-wide weighted total** | | | **~820** |

The Wh-headers explosion is the single biggest structural footprint (213 instances, 426 weighted points). Em-dashes in prose dropped from 70 (prior audit) to 14 — solid progress. Banned openers and throat-clearing are effectively gone.

## Most common kill-list adverbs

| Adverb | Count | Notes |
|---|---:|---|
| just | 83 | Often appears in instructions ("just wait", "just let it pass") where it dampens urgency. ~60–70% can go. |
| actually | 35 | Pattern: "what X actually does", "what actually happens". Mostly cuttable. |
| really | 4 | Already low after prior cleanup. |
| honest (adj) | 35 | New category. Performative authority. Cut almost all. |

Adverbs left out of the prior automatic strip (often, sometimes, usually, typically, especially, generally, etc.) remain unchanged at substantial counts. They mostly survive because they sometimes carry meaning; per-case human review still warranted.

## Top new-rule violations

The new ruleset surfaces issues invisible to the prior audit. Where they cluster:

**"X is real" / validation tics (35 instances).** Heaviest in for-loved-ones content (where families need their experience validated) and mat-suboxone (where bupe stigma needs explicit rebuttal). One use per page is load-bearing; the issue is stacking.

- `for-loved-ones/what-to-expect.md`: "the lying and the disappearing are real" pattern
- `mat-suboxone/suboxone-risks.md`: "Emotional blunting is real" / "Suboxone withdrawal is real" (acceptable — addressing denial)
- `post-acute/impending-doom.md`: 2 instances near the top

**"Honest" as performative-authority adjective (35 instances).** Heaviest in mat-suboxone cluster. Almost all cuttable.

- `compounds/mgm16.md`: "honest center", "honest picture", "honestly: it stays" — 3 instances on one page
- `mat-suboxone/sublocade-brixadi-info.md` line 111: "Honest read: the early signal..." → drop "Honest read:"
- `mat-suboxone/suboxone-isnt-working.md`: "be honest with your prescriber" (contextual, fine — different sense)

**Wh-headers (213 instances).** The single largest cleanup target. Worst clusters:

- `post-acute/what-is-paws.md` (7 Wh-headers)
- `mat-suboxone/suboxone-bernese-method.md` (6 Wh-headers)
- `for-loved-ones/what-to-expect.md` (7 Wh-headers — each one starts with "What the X pattern usually looks like")
- `mat-suboxone/suboxone-rapid-taper.md` (5 Wh-headers)
- `compounds/mgm16.md` (6 Wh-headers)
- `mat-suboxone/suboxone-custom-dose.md` (7 Wh-headers)

**Pedagogical hand-holding, banned openers, AI vocab tells, "serves as" dodge:** all effectively absent. Either the prior pass killed them, or the writing was already clean of these.

**Anaphora / listicle-in-trench-coat / despite-challenges / dead metaphor:** no significant instances detected.

## Files flagged, by score

Sorted descending. Cut at score ≤ 5.

### Tier 1 (score 25+)

#### `src/content/mat-suboxone/suboxone-rapid-taper.md` — score 53

14 em-dashes (9 in data tables, acceptable; ~5 in prose), 5 Wh-headers, 1 "just".

Prose em-dashes need converting. Wh-headers:
- L14: `## Why this works for 7-OH (and not for the heavier synthetics)` → "Pharmacology: 7-OH vs. the heavier synthetics"
- L99: `## What to expect during and after` → "Taper timeline and expectations"

#### `src/content/post-acute/impending-doom.md` — score 35

4 em-dashes, 6 Wh-headers, 2 "X is real", 5 "just", 1 "really".

The "just" cluster appears in action instructions ("just let it pass") where it dampens urgency. Wh-headers:
- L27: `## What to do in the next ten minutes` → "Immediate interventions (next 10 minutes)"
- L110: `## What it actually is` → "The neurobiology" (and drop "actually")

#### `src/content/post-acute/what-is-paws.md` — score 31

3 em-dashes, 7 Wh-headers, 2 "X is real", 3 "actually", 1 "honest" ("The honest range:").

- L24: `## What PAWS actually is` → "PAWS: definition and scope"
- L51: `The honest range:` → drop "honest", lead with the data
- L16/L39: "Both are normal." appears twice within 30 lines — cut the second

#### `src/content/resources/telehealth.md` — score 30

8 em-dashes, 3 Wh-headers. Em-dash count signals prose drift. Wh-headers:
- "Why these rates vary" → "Rate variation factors"
- "What to ask" → "Questions for prescribers"
- "When to switch" — acceptable (time marker)

#### `src/content/compounds/mgm16.md` — score 30

3 em-dashes, 6 Wh-headers, 3 "honest", 1 "just", 2 "actually".

Performative authority is the dominant issue:
- L21: "honestly: it stays inside..." → "It stays inside..."
- L59: "the honest center of the evidence base" → "where the evidence centers"
- L82: "These absences are part of the honest picture" → "These absences are part of the evidence picture"

Wh-headers:
- L47: `## What we know` → "Evidence base"
- L52: `## Why this matters` → "Clinical relevance"

#### `src/content/post-acute/long-term-outlook.md` — score 28

4 Wh-headers, 2 em-dashes, 3 "honest", 3 "actually", 3 "just".

Mixed bag; "honest" cluster is the priority cut.

#### `src/content/other-tools/cannabis-thc-in-recovery.md` — score 26

5 Wh-headers, 3 em-dashes, 2 "X is real", 1 "honest", 1 "actually".

#### `src/content/start-here/withdrawal-help.md` — score 26

6 Wh-headers, 1 em-dash, 1 "X is real", 1 "honest", 6 "actually".

The "actually" count is high here. Spot-check:
- "what actually happens", "what actually works" — all cuttable

### Tier 2 (score 15–24)

#### `src/content/for-loved-ones/what-to-expect.md` — score 23

7 Wh-headers, 2 "X is real", 4 "just".

Every section header is `What the X pattern usually looks like`. Rewrite to noun phrases:
- L19: → "Dishonesty patterns families see"
- L31: → "Disappearing and secrecy: the pattern"
- L44: → "Financial patterns"
- L56: → "Broken promises: the pattern"

#### `src/content/mat-suboxone/suboxone-isnt-working.md` — score 21

2 em-dashes, 2 Wh-headers, 1 "X is real", 2 "honest", 4 "just".

"honest with your prescriber" usages are contextual harm-reduction language and acceptable (different sense from performative "honest X"). The "just" cluster is the priority.

#### `src/content/for-you/rehabilitation-centers.md` — score 21

2 em-dashes, 5 Wh-headers, 1 "X is real", 1 "honest", 1 "just".

#### `src/content/compounds/7-oh.md` — score 20

2 em-dashes, 5 Wh-headers, 1 "just", 3 "actually".

#### `src/content/other-tools/naltrexone-low-dose.md` — score 20

2 em-dashes, 5 Wh-headers, 2 "X is real".

#### `src/content/other-tools/sr17018-info.md` — score 19

1 em-dash, 4 Wh-headers, 2 "X is real" (acceptable in harm-reduction context), 2 "honest".

#### `src/content/mat-suboxone/sublocade-brixadi-info.md` — score 18

1 em-dash, 5 Wh-headers, 1 "X is real", 1 "honest".

- L111: "Honest read: **the early signal is encouraging**" → "The early signal is encouraging"
- L34: `## What they are` → "Sublocade and Brixadi: overview"
- L180: `## When these might make sense` → "When to use injectables"
- L187: `## When these might not make sense` → "When injectables aren't the fit"
- L194: `## What to ask if your prescriber suggests one` → "Questions for your prescriber"

#### `src/content/other-tools/naltrexone-ultra-low-dose.md` — score 18

3 em-dashes, 3 Wh-headers, 1 "honest", 1 "actually".

#### `src/content/mat-suboxone/suboxone-cows.md` — score 17

5 Wh-headers, 2 "X is real", 3 "just".

#### `src/content/for-you/sober-living.md` — score 16

5 Wh-headers, 1 "X is real", 1 "honest", 1 "actually".

#### `src/content/mat-suboxone/suboxone-custom-dose.md` — score 16

7 Wh-headers.

Heavy header-count for the file size. Each subsection is a Wh-question.

#### `src/content/mat-suboxone/suboxone-bernese-method.md` — score 15

6 Wh-headers, 1 "honest" (contextual, acceptable), 1 "actually".

- L27: `## Who this might fit` → "Who should consider micro-induction"
- L80: `## Why it works (the pharmacology)` → "How micro-induction works: pharmacology"
- L94: `## What the outcome data actually shows` → "Clinical outcomes" (drop "actually")
- L137: `## When micro-induction isn't the answer` → "When to skip micro-induction"

#### `src/content/post-acute/depression-and-anhedonia.md` — score 15

5 Wh-headers, 1 "X is real", 2 "just".

#### `src/content/start-here/thinking-about-using.md` — score 15

1 em-dash, 4 Wh-headers, 2 "just".

#### `src/content/for-loved-ones/at-home-recovery.md` — score 15

6 Wh-headers as primary issue.

### Tier 3 (score 6–14)

Mostly isolated Wh-headers as the primary remaining violation. Cleanup is straightforward (header rename per file).

- `post-acute/pink-cloud.md` (14): 5 Wh-headers, 4 "just"
- `for-loved-ones/how-to-talk.md` (14): 5 Wh-headers
- `start-here/welcome.md` (13): 2 em-dashes, 3 Wh-headers
- `mat-suboxone/suboxone-risks.md` (13): 2 Wh-headers, 2 "X is real" (acceptable, addressing denial), 2 "honest"
- `compounds/kratom-leaf.md` (13): 1 em-dash, 4 Wh-headers, 2 "actually"
- `compounds/cats-claw.md` (12): 1 em-dash, 3 Wh-headers, 3 "actually"
- `about/community.md` (11): 3 Wh-headers, 5 "just"
- `compounds/mit-a-dhm.md` (10): 4 Wh-headers, 1 "X is real"
- `other-tools/vitamins-supplements.md` (10): 3 "X is real", 4 "just"
- `for-loved-ones/rehabilitation-centers.md` (10): 4 Wh-headers, 1 "X is real"
- `for-loved-ones/boundaries.md` (10): 2 Wh-headers, 1 "X is real", 1 "honest", 2 "just"
- `for-loved-ones/asking-them-to-leave.md` (10): 3 Wh-headers, 1 "X is real", 1 "just"
- `compounds/pseudo.md` (6): 3 Wh-headers
- `about/this-site.md` (6): 3 Wh-headers
- `for-you/start-here.md` (6): 1 Wh-header, 1 em-dash, 1 "just"
- `resources/crisis-hotlines.md` (6): 2 em-dashes
- `pharmacology/morphine-vs-kratom.md` (6): 3 Wh-headers
- `other-tools/tapering-with-leaf.md` (6): 1 Wh-header, 4 "just"

## Recommended cleanup priorities

**Top priority — Wh-header rename pass (213 instances site-wide).**

The single biggest structural shift. The fix is mechanical: rewrite "What X is" / "Why this matters" / "How X works" as noun phrases or statements. Time-marker headers ("When to call for help", "When to seek emergency help") stay. Question-shaped headers go.

Suggested approach: spreadsheet of all 213, propose noun-phrase replacements per page, batch-edit.

**Second priority — "honest X" and "X is real" cleanup (~70 total).**

Most "honest" usages can be cut entirely or rephrased as direct claims. "X is real" needs per-case judgment: in stigma-rebuttal contexts (mat-suboxone/suboxone-risks.md, for-loved-ones/what-to-expect.md), one use per page is load-bearing; cut the rest.

**Third priority — em-dashes in prose (14 instances).**

Down from 70 in the prior audit. The remaining 14 are mostly in `telehealth.md` and a handful of compound pages. Quick targeted fix.

**Fourth priority — "just" sweep (~50 of 83 are cuttable).**

Lower priority because "just" is colloquial and the harm-per-instance is small. Worth doing in a passing edit but not urgent.

**Maintenance:**

- Passive voice in narrative sections — spot-check during other edits
- Adverb stragglers (often, sometimes, usually) — per-case
- Binary contrasts (53 site-wide) — Mostly in `impending-doom.md` and `for-loved-ones/what-to-expect.md`; address during those files' Wh-header passes

## What got cleaned since the prior audit

The prior pass eliminated:
- Throat-clearing openers ("Here's the thing" family) — 14 → 0
- Banned sentence openers (Moreover, Furthermore, Additionally, etc.) — significant → 0
- Em-dashes in prose — 70 → 14
- "Really" — 4 (already low)
- AI vocab tells (delve, tapestry, leverage, robust as filler) — site-wide effectively absent

Big gaps remaining are the Wh-headers, the performative-authority cluster ("honest X", "X is real"), and "just" residue.
