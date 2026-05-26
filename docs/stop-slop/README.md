# stop-slop (vendored snapshot)

This directory is the **anti-AI-writing-pattern ruleset** that every page on the
site gets passed through before it ships. It lives in the repo so readers can
see exactly which patterns we're stripping out, not just take our word that
we're trying.

## Provenance

- Upstream: <https://github.com/hardikpandya/stop-slop> (Hardik Pandya, MIT
  License)
- This snapshot includes local additions documented in [CHANGELOG.md](CHANGELOG.md).
  The additions cover patterns specific to the kratom-synthetic recovery domain
  (reassurance tics, "X is real" declarations, performative-authority adjectives)
  and structural patterns imported from
  [tropes.fyi](https://tropes.fyi) by ossama.is
  (via [stephenturner/skill-deslop](https://github.com/stephenturner/skill-deslop)),
  and the broader Twitter/LinkedIn-aware
  [soothing-carport96/anti-ai-slop-writing](https://github.com/soothing-carport96/anti-ai-slop-writing).

## Files

- [SKILL.md](SKILL.md) — the top-level ruleset and quick-check list
- [references/phrases.md](references/phrases.md) — phrases to cut or replace
- [references/structures.md](references/structures.md) — structural patterns to avoid
- [references/examples.md](references/examples.md) — before/after transformations
- [CHANGELOG.md](CHANGELOG.md) — record of local additions

## Sync

This is a snapshot, not a git submodule. The active working copy lives in the
maintainer's Claude Code skills directory; updates get copied here when the
ruleset changes. License (MIT) is preserved.

See [CLAUDE.md](../../CLAUDE.md) for the project's broader voice rules.
