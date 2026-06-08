# Page descriptions audit

Generated 2026-06-08 in response to two asks:

1. Recommend descriptions for every page.
2. Stop framing the site (and individual pages) as "opioid recovery"
   in places where the actual scope is **7-OH, MGM-15, MIT-A,
   pseudoindoxyl, and kratom-derived synthetics**. The "and related
   opioid dependence" tail in the SITE description was the example
   that prompted this.

---

## What makes a good description here

- **120–160 characters**, hard cap 160. Google truncates with "…"
  somewhere between 155 and 160 on desktop and earlier on mobile.
  Many of our existing descriptions are 180–260 — the tail is cut
  off in every SERP.
- **Substance-specific keywords**. People googling "MGM-15
  withdrawal", "7-OH taper", "kratom synthetic detox" should hit
  pages that name those terms in the meta description. Replace
  "opioid withdrawal" / "opioid dependence" with the actual scope
  unless the page really is about generic OUD.
- **Front-load the searchable noun phrase**. The first 60 chars
  carry the most SEO weight and are what shows up in mobile SERPs.
  Put the title topic first; the explanatory tail second.
- **No slop** per `docs/stop-slop/`. No "X is real", no "honest",
  no Wh-headers in the description itself, no antithesis ladders,
  no triplet rhythm if it can be avoided.
- **Audience voice** per CLAUDE.md. For-loved-ones pages get softer
  language ("the person you love"). For-you pages get direct second
  person.
- **Action verb when the page is action-oriented**: "taper",
  "induce", "quit", "compare", "find", "score".

Descriptions go in: `<meta name="description">`, the og:description
fallback, the search-engine SERP snippet, and the sitemap text.

---

## Part 1: Site-wide framing (URGENT)

### `src/lib/site.ts` — `SITE.description`

**Current** (99 chars):

> Community recovery information for people quitting 7-OH, kratom
> synthetics, and related opioid dependence.

**Problem.** "And related opioid dependence" implies the site is
also for general opioid recovery — heroin, fentanyl, prescription
opioids. We're not. The site is specifically about 7-OH, MGM-15,
MIT-A/DHM, mitragynine pseudoindoxyl, and kratom leaf, plus the
recovery infrastructure (Suboxone, SR-17, helper meds, PAWS,
post-acute support) that applies to those compounds.

This string is the single most consequential one on the site — it
appears in `<meta name="description">` and `og:description` on
every page that doesn't override the description, and on the
homepage. Same string lands on Discord, Slack, Twitter, Google.

**Proposed** (138 chars):

> Recovery information for people coming off 7-OH, MGM-15, and
> kratom-derived synthetics — taper plans, MAT options, helper
> meds, PAWS guides.

Three things it does that the current doesn't:

- Names **MGM-15** explicitly. People search for it specifically
  and we're the only site with substantive coverage.
- Says **"kratom-derived synthetics"** instead of "kratom
  synthetics" — clearer that these are concentrated/semi-synthetic
  derivatives of kratom alkaloids, not "kratom" the plant.
- Tells the reader what the site *contains* (taper plans, MAT,
  helper meds, PAWS) so the SERP snippet does triage work.

**Alternatives** if a different angle is preferred:

- Shorter (98): "Community recovery information for people coming
  off 7-OH, MGM-15, and kratom-derived synthetics."
- Different lead (140): "Coming off 7-OH, MGM-15, or kratom-derived
  synthetics? Community-compiled taper plans, MAT options, helper
  meds, and PAWS guides."

### `src/layouts/BaseLayout.astro` — `og:image:alt` and `twitter:image:alt`

**Current**: `quitting7oh.org — Community recovery information.`

**Proposed**: `quitting7oh.org — recovery information for 7-OH,
MGM-15, and kratom-derived synthetics`

The og-image alt text is what assistive tech reads when the embed
image fails, and it's a small SEO signal. Better to say what's
covered.

---

## Part 2: Per-page descriptions

Format: file → current (with length) → proposed (with length) →
why. Pages flagged `KEEP` are already in good shape.

### about/

#### `about/contributing.md` (116 → 120)
- **Current**: How to suggest corrections, propose changes, or
  reach the team, via GitHub PR, Discord, subreddit modmail, or email.
- **Proposed**: Suggest corrections, propose changes, or reach the
  maintainers — via GitHub PR, Discord, subreddit modmail, or email.
- **Why**: Trims the triplet ("corrections, propose changes, or
  reach the team"), names the actual surface ("maintainers"
  vs "team"), keeps the channels list intact (SEO + answer-the-
  query value).

#### `about/how-ai-was-used.md` (124 → 138)
- **Current**: The guardrails, the ruleset in CLAUDE.md, the
  mandatory link verification, the human review at the end.
  Explained in detail.
- **Proposed**: How AI helped write this site under a strict
  ruleset: the CLAUDE.md guardrails, the mandatory link
  verification, and the human review at the end.
