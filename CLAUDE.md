# Project notes for Claude Code sessions

Project-scoped instructions for any Claude session opened in this repo.
These are durable rules — they survive across sessions.

## Always

### Don't push to prod without explicit approval for that push

`git push` is a deploy. CF Pages auto-deploys from `main`, so a push
is a production change visible to readers in withdrawal. Treat every
push as a discrete authorization decision.

- **Per-commit approval, not standing approval.** When the user says
  "push that," they're approving the specific commit they just
  reviewed. They are not granting a license to push every future
  commit in the session.
- **Default after committing: stop and report.** Once a commit lands
  locally, summarize what changed and wait for "push it" / "ok push"
  / similar. Don't push as part of the same turn as the commit
  unless the user told you to before you committed.
- **Batch when possible.** If the user is making several edits in a
  row, prefer committing the work and asking once at a logical
  stopping point rather than pushing each commit.
- The only exception is content the user has explicitly pre-cleared
  to auto-deploy ("just push fixes as you go"). That authorization
  has to be explicit and time-scoped — assume it expires when the
  task it covered is done.

### External links open in new tabs

Any link to an off-site URL must open in a new tab:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Example
</a>
```

Why both attributes:
- `target="_blank"` opens the link in a new tab
- `rel="noopener noreferrer"` is the security pair — `noopener` prevents the
  opened page from accessing `window.opener` (which can be a vector for
  tab-jacking), `noreferrer` prevents leaking the current URL via the
  Referer header.

**Markdown / MDX content gets this automatically** via the
`rehypeExternalLinks` plugin in `astro.config.mjs`. The plugin walks the
rendered tree, finds anchors whose `href` is an external URL (not relative,
not `#anchor`, and not on `quitting7oh.org`), and adds both attributes plus
an `external-link` CSS class. Don't add the attributes manually in markdown
— let the plugin do it.

**Hand-written JSX / Astro components** must include both attributes
explicitly. The plugin only runs on markdown. If you write an `<a
href="https://...">` in a `.tsx`, `.astro`, or `.mdx` JSX context, it
won't get target/rel without you adding them.

Internal links (relative URLs, fragments, `quitting7oh.org`) stay in the
same tab — opening a new tab for in-site navigation is jarring and breaks
the back button.

### Treat examples as illustrations, not specifications

