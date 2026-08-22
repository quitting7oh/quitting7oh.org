# Codex project instructions

`CLAUDE.md` is the shared rulebook for this repository. Codex must read it
before substantive work and follow every applicable project rule. `AGENTS.md`
imports those rules and adds Codex-specific steps.

## Changelog gate

Claude enforces the changelog rule through
`.claude/hooks/changelog-guard.sh`. That hook does not run for Codex, so Codex
must apply the same check before every commit.

- Treat changes under `src/components/`, `src/layouts/`, `src/pages/`,
  `src/lib/`, `src/data/`, `src/styles/`, `src/content/`, and `public/` as
  substantive unless they match the skip list in `CLAUDE.md`.
- Add or extend the newest `## YYYY-MM-DD` entry in root `CHANGELOG.md` in the
  same commit. Group related work under one thematic `###` heading.
- Root `CHANGELOG.md` is canonical. Never edit
  `src/content/about/changelog.md` by hand.
- Run `npm run sync:changelog` after updating the root changelog. Include the
  generated public mirror in the same commit.
- Skip changelog entries only for the exclusions in `CLAUDE.md`: typo-only,
  date-only, metadata-only, lint-only, or formatting-only changes.
- Before committing, compare the staged paths with the staged changelog. Stop
  if substantive files are staged without `CHANGELOG.md`.

## Content and prose

- Update `last_updated` when rendered content changes, following the exact
  exceptions in `CLAUDE.md`.
- Run the vendored `docs/stop-slop/` review for every prose edit and report the
  result to the user.
- Let Markdown external links use the rehype rule. Hand-written Astro and JSX
  links need `target="_blank" rel="noopener noreferrer"`.

## Git, builds, and previews

- Never push without explicit approval for that specific push. A push to
  `main` deploys production.
- Preserve unrelated work in a dirty tree and stage only files that belong to
  the current task.
- Follow the versions in `packageManager`, `engines`, and `.nvmrc` for installs
  and lockfile work.
- Use port 4320 for development and 4321 for the production preview. Existing
  Node processes on those ports may be stopped when a restart is needed.
- Keep Astro output static and run the production build before handing off a
  substantive site change.
