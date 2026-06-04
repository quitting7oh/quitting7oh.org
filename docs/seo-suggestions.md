# SEO Slug Review

A page-by-page audit of every slug on quitting7oh.org with rename suggestions ordered by impact-to-risk ratio. Read this, mark up what you want to change, and any rename ships as: add the 301 to `public/_redirects` + rename the content file + sweep internal links to the new URL.

## Reading the report

Each suggestion has:

- **Current slug** as it lives today
- **Suggested slug** if a rename would help
- **Why** the change improves discoverability or clarity
- **Risk** rating (low / medium / high) based on how much cross-link churn the rename causes inside the site, plus external link equity exposure

Risk has nothing to do with SEO upside; it's purely the cost of executing the rename cleanly.

Three principles guided the suggestions:

1. **Search terms over internal names.** Slugs should match what someone types into Google, not what the file is called in the repo. `helper-meds-info` is internal-doc shorthand; `helper-meds` or `comfort-meds-for-withdrawal` is search behavior.
2. **Drop the `-info` suffix.** That suffix appears nine times on the site. It's a holdover from an ingest pipeline that no longer exists and adds nothing for readers or crawlers. Most can be cut with no other change.
3. **Specificity wins for content-discovery pages, brevity wins for category indexes.** Long descriptive slugs (`thinking-about-relapse-cravings`) outrank short generic ones (`thinking-about-using`) when the search term lives in the long version.

## Quick wins: high impact, low risk

These have meaningful SEO upside and minimal cross-link churn inside the site.

| Current | Suggested | Why |
|---|---|---|
| `/other-tools/helper-meds-info` | `/other-tools/helper-meds` | Drops the `-info` cruft; the slug is exactly what people search. |
| `/other-tools/mega-vit-c-info` | `/other-tools/mega-dose-vitamin-c` | "vit-c" is internal shorthand; the search term is "mega dose vitamin c". Adds the keyword most likely typed. |
| `/other-tools/quitkit-info` | `/other-tools/quit-kit` | Match the actual product name people search for. |
| `/other-tools/sr17018-info` | `/other-tools/sr-17` | "SR-17" is what the community calls it; "sr17018" is the formal compound code. Both are searched; the hyphenated short form is by far the more common query. |
| `/other-tools/peptides-info` | `/other-tools/peptides-for-withdrawal` | Adds the use-case keyword. The generic "peptides" is too broad. |
| `/mat-suboxone/suboxone-info` | `/mat-suboxone/suboxone-for-7oh` | Specific to the use case the site serves. "suboxone" alone competes with thousands of clinical pages; "suboxone for 7oh" matches an actual underserved search. |
| `/mat-suboxone/sublocade-brixadi-info` | `/mat-suboxone/sublocade-brixadi` | Drops the suffix. |
| `/other-tools/tapering-with-leaf` | `/other-tools/tapering-with-kratom-leaf` | Adds "kratom", the actual search term. "leaf" alone is too generic to surface. |
| `/start-here/withdrawal-help` | `/start-here/7-oh-withdrawal-help` | High-traffic page missing its primary keyword. "withdrawal help" is generic; "7-oh withdrawal" is the exact phrase people in this audience search. |
| `/start-here/paths-off` | `/start-here/how-to-quit-7-oh` | "Paths off" is internal jargon. "How to quit 7-OH" is what the search bar gets. |

**Estimated lift:** these ten renames probably move the dial more than anything else on the site. None of them touch a category-level URL or rename a page that's heavily linked from outside.

## Recommended renames: moderate impact, moderate risk

Worth doing but require more internal-link sweep.

