#!/usr/bin/env node
// Build-time fetch + normalize for the /virtual-smart-meetings-now page.
//
// Pulls the SMART Recovery online meeting list from
//   https://meetings.smartrecovery.org/meetings/?meetingType=1&location=...
// running the search from four central US cities (Houston, LA, NYC, KC)
// at the maximum 1000-mile radius, and unioning the results by meeting
// ID. Single-city searches miss meetings outside their radius — the
// union covers roughly the continental US.
//
// For each unique meeting we then fetch its detail page to grab the
// Pathminder URL (the SMART-mediated "Join Online" link), since the
// listing rows don't expose it.
//
// Authorized by SMART Recovery senior leadership for republication
// with attribution.
//
// Output: src/data/smart-meetings.generated.json

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_PATH = join(REPO_ROOT, 'src', 'data', 'smart-meetings.generated.json');

const BASE = 'https://meetings.smartrecovery.org';
const SOURCE_URL = `${BASE}/meetings/?meetingType=1`;
const UA =
  'quitting7oh.org meeting collector (+https://quitting7oh.org; authorized by SMART Recovery)';

// 1000-mi radius searches from these central cities cover the
// continental US with sensible overlap. Adding more increases coverage
// marginally but at proportional fetch cost.
const SEARCH_CITIES = ['Houston, TX', 'Los Angeles, CA', 'New York, NY', 'Kansas City, MO'];
const RADIUS_MI = 1000;
const POLITE_DELAY_MS = 400;
const MAX_PAGES_PER_CITY = 30; // safety stop; in practice ~5–15 pages

// ─── HTTP helpers ────────────────────────────────────────────────────

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Listing parser ──────────────────────────────────────────────────

/** Split the listing HTML into one chunk per meeting row.
 *  Each row starts with `class="row meetinglistrow"`. */
function splitListingRows(html) {
  const marker = 'class="row meetinglistrow';
  const out = [];
  let i = html.indexOf(marker);
  while (i !== -1) {
    const next = html.indexOf(marker, i + marker.length);
    out.push(next === -1 ? html.slice(i) : html.slice(i, next));
    i = next;
  }
  return out;
}

const RE_HREF = /data-href="\/meetings\/(\d+)\/"/;
const RE_UTC = /class="meeting-time"\s+data-utc="([^"]+)"/;
const RE_ONLINE_ICON = /class="fas fa-video meetingtypeicon"/;
// The listing shows the meeting's program as `<strong>4-Point Recovery</strong>`
// inside the d-none/d-md-block label. Pick the first <strong> appearing after the
// program-name label region.
const RE_PROGRAM = /<strong>(4-Point Recovery|Family\s*&amp;\s*Friends|Veteran[^<]*|Teen[^<]*|[^<]{1,40})<\/strong>/;
// Audience and language are in plain text — both inside the same column
// in display-none-on-mobile and display-block-on-desktop variants. Use
// the desktop block which has cleaner whitespace.
const RE_DESKTOP_COL = /<span class="d-none d-md-block text-center">([\s\S]*?)<\/span>/;
// City/state location block.
const RE_LOCATION = /<span class="d-none d-md-block">\s*([^<]+?)\s*<!---/;
// Facilitator. The structure is consistent: `d-none d-md-block` containing the name.
const RE_FACILITATOR = /<i class="fas fa-user[^>]*"><\/i>[\s\S]*?<span class="d-none d-md-block">\s*([^<]+?)\s*<\/span>/;