- **Why**: Drops "Explained in detail" (filler). Adds "AI helped
  write this site" up front since that's the searched query.

#### `about/the-community.mdx` (88 → 124)
- **Current**: The Discord and subreddit, how the project started,
  and the people currently running it.
- **Proposed**: The quitting7oh Discord and r/quitting7oh
  subreddit, how the community started, and the people currently
  running it.
- **Why**: Names the actual handles (searchable). "Project" → "community"
  since that's how the site refers to it elsewhere.

#### `about/this-site.md` KEEP (84)
- Already tight, factual, includes the searched keyword
  ("quitting7oh.org"), and tells the reader what's covered.

#### `about/where-we-stand.md` KEEP (112)
- Good as is. Names the controversial topics it addresses.

### compounds/

#### `compounds/7-oh.md` KEEP (125)
- Excellent. SEO-strong ("7-hydroxymitragynine"), substance-specific,
  action-relevant ("tapereable" → consider fixing to "taperable",
  one-letter typo).
- **Single-letter fix**: `tapereable` → `taperable`.

#### `compounds/cats-claw.md` KEEP (105)
- Captures the deception story which is the SEO hook
  ("rhynchophylline" + "smoke shops").

#### `compounds/kratom-leaf.md` KEEP (140)
- Strong. Distinguishes leaf from concentrated 7-OH, which is
  exactly the search-intent disambiguation we want.

#### `compounds/mgm15.md` (106 → 156)
- **Current**: A long-acting opioid derived from 7-OH. What the
  long half-life means for tapering and Suboxone induction.
- **Proposed**: MGM-15 (dihydro-7-hydroxymitragynine, also sold as
  MIT-A and DHM), the long-acting reduced 7-OH. Pharmacology, taper
  plan, Suboxone induction notes.
- **Why**: Names the chemical (the correct chemistry, per
  [mit-a-dhm.md:98](../src/content/compounds/mit-a-dhm.md)) and
  the product labels it shows up under in stores. That's what
  people are searching for. "An opioid" is technically correct but
  doesn't help the reader who's googling "MGM-15" or "MIT-A".

#### `compounds/mgm16.md` (LONG 243 → 156)
- **Current**: The fluorinated analog of MGM-15, a 2014 medicinal-
  chemistry compound that's been discussed in scheduling
  proceedings but, as of this writing, has not been documented in
  any US consumer product. What's published, what isn't, and what
  it means.
- **Proposed**: The fluorinated analog of MGM-15, a 2014 medicinal-
  chemistry compound named in scheduling proceedings but not
  documented in any US consumer product to date.
- **Why**: 243 → 156. Drops "as of this writing" tic, "what's
  published, what isn't" triplet, and the meta-explainer tail.

#### `compounds/mit-a-dhm.md` (LONG 207 → 158)
- **Current**: Products marketed as MIT-A or DHM contain MGM-15, a
  reduced derivative of 7-OH that standard GC-MS testing reverts to
  mitragynine and misses entirely. The chemistry, the COAs, and
  what users actually report.
- **Proposed**: Products marketed as MIT-A or DHM contain MGM-15,
  a reduced 7-OH derivative that standard GC-MS testing reverts to
  mitragynine and misses entirely. Chemistry, COAs, and user reports.
- **Why**: Minor trim. Preserves the high-value SEO claim (MIT-A
  ≠ what the COA shows).

#### `compounds/mitragynine-pseudoindoxyl.md` KEEP (99)
- Tight, names alternate name (MP), names the practical content.

### for-loved-ones/

The whole section needs softer voice per CLAUDE.md. Several use
"loved one" already; a few say "they" / "them" in ways that read
clinical.

#### `for-loved-ones/asking-them-to-leave.md` (LONG 179 → 155)
- **Current**: When someone needs to leave the home and won't go:
  the legal landscape, what you can and can't do without a court,
  when to use protective orders, and where to get free legal help.
- **Proposed**: When the person you love needs to leave the home
  and won't go: the legal landscape, protective orders, and where
  to find free legal help.
- **Why**: Softer voice ("the person you love"). Trims the "what
  you can and can't do" mini-antithesis. Still names the searched
  keywords (protective orders, legal help).

#### `for-loved-ones/at-home-recovery.md` (LONG 185 → 158)
- **Current**: What at-home recovery from 7-OH and kratom
  synthetics looks like from outside it, the tools they may be
  using, what helps and what backfires, and when to push for
  higher-intensity care.
- **Proposed**: What at-home recovery from 7-OH and kratom-derived
  synthetics looks like from outside, the tools your loved one is
  using, and when to push for higher-intensity care.
- **Why**: 7-OH / synthetics framing kept (good SEO). "Their" →
  "your loved one's" (softer). Drops the "what helps and what
  backfires" antithesis ladder.

