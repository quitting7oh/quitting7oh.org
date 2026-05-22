# Changelog

All notable changes to **quitting7oh.org** are recorded here.

This site is a community recovery resource compiled from Discord channel
exports. The format is loosely based on [Keep a Changelog](https://keepachangelog.com/);
versioning is not strict — changes ship continuously.

## [Unreleased] — 2026-05-21 / 2026-05-22

### Site bootstrap & initial content

- **New Astro 5 project** with content collections, MDX, Tailwind v4
  (via `@tailwindcss/vite`), typography plugin, Pagefind search.
- **Three-state dark mode** (`system` → `light` → `dark`): toggle in the
  header, inline pre-paint script to prevent flash, `matchMedia` listener
  for live OS-theme changes while in `system` mode. Tailwind v4
  `@custom-variant dark` powers the class-based theming.
- **Self-hosted Inter** via `@fontsource-variable/inter` — no Google Fonts
  request.
- **Shiki dual-theme code blocks** (`github-light` + `github-dark`),
  swapped via the `.dark` class.
- **External-link rehype plugin** — auto-adds `target="_blank"`,
  `rel="noopener noreferrer"`, and a CSS-driven indicator icon to
  off-site links.
- **Heading-anchor rehype plugin** — appends a hover-revealed `#` link
  to each H2/H3/H4. The visible `#` is rendered via a CSS `::before`
  pseudo-element so it never enters the DOM as text (which Astro's
  TOC extractor would otherwise pick up).
- **Site structure**: 7 top-level categories — Start Here, Active
  Withdrawal, Compounds, MAT / Suboxone, Other Tools, Post-Acute,
  Resources. Sidebar nav auto-populates from content collection
  entries; URL structure is `/<category>/<slug>`.
- **Homepage**: calm hero, prominent CTA for active-withdrawal SOS,
  category grid with page counts, hero search.

### Ingest pipeline (Discord exports → site content)

- **`scripts/ingest-discord.mjs`** — reads Discord channel exports from
  `/imports/`, parses messages, strips per-message metadata, joins them
  into clean markdown, writes to `src/content/<category>/<slug>.md`.
- **`scripts/channel-mapping.json`** — maps Discord channel slugs to
  site categories with optional title overrides.
- **Multi-channel exports** supported — a single input file containing
  multiple `# #channel-name` sections splits into multiple output files.
- **CLI flags**: `--dry-run`, `--file <path>`, `--in <dir>`, `--out <dir>`,
  `--verbose`. Files prefixed with `_` and `README.md`/`index.md` are
  skipped (treated as fixtures or exporter manifests).
- **Two-pass discovery for cross-linking**: pass 1 scans every input
  file's channel header to build a `knownChannels` set; pass 2
  transforms bodies and links `**#channel-name**` and bare `#channel-name`
  references only when a corresponding site page exists (or will exist
  after this run).
- **Fuzzy channel-name matching** — `normChannel()` strips non-alphanumerics
  and lowercases, so `#mgm-15` / `#mgm15` / `#7oh` / `#7-oh` all resolve
  to the same canonical page.
- **Discord syntax stripping** in body transform:
  - `*(edited)*` markers (both inline and on header lines)
  - `*Reactions:* …` reaction summary lines
  - `-# …` Discord subtext lines
  - `:emoji:` shortcodes → unicode (via `emojiMap` in the config)
  - `<@123>` and bare `@username` mentions → anonymized
- **Chronological message ordering** — sorts by parsed message timestamp
  (oldest → newest) regardless of input direction. Different Discord
  exporters produce different orderings; sorting handles both.
- **Code-fence-aware regex** for title derivation and channel-ref
  conversion (Python comments like `# foo` inside code blocks no longer
  get mistakenly picked up as headings or channel references).
- **Auto-derived front matter**: title (from channel override → first H1
  → titleized channel name), description (first paragraph, truncated to
  120 chars), last_updated (most recent message timestamp), category
  (from mapping), source_channel (the Discord channel name).
- **`manual: true` front-matter flag** — when set on an existing
  `src/content/` file, ingest skips that file even if its source channel
  appears in `/imports/`. Lets you protect editorially-restructured
  pages from being clobbered.
- **Description preservation on re-ingest** — `existingDescription()`
  reads the on-disk file's front matter and prefers a non-empty
  hand-curated description over the auto-derived one. Makes it safe to
  hand-write descriptions even on non-manual files.
- **Compound auto-linker** (`scripts/lib/compound-linker.mjs`,
  `scripts/link-compounds.mjs`) — turns the *first* mention of each
  known compound (7-OH, MGM-15, MIT-A/DHM, pseudoindoxyl, Cat's Claw)
  on each page into a link to its compound page. Self-link prevention
  (a compound page doesn't link to itself). Skips code blocks, inline
  code, existing markdown links, headings, blockquotes. Idempotent.
  Integrated into the ingest pipeline AND runnable standalone via
  `npm run link:compounds`.
- **Pre-commit hook** at `.githooks/pre-commit` — runs `markdownlint-cli2`
  on staged content files. Loose config in `.markdownlint-cli2.jsonc`.

### Content (ingested + editorial)

#### Imported from Discord exports (20 pages, ingested via the pipeline)

| Category           | Pages                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| start-here         | what-to-expect, for-loved-ones                                         |
| active-withdrawal  | helper-meds-info, quitkit-info, vitamins-supplements                   |
| compounds          | cats-claw, mit-a-dhm, mgm15, pseudo                                    |
| mat-suboxone       | suboxone-info, suboxone-cows, suboxone-custom-dose, suboxone-isnt-working, suboxone-rapid-taper, suboxone-risks, sublocade-brixadi-info |
| other-tools        | low-dose-naltrexone, mega-vit-c-info, sr17018-info, tapering-with-leaf |
| post-acute         | what-is-paws, sleep-recovery                                           |
| resources          | quickmd-info                                                           |

#### Hand-written editorial pages (`manual: true`)

- **`welcome.md`** — 5.8 KB orientation page: who the site is for, what
  it is/isn't, 6 contextual starting points (active withdrawal, considering
  MAT, post-acute, understanding compounds, loved ones, researchers),
  Discord + subreddit links, closing reassurance.
- **`sos-resources.md`** — emergency-ready SOS page: 988/911 callout,
  Discord/subreddit links up top, "in the next hour" action list, hour-
  by-hour timeline table, **three** paths from here (tough-it-out vs.
  Suboxone vs. SR-17018), explicit ER red flags, sleep/food/mindset
  sections, closing reading list.
- **`resources/community.md`** — full page on the Discord
  (`discord.gg/quitting7oh`) and subreddit (`r/quitting7oh`), with a
  "which to use when" comparison table, anonymity note, "how to help"
  section.

#### Editorial expansions to existing pages

- **`suboxone-info.md`** (now `manual: true`) — added three major sections:
  - **Why we start low — receptor occupancy**: PET-imaging table showing
    the bupe receptor-occupancy curve flattens past 8 mg (2 mg ≈ 50–60%,
    8 mg ≈ 85–90%, 16 mg ≈ 92%, 32 mg ≈ 95%); the cost of starting at
    16+ mg is a much longer/harder taper for negligible additional
    coverage.
  - **About taper duration**: 5–14 days is the realistic range for this
    community (not weeks/months). Per-dose-range table. Corrected after
    user feedback ("None of our tapers is ever weeks or months").
  - **Long-term maintenance is a real option**: explicit "no shame";
    pharmacological framing (this community is short-taper-focused
    because 7-OH responds to short tapers, not because long-term is
    failure); when to consider Sublocade/Brixadi instead; pointer to
    r/suboxone for maintenance discussion.
- **`suboxone-cows.md`** (now `manual: true`, renamed to "COWS & SOWS Guide") —
  added full **SOWS** (Subjective Opiate Withdrawal Scale) section: 16
  symptom items, 0–4 scoring, severity bands, induction threshold
  (SOWS ≥ 17 ≈ COWS ≥ 12), guidance on which scale to use in which
  context (COWS for clinician-assisted, SOWS for solo home induction).
- **`vitamins-supplements.md`** (now `manual: true`) — restructured:
  H1 + disclaimer first, **Quick recommended list** section with 5
  scannable tables (Start with these / sleep / mood-and-PAWS / physical
  symptoms / avoid), then the detailed sections with dosing and
  citations.

#### Homepage callout — nuanced

The "trust the clinician" callout on the homepage was rewritten to
acknowledge that for some MAT decisions (Suboxone starting doses, taper
pacing) the community has lived experience worth bringing to the
prescriber conversation, without abandoning the broader "clinician
knows your situation" framing.

#### Site-wide language fixes

- **"server" → "community"/"site"** — 41 references across 13 imported
  pages reviewed case-by-case. "Discord server" kept where explicitly
  Discord; everything else mapped to "this community" (when referring
  to people) or "this site" (when referring to editorial focus).
  Changes made in `/imports/` so they survive future re-ingestion.

### Search

- **Pagefind** integrated. Lazy-loaded only when the user focuses a
  search input — visitors who never search download zero JS for it.
- **Header search** (`<SearchBox variant="header">`) and **hero search**
  on the homepage (`<SearchBox variant="hero">`). Both wired to the
  same Pagefind client.
- **Dev-mode message** improved — instead of "Search index not available
  (was the site built with `npm run build`?)", it now reads "Search is
  only available on the deployed site. To test locally, run
  `npm run build && npm run preview`."
- Index built into `dist/pagefind/` as the post-Astro step of
  `npm run build`. **Currently indexed: 27 pages, ~3,636 words.**

### Front matter & descriptions

- **Schema in `src/content.config.ts`** — typed with zod:
  `title, description, category, last_updated, source_channel, sort, draft, manual`.
- **All 27 page descriptions tightened** from auto-generated 150–160-char
  snippets (which were getting cut off in cards/snippets) to hand-written
  ~80–110-char summaries.
- **Ingest auto-truncation lowered** from 160 → 120 chars for future
  imports.

### "Edit this page on GitHub" fix

- Astro 5's glob content loader returns `doc.id` *without* the file
  extension, so my old `editOnGithubUrl(doc.id)` produced
  `…/start-here/welcome` (404) instead of `…/start-here/welcome.md`.
  The page route now uses `doc.filePath` and slices off
  `src/content/` to get the actual relative path with extension.

### Deployment infrastructure

Two supported deploy paths, both wired up:

**Option A — Cloudflare Pages (managed, free):**
- `wrangler.toml` with `pages_build_output_dir = "dist"`.
- `public/_headers` — security + cache headers.
- `public/_redirects` — placeholder for permanent redirects.
- Build command `npm run build`, output `dist/`, Node 22.

**Option B — Docker + GHCR + self-hosted:**
- **`Dockerfile`** — multi-stage: `node:22-alpine` builds Astro +
  Pagefind, output copied into `nginx:1.27-alpine`. Includes
  `HEALTHCHECK` for orchestrators. Listens on :8080.
- **`docker/nginx.conf`** — gzip, immutable cache for `/_astro/*`,
  short cache for `/pagefind/*`, security headers (CSP-adjacent set,
  HSTS deferred to Caddy), trailing-slash routing via `try_files`,
  `/healthz` endpoint, hidden version banner.
- **`.dockerignore`** — excludes `node_modules`, `dist`, `imports`,
  CI/docs, etc.
- **`.github/workflows/docker-publish.yml`** — multi-arch
  (linux/amd64 + linux/arm64) build on every push to `main`,
  publishes to GHCR as `ghcr.io/<owner>/<repo>` with tags `latest`,
  `sha-<short>`, semver (`v*.*.*`), and PR branches. Includes build
  attestation, provenance, and SBOM.
- **`docker-compose.yml`** — reference stack with `site` (the nginx
  container), `caddy` (TLS + HTTP→HTTPS + www→apex), and an optional
  `watchtower` that polls GHCR every 5 min.
- **`Caddyfile`** — reverse-proxy config: automatic Let's Encrypt
  via ACME, HTTP/3 enabled, HSTS, www→apex canonical redirect.
- **`docs/deploying.md`** — full server-setup walkthrough: VPS
  provisioning, DNS, Docker install, GHCR auth (public + private
  flows), starting the stack, day-to-day operations (push, rollback,
  pinning), logs/troubleshooting matrix, hardening, scaling notes.

### Bugs fixed during the session

- **Ingest's title regex matched inside code fences** (Python comment
  starting with `#` got picked as the page title). Now strips fenced
  code blocks before scanning for the first H1.
- **Channel reference double-replacement** — `**#suboxone-info**` was
  being wrapped twice (`[[#suboxone-info](/...)](/...)`). Added `[` to
  the exclusion class in the bare-reference regex so the bracketed text
  inside an already-formed link doesn't re-match.
- **Discord message-header regex too strict** — failed on headers with
  trailing `*(edited)*`. Now accepts an optional `*(edited)*` suffix.
- **Reverse-message-order assumption was wrong for one of the export
  formats** — caused the H1 to end up buried mid-document. Now sorts by
  timestamp regardless of source order.
- **`*Reactions:* 👍 3`** lines were rendering as literal text on the
  site. Now stripped during body transform.
- **`-#` Discord subtext lines** rendering as literal text. Now
  stripped.
- **`SKIP14` literal text leaking into rendered pages** from the
  compound-linker's mask/restore cycle when a blockquote contained a
  markdown link (nested masks). Token format changed from
  ` SKIP${n} ` (whitespace-delimited) to `\x00SKIP${n}\x00` (U+0000-
  delimited, can't appear in source) and restore now loops until
  stable to unwind nested masks.
- **Compound pages were self-linking** ("7-OH" on `/compounds/7-oh`
  linked to itself). `linkCompounds()` now takes a `selfUrl` and skips
  that compound on its own page.
- **TOC entries had trailing `#`** because the heading-anchor rehype
  plugin added a text-node `#` child that Astro's heading extractor
  picked up. The `#` is now rendered via CSS `::before` on the anchor
  element.
- **Bold text invisible in dark mode** because the Tailwind Typography
  plugin's `--tw-prose-bold` defaults to near-black. Added
  `dark:prose-invert` to the `<article>` wrapper.
- **Pagefind dynamic import failed at build time** because
  `/pagefind/pagefind.js` doesn't exist until the post-Astro Pagefind
  step runs. URL is now constructed at runtime so Rollup can't
  statically analyze it.
- **`src/content/README.md` was being picked up as a content entry** and
  failing zod validation. Glob pattern now excludes `**/README.md`.
- **`.astro/content-assets.mjs` missing after a hard cache clean** —
  documented the safe-clean sequence (`rm -rf dist .astro
  node_modules/.vite && npx astro sync`) in the prior conversation.

### Docs

- **`README.md`** — local dev, ingest workflow (Paths A + B), adding a
  page, adding a category, both deploy options with a decision table,
  what the site won't do.
- **`src/content/README.md`** — 5-step "add a page" guide, full front-
  matter reference table (including the new `manual` flag), available
  markdown features, callout usage in MDX, what not to do.
- **`imports/README.md`** — non-developer Discord-export workflow,
  multi-channel exports, idempotency, the `_`-prefix skip convention,
  the `manual: true` flag for protecting editorial work.
- **`docs/deploying.md`** — full server-setup walkthrough (already
  listed under Deployment).

### Pharmacology section (new category)

- **New top-level category: Pharmacology** (`🔬`) — for deeper science
  content beyond the practical compound overviews.
- **`pharmacology/minor-alkaloids.mdx`** — Kratom's Minor Alkaloids:
  Serotonergic & Adrenergic Activity Beyond the µ-Opioid Receptor. The
  7-column chart of mitragynine vs. paynantheine, speciogynine,
  speciociliatine, corynantheidine, 9-hydroxycorynantheidine, and
  mitraphylline across µ-opioid / 5-HT / α-adrenergic receptor systems.
  Recovery-reader intro at the top routes anyone in acute withdrawal
  to the right pages elsewhere on the site.
- **`pharmacology/morphine-vs-kratom.mdx`** — Morphine vs. *Mitragyna*
  Alkaloids: Structure, Modification & µ-Opioid Receptor Binding.
  Side-by-side structural pharmacology.
- **`scripts/convert-pharma-html.mjs`** — one-shot converter that
  extracts the `<style>` and `<body>` from the source HTML, drops the
  Google Fonts link, and remaps the doc's CSS variables (`--paper`,
  `--card`, `--ink`, `--em`, etc.) to our site palette (zinc + accent-
  teal) in both light and dark mode. Output is two Astro components
  under `src/components/pharmacology/` whose styles are auto-scoped
  by Astro so they don't leak. Original layout (2000px-wide reference
  sheet with the 7-column grid, molecule SVGs, receptor activity
  cards, polypharmacology map, caution + clarification panels, source
  citations) preserved intact. Horizontal-scroll on narrow viewports
  so the chart stays legible on mobile.
