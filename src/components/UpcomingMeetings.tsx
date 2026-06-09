import * as React from 'react';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import {
  findUpcomingMeetings,
  FELLOWSHIPS,
  platformFromUrl,
  type DisplayMeeting,
  type MeetingStatus,
} from '~/data/meetings';
import { cn } from '~/lib/utils';

const TICK_MS = 30_000;
/** How far ahead to look. 3 days fits comfortably on a page without
 *  scrolling becoming overwhelming, and covers the standard "I'll go
 *  to a meeting this week" planning horizon. */
const WINDOW_DAYS = 3;

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.max(0, Math.floor(ms / 1000))}s`;
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hours < 24) return min > 0 ? `${hours}h ${min}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localDayLabel(date: Date, now: Date): string {
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return 'Today';
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();
  if (isTomorrow) return 'Tomorrow';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function statusDetail(
  status: MeetingStatus,
  start: Date,
  end: Date,
  now: Date,
): string {
  switch (status) {
    case 'future':
    case 'starting-soon':
      return `in ${formatDuration(start.getTime() - now.getTime())}`;
    case 'meeting-starting':
      return 'just started';
    case 'live-now':
      return `${formatDuration(end.getTime() - now.getTime())} remaining`;
  }
}

const STATUS_TONES: Record<
  MeetingStatus,
  { label: string; pill: string }
> = {
  future: {
    label: 'Upcoming',
    pill: 'bg-sky-700 text-sky-50 dark:bg-sky-300 dark:text-sky-950',
  },
  'starting-soon': {
    label: 'Starting soon',
    pill: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950',
  },
  'meeting-starting': {
    label: 'Meeting starting',
    pill: 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950',
  },
  'live-now': {
    label: 'Live now',
    pill: 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950',
  },
};

interface CardProps {
  display: DisplayMeeting;
  now: Date;
}

/** Featured "Next up" card — large, prominent, takes the top of the page. */
function FeaturedCard({ display, now }: CardProps) {
  const { meeting, start, end, status } = display;
  const fellowship = FELLOWSHIPS[meeting.fellowship];
  const platform = platformFromUrl(meeting.joinUrl);
  const tone = STATUS_TONES[status];
  // When the meeting hasn't started, "Next up" is the right framing.
  // Once it's starting / live, the status itself is what matters — the
  // reader doesn't need both "Next up" AND "Live now" stamped on it.
  const pillLabel = status === 'future' ? 'Next up' : tone.label;

  return (
    <div className="rounded-xl border-2 border-sky-300 bg-sky-50 p-6 shadow-sm dark:border-sky-800/70 dark:bg-sky-950/30 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm',
            tone.pill,
          )}
        >
          {pillLabel}
        </span>
        <span className="text-sm font-medium text-foreground/80">
          {statusDetail(status, start, end, now)}
        </span>
      </div>

      <h2 className="m-0 text-2xl font-semibold text-foreground sm:text-3xl">
        {fellowship.shortName} — {meeting.format}
        {meeting.note && (
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({meeting.note})
          </span>
        )}
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {localDayLabel(start, now)} at {formatLocalTime(start)} your time
        </span>
        <span>·</span>
        <span>{fellowship.framework} fellowship</span>
        <span>·</span>
        <span>{platform}</span>
      </div>

      <div className="mt-5">
        <a
          href={meeting.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-base font-medium text-background hover:opacity-90"
        >
          Join in {platform}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

/** Compact card for the upcoming-meetings grid below the featured one. */
function CompactCard({ display, now }: CardProps) {
  const { meeting, start, end, status } = display;
  const fellowship = FELLOWSHIPS[meeting.fellowship];
  const platform = platformFromUrl(meeting.joinUrl);
  const tone = STATUS_TONES[status];

  return (
    <a
      href={meeting.joinUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatLocalTime(start)}
        </span>
        {status !== 'future' && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              tone.pill,
            )}
          >
            {tone.label}
          </span>
        )}
      </div>

      <div className="text-sm font-medium text-foreground">
        {fellowship.shortName} — {meeting.format}
        {meeting.note && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({meeting.note})
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>{statusDetail(status, start, end, now)}</span>
        <span>·</span>
        <span>{platform}</span>
      </div>

      <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground/80 group-hover:text-primary">
        Join
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </div>
    </a>
  );
}

/** Group meetings by the local calendar date their start falls on so
 *  the page can render "Today / Tomorrow / Friday Jun 13" headers. */
interface DayGroup {
  key: string;
  label: string;
  meetings: DisplayMeeting[];
}

function groupByDay(meetings: DisplayMeeting[], now: Date): DayGroup[] {
  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();
  for (const m of meetings) {
    const key = localDayKey(m.start);
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        label: localDayLabel(m.start, now),
        meetings: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.meetings.push(m);
  }
  return groups;
}

/** Hydration-only widget. Returns null on SSR so React can mount with
 *  the correct viewer-local time on first paint; otherwise the server
 *  would render meetings already in the past by the time the browser
 *  sees them. */
export function UpcomingMeetings() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Loading the schedule…
      </div>
    );
  }

  const meetings = findUpcomingMeetings(now, WINDOW_DAYS, 60);
  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No meetings in the next {WINDOW_DAYS} days. Check the{' '}
        <a
          href="/resources/meeting-schedules"
          className="font-medium text-foreground underline underline-offset-2"
        >
          full schedule
        </a>{' '}
        for the complete weekly calendar.
      </div>
    );
  }

  const [featured, ...rest] = meetings;
  const grouped = groupByDay(rest, now);

  return (
    <div className="space-y-12">
      <FeaturedCard display={featured} now={now} />

      {grouped.length > 0 && (
        <div className="space-y-16">
          {grouped.map((group) => (
            <section key={group.key}>
              <h3 className="mb-5 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {group.label}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.meetings.map((m, i) => (
                  <CompactCard key={`${group.key}-${i}`} display={m} now={now} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
