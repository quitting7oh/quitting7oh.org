import { addDays, todayInTimezone, wallClockToUTC } from '~/lib/tz';

export interface LiveNaMeeting {
  provider: 'NA';
  id: string;
  name: string;
  joinUrl: string;
  platform: string;
  day: number;
  hour: number;
  minute: number;
  timezone: string;
  alwaysAvailable?: boolean;
}

export interface LiveSmartMeeting {
  provider: 'SMART';
  id: string;
  name: string;
  joinUrl: string;
  platform: 'SMART Online';
  utcStart: string;
}

export interface LiveMeetingIndex {
  generatedAt: string;
  featuredNa: LiveNaMeeting | null;
  na: LiveNaMeeting[];
  smart: LiveSmartMeeting[];
}

export type LiveMeetingRecord = LiveNaMeeting | LiveSmartMeeting;

export interface LiveMeetingChoice {
  meeting: LiveMeetingRecord;
  end: Date | null;
  fallback: boolean;
}

function liveNaMeetings(meetings: LiveNaMeeting[], now: Date): LiveMeetingChoice[] {
  const nowMs = now.getTime();
  const live: LiveMeetingChoice[] = [];
  for (const meeting of meetings) {
    const today = todayInTimezone(now, meeting.timezone);
    for (let offset = -1; offset <= 0; offset += 1) {
      const day = addDays(today.y, today.m, today.d, offset);
      if (day.dow !== meeting.day) continue;
      const startMs = wallClockToUTC(
        day.y,
        day.m,
        day.d,
        meeting.hour,
        meeting.minute,
        meeting.timezone,
      );
      const end = new Date(startMs + 60 * 60_000);
      if (startMs <= nowMs && end.getTime() > nowMs) {
        live.push({ meeting, end, fallback: false });
      }
    }
  }
  return live;
}

function liveSmartMeetings(meetings: LiveSmartMeeting[], now: Date): LiveMeetingChoice[] {
  const nowMs = now.getTime();
  return meetings.flatMap((meeting) => {
    const startMs = Date.parse(meeting.utcStart);
    const end = new Date(startMs + 60 * 60_000);
    return Number.isFinite(startMs) && startMs <= nowMs && end.getTime() > nowMs
      ? [{ meeting, end, fallback: false }]
      : [];
  });
}

function choiceKey(choice: LiveMeetingChoice): string {
  return `${choice.meeting.provider}:${choice.meeting.id}`;
}

export function chooseLiveMeeting(
  index: LiveMeetingIndex,
  now: Date,
  preferredKey?: string | null,
): LiveMeetingChoice | null {
  const na = liveNaMeetings(index.na, now);
  const smart = liveSmartMeetings(index.smart, now);
  const all = [...na, ...smart];

  if (preferredKey) {
    const previous = all.find((choice) => choiceKey(choice) === preferredKey);
    if (previous) return previous;
  }

  if (all.length > 0) {
    const providerPools = [na, smart].filter((pool) => pool.length > 0);
    const pool = providerPools[Math.floor(Math.random() * providerPools.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return index.featuredNa
    ? { meeting: index.featuredNa, end: null, fallback: true }
    : null;
}

export function chooseLiveMeetingForProvider(
  index: LiveMeetingIndex,
  provider: LiveMeetingRecord['provider'],
  now: Date,
  preferredKey?: string | null,
): LiveMeetingChoice | null {
  const pool =
    provider === 'NA'
      ? liveNaMeetings(index.na, now)
      : liveSmartMeetings(index.smart, now);

  if (preferredKey) {
    const previous = pool.find((choice) => choiceKey(choice) === preferredKey);
    if (previous) return previous;
  }

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return provider === 'NA' && index.featuredNa
    ? { meeting: index.featuredNa, end: null, fallback: true }
    : null;
}

export function liveMeetingChoiceKey(choice: LiveMeetingChoice): string {
  return choiceKey(choice);
}