function parseListingRow(html) {
  const idMatch = html.match(RE_HREF);
  if (!idMatch) return null;
  const id = idMatch[1];

  // Validation: must show "Online" in the row. If the search filter
  // somehow returned a hybrid with no online tag, drop it.
  if (!RE_ONLINE_ICON.test(html)) return null;

  const utcMatch = html.match(RE_UTC);
  if (!utcMatch) return null;
  const utcStart = utcMatch[1];

  // Parse the desktop column for program + audience + language. Format:
  // <strong>4-Point Recovery</strong> <br> Adults Welcome <br> English
  const colMatch = html.match(RE_DESKTOP_COL);
  let program = '';
  let audience = '';
  let language = '';
  if (colMatch) {
    const inner = colMatch[1];
    const programMatch = inner.match(/<strong>([^<]+)<\/strong>/);
    if (programMatch) program = programMatch[1].trim();
    const lines = inner
      .replace(/<strong>[^<]+<\/strong>/, '')
      .split(/<br\s*\/?>/)
      .map((s) => s.replace(/<[^>]+>/g, '').trim())
      .filter((s) => s.length > 0);
    if (lines.length >= 1) audience = lines[0];
    if (lines.length >= 2) language = lines[1];
  }

  // Find the location column — second `d-none d-md-block` (the first
  // one is inside the program column).
  let locationCity = '';
  let locationState = '';
  // Scan all the .d-none.d-md-block blocks; the one that looks like
  // "City, State" without an enclosing <strong> is the location.
  const allBlocks = [...html.matchAll(/<span class="d-none d-md-block">\s*([\s\S]*?)\s*<\/span>/g)];
  for (const m of allBlocks) {
    const text = m[1].replace(/<!---[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').trim();
    if (text && /^[A-Z][^,]+,\s+[A-Z]/.test(text) && !text.includes('Recovery') && !text.includes('Welcome')) {
      const parts = text.split(',').map((s) => s.trim());
      locationCity = parts[0] || '';
      locationState = parts[1] || '';
      break;
    }
  }

  // Facilitator name. Often present; sometimes missing.
  const facMatch = html.match(RE_FACILITATOR);
  const facilitator = facMatch ? facMatch[1].trim() : '';

  return {
    id,
    utcStart,
    program: decodeListingText(program),
    audience: decodeListingText(audience),
    language: decodeListingText(language),
    locationCity: decodeListingText(locationCity),
    locationState: decodeListingText(locationState),
    facilitator: decodeListingText(facilitator),
  };
}

/** Local decoder used at listing-parse time. Defined here (instead of
 *  hoisting decodeEntities) to keep the parser self-contained when
 *  scanning this file. */
function decodeListingText(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAllListings() {
  const seen = new Map(); // id → row (first occurrence wins)
  const cityCounts = {};

  for (const city of SEARCH_CITIES) {
    cityCounts[city] = { pages: 0, rows: 0 };
    const encoded = encodeURIComponent(city);
    for (let page = 1; page <= MAX_PAGES_PER_CITY; page++) {
      const url = `${SOURCE_URL}&location=${encoded}&coordinates=${RADIUS_MI}&page=${page}`;
      let html;
      try {
        html = await fetchHtml(url);
      } catch (e) {
        console.warn(`  ! ${city} page ${page}: ${e.message}`);
        break;
      }
      const rows = splitListingRows(html);
      const parsed = rows.map(parseListingRow).filter(Boolean);
      if (parsed.length === 0) break;
      cityCounts[city].pages = page;
      cityCounts[city].rows += parsed.length;
      for (const row of parsed) {
        if (!seen.has(row.id)) seen.set(row.id, row);
      }
      await sleep(POLITE_DELAY_MS);
    }
    console.log(
      `  ${city.padEnd(20)} ${cityCounts[city].pages} pages, ${cityCounts[city].rows} rows`,
    );
  }

  return { meetings: Array.from(seen.values()), cityCounts };
}

// ─── Detail page parser ──────────────────────────────────────────────

const RE_PATHMINDER = /href="(https:\/\/instance-us\.pathcheck\.net\/j\/[A-Z0-9]+)\?smartappaction=leave"/;
const RE_TITLE = /<title>SMART Recovery[^-]+-\s+Meeting\s+#\d+\s+([^<]+)<\/title>/;
const RE_PASSCODE = /<strong>Passcode:<\/strong>\s*([A-Za-z0-9._-]+)/;
const RE_SPECIFIC_AUDIENCES = /<strong>Specific audiences:<\/strong>\s*([^<]+?)\s*<\/p>/;
const RE_LANGUAGES = /<strong>Languages spoken:<\/strong>\s*([^<]+?)\s*<\/p>/;
const RE_SCHEDULE_BLOCK = /<strong>Schedule:<\/strong>([\s\S]*?)<\/p>/;

/** Decode the small set of HTML entities that show up in SMART's rendered
 *  page. Doesn't try to be a full HTML decoder — just the common ones. */
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Audience tags as published in SMART's own form dropdown. Sort by
// length descending so longest match wins (otherwise "Military" would
// match before "Military, Veterans & First Responders").
const KNOWN_AUDIENCES = [
  'Military, Veterans & First Responders',
  'Family & Friends Only',
  'Young Adults (18-30)',
  'Teens (13-17)',
  'School & College',
  'Adults Welcome',
  'All Welcome',
  'LGBTQIA+',
  'BIPOC',
  'Women',
  'Men',
].sort((a, b) => b.length - a.length);

const KNOWN_LANGUAGES = ['English', 'French', 'Polish', 'Russian', 'Spanish'];

/** Greedy-match a comma-separated field of audience tags. Handles tags
 *  that contain their own commas (e.g. "Military, Veterans & First
 *  Responders") by attempting longest-match against the known set
 *  before falling back to naive comma split. */
function splitAudiences(raw) {
  if (!raw) return [];
  let text = decodeEntities(raw).replace(/\s+/g, ' ').trim();
  const found = [];
  while (text.length > 0) {
    let matched = false;
    for (const known of KNOWN_AUDIENCES) {
      if (text.startsWith(known)) {
        found.push(known);
        text = text.slice(known.length).replace(/^\s*,?\s*/, '');
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Fall back: take the next comma-bounded token. Lets unknown
      // audiences (if SMART adds new ones) still flow through.
      const idx = text.indexOf(',');
      const token = (idx === -1 ? text : text.slice(0, idx)).trim();
      if (token) found.push(token);
      text = idx === -1 ? '' : text.slice(idx + 1).replace(/^\s*/, '');
    }
  }
  return found;
}

/** Simple comma split for fields whose tags don't contain literal
 *  commas (languages, etc.). */
function splitField(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => decodeEntities(s).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

async function fetchDetail(id) {
  const url = `${BASE}/meetings/${id}/`;
  const html = await fetchHtml(url);

  const pathminderMatch = html.match(RE_PATHMINDER);
  if (!pathminderMatch) return null; // not an online meeting after all
  const pathminderUrl = pathminderMatch[1];

  const titleMatch = html.match(RE_TITLE);
  const titleLocation = titleMatch ? decodeEntities(titleMatch[1]).trim() : '';

  const passcodeMatch = html.match(RE_PASSCODE);
  const passcode = passcodeMatch ? passcodeMatch[1].trim() : '';

  const audiencesMatch = html.match(RE_SPECIFIC_AUDIENCES);
  const specificAudiences = splitAudiences(audiencesMatch ? audiencesMatch[1] : '');

  const languagesMatch = html.match(RE_LANGUAGES);
  const languages = splitField(languagesMatch ? languagesMatch[1] : '');

  const scheduleMatch = html.match(RE_SCHEDULE_BLOCK);
  const schedule = scheduleMatch
    ? decodeEntities(scheduleMatch[1].replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .replace(/\s+,/g, ',') // collapse "Tuesday , 12:30" → "Tuesday, 12:30"
        .trim()
    : '';

  return {
    pathminderUrl,
    titleLocation,
    passcode,
    specificAudiences,
    languages,
    schedule,
  };
}

// ─── Concurrency-limited detail fetching ─────────────────────────────

async function fetchAllDetails(meetings) {
  // Sequential with a polite delay — keeps SMART's CF rate-limiter happy
  // and lets the cron's total time stay deterministic.
  const out = [];
  let i = 0;
  for (const m of meetings) {
    i += 1;
    if (i % 50 === 0) {
      console.log(`  detail fetch ${i}/${meetings.length}…`);
    }
    try {
      const detail = await fetchDetail(m.id);
      if (!detail) {
        // Drop: no Pathminder URL means it's not actually online-joinable.
        continue;
      }
      out.push({ ...m, ...detail });
    } catch (e) {
      console.warn(`  ! detail ${m.id}: ${e.message}`);
    }
    await sleep(POLITE_DELAY_MS);
  }
  return out;
}

// ─── Normalize into render-ready shape ───────────────────────────────

function normalize(rec) {
  // Day-of-week + hour/minute in viewer's tz are derived from utcStart
  // at render time, so we don't need to compute them here.

  // Listing-fallback paths use the same audience-aware splitter so
  // tags like "Military, Veterans & First Responders" stay intact.
  const fallbackAudiences = rec.audience ? splitAudiences(rec.audience) : [];
  const fallbackLanguages = rec.language ? splitField(rec.language) : [];

  return {
    id: rec.id,
    name: rec.facilitator
      ? `${rec.program} — ${rec.facilitator}`
      : rec.program || 'SMART Recovery meeting',
    facilitator: rec.facilitator,
    program: rec.program,
    // Prefer the more-detailed "specific audiences" from the detail page
    // when present, falling back to the listing's audience(s).
    audiences:
      rec.specificAudiences.length > 0 ? rec.specificAudiences : fallbackAudiences,
    languages:
      rec.languages.length > 0 ? rec.languages : fallbackLanguages,
    utcStart: rec.utcStart,
    hostCity: rec.locationCity,
    hostState: rec.locationState,
    titleLocation: rec.titleLocation,
    schedule: rec.schedule,
    passcode: rec.passcode,
    pathminderUrl: rec.pathminderUrl,
    detailUrl: `${BASE}/meetings/${rec.id}/`,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching SMART Recovery listing pages (multi-city)…');
  const { meetings: rawListings, cityCounts } = await fetchAllListings();
  console.log(`  union of all cities: ${rawListings.length} unique meeting IDs`);

  console.log('Fetching detail pages for Pathminder URLs…');
  const enriched = await fetchAllDetails(rawListings);
  console.log(`  with Pathminder URL: ${enriched.length}`);
  console.log(`  dropped (no online join): ${rawListings.length - enriched.length}`);

  const normalized = enriched.map(normalize);

  // Inventories for filter UI.
  const programCounts = {};
  const audienceCounts = {};
  const languageCounts = {};
  for (const m of normalized) {
    programCounts[m.program] = (programCounts[m.program] || 0) + 1;
    for (const a of m.audiences) audienceCounts[a] = (audienceCounts[a] || 0) + 1;
    for (const l of m.languages) languageCounts[l] = (languageCounts[l] || 0) + 1;
  }

  const output = {
    fetched_at: new Date().toISOString(),
    source: `${BASE}/meetings/`,
    attribution:
      'Data from meetings.smartrecovery.org, used with SMART Recovery permission. Not affiliated with SMART Recovery.',
    search_cities: SEARCH_CITIES,
    search_radius_mi: RADIUS_MI,
    city_counts: cityCounts,
    total: normalized.length,
    program_counts: programCounts,
    audience_counts: audienceCounts,
    language_counts: languageCounts,
    meetings: normalized,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