When the user asks "implement X for Y", any example I offer ("here's what
that might look like — A, B, C") is one illustration, not a finalized
spec. Don't execute on my own example as if it were the user's
requirement.

Before building:

- **Search the actual content / code** for the real shape of the work.
  e.g., if the user asks to add tabs to "long pages", inspect the actual
  pages (length, structure, natural section breaks) before deciding which
  pages qualify and what the tabs should be.
- **If the right answer isn't obvious from the content, ask** — short,
  multiple-choice when possible. Better to spend 30 seconds confirming
  than to ship a wrong implementation based on a hypothetical example.
- **Never reuse my earlier hypothetical** (e.g., "Overview / Pharmacology
  / Withdrawal / Tapering") as if it were the user's pick. Those were
  conversational scaffolding, not requirements.

A good rule of thumb: if my plan to implement something is built entirely
on examples I generated myself (not on the actual repo state or an
explicit user choice), I'm probably about to do the wrong thing.

### Bump `last_updated` when editing content

When editing any file under `src/content/**/*.{md,mdx}`, update its
`last_updated:` front-matter to today's date (`YYYY-MM-DD`) in the same
commit. The displayed "Last updated" timestamp on each page and the
date column in the sitemap rely on this being current.

This applies to:

- Substantive content edits (rewriting paragraphs, adding/removing sections)
- Smaller editorial edits (factual corrections, link additions, tone fixes)
- Restructuring (reordering sections, adding callouts, etc.)

Skip the bump for:

- Pure typo fixes if there's nothing else changing in the file
- Automated tooling passes that don't change the rendered text (e.g.,
  reformatting whitespace)

If you're unsure, bump it. A slightly-too-fresh date is more honest than
a stale one.

### Keep category blurbs in sync with content

The homepage "Browse by topic" section reads its descriptions from the
`blurb` strings on each category in `src/lib/categories.ts`. When adding
a substantive new page, moving a page between categories, or removing one,
check whether the parent category's blurb still represents the section's
contents accurately and update it in the same commit.

This applies to:

- New top-level pages that materially expand what a section covers
  (a new adjunct, a new compound, a new post-acute topic)
- Page moves between categories (both the old and new category's blurb
  may need updating)
- Page removals where the blurb names a thing that no longer exists

Skip the update for:

- Minor content edits inside an existing page that don't change what
  the section covers
- Sort renumbering, frontmatter-only changes, or other metadata edits

The blurb is a one-line scannable summary, not an exhaustive list.
Representative examples are fine; pick the entries that best convey
what the section is about. Keep it punchy.

### Keep `CHANGELOG.md` current

Substantive changes go into `CHANGELOG.md`. Format: a `## YYYY-MM-DD`
header for the day the work ships, then thematic `### Subject`
subsections, then bullet points describing what shipped and why. Newest
entries on top.

Add or extend the most recent date entry in the same commit as the
substantive change. If a day's work spans multiple commits, extend
that day's entry rather than creating a second one for the same date.

This applies to:

- New top-level pages
- Significant rewrites or restructures of existing pages
- New features, layout changes, or design-system updates
- Editorial-rule changes in `CLAUDE.md` (the rule that drove the work
  belongs in the log too)
- Cross-cutting passes (a stop-slop sweep, a sourcing audit, a sort
  cascade, a cross-link sweep)

Skip the changelog for:

- Pure typo fixes
- Single date bumps with no content change
- Metadata-only edits (sort renumbering with no rendered-text change)
- Linter or formatting passes

Group related work under one subsection rather than fragmenting one
piece of work across multiple bullets. The reader scanning the log
wants the thematic story, not a commit-by-commit replay.

**The site mirrors this changelog on a public page** at
[`/about/changelog`](src/content/about/changelog.md). That file is
auto-generated by `scripts/sync-site-changelog.mjs`, which runs as
the `prebuild` hook before every `npm run build`. The reader-facing
file is overwritten from the root `CHANGELOG.md` body; never edit
`src/content/about/changelog.md` by hand. To update the public page,
edit `CHANGELOG.md` and either run `npm run sync:changelog` locally
(if you want the change reflected in the working tree before commit)
or commit and let CF Pages run the sync at build time. The script is
idempotent: re-running with no upstream changes leaves the file's
`last_updated` date alone, so dates don't churn on every build.

### Run the stop-slop pass on every prose edit, and report it

Every prose edit goes through the stop-slop ruleset before reporting
done. This is mandatory, even for short edits. The pass checks the
patterns documented in [docs/stop-slop/](docs/stop-slop/) plus the
project-specific anti-slop guidance later in this file (em-dashes,
What/Why/How/When/Who headers, "X is real" tic, "honest" credibility
markers, "worth knowing" tic, three-bullet rhythm, antithesis ladder,
hedge-stacking, etc.).

After the pass, the user-facing summary explicitly names that it ran
and what it changed. Format something like:

> **Stop-slop pass.** Cut 1 em-dash; renamed two Wh-headers (`What
> testing looks like` → `Testing workup`, `When treatment is
> considered` → `Treatment considerations`); removed an "honest"
> credibility marker.

If nothing needed changing, report "no changes" rather than omitting
the line:

> **Stop-slop pass.** No changes needed.

The point is visibility: the user should be able to see at a glance
whether the rule was followed, not have to guess. A silent pass is
indistinguishable from a skipped one.

Skip for:

- Code-only edits with no rendered prose changes
- Frontmatter-only edits (sort, last_updated)
- Pure typo fixes

### Verify on Cloudflare before stacking commits

This site deploys to Cloudflare Pages on every push to `main`. CF has
historically been the place where bugs that look fine locally surface
(e.g., Tailwind transform composition issues, stale Function bindings).

When making non-trivial changes:

1. Push a single focused commit.
2. Wait for the CF deploy to finish (~60-90s).
3. Verify with `curl -sI https://quitting7oh.org/ | head -5` — should be
   `HTTP/1.1 200 OK` with `cf-cache-status: HIT` or `MISS` (never `DYNAMIC`
   for a static page).
4. Only then move to the next change.

If a deploy returns 500 with `cf-cache-status: DYNAMIC` and empty body,
that's the signature of CF routing through a Pages Function (a
serverless function) that errors or doesn't exist. **Do not** add a
`public/_routes.json` to "disable" Functions — its presence makes CF
treat the project as a Functions project and produces exactly the bug
you're trying to fix. Roll back instead.

## Deployment

The site is on Cloudflare Pages, git-deployed from `main`. There is
also a Docker / GHCR / self-hosted path documented in [docs/deploying.md](docs/deploying.md)
for an alternative deployment.

The site is pure static — no Astro SSR adapter, no Pages Functions, no
Workers. `output: 'static'` is set in `astro.config.mjs`. Keep it that
way.

## Editing content

The site is the source of truth. Edit pages directly under
`src/content/` — see [src/content/README.md](src/content/README.md) for
front-matter and conventions. The original Discord-export ingest
pipeline has been retired; do not reintroduce it.

## UI components: shadcn/ui + React

All user-facing components are **React** built on **shadcn/ui** (Radix
primitives + Tailwind). Astro renders the markup and content collection
shell; React handles every interactive component as an island.

Conventions:

- New components go in `src/components/` (top level) and import shadcn
  primitives from `~/components/ui/`.
- Add a new shadcn primitive with `npx shadcn@latest add <name>` — it
  drops the source into `src/components/ui/<name>.tsx`, which you can
  edit freely.
- Mount React components from `.astro` files with the appropriate
  hydration directive:
  - `client:load` — needs to be interactive immediately (theme picker,
    search trigger, callouts, sidebar drawer).
  - `client:idle` — passive (back-to-top scroll listener, footer, right-
    rail TOC).
  - `client:visible` — below-the-fold-only components.
- Use semantic theme tokens (`bg-background`, `text-foreground`,
  `text-primary`, `text-muted-foreground`, `border-border`, etc.) rather
  than hardcoded zinc/teal scales. The theme picker switches between 8
  variants by setting `data-theme` on `<html>`; only semantic tokens
  follow the variant.
