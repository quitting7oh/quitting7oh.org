#!/usr/bin/env node
// Build-time fetch + normalize for the /virtual-na-meetings-now page.
//
// Pulls the full week of virtual NA meetings from na.org's admin-ajax
// endpoint (same source the page at /meetingsearch/virtual-meeting-search/
// uses), filters to US + English, normalizes the records into a render-
// ready shape, and writes src/data/na-meetings.generated.json.
//
// Authorized by NAWS senior leadership for republication with attribution.
//
// Run this:
//   - manually before committing if you want a fresher snapshot, or
//   - automatically on a weekly schedule by .github/workflows/refresh-na-meetings.yml
//
// The generated JSON is committed to the repo so the build doesn't need
// network access at deploy time.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_PATH = join(REPO_ROOT, 'src', 'data', 'na-meetings.generated.json');

const ENDPOINT = 'https://na.org/wp-admin/admin-ajax.php';
const REFERER = 'https://na.org/meetingsearch/virtual-meeting-search/';
const UA =
  'quitting7oh.org meeting collector (+https://quitting7oh.org; authorized by NAWS)';

const FILTERS = {
  country: 'United States',
  language: 'English',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MINUTES_PER_DAY = 24 * 60;
const POLITE_DELAY_MS = 1000;

async function fetchDay(day) {
  const body = new URLSearchParams({
    action: 'fetch_meetings_tz',
    time_diff: '[]',
    time_from: String((day - 1) * MINUTES_PER_DAY),
    time_to: String(day * MINUTES_PER_DAY),
  });
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Referer: REFERER,
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) throw new Error(`day ${day}: HTTP ${res.status}`);
  const text = await res.text();
  return JSON.parse(text);
}

function matchesFilters(row) {
  for (const [k, v] of Object.entries(FILTERS)) {
    if ((row[k] ?? '') !== v) return false;
  }
  return true;
}

// Zoom URLs look like:
//   https://us02web.zoom.us/j/85416304667
//   https://us02web.zoom.us/j/85416304667?pwd=abc.1
//   https://zoom.us/j/12345678
// We extract the meeting ID from /j/, /my/, or /wc/ paths.
const ZOOM_HOST_RE = /^(?:[a-z0-9-]+\.)?zoom\.us$/i;
const ZOOM_ID_RE = /\/(?:j|my|wc)\/([A-Za-z0-9._-]+)/i;

function parseZoom(url) {
  try {
    const u = new URL(url);
    if (!ZOOM_HOST_RE.test(u.hostname)) return null;
    const m = ZOOM_ID_RE.exec(u.pathname);
    if (!m) return null;
    return {
      url: u,
      meetingId: m[1].toLowerCase(),
      hasPwd: u.searchParams.has('pwd'),
    };
  } catch {
    return null;
  }
}

// Passcode field can carry junk like "Password: 247247", "PW 1234",
// "Meeting ID: 854 1630 4667; Passcode: AbCxYz". Pull out the most
// plausible-looking passcode token. Returns null if we can't find one.
function extractPasscode(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim();
  if (cleaned.length === 0) return null;

  // "Password: foo" or "Passcode: foo" or "PW: foo" — take the part after the colon.
  const labeled = cleaned.match(/(?:password|passcode|pw)\s*[:=]\s*([^\s,;]+)/i);
  if (labeled) return labeled[1];

  // If there's no whitespace, treat the whole string as the passcode.
  if (!/\s/.test(cleaned)) return cleaned;

  // Otherwise — multiple tokens. Take the first alphanumeric token.
  const firstToken = cleaned.match(/[A-Za-z0-9._-]+/);
  return firstToken ? firstToken[0] : null;
}

