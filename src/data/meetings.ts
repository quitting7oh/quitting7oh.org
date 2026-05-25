/** Single source of truth for the recurring meeting schedule rendered
 *  on /resources/meeting-schedules.mdx AND consumed by the homepage
 *  "next meeting" widget (NextMeeting.tsx).
 *
 *  All times are in ET (America/New_York), which handles DST. The
 *  NextMeeting widget converts to the viewer's local timezone at
 *  render time.
 *
 *  If the schedule changes, edit this file. The markdown page renders
 *  its tables from this data via the <MeetingsTable /> component;
 *  there is no separate copy to keep in sync.
 *
 *  Authoritative published sources:
 *  - KA:  https://www.kratom-anonymous.org
 *  - KQS: https://kratomquitters.com/meetings
 */

export type Fellowship = 'KA' | 'KQS';

export interface FellowshipMeta {
  id: Fellowship;
  /** Long display name. */
  name: string;
  /** Short / informal name used inline. */
  shortName: string;
  /** Programme-style: 12-step vs non-12-step. Surfaced in the homepage
   *  widget so a reader sees up front whether they're looking at AA-
   *  style format or an open peer-support format. */
  framework: '12-step' | 'non-12-step';
  /** Brief framing displayed alongside the table. */
  tagline: string;
  /** Authoritative source URL. */
  sourceUrl: string;
  /** Default meeting duration. Both KA and TIAWO run ~1 hour meetings. */
  defaultDurationMin: number;
}

export interface Meeting {
  fellowship: Fellowship;
  /** Days of week as JS getDay() numbers (0=Sun, 1=Mon, ..., 6=Sat).
   *  Multiple days means this same meeting recurs on each. */
  daysOfWeek: number[];
  hourET: number; // 0–23
  minuteET: number; // 0–59
  /** Format/topic label (e.g. "Discussion", "Step", "Morning"). */
  format: string;
  /** Primary join URL (the Zoom or Google Meet URL). */
  joinUrl: string;
  /** Optional human-friendly shortlink for display in the table. */
  shortLink?: string;
  /** Optional display string for the room number (Zoom). */
  room?: string;
  /** Optional duration override; falls back to fellowship default. */
  durationMinutes?: number;
  /** Optional note shown beside the format (e.g. "Grow Recovery"). */
  note?: string;
}

export const FELLOWSHIPS: Record<Fellowship, FellowshipMeta> = {
  KA: {
    id: 'KA',
    name: 'Kratom Anonymous',
    shortName: 'Kratom Anonymous',
    framework: '12-step',
    tagline:
      'Kratom Anonymous (KA) is a 12-step fellowship focused specifically on kratom, kratom extracts, and 7-OH addiction. Multiple daily virtual meetings on Zoom; the same room is reused for a given time slot and the format rotates between Discussion and Step.',
    sourceUrl: 'https://www.kratom-anonymous.org',
    defaultDurationMin: 60,
  },
  KQS: {
    id: 'KQS',
    name: 'There Is A Way Out (TIAWO)',
    shortName: 'TIAWO',
    framework: 'non-12-step',
    tagline:
      'There Is A Way Out (TIAWO), also published as "Quitting Kratom Support", is a volunteer-led non-12-step virtual community focused on kratom and 7-OH recovery. Meetings run on Google Meet and are open to both people in recovery and their loved ones.',
    sourceUrl: 'https://kratomquitters.com/meetings',
    defaultDurationMin: 60,
  },
};

/** Stable room/shortlink references used by multiple meetings.
 *  Defining once keeps the meeting entries below readable. */
const KA_ROOMS = {
  weekday10am: {
    joinUrl:
      'https://us06web.zoom.us/j/85416304667?pwd=pkbSAebEMTzfj65ldpcbekavV2Yi0k.1',
    shortLink: 'https://cutt.ly/ctg55sR6',
    room: '854 1630 4667',
  },
  weekday9pm: {
    joinUrl:
      'https://us06web.zoom.us/j/85310604948?pwd=G4oCebuIbCvJ0aVCYmyebe8jRyfHg6.1',
    shortLink: 'https://cutt.ly/8tgmCNjd',
    room: '853 1060 4948',
  },
  thuEvening: {
    joinUrl:
      'https://us06web.zoom.us/j/86106557739?pwd=b4ARPZhF3q7ROSabq65a1tQjNXhMYw.1',
    shortLink: 'https://cutt.ly/4tgmVje8',
    room: '861 0655 7739',
  },
  weekend: {
    joinUrl:
      'https://us06web.zoom.us/j/83187735602?pwd=dn36p4BHboNxaAZLrbbS7yAKlsRemV.1',
    shortLink: 'https://cutt.ly/xtgmVDlr',
    room: '831 8773 5602',
  },
  growRecovery: {
    joinUrl: 'https://meet.google.com/tns-snrh-eyn',
  },
} as const;