- The `--color-accent-*` (hex) scale is preserved for backward
  compatibility but new code should use semantic tokens.

Theme picker state:

- `theme` localStorage key → mode (`system` | `light` | `dark`)
- `theme-variant` localStorage key → variant (`accent-teal` | `zinc` |
  `slate` | `stone` | `neutral` | `rose` | `blue` | `green`)
- `ThemeScript.astro` is the inline pre-paint script — it applies both
  values to `<html>` before first render so there's no flash.

Layout:

- `BaseLayout.astro` provides the HTML shell + Header + BetaBanner +
  Footer + BackToTop.
- `DocLayout.astro` wraps in `SidebarShell` which provides the centered
  flex container with the sidebar (Sheet on mobile, plain `<aside>` on
  desktop) and the main content area.
- The Astro hamburger in `Header.astro` dispatches a `'toggle-sidebar'`
  window event that `AppSidebar.tsx` listens for to open the mobile
  drawer.

## House style

- Calm, factual, harm-reduction tone. The audience is in recovery — no
  marketing language, no judgment, no "you should" prescriptions.
- Distinguish kratom **leaf** (sometimes a valid taper tool) from
  concentrated **7-OH / MGM-15 / MIT-A / pseudo** (the synthetics this
  site is about). "Don't use kratom" framing should be specific to the
  synthetics. General descriptions of someone "struggling with kratom"
  can stay general, because problematic use happens with both forms —
  but anything prescriptive (quit, taper off, avoid) names the
  synthetics specifically.
- Discord references = "server"; everything else = "community" or "site".
  See the changelog entry on the "server → community/site" sweep.
- First-mention compound names get auto-linked by the compound linker
  (`npm run link:compounds`). Don't add the links by hand on first
  occurrence; do add them on subsequent references that need them.

### Prose voice: write like a person, not like an LLM performing thoughtfulness

Newer pages have drifted into a recognizable AI register. The patterns
below feel "balanced" while you're writing them and read as droning slop
to anyone else. Notice when you're reaching for them, and pick the plainer
version instead.

- **The antithesis ladder.** "It's not X, it's Y." "Not because A, but
  because B." "Trust the score, not the timer." Fine once for a genuine
  contrast; tic when stacked through a whole page. Say the thing directly
  instead of triangulating against what it isn't.
- **Performance signposting.** "The honest middle is...", "The bottom
  line is...", "What this means in practice is...". You're announcing
  that you're about to be credible instead of being credible. Cut the
  announcement; keep the credible sentence.
- **Em-dash addiction.** Most of your em-dashes should be commas,
  periods, or parentheses. Save the dash for moments that genuinely
  need the break. If a paragraph has more than one, audit them.
- **Bolded throat-clearing.** Bold should mark surprise or load-bearing
  words, not "the sentence I want the reader to definitely notice." If
  half the paragraphs have a bold sentence, the bolding has stopped
  meaning anything.
- **Triplet rhythm.** Three bullets, three examples, three parallel-
  structure clauses in a sentence. Vary the count, or cut to two, or use
  prose instead of a list. Real writing varies; a page where everything
  comes in threes reads as padded to a shape.
- **"Worth knowing / worth bringing up / worth understanding."**
  Throat-clearing. Either say it or don't.
- **Restating the takeaway at the end of every section.** The reader
  just read it. Trust them.
- **"As of this writing" / "in the current literature" as a tic.** Use
  it once when something might actually change soon. Not as defensive
  cover sprinkled throughout.
- **Hedge-stacking.** "Generally / typically / often / usually / in most
  cases" piled into the same sentence. Pick one. If the claim needs four
  hedges, rewrite the claim more precisely.
- **The "X is real" / "Y is fine" tic.** "Precipitated withdrawal is
  real." "A few extra days is fine, that's not failure." Used sparingly
  these land; used as a refrain they read as ChatGPT performing
  reassurance. Cut, or rephrase as a direct statement of the fact.

What good prose on this site sounds like: short declarative sentences,
concrete details, quiet authority. The voice of a harm-reduction worker
who knows the material and trusts the reader to follow without being
walked. Read a paragraph aloud. If it sounds like an executive summary
written to be defensible in a meeting, rewrite it. If it sounds like
something a person would actually say to another person, ship it.

### The stop-slop ruleset

The operationalized version of the prose-voice rule above lives in
**[docs/stop-slop/](docs/stop-slop/)** as a vendored snapshot of the
[stop-slop skill](https://github.com/hardikpandya/stop-slop) (Hardik
Pandya, MIT) plus local additions documented in the snapshot's
[CHANGELOG](docs/stop-slop/CHANGELOG.md). It's the rulebook every page
gets passed through before shipping. To avoid duplicating ~500 lines
of pattern rules here, this section just points at the canonical files:

- **[docs/stop-slop/SKILL.md](docs/stop-slop/SKILL.md)** — top-level
  rules and the Quick Checks list (run through these before delivering
  any prose)
- **[docs/stop-slop/references/phrases.md](docs/stop-slop/references/phrases.md)**
  — phrases to cut or replace (throat-clearing, business jargon,
  performative authority, AI vocabulary tells, the "serves as" dodge,
  validating-the-audience tics, banned sentence openers)
