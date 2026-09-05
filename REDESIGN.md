# Field Guide redesign, rev 2

This branch extends the warm Field Guide redesign with a safety-and-structure
layer for readers who may be anxious, sleep-deprived, shaky, or using a small
phone. It keeps the existing content and routes intact while making the next
useful action easier to find.

## Design intent

The interface is calm and editorial rather than clinical or promotional.
Typography, whitespace, and hierarchy do most of the work. Boxes are reserved
for real objects—urgent care guidance, live meeting information, calculators,
and tables—instead of framing every paragraph or navigation link.

The second revision adds three clear urgency tiers, a persistent `Help now`
action, a stripped withdrawal fast-path, a compact homepage support strip, and
stronger structure for category indexes, compound facts, meeting schedules,
and the 404 page.

## Typography

- **Commissioner Variable** handles article and interface text. Its open forms
  and restrained proportions remain clear across long articles and compact
  controls.
- **STIX Two Text Variable** handles page and section titles. Its firm,
  book-oriented shapes establish hierarchy without making the guide feel
  promotional.
- Article text is 17px on phones and 18px from 640px up, with a 1.7 line height
  and a 70ch measure. The surrounding object column may grow to 50rem for
  tables and calculators.
- Page titles remain deliberately smaller than marketing-style hero type:
  roughly 2.05–2.4rem on document pages. Section headings use a short clay cue;
  subsections switch back to the sans face for an obvious level change.
- Lists use conventional disc and decimal markers with restrained clay color
  and increased separation between items.

Both fonts are self-hosted and use `font-display: swap`, so text remains
visible while each bundled face loads. Explicit preloads keep the type system
stable across the site.

## Color

The palette avoids blue. Light mode is warm paper and brown-charcoal ink; dark
mode is lifted warm graphite with parchment text. Burnt clay is the brand and
link color, amber communicates caution, green communicates available support,
and red is reserved for immediate help.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Page | `hsl(43 38% 97%)` | `hsl(22 14% 10%)` | Reading background |
| Card | `hsl(44 44% 99%)` | `hsl(22 13% 13%)` | Object surfaces |
| Ink | `hsl(22 16% 14%)` | `hsl(42 28% 92%)` | Body and headings |
| Burnt clay | `hsl(15 42% 38%)` | `hsl(18 48% 70%)` | Links and ordinary actions |
| Amber | `hsl(35 88% 46%)` | `hsl(38 90% 58%)` | Caution and time-sensitive status |
| Green | `hsl(104 35% 34%)` | `hsl(104 43% 61%)` | Live and available support |
| Emergency | `hsl(2 62% 43%)` | `hsl(7 67% 67%)` | Immediate help only |

Body, muted text, links, primary controls, support, warning, and emergency
token pairs were checked programmatically in both themes and meet WCAG AA.

## Spacing and layout

Spacing follows a four-pixel base. Shared controls have a 44px minimum target;
crisis actions use 52px. On phones the document source order puts the article
before the hidden navigation payload. Desktop restores the guide index to the
left visually, while long pages keep a sticky, internally scrolling contents
rail on the right.

The mobile contents control sits above the article. Drawers and search use
`dvh` and safe-area insets. Tables remain semantic tables inside horizontal
scroll containers with a visible mobile swipe cue and a sticky first column
where useful.

Urgent care cards use a compact solid header and a full-size body:

- green support: talk to someone now;
- amber caution: check with a clinician first;
- red emergency: call 911 or go to the ER now, including an assistive-text
  urgency prefix.

Quiet informational notes retain the simpler clay-edge treatment.

## Components and behavior

- The header carries a persistent `Help now` button. The overlapping floating
  crisis pill was removed.
- The scheduling notice is static Astro HTML with a tiny dismissal script. Its
  existing localStorage key is preserved, and a pre-paint check prevents both
  a dismissed-state flash and hydration layout shift.
- Search renders as a working results-page link before hydration, then upgrades
  to the MiniSearch dialog at idle. The dialog uses full-screen mobile geometry,
  focus management, Escape close, and keyboard result navigation.
- The homepage `Right now, if you need it` strip combines withdrawal help,
  Discord `#sos`, the next 7-OH/kratom meeting, and Live NA/SMART alternatives
  when a kratom-specific meeting is not live.
- The withdrawal-help URL now uses a stripped `CrisisLayout`: four short steps,
  52px actions, community support, local meeting data, symptom shortcuts, and
  an emergency care card before the full existing guide.
- Live meeting SSR now reserves the hydrated card’s space, eliminating the
  previous large layout shift.
- Category indexes include page counts, descriptions, pinned cues, and updated
  dates. Compound pages gain a fact panel; meeting schedules gain a local-time
  hero; `/404` provides search and fast links.
- A reusable two-column Do/Don’t component and the three-tier care-card anatomy
  are available for future MDX use without changing current prose.

Lucide remains the single icon family. Transitions are brief, pressed states
are visible, and `prefers-reduced-motion` removes smooth scrolling and motion.

## Preserved functionality

- Static output remains enabled; there is no adapter, server function, or edge
  middleware.
- Pre-existing routes remain available. The MiniSearch experiment adds a
  dedicated `/search` page and a static `/search-index.json` asset.