- Each page also includes a "Reference, not advice" callout at the
  bottom, and `manual: true` so the MDX wrappers don't get clobbered
  by ingest.

### Pharmacology charts — `wide: true` layout

The two pharmacology reference charts (1200px min-width) wouldn't fit
inside the standard 832px content column. After two iterations:

**First try — full-bleed `calc(50% - 50vw)` escape:** broke out of the
prose column but pulled the chart *under* the left sidebar. Reverted.

**Final fix — new `wide: true` front-matter flag:**

- Added `wide: z.boolean()` to the content schema.
- `DocLayout` checks the flag: when `true` it **keeps the sidebar**
  (so site navigation still works on pharma pages) but **hides the
  TOC** and removes the `max-w-[52rem]` content-column constraint.
- The outer container expands from `max-w-[88rem]` (1408px) to
  `max-w-[112rem]` (1792px) on wide pages, giving the chart enough
  room next to the sidebar (~1408px of usable main width).
- The chart's own `max-width: 1600px` caps it on huge displays;
  `min-width: 1200px` with `overflow-x: auto` provides horizontal
  scroll inside the chart wrapper on viewports narrower than 1200px.
- Both pharmacology MDX pages now set `wide: true`.

Header, footer, and beta banner stay at the standard `max-w-[88rem]`
so the chrome doesn't sprawl. Slight asymmetry on 1792px+ displays
(content extends past chrome) but the chart fits cleanly.