const KQS_ROOMS = {
  main: {
    joinUrl: 'https://meet.google.com/cza-tyjv-fun',
  },
  mens: {
    joinUrl: 'https://meet.google.com/qjc-fixa-fnv',
  },
  womens: {
    joinUrl: 'https://meet.google.com/sbo-hibj-uwv',
  },
} as const;

export const MEETINGS: Meeting[] = [
  // ─── Kratom Anonymous (KA) ───────────────────────────────────────────
  // Weekday 10:00 AM ET — same Zoom room, format alternates by day.
  { fellowship: 'KA', daysOfWeek: [1, 3, 5], hourET: 10, minuteET: 0, format: 'Discussion', ...KA_ROOMS.weekday10am },
  { fellowship: 'KA', daysOfWeek: [2, 4], hourET: 10, minuteET: 0, format: 'Step', ...KA_ROOMS.weekday10am },

  // Weekday 9:00 PM ET — same Zoom room, format alternates by day.
  { fellowship: 'KA', daysOfWeek: [1, 3, 5], hourET: 21, minuteET: 0, format: 'Step', ...KA_ROOMS.weekday9pm },
  { fellowship: 'KA', daysOfWeek: [2, 4], hourET: 21, minuteET: 0, format: 'Discussion', ...KA_ROOMS.weekday9pm },

  // Thursday evening (separate Zoom room from the regular 9pm).
  { fellowship: 'KA', daysOfWeek: [4], hourET: 18, minuteET: 45, format: 'Discussion', ...KA_ROOMS.thuEvening },

  // Grow Recovery (side-panel listing on the KA site, Google Meet).
  { fellowship: 'KA', daysOfWeek: [3], hourET: 10, minuteET: 0, format: 'Discussion', note: 'Grow Recovery', ...KA_ROOMS.growRecovery },
  { fellowship: 'KA', daysOfWeek: [3], hourET: 21, minuteET: 0, format: '12-Step', note: 'Grow Recovery', ...KA_ROOMS.growRecovery },

  // Weekend — single Zoom room covers all four slots.
  { fellowship: 'KA', daysOfWeek: [6], hourET: 13, minuteET: 0, format: 'Step', ...KA_ROOMS.weekend },
  { fellowship: 'KA', daysOfWeek: [6], hourET: 17, minuteET: 0, format: 'Discussion', ...KA_ROOMS.weekend },
  { fellowship: 'KA', daysOfWeek: [0], hourET: 13, minuteET: 0, format: 'Discussion', ...KA_ROOMS.weekend },
  { fellowship: 'KA', daysOfWeek: [0], hourET: 17, minuteET: 0, format: 'Step', ...KA_ROOMS.weekend },

  // ─── Quitting Kratom Support (KQS / TIAWO) ───────────────────────────
  // Daily Mon–Sun on the shared Google Meet room.
  { fellowship: 'KQS', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], hourET: 8, minuteET: 0, format: 'Morning', ...KQS_ROOMS.main },
  { fellowship: 'KQS', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], hourET: 12, minuteET: 0, format: 'Midday', ...KQS_ROOMS.main },
  { fellowship: 'KQS', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], hourET: 20, minuteET: 0, format: 'Evening', ...KQS_ROOMS.main },

  // Tue/Thu/Sun late evening.
  { fellowship: 'KQS', daysOfWeek: [2, 4, 0], hourET: 21, minuteET: 15, format: 'Late evening', ...KQS_ROOMS.main },

  // Sunday gendered meetings, separate Google Meet rooms.
  { fellowship: 'KQS', daysOfWeek: [0], hourET: 11, minuteET: 0, format: "Men's meeting", ...KQS_ROOMS.mens },
  { fellowship: 'KQS', daysOfWeek: [0], hourET: 13, minuteET: 30, format: "Women's meeting", ...KQS_ROOMS.womens },
];

// ─── Platform / URL helpers ──────────────────────────────────────────────

/** Recognize the videoconference platform from a join URL. Drives the
 *  homepage widget's CTA label ("Join in Zoom" vs "Join in Google Meet")
 *  so a reader knows what they're about to open. */