- **[docs/stop-slop/references/structures.md](docs/stop-slop/references/structures.md)**
  — structural patterns to avoid (binary contrasts, dramatic fragmentation,
  self-posed rhetorical questions, anaphora, listicle-in-a-trench-coat,
  superficial participle analyses, false ranges, "despite its challenges"
  pivot, invented concept labels, one-point dilution, the dead metaphor,
  symmetric structures, Wh-headers)
- **[docs/stop-slop/references/examples.md](docs/stop-slop/references/examples.md)**
  — before/after transformations

When a page violates one of these patterns, the fix is in the relevant
reference file. The rules here in CLAUDE.md describe project-specific
constraints (substance framing, audience mode, link verification);
stop-slop covers the general anti-AI-writing-pattern enforcement.

### Link every third party we name

When the content names a specific outside resource — an organization, a
hotline, a treatment program, a tool, a credential, a government program,
a law, a book — link it. If we have our own page on it, link internally.
If we don't, link to the canonical external source (the org's own site,
the official government page, the publisher).

Examples of things that should always have a link the first time they
appear on a page:

- Hotlines: SAMHSA Helpline → `samhsa.gov/find-help/national-helpline`,
  988 Suicide & Crisis Lifeline → `988lifeline.org`, National Domestic
  Violence Hotline → `thehotline.org`, Childhelp → `childhelphotline.org`,
  Poison Control → `poison.org`.
- Treatment locators: findtreatment.gov.
- Accreditation bodies: CARF, Joint Commission, NARR.
- Government programs: Medicaid → `medicaid.gov`, VA SUD care →
  `va.gov`, Salvation Army ARC → `salvationarmyusa.org`, FQHCs
  → `findahealthcenter.hrsa.gov`.
- Laws: MHPAEA, ADA, FMLA → their canonical `.gov` page.
- Mutual aid and support groups: their own websites (Nar-Anon, SMART F&F,
  Learn to Cope, Kratom Anonymous, etc.).
- Books and authored frameworks: publisher page or a stable bookseller
  link is fine.

Use judgment on subsequent mentions. Linking the same org five times on
one page is noise. One per page per item is usually right; relink in a
distant section if it's a real navigation moment for the reader.

If a link's canonical home moves (org rebrands, domain shifts), update
the reference rather than leaving the dead link.

### Verify every third-party link before publishing

Every external URL we add must be verified to work before the change
ships. Don't trust that a URL "looks right" — confirm it.

- **At minimum, run `curl -sIL <url>` and confirm `HTTP/* 200`** (or a
  benign redirect chain ending in 200). 404s, 403s, server errors, and
  parked-domain landing pages all count as broken.
- **For pages that exist but may have moved**, eyeball the rendered
  body or a fetch via WebFetch to confirm the page still says what the
  link text claims it says. An org's home page that now redirects to a
  rebrand can technically return 200 but no longer serve the content
  we're citing.
- **For products we're recommending — books, courses, kits, medical
  devices — the product must actually exist and be in stock for
  purchase.** A book link to an out-of-print listing, an Amazon page
  marked "currently unavailable," or a vendor page that shows the
  product but no buy button: these are all broken for our purposes,
  even though the URL returns 200. Verify by fetching the product page
  and looking for a working price + add-to-cart / buy button (or the
  vendor-specific equivalent).
- **If you can't verify a link from the environment you're in** (e.g.,
  the URL is gated behind login, rate-limited, or the verification
  signal is ambiguous), do not silently ship it. Flag it explicitly to
  the user — "I can't confirm this link works, your call whether to
  ship it." — and let the user decide. Better to surface uncertainty
  than to ship a broken citation.

Run this check before you commit, not as a post-hoc audit. The cost of
verification is a few seconds per link; the cost of shipping a dead
"Salvation Army ARC" link to someone trying to find treatment at 3 a.m.
is real.

#### Verification toolkit

Most checks work with plain `curl`. Some sites need more.

**Tier 1 — plain `curl -sIL`.** Fine for most static pages and APIs.

**Tier 2 — `curl` with full browser headers.** Many `.gov` sites
(dol.gov, hhs.gov, fmcsa.dot.gov, medicaid.gov, lawhelp.org, ada.gov,
etc.) sit behind Akamai/Cloudflare bot detection that 403s a bare
`curl -I`. Adding a real User-Agent and the `Sec-Fetch-*` headers
usually gets a clean 200:

```sh
curl -sL \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -H "Sec-Fetch-Dest: document" \
  -H "Sec-Fetch-Mode: navigate" \
  -H "Sec-Fetch-Site: none" \
  -H "Upgrade-Insecure-Requests: 1" \
  -o /dev/null -w "%{http_code}\n" --max-time 20 "$URL"
```

Use this any time tier 1 returns 403/405/000 on a domain you know is
real (almost always `.gov`).

**Tier 3 — content grep for stock/availability.** For product pages
(Amazon, vendor sites), tier 2 gets you the HTML; then grep for
`add-to-cart-button`, `buy-now-button`, `In Stock`, or the
negative-case signals (`currently unavailable`, `Out of Stock`,
`Out of Print`). Confirms the link is not just live but the product is
actually purchaseable.

