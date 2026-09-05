/**
 * Daily re-verification of the 7-OH ban status.
 *
 * 1. Queries the Federal Register API for 7-hydroxymitragynine
 *    documents and compares them against REVIEWED_DOCS below.
 *    - Any document a human hasn't reviewed makes this script REFUSE
 *      to touch the files and exit 2. The page keeps its last verified
 *      date (stale but true) and the red run is the signal to read the
 *      new document and rewrite the page. Never auto-claim "7-OH is
 *      not banned" past an unreviewed Federal Register document.
 *    - An allowlist rather than a date cutoff, because documents that
 *      HAVE been handled (the August 26 pseudo/MGM order, the OASH
 *      comment extension) must not keep the job red forever. When a
 *      human folds a new document into the page, its number goes in
 *      REVIEWED_DOCS in the same commit.
 * 2. Refreshes the posted-comment count for docket HHS-OASH-2026-0232
 *    from the regulations.gov API (REGSGOV_API_KEY env var). Count
 *    failures are non-fatal: the date bump rests on the Federal
 *    Register check, not the count.
 * 3. Rewrites the as-of dates in SchedulingBanner.astro and
 *    src/content/compounds/7-oh-ban.md, plus the page's last_updated.
 *
 * Every rewrite asserts its pattern matched. If an edit reshapes the
 * text so a pattern no longer hits, the script exits 1 rather than
 * silently half-updating the page.
 */

import fs from 'node:fs';

/**
 * Federal Register documents a human has read and reflected on the ban
 * page. Anything outside this set published on or after FLOOR_DATE
 * stops the run.
 */
const REVIEWED_DOCS = new Map([
  ['2026-13580', 'Jul 6, 2026 — DEA notice of intent, 7-OH above a threshold (DEA-1570)'],
  ['2026-13581', 'Jul 6, 2026 — DEA notice of intent, pseudo / MGM-15 / MGM-16 (DEA-1644)'],
  ['2026-13608', 'Jul 6, 2026 — HHS OASH request for information (HHS-OASH-2026-0232)'],
  ['2026-17429', 'Aug 26, 2026 — DEA temporary scheduling ORDER, pseudo / MGM-15 / MGM-16 (in effect)'],
  ['2026-17409', 'Aug 26, 2026 — HHS OASH comment period extended to Sep 10, 2026'],
  ['2026-13364', 'Jul 1, 2026 — DEA notice of intent, SR-17018 and three other synthetic opioids (DEA-1665)'],
  ['2026-17531', 'Aug 27, 2026 — DEA temporary scheduling ORDER, SR-17018 / 5,6-dichloro desmethylchlorphine (in effect)'],
]);

/**
 * Search terms queried against the Federal Register. 7-OH covers the
 * kratom synthetics; SR-17018 is a separate scheduling track (DEA-1665)
 * that the 7-OH query does not surface, and the site makes dated claims
 * about it, so it gets watched too.
 */
const SEARCH_TERMS = ['7-hydroxymitragynine', 'SR-17018'];

/**
 * Documents published before this are the pre-2026 historical record
 * (the 2016 withdrawal, WHO scheduling notices) and are not the
 * script's concern.
 */
const FLOOR_DATE = '2026-07-01';

const BANNER = 'src/components/SchedulingBanner.astro';
const PAGE = 'src/content/compounds/7-oh-ban.md';

const now = new Date();
const monthDay = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  timeZone: 'America/New_York',
}).format(now);
const monthDayYear = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York',
}).format(now);
const isoDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
}).format(now);

// ── 1. Federal Register check ────────────────────────────────────────
const byNumber = new Map();
for (const term of SEARCH_TERMS) {
  const frUrl =
    'https://www.federalregister.gov/api/v1/documents.json' +
    `?conditions%5Bterm%5D=${encodeURIComponent(term)}&order=newest&per_page=20`;
  const frRes = await fetch(frUrl);
  if (!frRes.ok) {
    console.error(`Federal Register API returned ${frRes.status} for "${term}"; cannot verify. Aborting without changes.`);
    process.exit(1);
  }
  const fr = await frRes.json();
  for (const d of fr.results ?? []) {
    // A document can match more than one term; dedupe by number.
    if (d.publication_date >= FLOOR_DATE) byNumber.set(d.document_number, d);
  }
}
const inScope = [...byNumber.values()];
const unreviewed = inScope.filter((d) => !REVIEWED_DOCS.has(d.document_number));

if (unreviewed.length > 0) {
  console.error('UNREVIEWED Federal Register document(s):');
  for (const d of unreviewed) {
    console.error(`  ${d.publication_date} | ${d.document_number} | ${d.type} | ${d.title}`);
    console.error(`  ${d.html_url}`);
  }
  console.error(
    'Refusing to auto-update. A human needs to read the new document(s), rewrite the ban page,\n' +
      'and add the document number(s) to REVIEWED_DOCS in this script.',
  );
  process.exit(2);
}