### Wider site layout

Bumped the layout widths across the board for a less constrained feel
on modern displays (laptops 1440px+, desktops 1920px+):

| What                                   | Was            | Now              |
| -------------------------------------- | -------------- | ---------------- |
| Outer container (header/footer/main)   | 1280px         | 1408px           |
| Doc content column                     | 704px          | 832px            |
| Category index inner column            | 768px          | 832px            |
| Sitemap container                      | 1024px         | 1152px           |
| Homepage hero + medical-disclaimer     | 896px          | 1024px           |
| Homepage category grid                 | 3-col max      | 4-col at xl      |

Content prose stays in a comfortable line-length range (832px = roughly
85-95 chars per line at 16px Inter), but the page itself fills more of
modern wide screens.

### Site map + footer

- **New `/sitemap` page** at [src/pages/sitemap.astro](src/pages/sitemap.astro)
  — human-readable index of every page on the site, grouped by category,
  with title + source channel + description for each entry, and an
  "editorial" badge on `manual: true` pages. Cross-links the
  search-engine sitemap at `/sitemap-index.xml` for crawlers.
- **Footer link bar** added at the bottom of every page: Site map ·
  Community · GitHub.

### Honest ER framing on the SOS page

- The "ERs are required to stabilize you" paragraph was rewritten to
  keep the legal facts (EMTALA, no legal trouble for disclosure,
  on-site Suboxone induction) but acknowledge the lived reality that
  not every ER and not every doctor handles withdrawal well. New
  section gives readers concrete agency tools:
  - Stick to medical facts and numbers (COWS score, symptoms)
  - You can ask for a different provider, or escalate to the attending
  - Bring someone if possible — presence changes how staff behave
  - AMA discharge is allowed when you're not in active emergency
  - A bad ER doesn't mean medical care won't help; a telehealth
    Suboxone visit may be a better path