#### `for-loved-ones/boundaries.md` (LONG 184 → 145)
- **Current**: A boundary is what you will do, not what they must
  do. How to set limits that protect your life without trying to
  control theirs, and how to follow through without it becoming
  cruelty.
- **Proposed**: How to set limits that protect your life without
  trying to control your loved one's — what a boundary actually
  is, and how to follow through without becoming cruel.
- **Why**: Drops the "X is what you will do, not what they must
  do" antithesis-ladder lead. Same content, less performative.

#### `for-loved-ones/fmla-workplace.md` KEEP (148)
- Good as is. SEO-targeted ("FMLA", "EAPs", "state expansions").

#### `for-loved-ones/how-to-talk.md` (LONG 233 → 158)
- **Current**: When to bring it up, how to say it, and what tends
  to land vs. backfire. Includes a primer on CRAFT, the evidence-
  based framework that outperforms both Al-Anon and confrontational
  interventions for getting a loved one into treatment.
- **Proposed**: When to bring it up, how to say it, and a primer
  on CRAFT — the evidence-based framework that outperforms Al-Anon
  and confrontational interventions for getting a loved one into
  treatment.
- **Why**: Cuts the "what lands vs. backfires" antithesis. Keeps
  the high-SEO term (CRAFT).

#### `for-loved-ones/rehabilitation-centers.md` (LONG 187 → 144)
- **Current**: Detox, residential, PHP, IOP, and outpatient, from
  the family's perspective. How to navigate insurance, parity law,
  free and low-cost paths, and how to spot predatory treatment
  marketing.
- **Proposed**: Detox, residential, PHP, IOP, and outpatient, from
  the family's perspective — insurance, parity law, free paths,
  and how to spot predatory treatment marketing.
- **Why**: Same scope, tighter.

#### `for-loved-ones/safety.md` (LONG 186 → 152)
- **Current**: If you or your children are in danger, your safety
  is not negotiable. Recognizing escalation, safety planning,
  mandatory reporters, the crisis hotlines, and how to use
  naloxone (Narcan).
- **Proposed**: If you or your children are in danger: recognizing
  escalation, safety planning, mandatory reporters, the crisis
  hotlines, and how to use naloxone (Narcan).
- **Why**: Drops "your safety is not negotiable" (slogan tone).
  Keeps every searchable noun.

#### `for-loved-ones/support-groups.md` (LONG 173 → 158)
- **Current**: Peer support groups specifically for people with a
  loved one in addiction, Nar-Anon, SMART Recovery Family &
  Friends, Learn to Cope, the kratom-specific options, and others.
- **Proposed**: Peer support groups for people with a loved one in
  addiction: Nar-Anon, SMART Recovery Family & Friends, Learn to
  Cope, the kratom-specific options, and others.
- **Why**: Drops "specifically", trims a comma. Same SEO surface.

#### `for-loved-ones/taking-care-of-yourself.md` (LONG 187 → 153)
- **Current**: The unglamorous basics that keep you standing
  through a long process. Therapy, support groups, sleep, the
  hypervigilance trap, and why it's okay to be happy while
  they're still suffering.
- **Proposed**: The unglamorous basics that keep you standing —
  therapy, support groups, sleep, the hypervigilance trap, and
  why it's okay to be happy while your loved one isn't.
- **Why**: Tighter. "They" → "your loved one" (softer, consistent
  with section voice).

#### `for-loved-ones/welcome.md` (LONG 170 → 144)
- **Current**: If you love someone who's using 7-OH, kratom
  synthetics, or stacked products, this is where to start. Calm
  reference for the people walking alongside someone in recovery.
- **Proposed**: If you love someone using 7-OH, MGM-15, or kratom-
  derived synthetics, this is where to start — a calm reference
  for the family side of recovery.
- **Why**: Names MGM-15 explicitly. "Walking alongside" is a bit
  precious; "family side of recovery" is what the page is.

#### `for-loved-ones/what-to-expect.md` (LONG 173 → 158)
- **Current**: Dependence on 7-OH and kratom synthetics as it
  looks from the outside, what withdrawal does to the brain and
  body, and the long PAWS tail almost nobody warns families about.
- **Proposed**: Dependence on 7-OH and kratom-derived synthetics
  as it looks from outside, what withdrawal does to the brain and
  body, and the long PAWS tail families don't get warned about.
- **Why**: Minor tightening. "Almost nobody" → "don't get warned"
  is more direct.

### for-you/

#### `for-you/at-home-treatment.md` KEEP (142)
- Good. Substance-specific, action-relevant.

#### `for-you/fmla-ada-job.md` (LONG 168 → 154)
- **Current**: Federal job-protected leave for your own treatment,
  ADA protections for people in recovery, what HR actually sees,
  and how to use EAPs without your manager finding out.