export function platformFromUrl(url: string): 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Webex' | 'Online meeting' {
  if (/(^|\.)zoom\.us\//.test(url) || /\bcutt\.ly\b/.test(url)) return 'Zoom';
  if (/\bmeet\.google\.com\b/.test(url)) return 'Google Meet';
  if (/\bteams\.microsoft\.com\b/.test(url)) return 'Microsoft Teams';
  if (/\bwebex\.com\b/.test(url)) return 'Webex';
  return 'Online meeting';
}

// ─── TZ-aware occurrence math ────────────────────────────────────────────

const ET_TZ = 'America/New_York';

/** Convert an ET wall-clock moment (y/m/d/h/min) into a UTC timestamp,
 *  handling DST. Approach: format the candidate UTC as ET to find the
 *  offset, then shift. */
function etWallClockToUTC(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
): number {
  const naiveUTC = Date.UTC(y, m - 1, d, h, min, 0);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ET_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(naiveUTC)).map((p) => [p.type, p.value]),
  );
  // Some browsers emit "24" for midnight; normalize to 00.
  const etHour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const etInterpretedAsUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    etHour,
    Number(parts.minute),
    Number(parts.second),
  );
  // diff = naiveUTC − etInterpretedAsUTC = ET's offset from UTC at that moment
  const offsetMs = naiveUTC - etInterpretedAsUTC;
  return naiveUTC + offsetMs;
}

/** Today's date (year/month/day, 1-based month) as it reads in ET, plus
 *  the day-of-week as a JS getDay() number. */
function etToday(now: Date): { y: number; m: number; d: number; dow: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ET_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
    dow: dowMap[parts.weekday] ?? 0,
  };
}

/** Add `offset` calendar days to (y, m, d). Uses Date.UTC for overflow
 *  normalization without bringing any TZ into play. */
function addDays(y: number, m: number, d: number, offset: number): { y: number; m: number; d: number; dow: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + offset));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
    dow: dt.getUTCDay(),
  };
}

/** For a given meeting, find the most relevant occurrence: the soonest
 *  one whose end is in the future (i.e., either ongoing or upcoming).
 *  Returns null only if the meeting has an empty daysOfWeek. */
export function meetingOccurrence(meeting: Meeting, now: Date): { start: Date; end: Date } | null {
  const durationMs = (meeting.durationMinutes ?? FELLOWSHIPS[meeting.fellowship].defaultDurationMin) * 60_000;
  const todayET = etToday(now);

  // Search from yesterday (to catch ongoing meetings that started late
  // last night ET) through 7 days ahead.
  for (let offset = -1; offset <= 7; offset++) {
    const dayET = addDays(todayET.y, todayET.m, todayET.d, offset);
    if (!meeting.daysOfWeek.includes(dayET.dow)) continue;

    const startMs = etWallClockToUTC(dayET.y, dayET.m, dayET.d, meeting.hourET, meeting.minuteET);
    const endMs = startMs + durationMs;
    if (endMs > now.getTime()) {
      return { start: new Date(startMs), end: new Date(endMs) };
    }
  }
  return null;
}

export type MeetingStatus =
  | 'future' // > 15 min before start
  | 'starting-soon' // 15 min → 0 min before start
  | 'meeting-starting' // 0 → 5 min after start
  | 'live-now'; // 5 → 60 min after start (or until end)

/** Classify a meeting's occurrence relative to `now`. */
export function classifyStatus(start: Date, now: Date): MeetingStatus {
  const diff = start.getTime() - now.getTime(); // ms until start
  if (diff > 15 * 60_000) return 'future';
  if (diff > 0) return 'starting-soon';
  if (diff > -5 * 60_000) return 'meeting-starting';
  return 'live-now';
}

export interface DisplayMeeting {
  meeting: Meeting;
  start: Date;
  end: Date;
  status: MeetingStatus;
}

/** Pick the single meeting the homepage widget should display now.
 *  Algorithm: for each meeting, get its current-or-next occurrence; among
 *  those, return the one with the earliest start. That naturally prefers
 *  meetings that are already live (negative diff) and otherwise the next
 *  future occurrence. */
export function findDisplayMeeting(now: Date = new Date()): DisplayMeeting | null {
  const candidates: DisplayMeeting[] = [];
  for (const m of MEETINGS) {
    const occ = meetingOccurrence(m, now);
    if (!occ) continue;
    candidates.push({
      meeting: m,
      start: occ.start,
      end: occ.end,
      status: classifyStatus(occ.start, now),
    });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.start.getTime() - b.start.getTime());
  return candidates[0];
}