### ULDN (Ultra-Low-Dose Naltrexone) — new page

- **`other-tools/ultra-low-dose-naltrexone.md`** added (manual editorial).
  Companion to the existing LDN page. Covers the μg-range dose space,
  the dual-signaling-model mechanism, and the two community use cases:
  smoothing the bottom of a Suboxone taper, and reducing tolerance
  during longer-term bupe/Subutex maintenance.
- The LDN page now ends with an explicit "Not the same as ULDN" entry
  pointing readers to the new page (LDN is mg-range, after-withdrawal;
  ULDN is μg-range, taken *with* opioids). Added in both `imports/`
  and `src/content/` so the cross-link survives any future re-ingest.
- New entry in `scripts/channel-mapping.json` so `#ultra-low-dose-naltrexone`
  channel references route correctly.

### 7-OH page filled in (was a placeholder)

The site is named after this compound, but the `compounds/7-oh.md` page
had been sitting as a stub. Replaced with a real, manual-editorial page
covering:

- What 7-OH actually is (alkaloid in *Mitragyna speciosa*, naturally
  trace amounts, sold concentrated/semi-synthetic at retail).
- Pharmacology: µ-receptor binding affinity (K<sub>i</sub> ~13-17 nM,
  ~10× tighter than mitragynine), partial agonist with meaningful
  intrinsic activity, mu-dominant.