// ~23% of US English meetings come back from na.org with the `link`
// field empty and the connection info packed into `password` as free
// text. Three shapes account for nearly all of them:
//
//   1. Zoom packed in password:
//      "Zoom ID: 669 913 3088  Password: LL130"
//      "Meeting ID: 854 1630 4667 Password: foo"
//      → reconstruct a normal Zoom URL with embedded pwd
//
//   2. Phone dial-in (legitimate NA phone meeting format):
//      "+1 848.220-3300  Access Code: 22222222#"
//      "Dial-in #: 605-313-5144  Access Code: 367404#"
//      → build a `tel:` URL with the phone, surface the access code
//
//   3. Unparseable junk — fall through and leave link blank.
//
// Returns one of:
//   { kind: 'zoom', meetingId, passcode }
//   { kind: 'phone', phoneNumber, accessCode }
//   { kind: 'none' }
function parseEmbeddedConnection(raw) {
  if (!raw) return { kind: 'none' };
  const text = String(raw);

  // Zoom shape: "Zoom ID: 669 913 3088 Password: LL130"
  // The ID is 9-11 digits, often grouped with spaces or dashes.
  const zoomIdMatch = text.match(
    /(?:zoom\s*id|meeting\s*id|mtg\s*id)\s*[:#=]?\s*([\d\s.-]{9,18})/i,
  );
  if (zoomIdMatch) {
    const meetingId = zoomIdMatch[1].replace(/[\s.-]/g, '');
    if (/^\d{9,11}$/.test(meetingId)) {
      const pwdMatch = text.match(
        /(?:password|passcode|pw)\s*[:=]?\s*([A-Za-z0-9._-]+)/i,
      );
      return {
        kind: 'zoom',
        meetingId,
        passcode: pwdMatch ? pwdMatch[1] : '',
      };
    }
  }

  // Phone dial-in: a US-formatted phone number plus an "Access Code"
  // or "PIN" or "Conference Code".
  const phoneMatch = text.match(
    /(?:\+?\s*1\s*[-.()\s]*)?(\d{3})[-.\s)]+\s*(\d{3})[-.\s]+(\d{4})/,
  );
  const accessMatch = text.match(
    /(?:access\s*code|conference\s*code|pin|code)\s*[:#=]?\s*([\d#*]+)/i,
  );
  if (phoneMatch && accessMatch) {
    const phoneNumber = `+1${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}`;
    return {
      kind: 'phone',
      phoneNumber,
      accessCode: accessMatch[1].replace(/#$/, ''),
    };
  }

  return { kind: 'none' };
}

// If the URL is Zoom + has no ?pwd= + we have a passcode, embed it.
// Otherwise return the original link unchanged (Google Meet, WhatsApp,
// Telegram, FB groups, custom domains: we don't try to mess with those).
function buildJoinUrl(originalLink, passcode) {
  const z = parseZoom(originalLink);
  if (!z) return { joinUrl: originalLink, hasEmbeddedPasscode: false };
  if (z.hasPwd) return { joinUrl: originalLink, hasEmbeddedPasscode: true };
  if (!passcode) return { joinUrl: originalLink, hasEmbeddedPasscode: false };
  z.url.searchParams.set('pwd', passcode);
  return { joinUrl: z.url.toString(), hasEmbeddedPasscode: true };
}

// Format the Zoom meeting ID with the standard 3-3-4 / 3-4-4 grouping
// that Zoom itself prints in client UIs. Numeric only; vanity URLs pass
// through.
function formatRoomNumber(meetingId) {
  if (!/^\d+$/.test(meetingId)) return meetingId;
  if (meetingId.length === 9) return `${meetingId.slice(0,3)} ${meetingId.slice(3,6)} ${meetingId.slice(6)}`;
  if (meetingId.length === 10) return `${meetingId.slice(0,3)} ${meetingId.slice(3,6)} ${meetingId.slice(6)}`;
  if (meetingId.length === 11) return `${meetingId.slice(0,3)} ${meetingId.slice(3,7)} ${meetingId.slice(7)}`;
  return meetingId;
}

function platformOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (ZOOM_HOST_RE.test(h)) return 'Zoom';
    if (h === 'meet.google.com') return 'Google Meet';
    if (
      h === 'teams.microsoft.com' ||
      h.endsWith('.teams.microsoft.com') ||
      h === 'teams.live.com'
    ) {
      return 'Microsoft Teams';
    }
    if (h.endsWith('webex.com')) return 'Webex';
    if (h.endsWith('gotomeeting.com') || h.endsWith('goto.com')) return 'GoToMeeting';
    if (h.endsWith('freeconferencecall.com')) return 'FreeConferenceCall';
    if (h === 'meet.jit.si' || h.endsWith('.jit.si')) return 'Jitsi';
    if (h === 'discord.gg' || h === 'discord.com' || h.endsWith('.discord.com')) return 'Discord';
    if (h === 'chat.whatsapp.com') return 'WhatsApp';
    if (h === 't.me') return 'Telegram';
    if (h.endsWith('facebook.com') || h === 'fb.me') return 'Facebook';
    return 'Online meeting';
  } catch {
    return 'Online meeting';
  }
}

