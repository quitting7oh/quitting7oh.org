# Project notes for Claude Code sessions

Project-scoped instructions for any Claude session opened in this repo.
These are durable rules — they survive across sessions.

## Always

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

Two paths, documented in detail in [src/content/README.md](src/content/README.md)
(direct edits) and [imports/README.md](imports/README.md) (Discord-export
import workflow).

Pages with `manual: true` in their front matter are protected from
re-ingest; edit them directly under `src/content/`.

## House style

- Calm, factual, harm-reduction tone. The audience is in recovery — no
  marketing language, no judgment, no "you should" prescriptions.
- Distinguish kratom **leaf** (sometimes a valid taper tool) from
  concentrated **7-OH / MGM-15 / MIT-A / pseudo** (the synthetics this
  site is about). "Don't use kratom" framing should be specific to the
  synthetics.
- Discord references = "server"; everything else = "community" or "site".
  See the changelog entry on the "server → community/site" sweep.
- First-mention compound names get auto-linked by the compound linker
  (`npm run link:compounds`). Don't add the links by hand on first
  occurrence; do add them on subsequent references that need them.

## Build / dev

```sh
npm run dev                    # local dev server (no search index)
npm run build                  # full build + Pagefind index
npm run preview                # serve dist/ locally to test search
npm run ingest                 # Discord export → content collection
npm run link:compounds         # auto-link compound mentions
```
