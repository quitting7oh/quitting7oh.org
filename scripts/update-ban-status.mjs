/**
 * Daily re-verification of the 7-OH ban status.
 *
 * 1. Queries the Federal Register API for any 7-hydroxymitragynine
 *    document published after the July 6, 2026 notices of intent.
 *    - If something new has published, this script REFUSES to touch
 *      the files and exits 2. The page keeps its last verified date
 *      (stale but true) and the red run is the signal for a human to
 *      read the new document and rewrite the page. Never auto-claim
 *      "not banned" past a new Federal Register document.
 * 2. Refreshes the processed-comment count for docket
 *    HHS-OASH-2026-0232 from the regulations.gov API (REGSGOV_API_KEY
 *    env var). Count failures are non-fatal: the date bump rests on
 *    the Federal Register check, not the count.
 * 3. Rewrites the as-of dates in SchedulingBanner.tsx and
 *    src/content/compounds/7-oh-ban.md, plus the page's last_updated.
 *
 * Every rewrite asserts its pattern matched. If an edit reshapes the
 * text so a pattern no longer hits, the script exits 1 rather than
 * silently half-updating the page.
 */

import fs from 'node:fs';

const NOTICE_DATE = '2026-07-06';
const BANNER = 'src/components/SchedulingBanner.tsx';
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
const frUrl =
  'https://www.federalregister.gov/api/v1/documents.json' +
  '?conditions%5Bterm%5D=7-hydroxymitragynine&order=newest&per_page=10';
const frRes = await fetch(frUrl);
if (!frRes.ok) {
  console.error(`Federal Register API returned ${frRes.status}; cannot verify. Aborting without changes.`);
  process.exit(1);
}
const fr = await frRes.json();
const newDocs = (fr.results ?? []).filter(
  (d) => d.publication_date > NOTICE_DATE,
);
if (newDocs.length > 0) {
  console.error('NEW Federal Register document(s) since the notices of intent:');
  for (const d of newDocs) {
    console.error(`  ${d.publication_date} | ${d.type} | ${d.title}`);
    console.error(`  ${d.html_url}`);
  }
  console.error(
    'Refusing to auto-update. A human needs to read the new document(s) and rewrite the ban page.',
  );
  process.exit(2);
}
console.log(`Federal Register: no new documents since ${NOTICE_DATE}. Not banned as of ${monthDayYear}.`);

// ── 2. Docket processed-comment count (non-fatal) ────────────────────
let processedCount = null;
const apiKey = process.env.REGSGOV_API_KEY;
if (apiKey) {
  try {
    const res = await fetch(
      'https://api.regulations.gov/v4/comments?filter%5BdocketId%5D=HHS-OASH-2026-0232&page%5Bsize%5D=5',
      { headers: { 'X-Api-Key': apiKey } },
    );
    const j = await res.json();
    const total = j?.meta?.totalElements;
    if (Number.isInteger(total) && total > 0) processedCount = total;
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

let banner = fs.readFileSync(BANNER, 'utf8');
banner = mustReplace(
  BANNER,
  banner,
  /As of [A-Z][a-z]+ \d+, the DEA has not yet banned 7-OH\./,
  `As of ${monthDay}, the DEA has not yet banned 7-OH.`,
  'banner as-of line',
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
  /\*\*As of [A-Z][a-z]+ \d+, \d{4}, nothing is banned\.\*\*/,
  `**As of ${monthDayYear}, nothing is banned.**`,
  'status as-of line',
);
page = mustReplace(
  PAGE,
  page,
  /\| \*\*[A-Z][a-z]+ \d+, \d{4}\*\* \| Latest check against the Federal Register/,
  `| **${monthDayYear}** | Latest check against the Federal Register`,
  'timeline latest-check row',
);
if (processedCount !== null) {
  page = mustReplace(
    PAGE,
    page,
    /As of [A-Z][a-z]+ \d+,\n(\[the docket\]\([^)]+\)\n)shows [\d,]+ of them processed/,
    `As of ${monthDay},\n$1shows ${processedCount.toLocaleString('en-US')} of them processed`,
    'processed-comment count',
  );
}
fs.writeFileSync(PAGE, page);

console.log(`Updated banner and ban page to ${monthDayYear}.`);
if (processedCount !== null) console.log(`Docket processed count: ${processedCount.toLocaleString('en-US')}.`);
