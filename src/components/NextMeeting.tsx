import * as React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import {
  findDisplayMeeting,
  findNextStartingAfter,
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

const STATUS_BADGE: Record<MeetingStatus, { label: string; tone: 'neutral' | 'amber' | 'green' }> = {
  future: { label: 'Next meeting', tone: 'neutral' },
  'starting-soon': { label: 'Starting soon', tone: 'amber' },
  'meeting-starting': { label: 'Meeting starting', tone: 'green' },
  'live-now': { label: 'Live now', tone: 'green' },
};

function statusBadgeClasses(tone: 'neutral' | 'amber' | 'green'): string {
  switch (tone) {
    case 'amber':
      return 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950';
    case 'green':
      return 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950';
    case 'neutral':
      return 'bg-sky-700 text-sky-50 dark:bg-sky-300 dark:text-sky-950';
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

function joinLabel(status: MeetingStatus, platform: string): string {
  switch (status) {
    case 'future':
      return `Open in ${platform}`;
    case 'starting-soon':
      return `Join in ${platform}`;
    case 'meeting-starting':
    case 'live-now':
      return `Join in ${platform}`;
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
  // When the next kratom meeting is more than 15 min away (status
  // 'future'), nothing kratom-specific is currently in session — but
  // NA's virtual list always has something live. Surface the finder
  // for readers who need a meeting now, without naming any specific
  // NA meeting (there are thousands and we don't endorse any one of
  // them).
  const showNaPointer = status === 'future';

  return (
    <div className="flex flex-col gap-4 rounded-lg border-2 border-sky-300 bg-sky-50 p-5 shadow-sm dark:border-sky-800/70 dark:bg-sky-950/30">
      {/* Framing line — orients the reader on what this widget is and
          why it might be relevant before they decode the card. */}
      <p className="m-0 text-sm text-foreground/90">
        Need to talk to people who get it? Free virtual meetings every day. No signup, no fee. Show up from wherever you are.
      </p>

      {showNaPointer && (
        <div className="rounded-md border border-sky-200/70 bg-sky-100/50 px-3 py-2 text-sm dark:border-sky-900/70 dark:bg-sky-900/30">
          <span className="font-medium text-foreground">
            Need a meeting right now?
          </span>{' '}
          <span className="text-foreground/80">
            The kratom-specific meeting below starts later. There's a
            virtual NA meeting happening every hour —
          </span>{' '}
          <a
            href="/virtual-na-meetings-now"
            className="font-medium text-foreground underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300"
          >
            find one live
          </a>
          .
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm',
                statusBadgeClasses(badge.tone),
              )}
            >
              {badge.label}
            </span>
            <span className="text-xs font-medium text-foreground/70">
              {statusDetail(status, start, end, now)}
            </span>
          </div>
          <div className="text-base font-semibold text-foreground">
            {fellowship.shortName} — {meeting.format}
            {meeting.note && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">({meeting.note})</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {fellowship.framework} fellowship · {platform}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatLocalDay(start, now)} at {formatLocalTime(start)} your time
          </div>
        </div>
        <Calendar className="h-5 w-5 shrink-0 text-sky-700 dark:text-sky-400" aria-hidden={true} />
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={meeting.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          {joinLabel(status, platform)}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden={true} />
        </a>
        <a
          href="/resources/meeting-schedules"
          className="inline-flex items-center rounded-md border border-sky-300 bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-sky-100/50 dark:border-sky-800 dark:hover:bg-sky-950/40"
        >
          All meetings
        </a>
      </div>

      {showNextUp && nextUp && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-sky-200 pt-3 text-xs text-muted-foreground dark:border-sky-900/60">
          <span className="font-medium text-foreground/80">Up next at {formatLocalTime(nextUp.start)}:</span>
          <a
            href={nextUp.meeting.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-sky-700 dark:hover:text-sky-300"
          >
            {FELLOWSHIPS[nextUp.meeting.fellowship].shortName} — {nextUp.meeting.format}
            <ExternalLink className="h-3 w-3" aria-hidden={true} />
          </a>
          <span>· {platformFromUrl(nextUp.meeting.joinUrl)}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-sky-200 pt-3 text-xs text-muted-foreground dark:border-sky-900/60">
        <span>Broader groups, not kratom-specific:</span>
        <a
          href="https://www.na.org/meetingsearch/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:text-accent-700 dark:hover:text-accent-300"
        >
          Narcotics Anonymous
          <ExternalLink className="h-3 w-3" aria-hidden={true} />
        </a>
        <a
          href="https://meetings.smartrecovery.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:text-accent-700 dark:hover:text-accent-300"
        >
          SMART Recovery
          <ExternalLink className="h-3 w-3" aria-hidden={true} />
        </a>
      </div>
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
  if (!display) return null;

  return <MeetingCard display={display} now={now} />;
}