function parseFormatTags(formatStr) {
  if (!formatStr || !formatStr.trim()) return [];
  return formatStr
    .split(';')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// Normalize one raw row into the render-ready shape.
function normalizeRow(row) {
  // mtg_day in raw data is 1=Sunday..7=Saturday. Convert to JS getDay()
  // semantics (0=Sunday..6=Saturday) to match src/data/meetings.ts.
  const day = (row.mtg_day - 1) % 7;
  const timeStr = String(row.mtg_time).padStart(4, '0');
  const hour = parseInt(timeStr.slice(0, 2), 10);
  const minute = parseInt(timeStr.slice(2), 10);

  let joinUrl = '';
  let platform = 'Online meeting';
  let passcode = '';
  let hasEmbeddedPasscode = false;
  let roomNumber = '';

  if (row.link && row.link.trim()) {
    // Standard case: the row has a real link.
    passcode = extractPasscode(row.password) || '';
    const built = buildJoinUrl(row.link, passcode);
    joinUrl = built.joinUrl;
    hasEmbeddedPasscode = built.hasEmbeddedPasscode;
    platform = platformOf(row.link);
    const zoom = parseZoom(row.link);
    if (zoom) roomNumber = formatRoomNumber(zoom.meetingId);
  } else {
    // No link. Try to recover from the password field — many rows pack
    // their Zoom or phone connection info there as free text.
    const recovered = parseEmbeddedConnection(row.password);
    if (recovered.kind === 'zoom') {
      const params = new URLSearchParams();
      if (recovered.passcode) params.set('pwd', recovered.passcode);
      const qs = params.toString();
      joinUrl = `https://us02web.zoom.us/j/${recovered.meetingId}${qs ? '?' + qs : ''}`;
      platform = 'Zoom';
      passcode = recovered.passcode;
      hasEmbeddedPasscode = Boolean(recovered.passcode);
      roomNumber = formatRoomNumber(recovered.meetingId);
    } else if (recovered.kind === 'phone') {
      joinUrl = `tel:${recovered.phoneNumber}`;
      platform = 'Phone Call';
      passcode = recovered.accessCode;
      // The access code can't be auto-entered cross-platform reliably
      // — caller will be prompted for it. So it's effectively NOT
      // embedded, even though it's "in" the tel URL conceptually.
      hasEmbeddedPasscode = false;
      roomNumber = recovered.phoneNumber.replace(
        /^\+1(\d{3})(\d{3})(\d{4})$/,
        '($1) $2-$3',
      );
    }
    // recovered.kind === 'none' falls through with joinUrl = '' — the
    // component will treat the row as a non-joinable listing.
  }

  return {
    id: row.id,
    name: row.com_name || '',
    formatTags: parseFormatTags(row.format),
    closed: row.closed === 'Closed' ? 'Closed' : 'Open',
    day,
    hour,
    minute,
    timezone: row.timezone,
    platform,
    joinUrl,
    rawLink: row.link,
    passcode,
    hasEmbeddedPasscode,
    roomNumber,
    notes: row.room || '',
    state: row.state || '',
    city: row.city || '',
  };
}

// The 24/7 room (Zoom ID 558544927, name "NA 24/7 Online Meeting") is
// represented in the raw data as 158 separate rows — every-hour, every
// day. Collapse to a single featured record so the page renders it once
// as the always-available card.
function dedupe24x7(rows) {
  const TWENTY_FOUR_SEVEN_NAME = 'NA 24/7 Online Meeting';
  const featured = rows.find((r) => r.name === TWENTY_FOUR_SEVEN_NAME);
  if (!featured) return { featured: null, regular: rows };
  const regular = rows.filter((r) => r.name !== TWENTY_FOUR_SEVEN_NAME);
  return { featured: { ...featured, is24x7: true }, regular };
}

async function main() {
  console.log('Fetching virtual NA meetings (7 days)…');
  const allRaw = [];
  const perDayCounts = {};
  for (let day = 1; day <= 7; day++) {
    process.stdout.write(`  ${DAY_NAMES[day - 1].padEnd(10)} `);
    const rows = await fetchDay(day);
    console.log(`${rows.length} meetings`);
    perDayCounts[DAY_NAMES[day - 1]] = rows.length;
    allRaw.push(...rows);
    if (day < 7) await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }
  console.log(`Total raw: ${allRaw.length}`);

  const filtered = allRaw.filter(matchesFilters);
  console.log(`After filter (${JSON.stringify(FILTERS)}): ${filtered.length}`);

  const normalized = filtered.map(normalizeRow);
  const { featured, regular } = dedupe24x7(normalized);
  console.log(`Featured 24/7 room: ${featured ? 'yes' : 'no'}`);
  console.log(`Regular meetings: ${regular.length}`);

  // Connection-recovery stats — many rows pack info into the password
  // field instead of using the link field. Track how well we did.
  const platformBreakdown = {};
  let unjoinable = 0;
  for (const m of regular) {
    platformBreakdown[m.platform] = (platformBreakdown[m.platform] || 0) + 1;
    if (!m.joinUrl) unjoinable += 1;
  }
  console.log('Platform breakdown:');
  for (const [p, n] of Object.entries(platformBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${p}`);
  }
  console.log(`Rows with no joinable connection: ${unjoinable}`);

  // Tag inventory for filter UI.
  const tagCounts = {};
  for (const m of regular) {
    for (const t of m.formatTags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }

  const output = {
    fetched_at: new Date().toISOString(),
    source: REFERER,
    attribution: 'Data from na.org, used with NAWS permission. Not affiliated with Narcotics Anonymous.',
    filters: FILTERS,
    raw_per_day_counts: perDayCounts,
    raw_total: allRaw.length,
    filtered_total: filtered.length,
    tag_counts: tagCounts,
    platform_counts: platformBreakdown,
    featured,
    meetings: regular,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