- Plasma half-life ~100 minutes — short by opioid standards.
- A side-by-side comparison table: **leaf kratom vs. concentrated 7-OH**.
  This is the single most important framing for new readers.
- Acute withdrawal timeline (table) and the SNRI-like overlay from
  stacked products.
- "Why 7-OH is actually tapereable" — the same short half-life and
  mu-dominant binding that make it easy to get hooked also make it
  respond well to short Suboxone tapers.
- Common retail forms (tablets, shots, pseudo, stacked products,
  raw powder).
- Marketing claims to be skeptical of ("non-addictive", "all-natural",
  "doesn't cause respiratory depression").
- Three real paths to stopping, with cross-links.

Cross-linked from welcome, what-to-expect, SOS, suboxone-info, MGM-15,
LDN, and pharmacology pages via the existing compound auto-linker.

### Kratom framing — leaf vs. synthetics

Site-wide audit found several "don't use kratom" statements that
wrongly grouped leaf in with concentrated 7-OH / synthetics.
Distinction now made consistently:

- **The compound that brought you here** (7-OH, MGM-15, MIT-A/DHM,
  pseudo, stacked synthetics) — never redose during withdrawal or
  active recovery.
- **Plain kratom leaf** — a *planned, deliberate* taper tool for some
  people in this community (see
  [#tapering-with-leaf](/other-tools/tapering-with-leaf)); not a rescue
  medication and not improvised at 3 a.m.

Updated in: `vitamins-supplements.md` (both "Avoid" sections),
`sos-resources.md` ("Don't" list), `suboxone-info.md` (taper bullet +
reminder callout), `imports/suboxone-isnt-working.md` ("don't redose"
list), `imports/suboxone-rapid-taper.md` ("seek help" trigger).

### Homepage — Discord + subreddit links

Added a row of community links to the homepage hero, just below the
SOS CTA:

- **💬 Discord:** `discord.gg/quitting7oh` — real-time community
- **📖 r/quitting7oh:** searchable, slower, good for stories
- **→ About the community** — links to the deeper community page

Also fixed the SOS CTA: it was pointing at the `/active-withdrawal`
category index; now it links straight to
`/active-withdrawal/sos-resources` where someone in acute distress
actually wants to land.

### Site-wide beta banner

- **`BetaBanner.astro`** mounted at the top of every page (via
  `BaseLayout.astro`, just below the skip-link). Amber strip, warning
  icon, full text: "Beta — This site is still being verified. AI tools
  were used to help organize and clean up content that was originally
  written and fact-checked by humans, but not every page has been fully
  reviewed yet. Use at your own risk."
- Dismissable per session via `sessionStorage` so a return visitor in
  the same session doesn't have to look at it, but a fresh visit always
  shows it — the warning matters enough that a new reader should always
  see it once.
- Renders correctly in both light (amber-50 bg, amber-900 text) and
  dark (amber-950/50 bg, amber-100 text) modes.

### Breadcrumbs — site-wide

- New **`Breadcrumbs.astro`** component renders an accessible
  `<nav aria-label="Breadcrumb">` with an `<ol>` of crumb links. Last
  crumb is the current page (`aria-current="page"`, no link).
  "Home" is always prepended automatically.
- Wired into **all three** templates that render a non-homepage view:
  - `DocLayout.astro` → every content page (e.g. `Home › MAT / Suboxone › COWS & SOWS Guide`)
  - `[category]/index.astro` → every category landing (e.g. `Home › Compounds`)
  - `sitemap.astro` → `Home › Site map`
- Replaced the old "category eyebrow" link on doc pages with the
  breadcrumb (the eyebrow only showed the parent category; the
  breadcrumb shows the full trail including Home).
- Verified: 0 pages missing breadcrumbs across the entire built site
  (excluding the homepage, which intentionally has none).

### Mobile sidebar fix

The mobile nav drawer wasn't fully clickable. Root cause: sidebar at
`z-20`, sticky header at `z-30` — so the header was capturing clicks
on the top portion of the drawer where they overlapped. Compounded
by no backdrop, no close button, and no Escape handler.

Fixes:

- **Sidebar bumped to `z-40`** on mobile so it sits above the header.
  Drops back to `lg:z-10` on desktop so the sticky header still tucks
  over the sidebar when scrolling.
- **Tap-to-close backdrop** (`z-30`, dim + blur) covers the rest of the
  viewport while the drawer is open. Mobile-only — `lg:hidden`.
- **Close button** at the top of the drawer (mobile-only), inside a
  "Navigate" header bar.
- **Escape closes the drawer** and returns focus to the hamburger
  button — standard a11y for modal-style drawers.
- **`aria-hidden` syncs with open state and breakpoint** (was missing
  entirely). On `lg`+ the sidebar is always exposed to AT; below `lg`
  it's hidden until opened.
- Dropped the now-unnecessary `pt-20` from the sidebar — it was
  trying to clear the header, but the sidebar floats above the header
  now so the padding isn't needed.

### Mobile "On this page" TOC

Below `xl` (1280px) the sticky right-side TOC is hidden, which left
mobile and tablet readers with no in-page navigation. Added a
**collapsible `<details>` "On this page" block** at the top of every
content page, visible only below `xl`.

- Lives in **`TocMobile.astro`**; native `<details>` so works without
  JS.
- Collapsed by default ("On this page (N sections)") so it doesn't
  push the article down on first paint.
- Chevron icon rotates 180° on open.
- Hidden entirely on `xl`+ where the sticky right-side TOC is visible.
- Hidden on wide pharmacology pages (`wide: true`) and on category
  index / sitemap pages — none of those have per-section navigation.
- Sources from the same `headings` array as the desktop TOC, so they
  stay in sync.

Verified live on all 28 content pages.

## Still in flight / next up

- **`compounds/7-oh.md`** is still a placeholder; the real Discord
  export for that channel hasn't been provided.
- **`SITE.repo` in `src/lib/site.ts`** assumes the repo is at
  `github.com/quitting7oh/quitting7oh.org` — update once the canonical
  repo exists. (Affects "Edit on GitHub" links.)
- **Pharmacology pages might want a "minor alkaloids ⇄ compounds"
  cross-link strategy** — right now they live in their own category
  but compound pages don't yet link out to the deeper reference. Worth
  a follow-up pass to wire those connections explicitly.

---

[Unreleased]: https://github.com/quitting7oh/quitting7oh.org/commits/main