- **Proposed**: Federal job-protected leave for your own
  treatment, ADA protections in recovery, what HR actually sees,
  and how to use EAPs without your manager finding out.
- **Why**: 14 chars off without losing any searchable surface.

#### `for-you/mat-and-your-job.md` (LONG 245 → 156)
- **Current**: Most jobs have no business in your medical records,
  but a handful of regulated professions (CDL, pilots, ATC, law
  enforcement, armed security, some healthcare roles) treat MAT
  use as a licensure issue. What to check before you disclose or
  start.
- **Proposed**: A handful of regulated professions (CDL, pilots,
  ATC, law enforcement, armed security, some healthcare) treat
  MAT use as a licensure issue. What to check before you start.
- **Why**: Drops the "most jobs / but a handful" antithesis ladder
  lead. Goes straight to the searched specifics.

#### `for-you/mutual-aid.md` (LONG 191 → 156)
- **Current**: Free peer support groups for the person in
  recovery, Kratom Anonymous (the most directly applicable), NA,
  Heroin Anonymous, SMART, Refuge Recovery, The Phoenix, and
  others. Try more than one.
- **Proposed**: Free peer support groups for the person in
  recovery: Kratom Anonymous (most directly applicable), NA,
  Heroin Anonymous, SMART, Refuge Recovery, The Phoenix, and
  others.
- **Why**: Drops "Try more than one" exhortation. Same SEO-rich
  list of group names.

#### `for-you/rehabilitation-centers.md` KEEP (145)
- Good.

#### `for-you/sober-living.md` KEEP (149)
- Excellent. Includes the highly-searched "NARR" + "Oxford House"
  + "red flags".

#### `for-you/tapering-7oh.md` (LONG 182 → 152)
- **Current**: What tapering off concentrated 7-OH looks like:
  the early dose-halving stretch, the low-dose plateau where most
  self-managed tapers stall, the jump-off, and what helps at each
  stage.
- **Proposed**: What a 7-OH taper actually looks like — the early
  dose-halving stretch, the low-dose plateau where most tapers
  stall, the jump-off, and what helps at each stage.
- **Why**: "What tapering off concentrated 7-OH looks like" →
  "What a 7-OH taper looks like" matches the search query better
  ("7-oh taper").

#### `for-you/welcome.md` KEEP (134)
- Good.

### mat-suboxone/

#### `mat-suboxone/long-term-suboxone-risks.md` (LONG 164 → 152)
- **Current**: Long-term effects, dependence, hormone changes, and
  the realities of tapering off Suboxone, including the long-
  acting injectables some people are now using to exit.
- **Proposed**: Long-term Suboxone effects, dependence, hormone
  changes, and tapering off — including the long-acting injectables
  some people use to exit.
- **Why**: Front-loads "Suboxone" (search query). Cuts "realities"
  (filler). Slightly tighter.

#### `mat-suboxone/sows-cows-induction-guide.md` KEEP (156)
- Good. Hits "SOWS" and "COWS" and the practical scope.

#### `mat-suboxone/sublocade-brixadi.md` (LONG 178 → 155)
- **Current**: Long-acting buprenorphine injections, maintenance
  use, the long discontinuation tail, and the single-shot exit
  strategy showing promising results for long-term Suboxone
  patients.
- **Proposed**: Sublocade and Brixadi — long-acting buprenorphine
  injections for maintenance, the long discontinuation tail, and
  the single-shot exit strategy.
- **Why**: Names the products in the description (matches the
  title and search queries). Cuts the "promising results"
  editorial.

#### `mat-suboxone/suboxone-bernese-method.md` (LONG 181 → 155)
- **Current**: Low-dose buprenorphine induction with overlapping
  full-agonist use: overview, the original Bernese protocol, the
  modern variants, and where it fits for kratom-derivative
  dependence.
- **Proposed**: The Bernese Method — low-dose Suboxone induction
  with overlapping full-agonist use. Original protocol, modern
  variants, and where it fits for kratom synthetics.
- **Why**: Names "Bernese Method" up front (the search query).
  "Kratom-derivative dependence" → "kratom synthetics" (cleaner
  search hit).

#### `mat-suboxone/suboxone-custom-dose.md` KEEP (99)
- Tight, specific (mentions the 0.5 mg threshold), action-relevant.

#### `mat-suboxone/suboxone-for-7oh.md` KEEP (157)
- Good. SEO-strong.

#### `mat-suboxone/suboxone-rapid-taper.md` KEEP (73)
- Short but precise. Could expand for SEO if you wanted; the
  current is fine.

#### `mat-suboxone/why-suboxone-isnt-working.md` KEEP (125)
- Good. Names the specific symptom clusters.

### other-tools/

#### `other-tools/cannabis-thc-in-recovery.md` (LONG 187 → 156)
- **Current**: Sourced two-sided treatment of cannabis and THC use
  during acute withdrawal and PAWS from 7-OH and kratom: benefits,
  harms, the cannabinoid landscape, and how to think about the
  decision.