- MiniSearch indexes guide content and selected live-resource routes during
  the Astro build. The changelog and utility shells stay out of results.
- Theme selection still runs before paint and preserves system/light/dark
  behavior.
- Meeting widgets and schedules continue to use `src/data/meetings.ts`.
- Taper and SOWS components retain their dosing and scoring math.
- Breadcrumbs, category pagination, updated timestamps, changelog sync, mobile
  navigation, active-section tracking, and external-link behavior remain.
- The site-architecture reference under `src/content` was updated to describe
  this experiment. No recovery-guidance content, GitHub workflow, or existing
  automation script was changed for the search work.

No functionality was intentionally deferred.

## Required before merging to `main`

We have not adapted the ban-status automation on this branch. Complete and
verify every item below before merging the redesign:

- [ ] In `scripts/update-ban-status.mjs`, change both hard-coded banner paths
  from `src/components/SchedulingBanner.tsx` to
  `src/components/SchedulingBanner.astro` (the `BANNER` constant and the
  early `currentBanner` read).
- [ ] Update both date strings in `SchedulingBanner.astro`: the compact
  “The DEA has not banned 7-OH as of …” text and the wider “As of …, the DEA
  has not banned 7-OH” text. The updater must assert that both replacements
  succeeded.
- [ ] In `.github/workflows/update-ban-status.yml`, change the staged banner
  filename from `src/components/SchedulingBanner.tsx` to
  `src/components/SchedulingBanner.astro`.
- [ ] Bring the latest ban-status commit from `main` into this branch before
  the final merge so the verified date and docket count do not move backward.
- [ ] Add a non-writing compatibility test that exercises the updater’s
  expected banner and ban-page patterns without contacting external services
  or changing working-tree files.

Do not consider the redesign merge-ready until that compatibility test and the
normal production build both pass.

## Toolchain

The MiniSearch experiment replaces Pagefind with one small client-side search
dependency. It uses the current experimental-branch stack:

| Package | Version |
| --- | --- |
| Astro | 7.2.3 |
| Vite | 8.2.1 |
| React | 19.2.8 |
| Tailwind CSS | 4.3.3 |
| MiniSearch | 7.2.0 |
| TypeScript | 7.0.2 |

The project is verified with Node 24.15.0 and npm 12.0.2.

## Search experiment

The comparison used 40 representative queries plus an 18-query blind holdout.
The existing Pagefind configuration returned a weighted relevance score of
60.6% on the main set and 49.4% on the holdout. The MiniSearch prototype scored
91.7% and 77.2% respectively, with the correct page first for 70.9% of the
holdout weight. Tuning Pagefind against the known queries raised its main-set
score but did not improve the blind holdout, so the experiment favors the
smaller, explicit MiniSearch ranking policy.

Search is still static and private by construction: Astro serializes the index
at build time, browsers fetch it on demand, and queries are evaluated locally.
The interface adds typo tolerance, recovery-language aliases, natural-question
routing, deep links to the best matching section, one quiet safety result for
narrowly detected immediate risk, negation handling, suggested queries, and
shareable topic/type filters on `/search`. Best-match recovery guidance does
not receive crisis styling.

## Verification

- Clean production build: 105 static outputs with no server runtime.
- Search index: 88 page records, 739,207 bytes raw and about 184 KB gzip in the
  measured build.
- Search regression suite: 53 of 53 representative, intent, false-positive,
  typo, safety, negation, and exclusion cases pass without writing files.
- TypeScript `--noEmit` and `git diff --check` pass.
- Keyboard and mobile-width interaction checks cover embedded homepage search,
  the header dialog, section links, urgent pins, filters, empty results, arrow
  navigation, Enter, and Escape.

The earlier rev-2 redesign baseline remains:

- Generated-HTML audit: exactly one `h1`, skip link first, no skipped heading
  levels, no duplicate IDs, and no external anchors missing
  `target="_blank" rel="noopener noreferrer"`.
- Axe 4.13.0 on homepage, crisis, long guide, meetings, and category templates:
  zero violations on all five.
- Mobile Lighthouse handoff run:

| Template | Performance | Accessibility | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 95 | 100 | 2.7s | 0ms | 0 |
| Crisis fast-path | 98 | 100 | 2.3s | 0ms | 0.006 |
| Long guide (`helper-meds`) | 95 | 100 | 2.7s | 0ms | 0 |
| Meeting schedules | 96 | 100 | 2.6s | 0ms | 0 |
| Category index | 96 | 100 | 2.6s | 0ms | 0 |

All five meet the package’s performance and accessibility score floors. Four
simulated LCP readings remain 0.1–0.2s above the 2.5s stretch target; the
observed long-guide LCP was 1.15s. The custom serif was retained rather than
removed to optimize only the synthetic score.

The existing twelve files under `docs/redesign-shots/` document the first
redesign. They have not been refreshed for rev 2 because the app’s visual-test
connection was unavailable throughout final QA. The required 320/390/768/1440
light/dark screenshot matrix and manual keyboard/screen-reader walkthrough are
the remaining verification artifacts; they are not functionality deferrals.