| Current | Suggested | Why | Risk |
|---|---|---|---|
| `/start-here/what-is-7-oh` | (keep) | Already optimal; flagged here only to confirm it doesn't change. | — |
| `/post-acute/what-is-paws` | `/post-acute/paws-post-acute-withdrawal` | "PAWS" alone is searched but ambiguous (paws is a many-things abbreviation). The longer slug captures both the abbreviation and the expanded term. | medium |
| `/post-acute/kindling` | `/post-acute/kindling-and-relapse` | "Kindling" is searched in recovery contexts but is a generic term; adding "relapse" helps disambiguation. | medium |
| `/post-acute/long-term-outlook` | `/post-acute/7-oh-recovery-timeline` | "Long-term outlook" is generic. "7-oh recovery timeline" matches actual queries. | medium |
| `/post-acute/impending-doom` | `/post-acute/impending-doom-anxiety` | Anxiety is the symptom-cluster term people search; "impending doom" is the colloquial framing the page uses. | low-medium |
| `/start-here/thinking-about-using` | `/start-here/cravings-and-relapse-thoughts` | "Thinking about using" is internal/colloquial. "Cravings" and "relapse thoughts" are searched terms. (The existing page title can keep its colloquial framing in the H1; the slug just needs to match search.) | medium |
| `/compounds/pseudo` | `/compounds/mitragynine-pseudoindoxyl` | "pseudo" alone is ambiguous. The full compound name matches both academic and community searches. | medium |
| `/compounds/mit-a-dhm` | `/compounds/mit-a-dihydromitragynine` | Slightly cleaner; "dhm" is internal abbreviation. | low-medium |
| `/pharmacology/minor-alkaloids` | `/pharmacology/kratom-minor-alkaloids` | Adds the missing "kratom" qualifier. | low |
| `/resources/telehealth` | `/resources/telehealth-for-suboxone` | The page is specifically about Suboxone-prescribing telehealth. The current slug is so generic it underranks. | medium |
| `/mat-suboxone/suboxone-cows` | `/mat-suboxone/sows-cows-induction-guide` | Title is "SOWS & COWS Guide" but slug is COWS-only. Aligning the two helps the page rank for both scoring tools. | medium |
| `/mat-suboxone/suboxone-isnt-working` | `/mat-suboxone/why-suboxone-isnt-working` | Adds the "why" prefix that matches how people phrase the search. | medium |
| `/mat-suboxone/suboxone-risks` | `/mat-suboxone/long-term-suboxone-risks` | Title already says "Long-Term"; slug should match. | medium |

## Judgment calls: discuss before acting

| Current | Possible direction | The trade-off |
|---|---|---|
| `/post-acute/pink-cloud` | `/post-acute/early-recovery-pink-cloud` | "Pink cloud" is what the recovery community calls it; adding "early recovery" helps Google understand the context. But the short version is the brand-aligned term. Could go either way. |
| `/post-acute/dopamine-recovery` | (keep) | "Dopamine recovery" is searched as-is. Adding "after opioids" lengthens for less return. |
| `/post-acute/depression-and-anhedonia` | (keep) | Already optimal for both terms. |
| `/post-acute/sleep-recovery` | `/post-acute/sleep-recovery-after-opioids` | Slight upside for context; modest cost. |
| `/post-acute/endocrine-recovery` | (keep, recent) | New page; let it accrue link equity at its current URL. |
| `/post-acute/naltrexone` | (keep) | Naltrexone is searched as-is. |
| `/post-acute/naltrexone-normal-dose` | (keep) | Distinguishes from LDN / ULDN clearly. |
| `/post-acute/naltrexone-low-dose` | (keep) | Optimal: matches "low dose naltrexone" search. |
| `/post-acute/naltrexone-ultra-low-dose` | (keep) | Same. |
| `/about/community` | `/about/the-community` | Title is "The Community"; slug is just "community" which collides with the *concept* (Discord/Reddit). Matching the title is cleaner and not riskier. |
| `/about/this-site` | `/about` (as page) or keep | The category index is at `/about/`; this page is the canonical "about" content. Could rename to `/about/about-this-site` or treat this as the category landing page. |
| `/for-you/start-here` and `/for-loved-ones/start-here` | `/for-you/welcome` and `/for-loved-ones/welcome` | Two "start-here" slugs in different categories isn't great for crawler clarity. Renaming to "welcome" (matching `/start-here/welcome`) is consistent. |

## Category-level considerations: broader-impact discussion

These are bigger calls because every page under the category changes URL.

| Current category | Possible direction | Discussion |
|---|---|---|
| `/other-tools/` | `/adjuncts/` or `/recovery-tools/` | The sidebar title is "Adjuncts & Supplements" but the URL is `other-tools`. That disconnect is bad for both SEO and consistency. Eight pages move. **Recommend `/adjuncts/`**: short, semantic, matches the title's first word. |
| `/mat-suboxone/` | `/suboxone/` | "MAT" is industry shorthand; "Suboxone" is what people type. Eight pages move. |
| `/start-here/` | `/getting-started/` or keep | "Start here" is action-y but doesn't match search behavior. The category is reachable from the homepage funnel anyway. Could leave. |
| `/for-you/` | `/recovery/` | "For you" is vague for crawlers. "Recovery" is the actual category. Seven pages move. |
| `/for-loved-ones/` | `/for-families/` or keep | Slightly more specific but "loved ones" is widely understood. Marginal upside; eleven pages move. |
| `/post-acute/` | (keep) | "Post-acute" is the searched term in recovery contexts. |
| `/compounds/` | (keep) | Clear. |
| `/pharmacology/` | (keep) | Clear. |
| `/resources/` | (keep) | Clear. |
| `/about/` | (keep) | Standard. |