- **Proposed**: Cannabis and THC during acute withdrawal and PAWS
  from 7-OH and kratom — benefits, harms, the cannabinoid
  landscape, and how to think about the call.
- **Why**: "Sourced two-sided treatment" is meta-writing about the
  page. Cut. Same scope.

#### `other-tools/helper-meds.md` (102 → 153)
- **Current**: Prescription adjuncts that take the edge off:
  clonidine, gabapentin, hydroxyzine, trazodone, baclofen.
- **Proposed**: Helper medications for 7-OH and kratom-synthetic
  withdrawal — clonidine, gabapentin, baclofen, trazodone,
  ondansetron — with symptom-by-symptom dosing.
- **Why**: Current description is OK but doesn't connect to a
  search query. Adds "withdrawal" + the substance scope (high SEO
  value) and "dosing" since that's what the page now delivers
  after the recent rewrite.

#### `other-tools/mega-dose-vitamin-c.md` (84 → 138)
- **Current**: High-dose vitamin C as a withdrawal adjunct: the
  protocol, the brands, the cautions.
- **Proposed**: High-dose vitamin C as a 7-OH and kratom-synthetic
  withdrawal adjunct: the community protocol, brands, and the
  cautions to know.
- **Why**: Adds the substance scope so the page matches "vitamin C
  for 7-oh withdrawal" / "vitamin C for kratom" searches.

#### `other-tools/nad-iv-therapy.md` (LONG 187 → 155)
- **Current**: NAD+ infusions in the context of 7-OH and opioid
  recovery: what's offered, what it costs, what the published
  evidence supports, and how it stacks up against options with
  stronger backing.
- **Proposed**: NAD+ infusions for 7-OH and kratom recovery —
  what's offered, what it costs, what the published evidence
  supports, and where it falls short.
- **Why**: "Opioid recovery" → "kratom recovery" per the framing
  ask. "Stacks up against options with stronger backing" → "where
  it falls short" (shorter, more honest).

#### `other-tools/peptides-for-withdrawal.md` (LONG 235 → 158)
- **Current page title is "Peptides for Opioid Withdrawal"** —
  flag this too, see Part 3.
- **Current**: Peptides used as adjuncts in 7-OH and opioid
  recovery: BPC-157, Selank, Semax, DSIP, TB-500, and others.
  What's offered, what the evidence supports, and the safety
  considerations specific to injectable products from unregulated
  supply.
- **Proposed**: Peptides used as adjuncts in 7-OH and kratom-
  synthetic recovery — BPC-157, Selank, Semax, DSIP, TB-500 —
  the evidence and the unregulated-supply safety concerns.
- **Why**: Substance reframe + tightened.

#### `other-tools/quit-7-oh-with-kratom-leaf.md` KEEP (155)
- Excellent. SEO-strong title + description.

#### `other-tools/quit-7-oh-with-mitragynine.md` (LONG 180 → 156)
- **Current**: Using concentrated mitragynine extracts as a bridge
  from concentrated 7-OH to abstinence: doses, timelines, the
  contamination concern, and how this compares to the other paths
  off.
- **Proposed**: Concentrated mitragynine extracts as a bridge from
  7-OH to abstinence — doses, timelines, the contamination concern,
  and how it compares to the other paths off.
- **Why**: Light trim.

#### `other-tools/quit-kit.md` KEEP (156)
- Good. Names what the products are; "honest review" is the search
  hit.

#### `other-tools/sr-17.md` KEEP (106)
- Good. SEO-precise.

#### `other-tools/vitamins-supplements.md` (101 → 142)
- **Current**: A community-tested supplement stack for opioid
  withdrawal and PAWS, what to start with, what to skip.
- **Proposed**: A community-tested supplement stack for 7-OH and
  kratom-synthetic withdrawal and PAWS — what to start with, what
  to skip.
- **Why**: "Opioid withdrawal" → 7-OH/kratom-synthetic per the
  framing ask. Page is specific to this community.

### pharmacology/

#### `pharmacology/chemical-structures.mdx` (LONG 240 → 155)
- **Current**: Structure diagrams for morphine and the kratom
  alkaloids covered in the pharmacology section, kratom leaf
  alkaloids, the concentrated and semi-synthetic mitragynine
  derivatives that drive the 7-OH product market, and morphine
  for reference.
- **Proposed**: Structure diagrams for morphine, the kratom leaf
  alkaloids, and the concentrated and semi-synthetic mitragynine
  derivatives that drive the 7-OH product market.
- **Why**: Drops "morphine and the kratom alkaloids ... and
  morphine for reference" double-naming.

