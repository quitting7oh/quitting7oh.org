# quitting7oh.org

Static documentation site compiled from a community Discord server for people
recovering from 7-OH, kratom synthetics, and related opioid dependence.

Built with [Astro](https://astro.build), Tailwind CSS, and Pagefind. Content
is plain markdown. There is no CMS, no database, no user accounts, and no
tracking.

## Quick start (local dev)

```sh
npm install
npm run dev
```

Then open <http://localhost:4321>.

Search uses [Pagefind](https://pagefind.app/), which indexes the site at build
time. The dev server therefore won't have working search until you run:

```sh
npm run build
npm run preview
```

## Project structure

```
.
├── astro.config.mjs              ← Astro config (markdown plugins, sitemap)
├── src/
│   ├── content/                  ← Site content. Folder = category, file = page.
│   │   ├── start-here/
│   │   ├── active-withdrawal/
│   │   ├── compounds/
│   │   ├── mat-suboxone/
│   │   ├── other-tools/
│   │   ├── post-acute/
│   │   └── resources/
│   ├── pages/                    ← Routing (auto-generated from content)
│   ├── components/               ← Header, Sidebar, ThemeToggle, Search, etc.
│   ├── layouts/                  ← BaseLayout, DocLayout
│   ├── lib/                      ← Shared helpers (categories, site config)
│   └── styles/global.css         ← Tailwind + theme tokens
├── scripts/
│   ├── ingest-discord.mjs        ← Discord export → content collection
│   └── channel-mapping.json      ← Channel-name → category mapping
├── imports/                      ← Drop Discord export files here
└── public/                       ← Static assets (favicons, etc.)
```

## Editing content

There are two ways to add or update pages.

### Path A — direct markdown edit (fixing typos, updating an existing page)

1. Open the file under `src/content/<category>/<slug>.md`.
2. Edit the markdown body. Update `last_updated:` in the front matter.
3. Commit and open a pull request, or push to `main` if you have access.
4. The site rebuilds automatically when deployed (see *Deploying* below).

### Path B — import from a Discord export (adding a new page from the Discord)

1. Save the Discord channel export as a markdown file under `imports/`.
   The export should start with `# #channel-name` on its own line.
2. Open `scripts/channel-mapping.json` and add an entry for that channel:
   ```json
   "your-channel-name": { "category": "start-here", "title_override": null }
   ```
   Category must be one of: `start-here`, `active-withdrawal`, `compounds`,
   `mat-suboxone`, `other-tools`, `post-acute`, `resources`.
3. Run `npm run ingest` (or `npm run ingest:dry` to preview without writing).
4. Review the generated file at `src/content/<category>/<channel-name>.md`.
5. Commit both the new content file and the mapping update.

If a channel isn't in the mapping the script will log a warning and write the
output to `src/content/uncategorized/` for you to triage manually.

### Adding a new category

1. Open `src/lib/categories.ts` and add an entry to the `CATEGORIES` array.
   `slug` becomes the URL path and the folder name; `title`, `blurb`, and
   `emoji` show up in the sidebar and homepage cards.
2. Create the folder: `src/content/<slug>/`.
3. Add at least one page (or leave it empty — the category will simply show
   "No pages yet" until content arrives).

## Ingest pipeline reference

```
npm run ingest                  Default: read /imports/, write src/content/
npm run ingest:dry              Same, but print plans without writing
node scripts/ingest-discord.mjs --file imports/foo.md   Process a single file
node scripts/ingest-discord.mjs --out /tmp/out          Custom output dir
node scripts/ingest-discord.mjs --verbose               Verbose logging
```

The script:

- Parses Discord-export markdown (channel headers, `### Author — Date`
  messages, `*(edited)*` markers, pinned-count notes).
- Concatenates messages in chronological reading order.
- Strips Discord-specific metadata; converts `**#channel-name**` references
  to internal site links via the mapping; converts emoji shortcodes
  (`:warning:`, `:pray:`, etc.) to unicode; anonymizes `@mentions`.
- Skips files in `imports/` whose names start with `_` (treated as fixtures).
- Is idempotent — re-runs only rewrite files whose content actually changed.

See [`imports/README.md`](imports/README.md) for the import workflow in
non-developer-friendly steps.

## Theme behavior

The site has **three** theme modes: `system` (default), `light`, `dark`. The
toggle in the header cycles through them and the choice persists in
`localStorage`. If you've never used the toggle you stay in `system`, which
follows your OS-level dark-mode preference live (no reload needed when you
change OS settings).

Implementation: an inline script in `<head>` sets the `dark` class before the
page paints (prevents flash-of-incorrect-theme), and a `matchMedia` listener
keeps the page in sync with OS changes while in `system` mode.

## Deploying

You have two supported deployment paths. **Both are wired up; pick whichever
suits where you want the site to live.**

### Option A — Cloudflare Pages (managed, free, no server)

Cloudflare builds the site directly from the repo and serves it from
Cloudflare's edge. No server to manage. Best if you don't already have a
VPS or don't want one.

1. Push the repo to GitHub.
2. In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages**
   → **Connect to Git**. Select this repo.
3. Set the **build command** to `npm run build` and the **build output
   directory** to `dist`.
4. Set environment variable `NODE_VERSION=22` (Cloudflare sometimes defaults
   to older Node).
5. Deploy. Subsequent commits to `main` deploy automatically.

The repo includes:

- **[wrangler.toml](wrangler.toml)** — `pages_build_output_dir = "dist"`
- **[public/_headers](public/_headers)** — security + cache headers
- **[public/_redirects](public/_redirects)** — placeholder for permanent redirects

Enable **Cloudflare Web Analytics** in the dashboard for cookieless,
privacy-preserving traffic stats. Don't add Google Analytics.

### Option B — Self-hosted (Docker + GHCR + Caddy)

The site also builds into a **Docker image published to GHCR** by GitHub
Actions on every push to `main`. The image runs nginx and is intended to
sit behind Caddy on a small VPS for TLS termination.

**Full walkthrough:** [docs/deploying.md](docs/deploying.md) — server
setup, DNS, Docker install, Caddy TLS, Watchtower auto-updates,
rollback, logs, and hardening.

**TL;DR on an existing server:**

```sh
cd /opt/quitting7oh
docker compose pull && docker compose up -d
```

The repo includes:

- **[Dockerfile](Dockerfile)** — multi-stage build (Node → nginx)
- **[docker/nginx.conf](docker/nginx.conf)** — gzip, caching, security headers, trailing-slash routing
- **[docker-compose.yml](docker-compose.yml)** — site + Caddy + Watchtower
- **[Caddyfile](Caddyfile)** — TLS, HTTP→HTTPS, www→apex
- **[.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)** — multi-arch (amd64 + arm64) image, pushed to GHCR as `latest`, `sha-<short>`, and semver tags

### Which one?

| You want…                                  | Use            |
| ------------------------------------------ | -------------- |
| Zero server management, free, fast setup   | Cloudflare     |
| Total control, custom logging, on-prem     | Docker / VPS   |
| Multi-region for free                      | Cloudflare     |
| Custom server-side logic later             | Docker / VPS   |

You can also run both at once — Cloudflare in front of the VPS — and use
Cloudflare for caching/DDoS protection while keeping origin control.

## What this site won't do

- No blog, comments, accounts, or forum (the Discord is the forum).
- No affiliate links, ads, or any other monetization.
- No JavaScript-heavy interactive features. Pagefind and the theme toggle
  are the only scripts, and Pagefind only loads when the user focuses a
  search input.