**The biggest single SEO win at the category level** is renaming `/other-tools/` to `/adjuncts/` and fixing the title/URL disconnect. **The biggest at the page level** is `/start-here/withdrawal-help` getting "7-oh" in the slug, since that's likely the highest-traffic page on the site.

## Already optimal: leave alone

These slugs are already good and shouldn't change.

- `/start-here/what-is-7-oh`
- `/start-here/welcome`
- `/start-here/how-to-use-this-website` (could be shorter but harmless)
- `/for-you/at-home-treatment`
- `/for-you/tapering-7oh`
- `/for-you/mat-and-your-job`
- `/for-you/fmla-ada-job`
- `/for-you/mutual-aid`
- `/for-you/sober-living`
- `/for-you/rehabilitation-centers`
- `/for-loved-ones/*` (all of them; descriptive, scoped, fine)
- `/mat-suboxone/suboxone-bernese-method`
- `/mat-suboxone/suboxone-rapid-taper`
- `/mat-suboxone/suboxone-custom-dose`
- `/other-tools/vitamins-supplements`
- `/other-tools/cannabis-thc-in-recovery`
- `/other-tools/nad-iv-therapy`
- `/post-acute/dopamine-recovery`
- `/post-acute/depression-and-anhedonia`
- `/post-acute/sleep-recovery`
- `/post-acute/endocrine-recovery`
- `/compounds/7-oh`
- `/compounds/cats-claw`
- `/compounds/kratom-leaf`
- `/compounds/mgm15`
- `/compounds/mgm16`
- `/pharmacology/morphine-vs-kratom`
- `/resources/crisis-hotlines`
- `/about/changelog`
- `/about/how-ai-was-used`
- `/about/contributing`
- `/about/where-we-stand`

## Shipping a rename

For each slug change:

1. **Add the 301 redirect** to `public/_redirects` (create the file if it doesn't exist):
   ```
   /old-slug      /new-slug      301
   ```
   For category renames with wildcards:
   ```
   /other-tools/*    /adjuncts/:splat    301
   ```
2. **Rename the content file** (`src/content/<category>/<old>.md` → `src/content/<category>/<new>.md`).
3. **Sweep internal links** across the site so nothing points at the old URL. `grep -rn "/old-slug" src/content/ src/lib/ src/pages/ src/components/` finds them. Update every hit to the new URL. Don't rely on the redirect for internal navigation; search engines and accessibility-tooling both penalize unnecessary redirect hops.
4. **Update `src/lib/categories.ts`** `CATEGORY_GROUPS` and `PINNED_PAGES` if the slug appears there.
5. **Verify the build** locally: `npm run build` then `curl -sI http://localhost:4321/old-slug` (after `npm run preview`) should return a redirect, and `curl -sI http://localhost:4321/new-slug` should return 200.
6. **After push, verify on prod** once CF deploys (~60–90s):
   ```
   curl -sIL https://quitting7oh.org/old-slug | head -10
   ```
   Expected: `HTTP/2 301`, `location: /new-slug`, then `HTTP/2 200` from the new URL.
7. **Add a CHANGELOG entry** describing the rename (per the `Keep CHANGELOG.md current` rule).

Category renames (e.g., `/other-tools/` → `/adjuncts/`) are the biggest workflow item: the folder rename, the categories.ts slug update, every cross-link in content files, the `_redirects` wildcard rule, and sidebar config all touch in one commit. Worth treating as a dedicated PR rather than mixed with content changes.

## Suggested order if shipping in batches

If you want to phase the work rather than do everything in one push:

**Batch 1: quick wins (10 renames, all low risk).** ✅ Shipped 2026-06-04.

Drop the `-info` suffix from helper-meds, mega-vit-c, quitkit, sr17018, peptides, sublocade-brixadi, suboxone-info. Rename tapering-with-leaf → tapering-with-kratom-leaf. Rename withdrawal-help → 7-oh-withdrawal-help. Rename paths-off → how-to-quit-7-oh.

**Batch 2: moderate-impact renames.** ✅ Shipped 2026-06-04.

Twelve medium-risk renames (what-is-paws, kindling, long-term-outlook, impending-doom, thinking-about-using, pseudo, mit-a-dhm, minor-alkaloids, telehealth, suboxone-cows, suboxone-isnt-working, suboxone-risks) plus three judgment-call renames (about/community → the-community, for-you/start-here → welcome, for-loved-ones/start-here → welcome). The remaining judgment calls (pink-cloud, sleep-recovery, this-site) were left alone — `(keep)` directions in the table.

**Batch 3: category rename, if you decide to do it.**

`/other-tools/` → `/adjuncts/`. Dedicated PR.

**Batch 4 (optional): `/mat-suboxone/` → `/suboxone/`.**

Bigger upheaval; worth it long-term but only do if Batch 1–3 are already in.