#### `pharmacology/kratom-minor-alkaloids.md` (LONG 210 → 159)
- **Current**: Mitragynine is the headline alkaloid, but kratom
  leaf contains 40+ others. This page covers the six better-
  studied 'minor' alkaloids and their activity across the
  µ-opioid, serotonergic, and adrenergic systems.
- **Proposed**: Kratom leaf contains 40+ alkaloids beyond
  mitragynine. The six better-studied minor alkaloids and their
  activity across µ-opioid, serotonergic, and adrenergic systems.
- **Why**: Front-loads "kratom leaf alkaloids". Drops "This page
  covers" (meta-tic). Smart-quotes around 'minor' dropped (causes
  display weirdness in SERPs).

#### `pharmacology/morphine-vs-kratom.md` KEEP (138)
- Good. The "classical opioids" framing here is correct because
  this page is *literally* a comparison page.

### post-acute/

#### `post-acute/7-oh-recovery-timeline.md` (LONG 246 → 153)
- **Current**: What recovery from 7-OH dependence looks like,
  plainly stated: how hard it is, how relapse fits, why the long-
  arc picture borrows from the broader opioid-recovery literature,
  and the reality that the people who got there did it one day at
  a time.
- **Proposed**: What recovery from 7-OH dependence actually looks
  like — how hard it is, how relapse fits, and why the long-arc
  picture borrows from OUD literature.
- **Why**: 246 → 153. Drops "plainly stated" / "the reality that"
  performance signposting and the closing platitude.

#### `post-acute/depression-and-anhedonia.md` (LONG 199 → 152)
- **Current**: The depression and the can't-feel-anything that
  show up in the weeks and months after coming off 7-OH and
  kratom synthetics. The treatment-relevant distinction, what
  helps, and when to call for help.
- **Proposed**: The depression and anhedonia that show up in the
  weeks and months after coming off 7-OH and kratom synthetics —
  the distinction, what helps, when to escalate.
- **Why**: "Anhedonia" is the SEO term (used in the title). Drops
  "can't-feel-anything" colloquialism that doesn't match queries.

#### `post-acute/dopamine-recovery.md` KEEP (144)
- Excellent. Specific, action-relevant, names the symptoms.

#### `post-acute/endocrine-recovery.md` (LONG 235 → 159)
- **Current**: Chronic opioid-receptor compounds suppress the
  body's hormone systems. The page covers what readers may
  experience months into recovery, what testing looks like, what
  recovery actually involves, and what's specific to men and to
  women.
- **Proposed**: 7-OH and kratom synthetics suppress the hormone
  systems chronically. What you may experience months in, the
  testing workup, the recovery picture, and what's specific to
  men and to women.
- **Why**: Substance-specific lead (per framing ask). Drops "The
  page covers" meta-tic and the "what testing looks like" Wh-tic
  in favor of "testing workup".

#### `post-acute/impending-doom-anxiety.md` (LONG 241 → 156)
- **Current**: The specific terror that hits in withdrawal and
  PAWS, that something catastrophic is about to happen, that you
  might die, that the world is ending. What it is, what to do in
  the next ten minutes, and when it's more than a withdrawal
  symptom.
- **Proposed**: The specific terror that hits in withdrawal and
  PAWS — feeling like something catastrophic is about to happen.
  What it is, what to do right now, when it's more than withdrawal.
- **Why**: Cuts the triplet "that you might die, that the world
  is ending" and "next ten minutes" → "right now".

#### `post-acute/kindling-and-relapse.md` (LONG 198 → 156)
- **Current**: What happens if you use again after a stretch off,
  why withdrawal can come back fast, what the opioid literature
  shows, what this community reports about 7-OH, and what to do
  if you've already used.
- **Proposed**: What happens if you use again after a stretch off
  — why withdrawal can come back fast, what the OUD literature
  shows, what this community reports about 7-OH.
- **Why**: Drops the closing "what to do if you've already used"
  for length. Keep that as the page's lead instead. "Opioid
  literature" → "OUD literature" (SEO-precise).

#### `post-acute/naltrexone-low-dose.md` (LONG 236 → 156)
- **Current**: Naltrexone at a small fraction of the standard
  dose, used off-label for chronic pain, autoimmune conditions,
  and increasingly as an adjunct in addiction recovery once acute
  withdrawal is over. Overview, evidence, and the safety caveats.
- **Proposed**: Low-dose naltrexone (LDN) at a small fraction of
  the standard dose — off-label for chronic pain, autoimmune
  conditions, and as a post-acute adjunct. Evidence and caveats.
- **Why**: Names "LDN" (search term). Tighter.

#### `post-acute/naltrexone-normal-dose.md` (LONG 181 → 153)
- **Current**: Full-dose naltrexone, oral 50 mg daily and Vivitrol
  380 mg monthly injection, for sustained abstinence after detox.
  The page with the unmissable precipitated-withdrawal safety note.