**Tier 4 — `curl-impersonate` (`brew install curl-impersonate`).**
Impersonates Chrome's full TLS fingerprint. Defeats most
TLS-fingerprint-based bot detection (Cloudflare Turnstile, Akamai BMP,
DataDome) that User-Agent spoofing alone can't bypass. Invoke as
`curl_chrome116 …` with the same flags as regular curl.

**Tier 5 — headless browser.** For fully JS-rendered SPAs where no
amount of HTTP fetching gets the content (the response body has no
real markup until the JS runs). Two viable installs:

```sh
brew install --cask chromium        # ~250 MB, has a CLI
npm i -g playwright && playwright install chromium    # ~200 MB, scriptable
```

Then run a one-liner Playwright script that loads the URL, waits for a
selector, and reports whether it appears. Reserve for cases where
tiers 1–4 all fail.

Most verification needs tiers 1–2. Tier 3 covers products. Tiers 4–5
exist for the cases where everything else fails — if you find yourself
reaching for them often, the link is probably worth flagging to the
user as "hard to verify; manual check recommended" rather than spending
a lot of session time on infrastructure.

## Audience-specific language

- **Family / loved-ones pages**: use "person with a substance use
  disorder," "your loved one," or "the person you love" rather than
  "addict." Softer register overall.
- **Person-in-recovery pages**: meet the reader where they are. Don't
  assume readiness, abstinence, or shame. Don't gatekeep.
- "Addict" is fine in spaces where the audience self-identifies with the
  term, but family-facing pages call for softer language.
- Address the reader directly ("you").

## Substance framing

- Most user-facing content centers 7-OH, kratom, and opioid dependence.
  Don't introduce other substance categories (alcohol, benzodiazepines,
  stimulants, cannabis) as parallel contexts.
- The exception is **polysubstance use**: anywhere withdrawal, detox,
  or medical risk comes up, include a clear warning that mixing 7-OH or
  opioids with other substances requires professional medical
  supervision, and route the reader to SAMHSA (1-800-662-4357) or
  findtreatment.gov.

### Buprenorphine is AN option, not THE option

The community is medication-agnostic. Buprenorphine (Suboxone, Subutex)
is **one of several legitimate paths** people use to come off 7-OH and
kratom synthetics. Others documented on the site include:

- [SR-17](/other-tools/sr17018-info) as an informal taper bridge
- [Tapering with kratom leaf](/other-tools/tapering-with-leaf)
- Cold turkey with [helper meds](/other-tools/helper-meds-info)

**Naltrexone (LDN, ULDN, Vivitrol) is NOT a path off opioids.** It's a
mu-opioid *antagonist* — taking it while there are still opioids on
your receptors will precipitate withdrawal. The
[LDN](/other-tools/low-dose-naltrexone) and
[ULDN](/other-tools/ultra-low-dose-naltrexone) pages are for the
**post-acute** phase, after withdrawal is over, to help the endogenous
endorphin system come back online. Never list naltrexone as one of
the ways to quit — it's recovery support, not a quitting tool, and
the framing matters because misusing it is genuinely dangerous.

**Never write "the standard treatment is buprenorphine," "the gold
standard," "the standard of care," or any phrasing that frames bupe
as the singular correct answer.** Bupe is widely used and well-studied,
but framing it as the only path undermines readers who have made
informed choices in another direction. Write "one option," "one common
path," "a widely-used option" — not "the standard."

Telehealth pages and MAT pages are allowed to assume bupe in their own
narrow scope (a page about Suboxone is naturally about Suboxone), but
their opening framing should still acknowledge bupe as one of several
options before diving in.

#### The site is objective; don't rank paths in editorial voice

This is the **broader rule** that the Subs↔SR-17 pairing rule (below)
operationalizes. The site is an objective reference. We describe
options, the evidence behind them, the trade-offs, and the practical
realities. We do **not** rank one path as more legitimate, more
medical, or more evidence-based than another in our own editorial
voice.

**Specifically banned framings** (these have all shown up and all
violated the rule):

- "The evidence-based path is X" / "the clinical answer is X" — sets
  up everything else as not-evidence-based.
- "This is self-medication without clinical supervision" / "this is
  unsupervised" / "this isn't real medicine" — applied to leaf taper,
  SR-17, helper-med cold turkey, or anything community-documented.
  All four are legitimate paths some people in this community use.
- "The standard treatment is Suboxone" / "the gold standard is X" /
  "the standard of care is X" — already covered above, restated here
  because it's the same family of error.
- "Real recovery looks like X" / "the proper way is X" — any prose
  that implies a hierarchy of legitimacy.
- Framing one path as the "official" version and others as informal,
  off-label, or grey-area in a way that signals editorial disapproval
  rather than neutral description.

**Acceptable usages of "standard," "evidence-based," etc.:**

