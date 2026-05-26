---
title: "How AI Was Used"
description: "The guardrails, the ruleset in CLAUDE.md, the mandatory link verification, the human review at the end. Explained in detail."
category: "about"
last_updated: "2026-05-25"
sort: 2
---

Most of the writing on this site went through an LLM. This page explains how, in detail, because vagueness about AI use is part of the problem.

The maintainers and moderators have direct experience using and withdrawing from [7-OH](/compounds/7-oh) and kratom synthetics. The site grew out of conversations between people who'd been there, plus about a year of helping others through the same: thousands of reddit posts, Discord conversations, direct support exchanges with people in withdrawal. That body of lived experience is the foundation of every page. Compressing it into 60+ navigable pages would take a small team of writers somewhere between three and six months of full-time work. None of the maintainers had three months of full-time anything to give. The pages would either get written badly and slowly, or not get written at all.

What we did instead: ~40 hours writing rules for the LLM to operate inside, ~80 hours generating and reviewing drafts, ~30 hours verifying every claim and link. The maintainers wrote the rules; the LLM filled in the prose. About a fifth of the time the manual approach would have cost.

## The ruleset is public

The full set of constraints the LLM operates under lives in [CLAUDE.md](https://github.com/quitting7oh/quitting7oh.org/blob/main/CLAUDE.md) in the public repo. It's a working document of about 700 lines. Anyone can read exactly what the model was told to do, and not to do.

A representative sample of what's in there:

- Voice and audience. Calm, harm-reduction, no marketing language, no judgment, no "you should" prescriptions. Family-facing pages use softer terms than person-in-recovery pages ("person with a substance use disorder" vs "addict"). Audience-mode is named explicitly at the top of every page.
- The path-ranking ban. The site does not rank quitting paths in editorial voice. Banned phrasings include "the evidence-based path is X," "the standard treatment is Suboxone," "real recovery looks like X," and any popularity claim ("most people in this community use X"). Telling a reader that one path is the authentic or default one undermines readers who chose another.
- The Subs↔SR-17 pairing rule. When the writing is routing someone, [Suboxone](/mat-suboxone/suboxone-info) and [SR-17018](/other-tools/sr17018-info) are named together. Naming one without the other implies the named one is the "real" answer. A page about Suboxone itself can stay focused on Suboxone; routing language triggers the pairing.
- Substance-specific factual rules. No opioid-overdose-mortality framing on 7-OH specifically (the mortality data from heroin and fentanyl studies doesn't transfer cleanly to a compound where pure overdose without polysubstance involvement is clinically rare). No multi-year claims about the synthetics (they emerged in 2023; nobody has multi-year 7-OH dependence). The hydroxyzine carve-out: a major helper med, but it worsens restless-legs syndrome, and RLS is a withdrawal symptom; anywhere hydroxyzine appears, the RLS caveat appears with it or it's dropped from the list.
- Link verification, mandatory. Every external link goes through a check before publication. The procedure is a five-tier toolkit in CLAUDE.md (plain curl, then User-Agent spoofing, then content-grep for stock indicators on product pages, then `curl-impersonate` for TLS-fingerprint-locked sites, then a headless browser for SPAs). Product recommendations (books, supplements, kits) have to show a working buy button, not just return HTTP 200.
- Lower and slower than typical clinical guidance. Standard primary-care advice for opioid dependence tends toward higher Suboxone induction doses (16 mg on day 1) and open-ended maintenance. The community has consistently found that lower-and-slower works better for 7-OH and the synthetics specifically (2 mg start, structured tapers over 5 to 14 days). The site defaults to community-validated numbers and names the tension with typical doctor advice openly.
- Only route to a clinician for things a clinician will engage with. Sending a reader to telehealth for a cannabis question or an SR-17018 conversation wastes their time. The page names what a clinician will actually help with, and routes community-territory topics back to peers and the Discord.

## The anti-AI-writing pass

A separate ruleset called [stop-slop](https://github.com/quitting7oh/quitting7oh.org/blob/main/docs/stop-slop/SKILL.md) runs on every draft to strip the patterns that make AI-generated prose recognizable. It's vendored into the repo at [docs/stop-slop/](https://github.com/quitting7oh/quitting7oh.org/tree/main/docs/stop-slop), originally [Hardik Pandya's MIT-licensed skill](https://github.com/hardikpandya/stop-slop) with local additions tracked in the snapshot's CHANGELOG. Em-dashes (banned site-wide; replaced with periods). Throat-clearing openers ("here's the thing"). Validation tics ("you're not alone," "this is normal") stacked through a page. The "honest tradeoffs" and "real options" credibility-marker words. The "from X to Y to Z" false ranges. The "despite its challenges" pivot-and-dismiss formula. Wh-shaped headers like "What helps". The "serves as" dodge for the simple copula `is`. Anaphora abuse. Bold-first bullets. The "let's break this down" pedagogical voice.

The list runs to several hundred patterns. Most pages get rewritten two or three times against it.

## Hard limits

The LLM was not allowed to:

- Invent doses, half-lives, receptor-binding values, or any clinical figure. Every number has a primary-source citation.
- Invent vendor names, telehealth providers, treatment programs, or hotline numbers.
- Generate quotes from community members.
- Apply opioid-overdose-mortality framing to 7-OH.
- Claim multi-year 7-OH outcomes.
- Recommend one quitting path over another in editorial voice.
- Make popularity claims about which path readers pick ("most people in this community use X").

When the model tried (and it tried), the drafts got rejected and rewritten.

## Human review and ownership

Every page on the site was read by at least one community member who has lived through 7-OH or kratom-synthetic dependence, including the maintainers themselves. Pages where the framing felt off got pushed back on. Where the AI smoothed over something hard, the page got rewritten by hand. The maintainers stand behind every page.

The LLM did not decide what goes on this site. The community did. The LLM was the tool that made the volume of writing possible.

If you're skeptical of AI-assisted content, that skepticism is warranted in general. Most of it is bad. The bar we tried to clear: would a person in withdrawal at 3 a.m., reading this page, find something useful, accurate, and grounded that they couldn't have found elsewhere? When we couldn't answer yes, the page didn't ship.

See also: [About This Site](/about/this-site), [The Community](/about/community), [Where the Site Stands](/about/where-we-stand), [Contributing & Feedback](/about/contributing).
