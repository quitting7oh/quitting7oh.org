/**
 * Daily re-verification of the 7-OH ban status.
 *
 * 1. Queries published and public-inspection Federal Register documents
 *    and compares them against REVIEWED_DOCS below.
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
 *    Register check, not the count. The submissions-received total is
 *    maintained by hand; this API only exposes posted comments.
 * 3. Rewrites the banner's LAST_CHECKED date and the as-of dates in
 *    src/content/compounds/7-oh-ban.md, plus the page's last_updated.
 *
 * Every rewrite asserts its pattern matched. If an edit reshapes the
 * text so a pattern no longer hits, the script exits 1 rather than
 * silently half-updating the page.
 */

import fs from 'node:fs';

/**
 * Federal Register documents a human has read and reflected on the ban
 * page. Anything outside this set published or filed on or after
 * FLOOR_DATE stops the run, including notices awaiting publication.
 */
const REVIEWED_DOCS = new Map([
  ['2026-13580', 'Jul 6, 2026 — DEA notice of intent, 7-OH above a threshold (DEA-1570)'],
  ['2026-13581', 'Jul 6, 2026 — DEA notice of intent, pseudo / MGM-15 / MGM-16 (DEA-1644)'],
  ['2026-13608', 'Jul 6, 2026 — HHS OASH request for information (HHS-OASH-2026-0232)'],
  ['2026-17429', 'Aug 26, 2026 — DEA temporary scheduling ORDER, pseudo / MGM-15 / MGM-16 (in effect)'],
  ['2026-17409', 'Aug 26, 2026 — HHS OASH comment period extended to Sep 10, 2026'],
  ['2026-13364', 'Jul 1, 2026 — DEA notice of intent, SR-17018 and three other synthetic opioids (DEA-1665)'],
  ['2026-17531', 'Aug 27, 2026 — DEA temporary scheduling ORDER, SR-17018 / 5,6-dichloro desmethylchlorphine (in effect)'],
  ['2026-20943', 'Filed Oct 9, 2026 — new 7-OH/pseudo threshold NOI; publication scheduled Oct 14 (DEA-1570)'],
  ['2026-20942', 'Filed Oct 9, 2026 — companion MGM-15/MGM-16 NOI; existing controls remain (DEA-1644)'],
]);

/**
 * Search terms queried against the Federal Register. 7-OH covers the
 * kratom synthetics; SR-17018 is a separate scheduling track (DEA-1665)
 * that the 7-OH query does not surface, and the site makes dated claims
 * about it, so it gets watched too.
 */
const SEARCH_TERMS = ['7-hydroxymitragynine', 'MGM-15', 'MGM-16', 'SR-17018'];

// The page's conditional earliest-order date depends on these dates.
// A rescheduled filing needs another review before any date refresh.
const EXPECTED_PUBLICATION_DATES = new Map([
  ['2026-20943', '2026-10-14'],
  ['2026-20942', '2026-10-14'],
]);

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
for (const feed of ['documents', 'public-inspection-documents']) {
  for (const term of SEARCH_TERMS) {
    let pageNumber = 1;
    let totalPages = 1;
    do {
      const url = new URL(`https://www.federalregister.gov/api/v1/${feed}.json`);
      url.searchParams.set('conditions[term]', term);
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', String(pageNumber));
      if (feed === 'documents') url.searchParams.set('order', 'newest');
      try {
        const res = await fetch(url.href);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // The API omits results and pagination for a zero-match search.
        const empty = data.count === 0 && data.results === undefined && data.total_pages === undefined;
        const results = empty ? [] : data.results;
        const pages = empty ? 0 : data.total_pages;
        if (!Array.isArray(results) || !Number.isInteger(pages) || pages < 0 || (pages === 0 && results.length > 0)) {
          throw new Error('missing results or pagination metadata');
        }
        totalPages = Math.max(1, pages);
        if (pageNumber < totalPages && results.length === 0) {
          throw new Error('empty page before the end of the feed');
        }
        for (const d of results) {
          if (typeof d.document_number !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.publication_date ?? '')) {
            throw new Error('document missing its number or publication date');
          }
          const filedDate = d.filed_at?.slice(0, 10);
          if (d.publication_date >= FLOOR_DATE || filedDate >= FLOOR_DATE) {
            // Deduplicate across terms and feeds; a pending notice is
            // reviewed before its publication, without treating it as an order.
            byNumber.set(d.document_number, { ...d, feed });
          }
        }
      } catch (error) {
        console.error(`Federal Register ${feed} check failed for "${term}": ${error.message}. Aborting without changes.`);
        process.exit(1);
      }
      pageNumber += 1;
    } while (pageNumber <= totalPages);
  }
}
const inScope = [...byNumber.values()];
const unreviewed = inScope.filter((d) => !REVIEWED_DOCS.has(d.document_number));

if (unreviewed.length > 0) {
  console.error('UNREVIEWED Federal Register document(s):');
  for (const d of unreviewed) {
    console.error(`  ${d.feed} | ${d.publication_date} | ${d.document_number} | ${d.type} | ${d.title}`);
    console.error(`  ${d.html_url}`);
  }
  console.error(
    'Refusing to auto-update. A human needs to read the new document(s), rewrite the ban page,\n' +
      'and add the document number(s) to REVIEWED_DOCS in this script.',
  );
  process.exit(2);
}

for (const d of inScope) {
  const expectedDate = EXPECTED_PUBLICATION_DATES.get(d.document_number);
  if (expectedDate && d.publication_date !== expectedDate) {
    console.error(`Publication date changed for ${d.document_number}: expected ${expectedDate}, found ${d.publication_date}.`);
    console.error('Review the filing and update the ban page timing before refreshing dates. Aborting without changes.');
    process.exit(2);
  }
}

// A reviewed document that vanishes from both feeds means the query or
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
    `${SEARCH_TERMS.length} search terms in published and public-inspection feeds, all reviewed. ` +
    `No order on the 7-OH threshold as of ${monthDayYear}.`,
);

// The workflow runs after each of the Federal Register's publication
// slots and throughout the day for irregular filings. Only the day's first run
// rewrites anything; later runs are pure verification so the page
// doesn't churn with count-only commits.
const currentBanner = fs.readFileSync(BANNER, 'utf8');
// The date is separate from the display copy and shared across screen sizes.
// Validate its unique marker even when the date is already current.
const banner = mustReplaceAll(
  BANNER,
  currentBanner,
  /^const LAST_CHECKED = '\d{4}-\d{2}-\d{2}';$/gm,
  `const LAST_CHECKED = '${isoDate}';`,
  1,
  'banner last-checked date',
);
if (banner === currentBanner) {
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

/** Same, but asserts an exact match count so missing or duplicated
 *  date markers fail loudly instead of half-updating. */
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
  /\*\*As of [A-Z][a-z]+ \d+, \d{4}, (\[7-OH\]\(\/compounds\/7-oh\)|7-OH) is not federally scheduled\.\*\*/,
  `**As of ${monthDayYear}, $1 is not federally scheduled.**`,
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
    /As of [A-Z][a-z]+ \d+,\n(\[the docket\]\([^)]+\)\n)showed [\d,]+ comments posted/,
    `As of ${monthDay},\n$1showed ${postedCount.toLocaleString('en-US')} comments posted`,
    'posted-comment count',
  );
}
// Validate every replacement before writing either file.
fs.writeFileSync(BANNER, banner);
fs.writeFileSync(PAGE, page);

console.log(`Updated banner and ban page to ${monthDayYear}.`);
if (postedCount !== null) console.log(`Docket posted count: ${postedCount.toLocaleString('en-US')}.`);