- **Proposed**: Full-dose naltrexone — oral 50 mg daily and
  Vivitrol 380 mg monthly — for sustained abstinence after detox.
  With the precipitated-withdrawal safety warning.
- **Why**: Cuts "the unmissable" and "the page with" meta-tics.

#### `post-acute/naltrexone-ultra-low-dose.md` (LONG 186 → 154)
- **Current**: Naltrexone at microgram-range doses taken alongside
  opioids, an investigational concept with thin and aging clinical
  evidence. Overview, what's been tried, why it isn't standard of
  care.
- **Proposed**: Ultra-low-dose naltrexone (ULDN) at microgram doses
  taken alongside opioids — the investigational concept, the thin
  clinical evidence, why it isn't standard care.
- **Why**: Names ULDN up front (search term).

#### `post-acute/naltrexone.md` (LONG 260 → 159)
- **Current**: A mu-opioid antagonist used in three very different
  dose tiers, normal-dose for sustained abstinence after detox,
  low-dose (LDN) for off-label PAWS support, and ultra-low-dose
  (ULDN) as an investigational adjunct. What each one is, and
  which page to read next.
- **Proposed**: Naltrexone in three dose tiers — normal-dose for
  abstinence after detox, low-dose (LDN) for PAWS, and ultra-low-
  dose (ULDN) as an investigational adjunct.
- **Why**: 260 → 159. Drops "What each one is, and which page to
  read next" (boilerplate for a hub page; the body covers that).

#### `post-acute/paws-post-acute-withdrawal.md` KEEP (157)
- Good.

#### `post-acute/pink-cloud.md` (LONG 179 → 153)
- **Current**: The early-recovery stretch of unexpected well-being
  some people hit after acute withdrawal, what it is, how to use
  the window, what not to commit to, and what tends to come after.
- **Proposed**: The early-recovery stretch of unexpected well-being
  some people hit after acute withdrawal — what it is, how to use
  the window, and what comes next.
- **Why**: Trims and drops the "what not to commit to" antithesis.

#### `post-acute/sleep-recovery.md` (91 → 142)
- **Current**: Sleep recovery after opioid use, what's normal,
  what helps, and how long it actually takes.
- **Proposed**: Sleep recovery after coming off 7-OH and kratom
  synthetics — what's normal, what helps, and how long it
  actually takes.
- **Why**: "After opioid use" reads as generic-OUD framing.
  Substance-specific is more accurate.

### resources/

#### `resources/crisis-hotlines.md` KEEP (137)
- Good. Names the use cases that match search queries.

#### `resources/meeting-schedules.mdx` (LONG 189 → 158)
- **Current**: Full meeting schedules for the two kratom-specific
  peer support fellowships, Kratom Anonymous (12-step) and There
  Is A Way Out / TIAWO (non-12-step), with day, time, format, and
  join links.
- **Proposed**: Live meeting schedules for the two kratom-specific
  fellowships — Kratom Anonymous (12-step) and There Is A Way Out
  / TIAWO (non-12-step). Day, time, format, join links.
- **Why**: "Live" hints these update; minor trim.

#### `resources/taper-calculator.mdx` (LONG 235 → 155)
- **Current**: Enter your current dose and chosen speed; the
  calculator generates a step-by-step schedule for buprenorphine,
  7-OH, MGM-15/MIT-A, pseudo, kratom leaf, and SR-17. Established
  schedules where they exist, percentage math where they don't.
- **Proposed**: A taper calculator for buprenorphine, 7-OH,
  MGM-15/MIT-A, pseudoindoxyl, kratom leaf, and SR-17 — enter a
  dose and speed, get a day-by-day schedule.
- **Why**: Front-loads "taper calculator" (search term). 235 → 155.

#### `resources/telehealth-for-suboxone.md` (LONG 175 → 156)
- **Current**: Neutral, fact-checked comparison of telehealth
  providers that prescribe buprenorphine for opioid use disorder,
  including those who explicitly treat kratom and 7-OH dependence.
- **Proposed**: Side-by-side comparison of telehealth providers
  that prescribe Suboxone for kratom and 7-OH dependence —
  pricing, scope, and what they'll work with.
- **Why**: "Neutral, fact-checked" reads as marketing claim about
  the page itself. "Side-by-side" matches "comparison" search
  intent. Names what readers actually look up
  ("Suboxone telehealth", not "buprenorphine for OUD").

### start-here/

#### `start-here/7-oh-withdrawal-help.md` KEEP (97)
- Strong urgency-page lead.

#### `start-here/cravings-and-relapse-thoughts.md` KEEP (145)
- Good.

#### `start-here/how-to-quit-7-oh.md` KEEP (97)
- Good.

#### `start-here/how-to-use-this-website.md` KEEP (130)
- Good.

#### `start-here/welcome.md` (SHORT 54 → 134)
- **Current**: What this site is, who it's for, and where to go
  next.