- Describing what mainstream clinicians default to — *as a fact about
  clinical practice* — before explaining where the community's
  experience differs ("the standard clinical protocol starts at 4 mg;
  the community has found 2 mg works better"). This is the dominant
  pattern on the site and it's correct.
- Describing a specific framework that genuinely has RCT-grade
  evidence behind it ([[CRAFT for families]] is the canonical
  example) when the contrast group also has weaker evidence. The
  "evidence-based" label here is doing factual work, not editorial
  ranking.
- Direct vendor quotes in blockquotes, attributed (documenting what
  the vendor says, not endorsing).

If you find yourself writing a sentence that implicitly answers "which
path is the real one," delete it and rewrite as neutral description.
The reader gets to weigh the trade-offs.

#### No unsupported popularity claims about which path people pick

A close cousin of the rank-paths violation: writing that **most**
community members use X, that X is **often** the path people pick,
that X is **typically** what works. These are popularity claims, and
popularity is a form of ranking — telling the reader "this is the
dominant choice" functionally signals "this is the right/normal/
expected one." We don't have data to back up popularity claims about
which paths community members use, and even if we did, the
don't-rank-paths rule above asks us not to lean on it.

**Banned framings:**

- "The path most people in this community use is X"
- "Most people don't need [alternative path]"
- "Often the path people pick when..."
- "Typically people pick X for..."
- "Usually X works for..."

**Fix shape: describe what the path IS, not who picks it.** Don't
characterize popularity, frequency, or who-tends-to-do-this. Describe
the path itself and let the reader decide whether it fits.

| Before | After |
| --- | --- |
| "The path most people in this community use is at-home treatment" | "This site is built around the at-home path: a structured taper or planned stop, with the right medications and supplements queued up..." |
| "Most people don't need inpatient or residential care" | "Inpatient or residential care isn't required to come off 7-OH — what's required is a plan, the right tools, and..." |
| "Often the path people pick when they're on higher-dose 7-OH" | "Suboxone is a partial opioid agonist. Taken correctly during a successful induction, it can drop withdrawal to nearly zero within hours..." |

**Exception: "most" / "often" doing factual work about something
other than which quitting path people pick is fine.** Examples:
"most people inducting solo at home find SOWS more honest than
COWS" (clinical observation about a scoring tool), "most people
coming off 7-OH land in the 2–8 mg range" (dose observation).
These are observations about a specific clinical detail, not
popularity claims about which path is the right one.

#### Subs ↔ SR-17 pairing rule

The site is **opinionless** on which path someone uses to quit. Every
option has real pros and cons; the job here is to educate, not steer.

**Easy rule to remember: if Suboxone is named in a quitting context,
[SR-17](/other-tools/sr17018-info) is named alongside it.** They're the
two community-validated medication-assisted paths off 7-OH and related
synthetics. Naming one without the other implicitly endorses the named
one as the "real" answer, which violates the opinionless posture.

Applies whenever the writing is recommending or routing — wayfinder
branches, "where to go next" sections, in-content "if you're trying to
quit, see X" callouts, compound-page reminders, etc. It does **not**
apply inside content that is itself scoped to a specific medication (a
Suboxone induction page can stay focused on Suboxone; an SR-17 protocol
page can stay focused on SR-17).

[Tapering with leaf](/other-tools/tapering-with-leaf) and cold turkey
with [helper meds](/other-tools/helper-meds-info) are also legitimate
paths — name them when they fit the context — but the Subs↔SR-17 pair
is the load-bearing one: those are the two MAT-equivalent options the
community has converged on for getting off the synthetics.

### Don't apply opioid-overdose framing to 7-OH specifically

7-OH is a mu-opioid agonist on paper, but **pure-7-OH overdoses
without polysubstance involvement are clinically rare.** The standard
opioid-overdose literature — prison-release mortality multipliers,
MAT-reduces-OD-deaths cohort data, "tolerance drops then you OD"
framings — describes traditional opioids (heroin, fentanyl,
prescription opioids) and does not transfer cleanly to 7-OH.

**Do not write or imply:**

- "129× overdose mortality" / Binswanger-NEJM-style stats as if they
  apply to 7-OH
- "Your tolerance dropped during abstinence; returning to your old
  dose is dangerous" as a 7-OH-specific warning
- MAT-mortality numbers (Larochelle, Sordo) as a 7-OH-specific
  argument for buprenorphine
- Anything that suggests pure-7-OH overdose is a common cause of
  kratom-adjacent death

**What IS appropriate:**

- **Polysubstance combinations kill people.** Mixing 7-OH with
  alcohol, benzos, gabapentinoids, or other depressants raises real
  overdose risk. This is the actual fatal pattern.
- **Have naloxone (Narcan) on hand as harmless safety equipment.**
  See [for-loved-ones/safety](/for-loved-ones/safety) for the existing
  framing: real-world products are mixed, combinations are dangerous,
  and Narcan is essentially harmless if given when not needed — so
  use it if there's any doubt.
- **Other kratom-derived compounds DO have meaningful overdose risk.**
  [MGM-15](/compounds/mgm15), [MIT-A/DHM](/compounds/mit-a-dhm), and
  [pseudo](/compounds/pseudo) are full mu-agonists or have long
  half-lives — overdose framing on those pages is correct and should
  stay.

If you find a passage on the site that treats 7-OH as if it carries
the overdose-mortality profile of traditional opioids, **remove it.**
Keep the polysubstance-is-dangerous framing and the practical-Narcan
framing where they exist on their own; cut the 7-OH-OD-mortality
claims entirely rather than reframing them.

### Don't make multi-year claims about the synthetics

Concentrated 7-OH products emerged in U.S. consumer markets around
2023; the kratom-synthetic recovery community took shape in early
2024. **No reader of this site has multiple years of dependence on
the synthetics specifically.** Any phrasing that assumes a multi-year
arc of 7-OH, MGM-15, MIT-A, or pseudo use is inaccurate and dates
itself fast.

**Banned framings:**

- "years of stacked use" / "years of 7-OH use" / "years on the synthetics"
- "decade-long use" / "multi-year dependence" / "after years of"
- Any phrasing that puts a multi-year clock on dependence on the
  concentrated synthetics specifically.

**Fix shape: describe severity without time.** "Longer-term extended
use," "heavy stacked use," "high-dose chronic use," "established
dependence." These capture what makes a case harder to manage without
invoking a timeframe the synthetics can't support.

**Where multi-year time references stay accurate:**

- **Kratom leaf** has been used for decades; "years of kratom-leaf
  use" is often accurate for a specific reader's situation. The carve-out
  is the synthetics, not the plant.
- The broader **opioid-use-disorder literature** has decades of data;
  cite it with explicit labeling that it's OUD-broad, not 7-OH-specific
  ("NIDA's chronic-disease framing notes...").
- **Post-quit recovery durations** (5-year remission marks, etc.)
  cited from OUD literature with the same labeling.
- **Buprenorphine maintenance** can legitimately be "years long" —
  bupe has been prescribed for OUD for 20+ years.

If you're tempted to write a duration, ask: is this about the
synthetic specifically, or about kratom leaf / the broader OUD context?
The synthetic side has a hard ceiling at ~3 years; the rest doesn't.

### Default to lower / slower than typical clinical guidance

The community has consistently found that the standard clinical
playbook for opioid dependence over-medicates for 7-OH and kratom
synthetics. Standard primary-care advice tends toward higher induction
doses (16 mg on day 1) and open-ended maintenance; what this community
has found to work better is **low-and-slow induction** (2 mg start,
titrate by 1 mg) and **short structured tapers** (typically 5–14 days
for 7-OH) where the reader's situation supports it.

When writing taper, induction, or dosing guidance:

- **Default to the community's low-and-slow numbers** (2 mg start vs.
  4 mg or 16 mg; 5–14 day taper vs. open maintenance), unless the
  reader's situation specifically calls for maintenance (long-acting
  synthetics, years of stacked use, prior unsuccessful tapers).
