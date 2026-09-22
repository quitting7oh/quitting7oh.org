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

export interface LiveMeetingIndex {
  generatedAt: string;
  featuredNa: LiveNaMeeting | null;
  na: LiveNaMeeting[];
  smart: [];
}

export interface LiveMeetingChoice {
  meeting: LiveNaMeeting;
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

function choiceKey(choice: LiveMeetingChoice): string {
  return `${choice.meeting.provider}:${choice.meeting.id}`;
}

export function chooseLiveMeeting(
  index: LiveMeetingIndex,
  now: Date,
  preferredKey?: string | null,
): LiveMeetingChoice | null {
  const pool = liveNaMeetings(index.na, now);

  if (preferredKey) {
    const previous = pool.find((choice) => choiceKey(choice) === preferredKey);
    if (previous) return previous;
  }

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return index.featuredNa
    ? { meeting: index.featuredNa, end: null, fallback: true }
    : null;
}

export function liveMeetingChoiceKey(choice: LiveMeetingChoice): string {
  return choiceKey(choice);
}