- **Proposed**: Start here — what quitting7oh.org is, who it's
  for, and the page most likely to help where you are right now.
- **Why**: Current is too generic to do any SEO work. New version
  names the site (search term) and hints at the routing logic.

#### `start-here/what-is-7-oh.md` KEEP (119)
- Good.

---

## Part 3: Opioid-framing in body content and titles

Beyond the descriptions, here's the broader sweep of where the
site frames things as generic-opioid that should be 7-OH /
kratom-synthetic specific. Action level varies — some are correct
technical claims and should stay; others are framing leaks.

### Page titles to consider renaming

| File | Current title | Suggested |
|---|---|---|
| `other-tools/peptides-for-withdrawal.md` | "Peptides for Opioid Withdrawal" | "Peptides for 7-OH and Kratom-Synthetic Withdrawal" |

Title affects `<title>` tag, breadcrumb, and SERP heading. "Opioid"
is the wrong-scope frame here.

### Body-prose phrasings to revisit

These are passages that talk *about the site itself* as if its
audience is general-OUD when it's specifically 7-OH and kratom-
synthetic:

- `about/this-site.md` line 9: "a community-compiled reference for
  getting off 7-OH, kratom synthetics, and the opioid dependence
  they produce" — last clause is awkward. Suggest: "a community-
  compiled reference for getting off 7-OH, MGM-15, and kratom-
  derived synthetics."

- `for-loved-ones/welcome.md` line 42: "Withdrawal looks like
  opioid withdrawal because biochemically, that's what it is." —
  KEEP. This is the correct pedagogical claim and answers a real
  reader question. The framing is "your loved one's dependence is
  biochemically opioid, even though the substance was sold as a
  supplement" — that's a feature, not a bug.

- `for-loved-ones/support-groups.md` line 15: "since dependence on
  7-OH and the kratom synthetics is biochemically opioid
  dependence" — KEEP for the same reason. Correctly explains why
  opioid-specific family fellowships are relevant.

- `for-loved-ones/what-to-expect.md` line 105: "relapse … is part
  of the population-level pattern for opioid dependence" — KEEP.
  Page is explicitly borrowing OUD population data, labeled as
  such.

- `for-you/mutual-aid.md` line 44: "Dependence on 7-OH and the
  kratom synthetics is biochemically opioid dependence, so the
  opioid-specific fellowships are also a strong fit" — KEEP.
  Same logic.

- `for-you/mutual-aid.md` line 58: "12-step, specifically focused
  on people in recovery from opioid use including prescription
  opioids, heroin, fentanyl, and analogues" — KEEP. Describes what
  Heroin Anonymous *is*; accurate.

- `mat-suboxone/why-suboxone-isnt-working.md` line 19: "When you
  stop, you don't just get opioid withdrawal. You get opioid
  withdrawal plus..." — KEEP. The whole point of the page is
  contrasting our scope with generic opioid withdrawal.

- `for-loved-ones/rehabilitation-centers.md` line 33: "For 7-OH
  and opioid dependence, detox handles the worst of the acute
  withdrawal" — could be "For 7-OH and kratom-synthetic
  dependence" since the page is in the for-loved-ones context
  for this community. Consider rewording.

- `other-tools/vitamins-supplements.md` description (already in
  Part 2): "for opioid withdrawal and PAWS" → 7-OH/kratom-synthetic
  scope.

- `post-acute/sleep-recovery.md` description (already in Part 2):
  "after opioid use" → 7-OH/kratom-synthetic scope.

- `start-here/7-oh-withdrawal-help.md` line 134: "Saying 'I'm in
  opioid withdrawal'" — KEEP, that's the actual phrasing the
  reader should use with ER staff (it's what the staff understands).

### Summary on the framing audit

The general rule I'd apply: **when the site describes its own
scope or audience, use 7-OH / MGM-15 / kratom-derived synthetics
specifically**. When the site describes the *biological mechanism*
of withdrawal, or quotes mainstream OUD literature, or guides the
reader to use language clinicians understand, "opioid" is the
correct term and should stay.

The SITE.description fix in Part 1 is the most consequential. The
peptides page title is the only standalone page title that needs
renaming. The body-prose passages above are mostly fine; only a
couple are framing leaks (flagged with "could be" rather than KEEP).

---

## Recommended rollout

If you'd like to apply all of this, the cleanest order is:

1. **Site-wide:** SITE.description + og-image alt. Single commit.
2. **Per-page descriptions:** one commit per section
   (about, compounds, for-loved-ones, for-you, mat-suboxone,
   other-tools, pharmacology, post-acute, resources,
   start-here). Each touches multiple `last_updated` bumps; group
   them by section so the diff and CHANGELOG entry stay scoped.
3. **Peptides page title rename** + the body-prose framing leaks.
   Single commit.

Let me know which of these (all? selected? table-level adjustments?)
you want me to execute, and I'll proceed.
