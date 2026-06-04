#!/usr/bin/env bash
#
# Verify slug-rename redirects against any base URL.
#
# Usage:
#   scripts/check-redirects.sh                              # defaults to https://quitting7oh.org
#   scripts/check-redirects.sh https://quitting7oh.org      # prod
#   scripts/check-redirects.sh http://localhost:8788        # local, via wrangler (see below)
#
# Local testing
# -------------
# `public/_redirects` is processed by Cloudflare Pages at the edge. The
# basic `astro preview` server does NOT process the file. To test
# locally:
#
#   npm run build
#   npx wrangler pages dev dist            # serves on http://localhost:8788
#
# Then in another shell:
#
#   scripts/check-redirects.sh http://localhost:8788
#
# For each old→new pair the script confirms:
#   1. The initial response to the old URL is a 301
#   2. The redirect chain ends at the expected new URL (trailing-slash
#      normalization is tolerated)
#   3. The final response is 200
#
# Exit code is non-zero if any pair fails.

set -u

BASE="${1:-https://quitting7oh.org}"
BASE="${BASE%/}"

# One pair per line: old | new
PAIRS="
/other-tools/helper-meds-info|/other-tools/helper-meds
/other-tools/mega-vit-c-info|/other-tools/mega-dose-vitamin-c
/other-tools/quitkit-info|/other-tools/quit-kit
/other-tools/sr17018-info|/other-tools/sr-17
/other-tools/peptides-info|/other-tools/peptides-for-withdrawal
/mat-suboxone/suboxone-info|/mat-suboxone/suboxone-for-7oh
/mat-suboxone/sublocade-brixadi-info|/mat-suboxone/sublocade-brixadi
/other-tools/tapering-with-leaf|/other-tools/tapering-with-kratom-leaf
/start-here/withdrawal-help|/start-here/7-oh-withdrawal-help
/start-here/paths-off|/start-here/how-to-quit-7-oh
"

echo "Base: $BASE"
echo ""
printf '%-44s  %-6s  %-6s  %s\n' "Old slug" "Status" "Final" "Notes"
printf '%-44s  %-6s  %-6s  %s\n' "--------" "------" "-----" "-----"

pass=0
fail=0
failed_lines=()

# Strip trailing slash from a path for canonical comparison.
norm() { printf '%s' "${1%/}"; }

while IFS='|' read -r old new; do
  [ -z "$old" ] && continue

  # First hop: should be 301 from old.
  first_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BASE$old" || echo "000")

  # Follow the redirect chain and capture the final URL + final status.
  # %{url_effective} gives the URL where curl ended up.
  # %{http_code} after -L gives the final response code.
  final_url=$(curl -sL -o /dev/null -w '%{url_effective}' --max-time 20 "$BASE$old" || echo "")
  final_code=$(curl -sL -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$old" || echo "000")

  # Strip base + trailing slash from the final URL for comparison.
  final_path="${final_url#$BASE}"
  final_path_canonical=$(norm "$final_path")
  expected_canonical=$(norm "$new")

  status="FAIL"
  notes=""

  if [ "$first_code" != "301" ] && [ "$first_code" != "302" ]; then
    notes="initial response was $first_code (expected 301)"
  elif [ "$final_code" != "200" ]; then
    notes="final response was $final_code (expected 200)"
  elif [ "$final_path_canonical" != "$expected_canonical" ]; then
    notes="landed at $final_path (expected $new)"
  else
    status="PASS"
  fi

  if [ "$status" = "PASS" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    failed_lines+=("$old -> $new: $notes")
  fi

  printf '%-44s  %-6s  %-6s  %s\n' "$old" "$status" "$final_code" "$notes"
done <<EOF
$PAIRS
EOF

echo ""
total=$((pass + fail))
echo "Passed: $pass / $total"

if [ "$fail" -gt 0 ]; then
  echo ""
  echo "Failures:"
  for line in "${failed_lines[@]}"; do
    echo "  $line"
  done
  exit 1
fi
