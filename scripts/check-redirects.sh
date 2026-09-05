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
#   2. The redirect reaches the new URL in one hop
#   3. The redirect ends at the expected new URL (trailing-slash
#      normalization is tolerated)
#   4. The final response is 200
#
# Exit code is non-zero if any pair fails.

set -u

BASE="${1:-https://quitting7oh.org}"
BASE="${BASE%/}"

# One pair per line: old | new
#
# Each pair is auto-tested in both no-trailing-slash and
# trailing-slash form, since CF Pages' _redirects file treats /foo
# and /foo/ as different keys and (worse) will serve a stale cached
# /foo/ page if the trailing-slash variant isn't explicitly listed.
PAIRS="
/other-tools|/medications-supplements
/other-tools/cannabis-thc-in-recovery|/medications-supplements/cannabis-thc-in-recovery
/other-tools/helper-meds|/medications-supplements/helper-meds
/other-tools/mega-dose-vitamin-c|/medications-supplements/mega-dose-vitamin-c
/other-tools/nad-iv-therapy|/medications-supplements/nad-iv-therapy
/other-tools/peptides-for-withdrawal|/medications-supplements/peptides-for-withdrawal
/other-tools/quit-7-oh-with-kratom-leaf|/medications-supplements/quit-7-oh-with-kratom-leaf
/other-tools/quit-7-oh-with-mitragynine|/medications-supplements/quit-7-oh-with-mitragynine
/other-tools/quit-kit|/medications-supplements/quit-kit
/other-tools/sr-17|/medications-supplements/sr-17
/other-tools/vitamins-supplements|/medications-supplements/vitamins-supplements
/other-tools/helper-meds-info|/medications-supplements/helper-meds
/other-tools/mega-vit-c-info|/medications-supplements/mega-dose-vitamin-c
/other-tools/quitkit-info|/medications-supplements/quit-kit
/other-tools/sr17018-info|/medications-supplements/sr-17
/other-tools/peptides-info|/medications-supplements/peptides-for-withdrawal
/mat-suboxone/suboxone-info|/mat-suboxone/suboxone-for-7oh
/mat-suboxone/sublocade-brixadi-info|/mat-suboxone/sublocade-brixadi
/other-tools/tapering-with-leaf|/medications-supplements/quit-7-oh-with-kratom-leaf
/other-tools/tapering-with-kratom-leaf|/medications-supplements/quit-7-oh-with-kratom-leaf
/other-tools/low-dose-naltrexone|/post-acute/naltrexone-low-dose
/other-tools/ultra-low-dose-naltrexone|/post-acute/naltrexone-ultra-low-dose
/start-here/withdrawal-help|/start-here/7-oh-withdrawal-help
/start-here/paths-off|/start-here/how-to-quit-7-oh
/post-acute/what-is-paws|/post-acute/paws-post-acute-withdrawal
/post-acute/kindling|/post-acute/kindling-and-relapse
/post-acute/long-term-outlook|/post-acute/7-oh-recovery-timeline
/post-acute/impending-doom|/post-acute/impending-doom-anxiety
/start-here/thinking-about-using|/start-here/cravings-and-relapse-thoughts
/compounds/pseudo|/compounds/mitragynine-pseudoindoxyl
/compounds/mit-a-dihydromitragynine|/compounds/mit-a-dhm
/pharmacology/minor-alkaloids|/pharmacology/kratom-minor-alkaloids
/resources/telehealth|/resources/telehealth-for-suboxone
/mat-suboxone/suboxone-cows|/mat-suboxone/sows-cows-induction-guide
/mat-suboxone/suboxone-isnt-working|/mat-suboxone/why-suboxone-isnt-working
/mat-suboxone/suboxone-risks|/mat-suboxone/long-term-suboxone-risks
/about/community|/about/the-community
/about/how-ai-was-used|/about/this-site/#ai-assisted-writing
/about/for-fly|/about/acknowledgments
/for-you/start-here|/for-you/welcome
/for-loved-ones/start-here|/for-loved-ones/welcome
"

echo "Base: $BASE"
echo ""
printf '%-44s  %-6s  %-6s  %s\n' "Old slug" "Status" "Final" "Notes"
printf '%-44s  %-6s  %-6s  %s\n' "--------" "------" "-----" "-----"

pass=0
fail=0
failed_lines=()

# Strip fragments and trailing slashes for canonical path comparison. Redirect
# anchors stay in _redirects, while curl verifies the route that serves them.
norm() {
  value="${1%%#*}"
  printf '%s' "${value%/}"
}

check_one() {
  old="$1"
  new="$2"

  first_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BASE$old" || echo "000")
  final_url=$(curl -sL -o /dev/null -w '%{url_effective}' --max-time 20 "$BASE$old" || echo "")
  final_code=$(curl -sL -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$old" || echo "000")
  redirect_count=$(curl -sL -o /dev/null -w '%{num_redirects}' --max-time 20 "$BASE$old" || echo "0")

  final_path="${final_url#$BASE}"
  final_path_canonical=$(norm "$final_path")
  expected_canonical=$(norm "$new")

  status="FAIL"
  notes=""

  if [ "$first_code" != "301" ]; then
    notes="initial response was $first_code (expected 301)"
  elif [ "$redirect_count" != "1" ]; then
    notes="followed $redirect_count redirects (expected 1)"
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
}

while IFS='|' read -r old new; do
  [ -z "$old" ] && continue
  check_one "$old" "$new"
  check_one "$old/" "$new"
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
