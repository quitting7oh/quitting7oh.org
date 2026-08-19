import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  findDisplayMeeting,
  findNextStartingAfter,
  isNewMeeting,
  FELLOWSHIPS,
  platformFromUrl,
  type DisplayMeeting,
  type MeetingStatus,
} from '~/data/meetings';
import { cn } from '~/lib/utils';

/** Refresh cadence. 30s is fast enough to catch the status transitions
 *  (starting-soon → meeting-starting → live-now → next) without burning
 *  cycles. The exact transitions happen at the user's local clock; a
 *  30s tick keeps the displayed countdown roughly truthful. */
const TICK_MS = 30_000;

/** Format the remaining duration to display next to a status badge.
 *  Output: "5s", "12 min", "1h 30m", "2d 4h" — short and stable. */
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

function formatLocalDay(date: Date, now: Date): string {
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
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Pill for meetings the fellowship recently added to its roster.
 *  Same tone as the next-meeting page's New badge. */
const NEW_PILL = 'border border-primary/35 bg-accent text-accent-foreground';

const STATUS_BADGE: Record<MeetingStatus, { label: string; tone: 'neutral' | 'amber' | 'green' }> = {
  future: { label: 'Next meeting', tone: 'neutral' },
  'starting-soon': { label: 'Starting soon', tone: 'amber' },
  'meeting-starting': { label: 'Meeting starting', tone: 'green' },
  'live-now': { label: 'Live now', tone: 'green' },
};

function statusBadgeClasses(tone: 'neutral' | 'amber' | 'green'): string {
  switch (tone) {
    case 'amber':
      return 'bg-signal text-signal-foreground';
    case 'green':
      return 'bg-success text-success-foreground';
    case 'neutral':
      return 'bg-primary text-primary-foreground';
  }
}

function statusDetail(status: MeetingStatus, start: Date, end: Date, now: Date): string {
  switch (status) {
    case 'future': {
      const ms = start.getTime() - now.getTime();
      return `in ${formatDuration(ms)}`;
    }
    case 'starting-soon': {
      const ms = start.getTime() - now.getTime();
      return `in ${formatDuration(ms)}`;
    }
    case 'meeting-starting':
      return 'just started';
    case 'live-now': {
      const ms = end.getTime() - now.getTime();
      return `${formatDuration(ms)} remaining`;
    }
  }
}

interface CardProps {
  display: DisplayMeeting;
  now: Date;
}

/** If the primary meeting is live or just started, surface what's
 *  queued up next so a reader mid-meeting knows what's coming. Only
 *  shown when the next meeting starts within MAX_NEXT_UP_WINDOW_MS
 *  after the current one ends — anything further isn't "right after." */
const MAX_NEXT_UP_WINDOW_MS = 120 * 60_000; // 2 hours

function shouldShowNextUp(status: MeetingStatus): boolean {
  return status === 'live-now' || status === 'meeting-starting';
}

function LiveMeetingAlternatives({ standalone = false }: { standalone?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 text-sm sm:flex-row sm:items-center sm:justify-between',
        standalone ? 'field-card p-5 sm:p-6' : 'pt-1',
      )}
    >
      <span className="font-medium text-foreground/80">
        No 7-OH/kratom meeting is live right now.
      </span>
      <span className="flex flex-wrap gap-x-4 gap-y-2 font-bold">
        <a href="/virtual-na-meetings-now" className="text-primary hover:underline">
          Live NA meetings
        </a>
        <a href="/virtual-smart-meetings-now" className="text-primary hover:underline">
          Live SMART meetings
        </a>
      </span>
    </div>
  );
}

function MeetingCard({ display, now }: CardProps) {
  const { meeting, start, end, status } = display;
  const badge = STATUS_BADGE[status];
  const fellowship = FELLOWSHIPS[meeting.fellowship];
  const platform = platformFromUrl(meeting.joinUrl);

  const nextUp = shouldShowNextUp(status)
    ? findNextStartingAfter(end)
    : null;
  const showNextUp =
    nextUp !== null &&
    nextUp.start.getTime() - end.getTime() <= MAX_NEXT_UP_WINDOW_MS;
  return (
    <div className="field-card flex flex-col gap-4 p-5 sm:p-6">
      <div className="gap-5 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]',
                statusBadgeClasses(badge.tone),
              )}
            >
              {badge.label}
            </span>
            {isNewMeeting(meeting, now) && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]',
                  NEW_PILL,
                )}
              >
                New
              </span>
            )}
            <span className="text-xs font-medium text-foreground/70">
              {statusDetail(status, start, end, now)}
            </span>
          </div>
          <div className="mt-2 font-display text-[1.35rem] font-semibold leading-tight text-foreground">
            <a
              href={fellowship.orgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="decoration-primary/35 underline-offset-4 hover:text-primary hover:underline"
            >
              {fellowship.shortName}
            </a>
            {' · '}{meeting.format}
            {meeting.note && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">({meeting.note})</span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatLocalDay(start, now)}, {formatLocalTime(start)} · {platform}
          </div>
        </div>
        <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:justify-end">
          <a
            href={meeting.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            Join meeting
            <ExternalLink className="h-3.5 w-3.5" aria-hidden={true} />
          </a>
          <a
            href="/next-kratom-support-meeting"
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:border-primary hover:bg-accent"
          >
            Schedule
          </a>
        </div>
      </div>

      {showNextUp && nextUp && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Up next at {formatLocalTime(nextUp.start)}:</span>
          <a
            href={nextUp.meeting.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-primary"
          >
            {FELLOWSHIPS[nextUp.meeting.fellowship].shortName} — {nextUp.meeting.format}
            <ExternalLink className="h-3 w-3" aria-hidden={true} />
          </a>
          <span>· {platformFromUrl(nextUp.meeting.joinUrl)}</span>
        </div>
      )}

      {!shouldShowNextUp(status) && <LiveMeetingAlternatives />}

    </div>
  );
}

/** Hydration-only widget. Returns nothing on SSR so React can mount
 *  with the correct viewer-local time on first paint; otherwise the
 *  server would render a "next meeting" that's already past by the
 *  time the browser sees it. */
export function NextMeeting() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const display = findDisplayMeeting(now);
  if (!display) return <LiveMeetingAlternatives standalone />;

  return <MeetingCard display={display} now={now} />;
}
