# Site audit against CLAUDE.md

**Date:** 2026-05-24
**Scope:** All 65 content files under `src/content/` (excluding `README.md`).
**Method:** Three parallel read-only audits — prose voice / AI-tells, substance framing, telehealth routing — each against the corresponding CLAUDE.md rules. No edits were made; this file is for review and triage.

---

## Executive summary

- **Total findings:** ~80 across three rule families + 2 user-flagged content gaps
  - Voice / AI-tells: ~55 findings across 22 files (6 critical, ~20 important, ~30 minor)
  - Substance framing: 14 findings (4 important, 10 minor; the important ones are all the same rule — Subs↔SR-17 pairing on long-acting compound pages)
  - Telehealth routing: 11 findings (0 critical, 4 important, 7 minor)
  - Structural / content gaps (user-flagged 2026-05-24): 2 important on for-loved-ones pages — see [what-to-expect.md](#srccontentfor-loved-oneswhat-to-expectmd--voice--structure) financial-section pattern, and [how-to-talk.md](#srccontentfor-loved-oneshow-to-talkmd--voice--structure) when-not-to-bring-it-up paradox
- **The two dominant patterns** are:
  1. **Voice drift on the post-acute + Suboxone clusters** — "The honest X" performance signposting, "It's not weakness, it's neurobiology"-style bolded antithesis ladders, "worth knowing about" tics. Reads as a single author voice that drifted into the AI register.
  2. **Subs↔SR-17 pairing gap on long-acting compound pages** — MGM-15, MIT-A/DHM, and pseudo all discuss Suboxone induction extensively without naming SR-17 alongside, even though SR-17's own page covers their applicability.
- **What's working well across the audit:**
  - Rule 4 (don't apply traditional-opioid OD framing to 7-OH) — fully compliant site-wide
  - Rule 5 (default lower/slower) — community-vs-typical-clinical tension surfaced consistently
  - Rule 6 (audience language) — for-loved-ones pages use soft language throughout
  - SR-17 page has zero telehealth routings (correct)
  - Cannabis page is compliant (recently rewritten)
  - LDN and ULDN explicitly note OUD telehealth won't prescribe them
  - All Suboxone / Sublocade / helper-meds / antidepressant routings to telehealth are correct

---

## Suggested PR batches

These are logical groupings — fix each batch in one commit, verify on CF before stacking the next.

1. **Compound-page Subs↔SR-17 sweep** — `compounds/mgm15.md`, `compounds/mit-a-dhm.md`, `compounds/pseudo.md`. Same omission pattern across three files. The 7-OH page handles this correctly and is the template. Important.
2. **Supplement-page telehealth boilerplate fix** — `other-tools/quitkit-info.md:8`, `other-tools/mega-vit-c-info.md:8`, `other-tools/vitamins-supplements.md:9`. Same "talk to your prescriber before starting any supplement" shape; lead with the narrow ask (interactions, kidney stones) and treat protocol-planning as community ground. Important.
3. **kratom-leaf.md routing rewrite** — top-of-page disclaimer routes the leaf taper plan itself to telehealth/a prescriber, contradicting the new CLAUDE.md rule. Touches 3 places on one file (lines 12, 294-297, 329-335). Important.
4. **naltrexone overview CTA fix** — `other-tools/naltrexone.md:114` closing routes to telehealth for all three protocols including LDN/ULDN. Narrow to normal-dose; route LDN/ULDN per their daughter pages. Important.
5. **Voice reset on the post-acute cluster** — `post-acute/depression-and-anhedonia.md`, `dopamine-recovery.md`, `impending-doom.md`, `long-term-outlook.md`. These four share the same "honest X" / "What this means in practice" / bolded-antithesis-ladder drift. Could be one PR or four small ones. Important.
6. **Voice reset on the Suboxone cluster** — `mat-suboxone/suboxone-bernese-method.md` (heaviest single page), `suboxone-info.md`, `suboxone-isnt-working.md`. Same author voice drift as the post-acute cluster. Critical + important.
7. **for-loved-ones/what-to-expect.md** — two things on this page: (a) the stacked "It's not X. It's not Y. It's Z." triplet at line 60 (most concentrated single AI-tell in the audit), and (b) **content gap**: the financial-pattern section sits alone after the "not a moral failing" intro that names lying / stealing / broken promises / disappearing only in the abstract. Add parallel concrete sections for the other behaviors so families get the same picture for dishonesty, secrecy, and broken promises that they get for money. Critical + important.
8. **for-loved-ones/how-to-talk.md — "when not to bring it up" paradox** — the list excludes both active use and acute withdrawal without addressing what that leaves for families of people in active daily cycles, where the gap between the two is hours. Add guidance on the narrow openings (post-dose comedown windows, early morning, days of voluntary step-down, moments they bring something up themselves) and acknowledge directly when the "ideal stable moment" doesn't exist. Important; user-flagged.
9. **post-acute/what-is-paws.md** — add SR-17 to the "Clinically used (prescribed)" tier alongside MAT. Important.
10. **Loose-ends sweep** — the remaining minor flags (em-dash culls on a few pages, "worth knowing about" section-heading edits, the post-acute "for any clinically-used intervention above" telehealth routings, contributing.md disclaimer). Can wait. Minor.

---

## Findings by file

Files ordered by total severity weight (critical first, then important, then minor). Each finding cites file:line, quotes the offending text, names the rule, and gives a suggested fix.

### `src/content/mat-suboxone/suboxone-bernese-method.md` — voice (heaviest)

The single worst-hit page in the audit. Reads as a structured argument announcing its own credibility at every section boundary.

- **Line 98 — Performance signposting [critical]**
  Quote: "This is the honest middle of the page. **Most published evidence is case series and small cohorts, not RCTs.**"
  Fix: Cut "This is the honest middle of the page." Open with the fact.

- **Line 106 — Performance signposting [critical]**
  Quote: "The honest read: **inpatient completion is high; outpatient completion is much lower.**"
  Fix: Cut "The honest read:". Lead with the contrast directly.

- **Line 120 — Performance signposting + "as of this writing" [important]**
  Quote: "The community-validated reality, as of this writing: **a handful of people in this community have used micro-induction successfully for MGM-15..."
  Fix: Replace with direct claim. If time-bounding matters, fold into a separate sentence ("The volume of community experience is small.").

- **Line 13 — Em-dash addiction + "worth knowing" [important / minor]**
  Quote: "...synthetics ([MGM-15](/compounds/mgm15) at ~15 hours, [pseudo](/compounds/pseudo), or [MIT-A/DHM](/compounds/mit-a-dhm)) — and for anyone who's already tried standard induction and gotten precipitated withdrawal — micro-induction is the alternative pathway worth knowing about."
  Fix: Convert outer dashes to commas; drop "worth knowing about" — "is the alternative pathway here" or "is the alternative pathway."

- **Line 108 — Bolded throat-clearing [minor]**
  Quote: "The takeaway isn't 'don't do this' — for the right person, it works. It is: **plan for the support structure that the inpatient setting provides, because that's the variable that drives completion.**"
  Fix: The bold sentence is announcing "here is the conclusion." Either de-bold or cut.

- **Lines 118, 136 — Em-dash density [minor]** — same dash-stacking pattern; parentheses land cleaner.

### `src/content/for-loved-ones/what-to-expect.md` — voice + structure

- **Lines 11–26 — Financial section sits alone without parallel behavioral sections [important; structural; user-flagged]**
  The "Addiction is not a moral failing" intro (line 13) names lying, stealing, broken promises, and disappearing as real behaviors driven by a hijacked brain — but only in the abstract, as a reassurance frame. Then "What the financial pattern usually looks like" (line 17) gets its own concrete section with specific bullets. The result is that families get a concrete picture of the money side but nothing equivalent for the lying, the manipulation/gaslighting, the disappearing/secrecy patterns, or the broken promises — all behaviors that hit families equally hard.
  Fix shape: surround the financial pattern with parallel concrete sections for the other addict behaviors (proposal: "What the dishonesty pattern usually looks like" / "What the disappearing-and-secrecy pattern looks like" / "What the financial pattern usually looks like") so families have the same concrete picture for each. The "not a moral failing" frame still opens; the financial section becomes one of several specific patterns rather than the only specific pattern surfaced.

- **Line 60 — Stacked antithesis ladder + bolded throat-clearing [critical]**
  Quote: "**Here's the part to brace for: your loved one may seem emotionally worse for a while *after* getting clean, before they get better.** This is normal. **It's not failure. It's not relapse-imminent. It's the brain healing on its own slow timeline.**"
  Fix: "It's not X. It's not Y. It's Z." triplet is the classic AI-tell. Rewrite: "This is normal — the brain healing on its own timeline, not a failure or impending relapse."

- **Line 9 — Performance signposting [important]**
  Quote: "...and the reality is both worse and more recoverable than that."
  Fix: "the reality is" can come out. Restructure to not need the meta-frame.

- **Line 44 — Antithesis ladder [important]** — "It's not 'the flu.'" Fine in isolation; flagged because it's part of the stacking with line 60.

### `src/content/mat-suboxone/suboxone-info.md` — voice + substance

- **Line 14 — Em-dash density [important]**
  Quote: "**Long-term Suboxone maintenance is also a valid choice and saves lives** — see [Long-term maintenance is a real option](#...) further down. ... People coming off the longer-acting synthetics ... are in a different situation — for them, longer protocols ... often make more sense."
  Fix: Paragraph has 2 em-dashes plus a colon doing similar work. Convert at least one.

- **Line 56 — Em-dash density (3 dashes one paragraph) [important]**
  Quote: "Kratom's minor alkaloids — paynantheine, speciogynine, corynantheidine, and others — bind serotonin and adrenergic receptors **directly** ... Adjuncts ... can fill that gap — see [Helper Medications]..."
  Fix: Parenthesize the alkaloid list; convert trailing dash to period.

- **Line 97 — Antithesis ladder [important]**
  Quote: "This is the reason behind the low-and-slow protocol — not because lower doses are intrinsically better, but because **the dose you start at is the dose you have to come off of**..."
  Fix: Cut "not because X, but because Y." "Low-and-slow exists because the dose you start at is the dose you have to come off of, and that math compounds badly above 8 mg."

- **Line 123 — "X is fine, not failure" tic [minor]**
  Quote: "A few days longer than your plan is fine if you stall at the bottom or want extra time on a particular dose — that's not failure, that's pacing yourself."
  Fix: "Stalling at the bottom or wanting extra time on a dose is normal pacing."

- **Lines 33, 76, 109, 113, 125 — Em-dash drumbeat [important cumulative]** — page-wide cull.

- **Line 12 — "worth understanding" [minor]** — "it's the medication route worth understanding" → "the medication route most people in this community use."

- **Opening framing — Rule 1 (bupe-as-THE-option) [minor-to-important; substance audit]**
  Page leads with "Suboxone is the most common medication used to come off opioid dependence" without the "one of several" framing CLAUDE.md asks for in opening paragraphs of medication-scoped pages. Compare to the bernese-method page's opening (line 15: "[SR-17](/other-tools/sr17018-info) is another path entirely if Suboxone isn't right for you.") which does this correctly.

### `src/content/mat-suboxone/suboxone-isnt-working.md` — voice

- **Line 60 — Antithesis ladder + bolded throat-clearing [important]**
  Quote: "**It's not in your head, it's pharmacology.**"
  Fix: Classic "It's not X, it's Y." Rewrite as direct claim: "This is pharmacology, not your imagination." Or cut — the paragraph already established the pharmacology.

- **Line 70 — "worth bringing up" [minor]**
  Quote: "Worth bringing up with a prescriber if standard induction isn't a fit..."
  Fix: "Bring this up with a prescriber..."

- **Lines 14, 20, 70 — Em-dash addiction (alkaloid-list construction) [minor]** — parenthesize.

### `src/content/post-acute/depression-and-anhedonia.md` — voice

- **Line 71 — Performance signposting [important]**
  Quote: "What this means in practice: if you're past acute and you feel flat or low, you're in normal company."
  Fix: Delete the prefix.

- **Line 199 — Antithesis ladder + bolded throat-clearing [important]**
  Quote: "**It's not weakness, it's neurobiology** — and it's treatable."
  Fix: "Suicidal thinking in early opioid recovery is a neurobiological symptom, and it's treatable." Lose the bold.

- **Line 207 — "## The honest framing" section heading [minor]**
  Fix: Rename ("What recovery looks like") or remove the wrap-up.

- **Line 139 — "What's worth noting *specifically*" tic [minor]** — drop the meta-prefix.

- **Line 41 — Performance signposting (mild) [minor]** — "The reason the distinction matters: ..."  → lead with the fact.

- **Lines 19–20 — Antithesis ladder + em-dash [minor]** — "...but they're not the same thing — and treating them as the same thing usually misses what helps." Drop the em-dash so it doesn't compound.

### `src/content/post-acute/dopamine-recovery.md` — voice + telehealth

- **Line 103 — Performance signposting [important]**
  Quote: "The honest read: **your dopamine system is rebalancing on its own timeline, mostly driven by time and reasonable lifestyle inputs.**"
  Fix: Drop "The honest read:". Let the bolded claim stand.

- **Line 105 — Em-dash density [minor]** — "That's not nothing — it's actually the whole answer — but it isn't the answer people are usually looking for..."

- **Line 117 — "What's worth noting *specifically*" tic [minor]** — same as depression-and-anhedonia.

- **Line 223 — Telehealth routing too broad [minor]**
  Quote: "**[Telehealth Providers](/resources/telehealth)** — for any of the clinically-used options above."
  Fix: Verify what "options above" includes; if LDN/ULDN are in the list, narrow the routing.

### `src/content/post-acute/impending-doom.md` — voice + telehealth

- **Line 160 — "worth flagging" [important]**
  Quote: "Two things worth flagging *specifically* for the impending-doom symptom:"
  Fix: "Specifically for the impending-doom symptom:" or "Two things specific to impending doom:".

- **Line 219 — Restated takeaway + "X is real" / "It still ends" refrain [important]**
  Quote: "The sustained version is still impending doom, not something worse — it's the same neurobiology stretched out over a longer window. **It still ends.** The endpoint is the same as the wave version; the path there is just slower."
  Fix: Reassurance-restating-itself. Trim and drop the bolded "It still ends" — the kind of refrain the rule warns about.

- **Line 178 — Em-dash density [minor]** — parens.

- **Line 244 — Telehealth routing too broad [minor]** — same shape as dopamine-recovery line 223.

### `src/content/post-acute/long-term-outlook.md` — voice

- **Line 34 — Performance signposting + triplet [important]**
  Quote: "The honest version — not the inspirational-poster version, not the recovery-blog tagline version. The one that earns the second mirror."
  Fix: Drop "The honest version —" prefix. Consider: "What follows isn't the inspirational-poster version. It's the one that earns the second mirror." Or trim further.

- **Line 27 — Performance signposting [minor]** — "The honest framing up top:" → cut prefix.

- **Line 183 — "X is real" tic [minor]** — "The variance is real." → "Variance is wide."

### `src/content/compounds/mgm15.md` — substance (Subs↔SR-17) + voice

- **Subs↔SR-17 pairing gap [important; substance audit]**
  Page discusses Suboxone induction extensively (line 23 "Why Suboxone is tricky with MGM-15," induction guidance through line 34) without naming SR-17 as a parallel option. SR-17's own page covers MGM-15 applicability. The 7-OH page handles this correctly — same fix shape.
  Fix: Add SR-17 reference, at minimum in the "what people have found helps" paragraph (line 34) or as a "where to read next" link, noting the SR-17 caveats around MGM-15's dual mu/delta activity (which the SR-17 page addresses at lines 100-108).

- **Line 24 — "worth understanding" [minor]** — "Both pharmacological, both worth understanding before you try this transition:" → "Both are pharmacological. Before you try this transition:".

- **Line 11 — "as of this writing" [minor; acceptable]** — time-bounding genuinely matters for a brand-new compound's market status.

### `src/content/compounds/mit-a-dhm.md` — substance (Subs↔SR-17) + voice

- **Subs↔SR-17 pairing gap [important; substance audit]**
  Suboxone-induction discussion (lines 36-47) is extensive but SR-17 is never named alongside, even though SR-17's own page covers MIT-A use (sr17018-info.md:108).
  Fix: Add SR-17 mention in the "what helps" closing paragraph (line 47) or in the routing language.

- **Line 26 — "worth flagging" [minor]** — "That alone is worth flagging: ..." → "That matters: ...".

### `src/content/compounds/pseudo.md` — substance (Subs↔SR-17)

- **Subs↔SR-17 pairing gap [important; substance audit]**
  Suboxone-considerations section (lines 34-44) is detailed without naming SR-17 alongside. Pseudo's tight mu binding is exactly the territory where SR-17's biased-agonist mechanism is most discussed in community contexts.
  Fix: Add SR-17 mention in the Suboxone-considerations section or in a "where to read next" footer.

### `src/content/post-acute/what-is-paws.md` — substance (Subs↔SR-17) + telehealth

- **Lines 207-223 — Subs↔SR-17 pairing gap in the "Clinically used (prescribed)" tier [important; substance audit]**
  Quote: "...continued **MAT** or the [single-shot Sublocade exit](/mat-suboxone/sublocade-brixadi-info#using-a-single-shot-as-an-exit-from-long-term-suboxone)."
  Fix: Add SR-17 alongside MAT in the prescribed-options list, or in the "where to read next" footer.

- **Lines 378-379 — Telehealth routing too broad [minor]**
  Quote: "**[Telehealth Providers](/resources/telehealth)** — for any of the clinically-used interventions above."
  Fix: "...for the SSRI / SNRI / bupropion / buspirone / Suboxone / Sublocade items above. LDN is mostly outside standard OUD telehealth — see the [LDN page](/other-tools/naltrexone-low-dose) for routing."

### `src/content/compounds/kratom-leaf.md` — telehealth + voice

- **Line 12 — Top-of-page disclaimer routes leaf-taper to clinician [important; telehealth audit]**
  Quote: "For clinical decisions — including whether and how to taper — see the [Telehealth Providers](/resources/telehealth) comparison and talk to a prescriber."
  Fix: Reframe to community-first with prescriber-narrow qualifier: "For clinical decisions — adjunct meds, drug interactions if you're already on a prescription — the [Telehealth Providers](/resources/telehealth) comparison flags providers with explicit kratom/7-OH experience. The leaf taper plan itself is mostly community ground; see #kratom-leaf."

- **Lines 294-297 — Same shape, partially rescued [minor]** — already acknowledges variance. Optional tightening: name what the clinician would actually help with (adjuncts, lab work) rather than the whole "taper conversation."

- **Lines 329-335 — Closing block routes to telehealth after listing SR-17 [minor]**
  Fix: "For finding a prescriber for Suboxone or helper meds, see [Telehealth Providers](/resources/telehealth). SR-17 is off-prescription; community ground."

- **Line 237 — "worth knowing" [minor; voice]** — "One other piece worth knowing:" → "One other thing:" or "Also:".

### `src/content/other-tools/naltrexone.md` — telehealth

- **Line 114 — Overview CTA conflicts with daughter pages [important; telehealth audit]**
  Quote: "**[Telehealth Providers](/resources/telehealth)** — for finding a prescriber familiar with any of these protocols, especially for kratom/7-OH dependence."
  Fix: Narrow to normal-dose, or qualify: "primarily for normal-dose naltrexone — LDN and ULDN are mostly outside standard OUD telehealth; see the LDN Research Trust on the LDN page, and the ULDN page for routing."

### `src/content/other-tools/quitkit-info.md` — telehealth + voice

- **Line 8 — Supplement-page telehealth boilerplate [important; telehealth audit]**
  Quote: "Talk to your prescriber before starting any supplement, especially if you're on Suboxone, LDN, or other medications."
  Fix: Lead with the narrow ask: "If you're on a prescribed medication (Suboxone, LDN, antidepressants, etc.), ask your prescriber about any specific interaction concerns. Otherwise this is community ground — talk it through in #vitamins-supplements or with a peer who's used a similar stack."

- **Lines 28, 60 — "X is real" tic, repeats on same page [important when cumulative]**
  Quotes: "The convenience of pre-packaged morning/night doses is real." / "The ingredients are real. People have used them and gotten through withdrawal."
  Fix: Pick a different phrasing for at least one — "Pre-packaged morning/night doses are genuinely convenient." / "The ingredients are evidence-supported."

### `src/content/other-tools/mega-vit-c-info.md` — telehealth + voice

- **Line 8 — Supplement-page telehealth boilerplate [important; telehealth audit]**
  Quote: "Talk to your prescriber before starting any high-dose supplement protocol, especially if you have kidney issues, take medications, or have a history of kidney stones."
  Fix: Reframe with kidney/interaction narrow ask leading: "If you have a history of kidney stones, kidney disease, hemochromatosis, or are on an iron supplement, ask your prescriber about that specific concern before megadosing. The broader protocol design is community territory — see #vitamins-supplements."

- **Line 109 — "worth knowing about" [minor]** — "Rare but worth knowing about." → "Rare but possible."

- **Line 116 — "as of this writing" [minor; acceptable]** — product stock context.

- **Line 140 — Antithesis ladder + bolded throat-clearing closer [minor]** — soft restatement of the takeaway already made above; trim or drop bold.

### `src/content/other-tools/vitamins-supplements.md` — telehealth

- **Line 9 — Supplement-page telehealth boilerplate [minor; telehealth audit]**
  Quote: "Talk to a doctor or pharmacist before starting anything, especially with prescription meds."
  Fix: Pharmacist is the right framing for interaction questions. Lead with that: "If you're on prescription meds, check interactions with your pharmacist or prescriber before starting anything from this list. Otherwise this is community ground."

### `src/content/start-here/thinking-about-using.md` — voice

- **Line 151 — Performance signposting [important]**
  Quote: "**The honest version: in the first weeks and months, relapse is genuinely common. It doesn't mean treatment failed. It means treatment needs to be adjusted or resumed.**"
  Fix: Cut "The honest version:". "In the first weeks and months, relapse is genuinely common. It doesn't mean treatment failed; it means treatment needs to be adjusted or resumed."

- **Line 158 — Em-dash density [minor]** — "Anything specific you've seen — 'X% of kratom users relapse in Y days' — is almost certainly not from a real study." → parens.

### `src/content/for-loved-ones/how-to-talk.md` — voice + structure

- **Lines 11–18 — "When not to bring it up" excludes use AND withdrawal without addressing the resulting paradox [important; structural; user-flagged]**
  The list says don't bring it up during use, don't bring it up during acute withdrawal, don't bring it up during acute crisis, and not when you're white-hot angry. The closing line says "the best time is often boring: a quiet evening, a long drive, a walk." For families of people in active daily cycles (especially with short-acting [7-OH](/compounds/7-oh) where the gap between use and withdrawal can be hours), this advice ends up being "wait for a moment that almost never comes." The page doesn't help the reader navigate that real paradox — it just stacks the don'ts.
  Fix shape: name the paradox directly and give practical guidance for finding the narrow openings. Options that come to mind: the comedown / post-dose stable window before the next withdrawal arc; right after sleep / early morning before the day's first dose; days when they've voluntarily stepped down or are using less; moments when they themselves bring something up. Acknowledge that for some readers the "ideal stable moment" doesn't exist and the choice is between a less-bad window and never speaking — and give them a way to pick the less-bad window.

- **Line 57 — Antithesis ladder + double-triplet [important]**
  Quote: "CRAFT is not a magic formula and it's not a substitute for your own support. It's a framework for being skillful, sustainable, and effective in a situation where most instincts (lecturing, rescuing, controlling) backfire."
  Fix: Two triplets in one sentence is the padding-to-shape pattern. "CRAFT is a framework for being effective in situations where the obvious instincts (lecturing, rescuing) tend to backfire."

### `src/content/for-loved-ones/at-home-recovery.md` — voice

- **Line 32 — Antithesis ladder [important]**
  Quote: "It's not a downgrade from 'real' treatment — it's the version most people use..."
  Fix: Direct: "Most people coming off these compounds do it at home, often with a telehealth prescriber and community as backup."

- **Line 116 — Antithesis ladder [important]**
  Quote: "**Treating the at-home path as inadequate.** It isn't. It's what most people in this community do successfully."
  Fix: "The at-home path is what most people in this community use successfully. Treating it as a fallback or as inadequate makes the work harder."

### `src/content/for-loved-ones/taking-care-of-yourself.md` — voice

- **Line 42 — Antithesis ladder + bolded throat-clearing [important]**
  Quote: "This is one of the hardest things to give up because giving it up feels like giving up. It isn't. **Stopping the surveillance is not consent for their use. It's a recognition that the surveillance has costs to you that are not buying anything for them.**"
  Fix: "Stopping the surveillance isn't consent for their use; it's an acknowledgment that the surveillance costs you something and isn't buying anything for them."

### `src/content/for-you/rehabilitation-centers.md` — voice

- **Line 60 — Performance signposting [important]**
  Quote: "Residential is genuinely valuable for some people; for others it's expensive overkill. The honest version: if you have a stable home..."
  Fix: Drop "The honest version:". "If you have a stable home, supportive people around you, and a way to get to outpatient appointments, you may not need residential."

### `src/content/other-tools/naltrexone-ultra-low-dose.md` — voice

- **Line 190 — Performance signposting + triplet [important]**
  Quote: "ULDN sometimes attracts framing of the 'mainstream medicine missed this' type. The honest version is that the field tried, the clinical translation didn't hold up, and the mechanism work that would have explained why it should hasn't survived peer review."
  Fix: Drop "The honest version is that". Trim the three parallel clauses to two for variety.

- **Line 99 — Performance signposting (mild) [minor]** — "The honest summary:" → drop prefix.

### `src/content/compounds/cats-claw.md` — voice

- **Line 24 — Combined "is real and worth knowing about" tic [important]**
  Quote: Section heading "## The synthetic-derivative angle is real and worth knowing about"
  Fix: "The synthetic-derivative angle" or "What 'cat's claw' products may actually contain."

- **Line 33 — "is real" tic [minor]** — "batch-to-batch variation is real" → "...is significant" or "...is documented."

### `src/content/mat-suboxone/suboxone-risks.md` — voice

- **Line 11 — "worth understanding" [minor]** — "and that's worth understanding" → drop coda.

- **Line 106 — "worth knowing about" section heading [minor]** — "## Other long-term effects" suffices.

### `src/content/mat-suboxone/suboxone-custom-dose.md` — voice

- **Line 74 — "worth knowing about" section heading [minor]** — "Alternative methods" or "Other approaches."

### `src/content/mat-suboxone/sublocade-brixadi-info.md` — voice + substance

- **Line 22 — "worth understanding" [minor]** — restructure.

- **Line 117 — "X is real" tic [minor]** — single instance; acceptable but could rephrase.

- **Lines 29-36 — Heads-up callout doesn't surface non-bupe alternatives [minor; substance audit]** — niche injectable page, exception broadly applies; optional reference to at-home/sr17/leaf via /for-you/at-home-treatment link.

### `src/content/other-tools/helper-meds-info.md` — voice + substance

- **Lines 87, 148 — "worth knowing about" section headings [minor]**
  Fix: "Other muscle relaxants:" / "## Other medications".

- **No SR-17 mention [minor; substance audit]** — page is helper-meds reference, not a wayfinder, but cold-turkey readers land here. Optional: link SR-17 in "How to get these" or "bottom line" so readers know the SR-17 alternative pairs with the same adjuncts.

### `src/content/post-acute/kindling.md` — voice + telehealth + substance

- **Line 100 — Em-dash density [minor]** — "...the slower stuff — sleep, mood, anhedonia — that you'd been climbing out of." → parens.

- **Lines 131-132 — Telehealth routing generic [minor]**
  Quote: "[Telehealth Providers](/resources/telehealth) is for getting (or getting back) a prescriber who knows kratom and 7-OH."
  Fix: "If you want to restart Suboxone or get back on helper meds, [Telehealth Providers](/resources/telehealth) is the comparison."

- **Lines 110-121 — Polysubstance warning missing SAMHSA hand-off [minor; substance audit]** — has naloxone + Never Use Alone, doesn't reference SAMHSA / findtreatment.gov.

### `src/content/start-here/withdrawal-help.md` — substance + voice

- **Polysubstance warning incomplete [minor; substance audit]** — lines 73-86 have don't-mix-benzos warning; doesn't include the SAMHSA polysubstance routing the rehab/at-home/loved-ones pages use. Crisis numbers are prominent so it's lower priority.

- **Line 167 — "worth understanding" [minor; voice]** — drop the meta.

- **Line 63 — "X is fine" [minor; acceptable]** — single direct usage, fine.

### `src/content/other-tools/sr17018-info.md` — voice

- **Line 12 — "worth understanding" + "we want to be honest" [minor]**
  Quote: "**It's a valid option worth understanding.** It's also still an opioid, and we want to be honest about that."
  Fix: "It's a valid option, and it's also still an opioid — be clear-eyed about that."

- **Line 59 — Antithesis ladder x2 in close [minor]** — "It's not a clinical protocol, it's community experience. Treat it as a reference, not a prescription." → "Community experience, not a clinical protocol. Reference, not prescription." or drop one negation.

- **Line 129 — "is real" tic [minor]** — single use, acceptable; could rephrase.

### `src/content/compounds/7-oh.md` — voice + substance

- **Line 227 — "as of this writing" [minor; acceptable]** — exactly the time-bounding case the rule allows.

- **Lines 270-274 — Closing reminder doesn't name SR-17 [minor; substance audit]** — page opens with the full triad and "four real paths" names SR-17. Optional: add ", SR-17" to the "MAT, helper meds, structured tapers" list in the closing reminder.

### `src/content/about/contributing.md` — telehealth

- **Line 48 — "see your prescriber" general disclaimer [minor]** — presumes reader has a prescriber. Optional: "see your prescriber or the [Telehealth Providers comparison](/resources/telehealth) if you don't yet have one."

### Smaller-issue files

The following have one or two minor flags each — clean-up items, not load-bearing fixes:

- `src/content/for-loved-ones/support-groups.md:57` — "Worth knowing about because of sheer availability" [minor voice]
- `src/content/for-you/start-here.md:15` — antithesis ladder, mild [minor voice]
- `src/content/for-you/sober-living.md:66` — antithesis ladder, contrast is doing real work [minor voice; borderline acceptable]
- `src/content/for-you/mutual-aid.md:14` — "is real" tic, single use [minor voice]
- `src/content/other-tools/cannabis-thc-in-recovery.md:284` — "worth weighing" coda [minor voice]
- `src/content/compounds/mgm16.md` (frontmatter) — "as of this writing" [minor; acceptable]
- `src/content/pharmacology/morphine-vs-kratom.md:33` — "as of this writing" [minor; acceptable]
- `src/content/pharmacology/chemical-structures.mdx:137` — antithesis ladder, single use [minor; acceptable]
- `src/content/resources/telehealth.md:420, 730` — two "worth knowing" tics [minor voice]

---

## Files clean across all three audits

These files had no significant findings from any of the three rule passes:

- `src/content/about/community.md`
- `src/content/about/this-site.md`
- `src/content/compounds/pseudo.md` *(voice clean; flagged for substance Subs↔SR-17 only)*
- `src/content/for-loved-ones/asking-them-to-leave.md`
- `src/content/for-loved-ones/boundaries.md`
- `src/content/for-loved-ones/fmla-workplace.md`
- `src/content/for-loved-ones/rehabilitation-centers.md` *(one minor em-dash line at 111, otherwise clean)*
- `src/content/for-loved-ones/safety.md`
- `src/content/for-loved-ones/start-here.md`
- `src/content/for-you/at-home-treatment.md`
- `src/content/for-you/fmla-ada-job.md`
- `src/content/for-you/mat-and-your-job.md`
- `src/content/mat-suboxone/suboxone-cows.md`
- `src/content/mat-suboxone/suboxone-rapid-taper.md`
- `src/content/other-tools/naltrexone-low-dose.md`
- `src/content/other-tools/naltrexone-normal-dose.md`
- `src/content/other-tools/tapering-with-leaf.md`
- `src/content/pharmacology/minor-alkaloids.md`
- `src/content/post-acute/sleep-recovery.md`
- `src/content/resources/crisis-hotlines.md`
- `src/content/resources/meeting-schedules.md`
- `src/content/start-here/how-to-use-this-website.md`
- `src/content/start-here/welcome.md`
- `src/content/start-here/what-is-7-oh.md`

---

## Audit coverage caveats

- **Voice audit:** ~30 of 65 files read in depth, the rest grep-scanned for the named patterns. Files that came back clean to grep weren't deep-read. The clean list above reflects "no grep hits + no concerns surfaced in adjacent reads" — a deeper second pass on `resources/telehealth.md` (long; only grep-scanned) and the for-loved-ones pages that weren't surfaced could turn up additional minor flags.
- **Substance audit:** all 64 files read against the explicit phrase patterns and Rule 3 (Subs↔SR-17) routing-context checks. Confidence is high on the Rule 3 / Rule 4 / Rule 5 / Rule 6 findings; Rule 7 polysubstance-warning coverage is judgment-based and the minor flags are debatable.
- **Telehealth audit:** all 90 grep hits across 30 files were inspected in context. Confidence is high.
- **What's NOT in this audit:**
  - **Third-party link verification.** The site has hundreds of external URLs. A full re-verification pass is a separate effort. Recently-edited pages (cannabis, naltrexone-low-dose, naltrexone-ultra-low-dose) had their links verified at edit time.
  - **CLAUDE.md "External links open in new tabs"** — this is handled by `rehypeExternalLinks` plugin in `astro.config.mjs` automatically for markdown content. JSX/Astro components would need manual audit, which wasn't done here.
  - **Last-updated freshness.** Not audited; pages currently in the audit are all on `2026-05-24`, which is today.
