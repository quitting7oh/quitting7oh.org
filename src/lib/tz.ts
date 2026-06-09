/** Generic timezone helpers for occurrence math across IANA timezones.
 *
 *  The existing src/data/meetings.ts code is ET-specific (the kratom
 *  meetings all publish in America/New_York). The NA virtual meeting
 *  dataset spans dozens of timezones — every meeting carries its own
 *  IANA string — so the math here parameterizes on the timezone.
 *
 *  Approach (same as the ET version): create a naive UTC timestamp from
 *  the wall-clock fields, ask Intl.DateTimeFormat to re-render that
 *  timestamp in the target timezone, diff the two to recover the offset,
 *  then shift. Handles DST by going through the formatter at the actual
 *  moment in question.
 */

/** Convert a wall-clock moment (year, month, day, hour, minute) in a
 *  given IANA timezone to a UTC timestamp in milliseconds. */
export function wallClockToUTC(
  y: number,
  m: number, // 1-12
  d: number,
  h: number,
  min: number,
  timezone: string,
): number {
  const naiveUTC = Date.UTC(y, m - 1, d, h, min, 0);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
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
  const tzHour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const tzInterpretedAsUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    tzHour,
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = naiveUTC - tzInterpretedAsUTC;
  return naiveUTC + offsetMs;
}

/** Today's wall-clock date (y/m/d) and JS-style day-of-week (0=Sun..6=Sat)
 *  as observed in the given timezone. */
export function todayInTimezone(
  now: Date,
  timezone: string,
): { y: number; m: number; d: number; dow: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const dowMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
    dow: dowMap[parts.weekday] ?? 0,
  };
}

/** Add `offset` calendar days to (y, m, d), returning the resulting
 *  date and its day-of-week. Uses Date.UTC for overflow normalization
 *  without bringing any timezone into play. */
export function addDays(
  y: number,
  m: number,
  d: number,
  offset: number,
): { y: number; m: number; d: number; dow: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + offset));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
    dow: dt.getUTCDay(),
  };
}

/** For a recurring meeting that runs on the given day-of-week at the
 *  given local hour/minute in the given timezone, return the next
 *  occurrence whose end is in the future (or whose start is within the
 *  trailing `gracePeriodMin` minutes — i.e. still callable as live).
 *  Searches up to 8 days ahead to handle the weekly recurrence and
 *  cross-week boundary cases. */
export function nextOccurrence(
  daysOfWeek: number[], // 0=Sun..6=Sat
  hour: number,
  minute: number,
  timezone: string,
  now: Date,
  durationMin: number = 60,
): { start: Date; end: Date } | null {
  const today = todayInTimezone(now, timezone);
  const durationMs = durationMin * 60_000;
  for (let offset = -1; offset <= 8; offset++) {
    const day = addDays(today.y, today.m, today.d, offset);
    if (!daysOfWeek.includes(day.dow)) continue;
    const startMs = wallClockToUTC(day.y, day.m, day.d, hour, minute, timezone);
    const endMs = startMs + durationMs;
    if (endMs > now.getTime()) {
      return { start: new Date(startMs), end: new Date(endMs) };
    }
  }
  return null;
}
