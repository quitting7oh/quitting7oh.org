#!/usr/bin/env bash
# PreToolUse Bash hook: block `git commit` when staged files include
# substantive content but CHANGELOG.md is NOT staged alongside.
#
# Rule from CLAUDE.md: "Add or extend the most recent date entry in the
# same commit as the substantive change." A repeated failure mode for
# the AI agent is shipping the substantive change without the CHANGELOG
# entry. Memory hasn't been enough on its own; this is the hard backstop.
#
# Exempt staged sets:
#   - Pure typo/metadata/linter passes (per CLAUDE.md's own skip list) —
#     bypass by exporting HOOKS_SKIP=1 in the environment before the
#     commit. The bypass is intentional and explicit, not silent.
#   - CHANGELOG.md itself already staged → nothing to enforce.
#   - Only changes are to src/content/about/changelog.md (auto-synced
#     from CHANGELOG.md) → no separate entry needed.
#
# Substantive directories (any file under these counts):
#   src/components/, src/layouts/, src/pages/, src/lib/, src/data/,
#   src/styles/, src/content/ (excluding about/changelog.md), public/.
set -euo pipefail

# Bypass.
if [ "${HOOKS_SKIP:-}" = "1" ]; then
  exit 0
fi

# Read the tool-call payload Claude Code sends on stdin.
input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')

# Only act on `git commit` invocations (allow git status / git diff / etc.).
case "$command" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

# Inspect the staged set.
staged=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$staged" ]; then
  exit 0
fi

# CHANGELOG.md already staged → no enforcement needed.
if printf '%s\n' "$staged" | grep -qx 'CHANGELOG.md'; then
  exit 0
fi

# Filter to "substantive" paths, excluding the auto-synced changelog mirror.
substantive=$(printf '%s\n' "$staged" \
  | grep -E '^(src/content/|src/components/|src/layouts/|src/pages/|src/lib/|src/data/|src/styles/|public/)' \
  | grep -vx 'src/content/about/changelog.md' || true)

if [ -z "$substantive" ]; then
  exit 0
fi

# Block.
{
  echo "❌ CHANGELOG.md must be updated in the same commit as substantive changes."
  echo ""
  echo "Substantive staged files:"
  printf '%s\n' "$substantive" | sed 's/^/  /'
  echo ""
  echo "Per CLAUDE.md: \"Add or extend the most recent date entry in the same commit as the substantive change.\""
  echo ""
  echo "Add an entry to CHANGELOG.md and stage it, then retry the commit."
  echo "If this is genuinely a typo / metadata / linter-only change (CLAUDE.md's"
  echo "skip list), bypass with: HOOKS_SKIP=1 git commit ..."
} >&2

# Emit the structured decision so Claude Code blocks the tool call.
cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "CHANGELOG.md must be staged alongside substantive content changes (see stderr)."
  }
}
JSON