// A reviewed document that vanishes from the feed means the query or
// the API changed shape; better to go red than to verify nothing.
const seen = new Set(inScope.map((d) => d.document_number));
const missing = [...REVIEWED_DOCS.keys()].filter((n) => !seen.has(n));
if (missing.length > 0) {
  console.error(`Reviewed document(s) absent from the Federal Register results: ${missing.join(', ')}.`);
  console.error('The query or the API response has changed. Aborting without changes.');
  process.exit(1);
}

console.log(
  `Federal Register: ${inScope.length} document(s) since ${FLOOR_DATE} across ` +
    `${SEARCH_TERMS.length} search terms, all reviewed. ` +
    `No order on the 7-OH threshold as of ${monthDayYear}.`,
);

// The workflow runs after each of the Federal Register's publication
// slots (8:45 AM, 11:15 AM, 4:15 PM ET). Only the day's first run
// rewrites anything; later runs are pure verification so the page
// doesn't churn with count-only commits.
const currentBanner = fs.readFileSync(BANNER, 'utf8');
// The banner renders a short mobile variant and a longer desktop one,
// so the as-of line appears twice. Both are already current, or neither.
if (currentBanner.split(`As of ${monthDay}, 7-OH is not banned.`).length - 1 === 2) {
  console.log(`Already current for ${monthDayYear}; verification-only run, no rewrites.`);
  process.exit(0);
}

// ── 2. Docket posted-comment count (non-fatal) ───────────────────────
let postedCount = null;
const apiKey = process.env.REGSGOV_API_KEY;
if (apiKey) {
  try {
    const res = await fetch(
      'https://api.regulations.gov/v4/comments?filter%5BdocketId%5D=HHS-OASH-2026-0232&page%5Bsize%5D=5',
      { headers: { 'X-Api-Key': apiKey } },
    );
    const j = await res.json();
    const total = j?.meta?.totalElements;
    if (Number.isInteger(total) && total > 0) postedCount = total;
    else console.error('regulations.gov: no usable totalElements; keeping the existing count.');
  } catch (e) {
    console.error(`regulations.gov fetch failed (${e.message}); keeping the existing count.`);
  }
} else {
  console.error('REGSGOV_API_KEY not set; keeping the existing count.');
}

// ── 3. Rewrites ──────────────────────────────────────────────────────
function mustReplace(file, content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    console.error(`Pattern not found in ${file}: ${label}. The text has drifted; update this script.`);
    process.exit(1);
  }
  return content.replace(pattern, replacement);
}

/** Same, but asserts an exact match count so a dropped or duplicated
 *  responsive variant fails loudly instead of half-updating. */
function mustReplaceAll(file, content, pattern, replacement, expected, label) {
  const found = content.match(pattern)?.length ?? 0;
  if (found !== expected) {
    console.error(
      `Expected ${expected} match(es) in ${file} for ${label}, found ${found}. ` +
        'The text has drifted; update this script.',
    );
    process.exit(1);
  }
  return content.replace(pattern, replacement);
}

let banner = fs.readFileSync(BANNER, 'utf8');
banner = mustReplaceAll(
  BANNER,
  banner,
  /As of [A-Z][a-z]+ \d+, 7-OH is not banned\./g,
  `As of ${monthDay}, 7-OH is not banned.`,
  2,
  'banner as-of lines (mobile + desktop variants)',
);
fs.writeFileSync(BANNER, banner);

let page = fs.readFileSync(PAGE, 'utf8');
page = mustReplace(
  PAGE,
  page,
  /last_updated: "\d{4}-\d{2}-\d{2}"/,
  `last_updated: "${isoDate}"`,
  'front-matter last_updated',
);
page = mustReplace(
  PAGE,
  page,
  /\*\*Last verified against primary sources on [A-Z][a-z]+ \d+, \d{4}\.\*\*/,
  `**Last verified against primary sources on ${monthDayYear}.**`,
  'verified-against-sources line',
);
page = mustReplace(
  PAGE,
  page,
  /\*\*As of [A-Z][a-z]+ \d+, \d{4}, 7-OH is not banned\.\*\*/,
  `**As of ${monthDayYear}, 7-OH is not banned.**`,
  'status as-of line',
);
page = mustReplace(
  PAGE,
  page,
  /\| \*\*[A-Z][a-z]+ \d+, \d{4}\*\* \| Latest check against the Federal Register/,
  `| **${monthDayYear}** | Latest check against the Federal Register`,
  'timeline latest-check row',
);
if (postedCount !== null) {
  page = mustReplace(
    PAGE,
    page,
    /As of [A-Z][a-z]+ \d+,\n(\[the docket\]\([^)]+\)\n)shows [\d,]+ comments posted/,
    `As of ${monthDay},\n$1shows ${postedCount.toLocaleString('en-US')} comments posted`,
    'posted-comment count',
  );
}
fs.writeFileSync(PAGE, page);

console.log(`Updated banner and ban page to ${monthDayYear}.`);
if (postedCount !== null) console.log(`Docket posted count: ${postedCount.toLocaleString('en-US')}.`);