- **Name the tension with typical doctor advice explicitly.** Don't
  pretend the community's posture is medical consensus — it isn't.
  Being honest about that ("a standard primary-care doctor will likely
  suggest X; the community has consistently found Y works better
  because Z") helps the reader navigate the conversation with their
  prescriber rather than blindsiding them.
- For the rare case where maintenance genuinely is the right call,
  say so plainly. Don't default to taper in situations where it
  doesn't fit.

### Community routing: only our resources for calls-to-action

The site is the [Discord](https://discord.gg/quitting7oh) and
[r/quitting7oh](https://www.reddit.com/r/quitting7oh/) community's
public reference. When telling readers where to go for community
support, those are the only addresses we name.

There are two distinct contexts for naming a community space, and
the rule is different in each:

- **Routing / call-to-action context.** "Go here for the live
  conversation," "talk to peers," "post in #channel," "ask in the
  subreddit." Use ONLY our resources: the Discord and
  r/quitting7oh. Pointing readers to other subs as if they were
  our destinations is wrong. Those communities have their own
  rules, their own moderation, and their own posture, and we
  don't speak for them. Routing readers there in a "where to find
  help" voice misrepresents that.
- **Sourcing / attribution context.** "Numbers come from threads
  in X." "The pattern is documented across r/X and r/Y." That's
  factual citation, and other subs are named accurately. **When
  we do name other subs in sourcing, our resources (r/quitting7oh
  and the Discord) go first in the list,** so the reader's eye
  lands on us before the third-party citations.

The line between routing and sourcing: if the sentence is telling
the reader where to go, it's routing (our resources only). If the
sentence is describing where data came from, it's sourcing (other
subs OK, but ours first).

This rule applies to subreddits, Discord servers, Slacks, forums,
or any other community space the page might mention. If the
audience is "people looking for the live conversation," route only
to ours. If the audience is "someone reading our sourcing trail,"
list everyone honestly, with ours first.

### Only route to a clinician or telehealth for things a clinician will actually do

A "talk to a clinician" or "see [Telehealth Providers]" handoff is
only useful if the reader can actually get the thing from that
clinician. If a typical addiction-medicine prescriber isn't going to
engage with the topic — or will brush it off, pathologize the
question, or refuse to discuss it — pointing the reader at telehealth
wastes their time and erodes trust in the rest of the site. A reader
in withdrawal who books a same-day video appointment expecting help
with X, then gets a clinician who flatly won't discuss X, has just
spent $99 and an hour to feel dismissed.

**Things telehealth and addiction-medicine clinicians reliably handle.**
Route to [Telehealth Providers](/resources/telehealth) confidently
when the page is about:

- Buprenorphine (Suboxone, Subutex) induction, maintenance, or taper
- Helper meds: clonidine, gabapentin, hydroxyzine, trazodone,
  baclofen, ondansetron, mirtazapine
- Antidepressants for post-acute use (SSRIs, SNRIs, bupropion)
- Sublocade / Brixadi (specific platforms; check the telehealth page)
- Sleep medications (trazodone, doxepin, mirtazapine, hydroxyzine)
- Drug-interaction questions about a specific prescribed medication

**Things telehealth and most clinicians won't substantively engage with.**
These are community-territory topics. Default to "talk to a sponsor,
a peer in this community, or someone in your life who knows your
situation." Mention a clinician only as a narrow optional secondary
path, and only when you can name the specific thing a clinician would
actually help with:

- **Cannabis use during recovery.** Most clinicians have a
  one-sentence policy (allow / don't allow), not a conversation.
  Drug-interaction questions (CBD ↔ bupe) are the narrow exception.
- **SR-17018.** Off-prescription, no human clinical literature; most
  clinicians have never heard of it.
- **LDN / ULDN protocols for post-acute use.** A small subset of
  prescribers run these; the typical addiction-medicine telehealth
  intake will not. Route only with the caveat that prescribers
  familiar with the protocol are uncommon.
- **Tapering with kratom leaf as a strategy.** Some clinicians engage;
  many treat any kratom use as the problem and won't help plan a
  taper. Acknowledge the variance rather than implying it's a standard
  prescribed protocol.
- **Phenibut, kava, "natural" research chemicals.** Community-only
  territory.
- **Most of the supplement stack.** Beyond a brief "I'm taking X, any
  interaction concern?" most prescribers won't engage substantively.

**The default reframe for community-territory topics:**

> This isn't a decision to make alone. Talk to a sponsor, a peer in
> this community who's faced the same question, or someone in your
> life who knows your situation. If you're on a prescribed
> medication and you're worried about a specific interaction, that's
> a question for your prescriber. Otherwise this is community ground.

Adapt the wording per page. The principle: lead with people, not
prescribers, for topics prescribers won't really help with. When you
do name a clinician role, name what the clinician would actually do
in that sentence ("ask your prescriber about the CYP3A4 interaction
between CBD and buprenorphine"), not a vague "see a clinician."

The cost of routing wrong is asymmetric: routing too eagerly to
telehealth for a topic clinicians won't engage with sends the reader
on a wasted appointment; routing too cautiously to community for a
topic clinicians do handle just means the reader reads more of the
site before booking. Err toward community.

### Hydroxyzine: name the restless-legs caveat, or don't mention it at all

Hydroxyzine (Atarax, Vistaril) is a non-controlled first-generation
antihistamine that's otherwise a useful adjunct for anxiety and
sleep. The problem: first-gen antihistamines worsen restless legs
([Yang et al., *Sleep Med* 2005](https://pubmed.ncbi.nlm.nih.gov/15165526/)),
and restless legs is one of the loudest symptoms in opioid
withdrawal. For a large fraction of our audience, hydroxyzine will
make the worst symptom worse. Recommending it without flagging that
is misleading.

**The rule:**

- **If the page has room for a caveat, name the RLS issue inline.**
  ("Hydroxyzine works for some but can worsen restless legs.")
  The [Helper Medications](/other-tools/helper-meds-info) entry is
  the canonical version.
- **If the mention is part of a compact list of adjuncts** —
  "clonidine, hydroxyzine, gabapentin, trazodone" — **drop
  hydroxyzine from the list.** Adding the caveat would gum up the
  list, and not adding it sends readers with active RLS toward the
  wrong medication. The helper-meds page lists it with the caveat;
  readers who want the full menu will find it there.
- **The helper-meds page itself is the exception.** Bare mentions
  of hydroxyzine inside `other-tools/helper-meds-info.md` (the page
  where the canonical caveat lives) are fine.
- **Factual documentation of what a third party offers is fine.**
  Quoting a vendor's published list of comfort meds (e.g., the
  telehealth-providers comparison) is documenting reality, not the
  site recommending hydroxyzine.

This rule is hydroxyzine-specific because hydroxyzine is the only
non-controlled helper med where the standard prescribing pattern
genuinely interacts with a major symptom of our audience. Trazodone,
clonidine, gabapentin, baclofen, etc. don't have the same issue and
can stay in bare lists.

## Content density

- Expand on information where it genuinely serves the reader's
  understanding. Depth that answers a real question is welcome; depth
  for its own sake isn't.
- Pages should be scannable: headings, short paragraphs, clear callouts
  for crisis and safety content.
- If a topic deserves significant depth, give it its own page rather
  than padding an existing one. A page that tries to cover everything
  covers nothing well.
- Cut hedging, restated obvious points, and "comprehensive" filler.
- When in doubt: one solid paragraph beats three watery ones.

## Build / dev

```sh
npm run dev                    # local dev server (no search index)
npm run build                  # full build + Pagefind index
npm run preview                # serve dist/ locally to test search
npm run link:compounds         # auto-link compound mentions
```
