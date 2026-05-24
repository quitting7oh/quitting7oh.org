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
