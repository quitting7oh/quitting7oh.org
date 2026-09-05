import * as React from 'react';
import { ArrowRight, CalendarDays, ExternalLink, Radio } from 'lucide-react';
import {
  FELLOWSHIPS,
  findDisplayMeeting,
  findLiveMeetings,
  platformFromUrl,
  type DisplayMeeting,
  type Meeting,
} from '~/data/meetings';
import { cn } from '~/lib/utils';
import { recordMeetingJoin } from '~/lib/meeting-history';

interface Props {
  variant?: 'row' | 'button';
  className?: string;
}

const TICK_MS = 30_000;

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDay(date: Date, now: Date) {
  if (date.toDateString() === now.toDateString()) return 'Today';
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatCountdown(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function meetingName(meeting: Meeting) {
  return `${FELLOWSHIPS[meeting.fellowship].shortName} — ${meeting.format}`;
}

/** Short label for listing several rooms in one line. Keeps the note
 *  so two same-format rooms (KA and Grow Recovery both run Wednesday
 *  Discussion) don't read as duplicates. */
function meetingLabel(meeting: Meeting) {
  const base = `${FELLOWSHIPS[meeting.fellowship].shortName} ${meeting.format}`;
  return meeting.note ? `${base} (${meeting.note})` : base;
}

function recordJoin(meeting: Meeting) {
  recordMeetingJoin({
    provider: meeting.fellowship,
    meetingId: meeting.id,
    name: meetingName(meeting),
    joinUrl: meeting.joinUrl,
  });
}

/** Join button used for each live room. Sage marks "open right now"
 *  across the site, so every live room gets the same treatment rather
 *  than the first one being green and the rest being links. */
function JoinLiveButton({ meeting, className }: { meeting: Meeting; className?: string }) {
  return (
    <a
      href={meeting.joinUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordJoin(meeting)}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-sm font-bold text-success-foreground shadow-sm hover:bg-success/90',
        className,
      )}
    >
      Join live
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

const LIVE_ROW_SHELL =
  'relative overflow-hidden bg-success/[0.08] text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-success';

const LIVE_PILL =
  'inline-flex items-center gap-1.5 rounded-md bg-success px-2 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-success-foreground';

/** One live room. The layout is the same whether the row holds one
 *  room or several; only the header pill above changes. */
function LiveRow({ display, now }: { display: DisplayMeeting; now: Date }) {
  const { meeting, end } = display;
  const fellowship = FELLOWSHIPS[meeting.fellowship];
  const remaining = formatCountdown(end.getTime() - now.getTime());
  const platform = platformFromUrl(meeting.joinUrl);
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 first:pt-0 last:pb-0">
      <span className="min-w-0 flex-1 basis-48">
        <span className="block font-bold leading-snug">
          {fellowship.shortName} — {meeting.format}
          {meeting.note && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">({meeting.note})</span>
          )}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
          {remaining} remaining · {platform}
        </span>
      </span>
      <JoinLiveButton meeting={meeting} />
    </li>
  );
}

/** Two or more 7-OH/kratom rooms open at the same time. Every room is
 *  listed with its own join button so the reader sees the choice
 *  instead of the earliest-started room hiding the others. */
function LiveRows({ live, now, className }: { live: DisplayMeeting[]; now: Date; className?: string }) {
  return (
    <div
      className={cn(
        LIVE_ROW_SHELL,
        'grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3.5 sm:px-5',
        className,
      )}
      aria-live="polite"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-success text-success-foreground shadow-sm">
        <Radio className="size-5" aria-hidden="true" />
      </span>
      <span className="flex min-h-10 items-center">
        <span className={LIVE_PILL}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          {live.length} live now · 7-OH / kratom
        </span>
      </span>
      <div className="col-start-2 min-w-0">
        <ul className="divide-y divide-success/25">
          {live.map((display) => (
            <LiveRow key={display.meeting.id} display={display} now={now} />
          ))}
        </ul>
        <a
          href="/next-kratom-support-meeting"
          className="-ml-1.5 mt-2 inline-flex min-h-9 items-center rounded-md px-1.5 text-xs font-bold text-primary hover:bg-accent"
        >
          Full schedule
        </a>
      </div>
    </div>
  );
}

export function MeetingQuickLink({ variant = 'row', className }: Props) {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const live = now ? findLiveMeetings(now) : [];
  const display = now ? findDisplayMeeting(now) : null;
  const meeting = display?.meeting;
  const isLive = live.length > 0;
  const multiLive = live.length > 1;
  // With several rooms open, the link goes to the schedule page where
  // every room is listed, instead of silently picking one to join.
  const href = multiLive ? '/next-kratom-support-meeting' : meeting?.joinUrl ?? '/next-kratom-support-meeting';
  const external = Boolean(meeting) && !multiLive;
  const label = display && now
    ? isLive
      ? multiLive
        ? `${live.length} 7-OH/kratom meetings live now`
        : '7-OH/kratom meeting live now'
      : `Next 7-OH/kratom meeting · in ${formatCountdown(display.start.getTime() - now.getTime())}`
    : 'Find the next live meeting';
  const detail = display
    ? `${FELLOWSHIPS[meeting!.fellowship].shortName} · ${formatDay(display.start, now!)} ${formatTime(display.start)} · ${meeting!.format}`
    : 'Kratom-specific meetings in your local time';

  if (variant === 'button') {
    // Two deliberate lines: a short headline that fits one line at every
    // width, and a small detail line with the fellowship and time. Long
    // single labels wrapped unpredictably next to the Discord button.
    const headline = display && now
      ? isLive
        ? multiLive
          ? `${live.length} meetings live now`
          : 'Join the live meeting'
        : `Next meeting · in ${formatCountdown(display.start.getTime() - now.getTime())}`
      : 'Find a meeting';
    const sub = display && meeting && now
      ? isLive
        ? multiLive
          ? `7-OH/kratom · ${live.map((entry) => meetingLabel(entry.meeting)).join(' & ')}`
          : `7-OH/kratom · ${FELLOWSHIPS[meeting.fellowship].shortName} ${meeting.format} · ${formatCountdown(display.end.getTime() - now.getTime())} left`
        : `7-OH/kratom · ${FELLOWSHIPS[meeting.fellowship].shortName} ${meeting.format} · ${formatDay(display.start, now)} ${formatTime(display.start)}`
      : 'Kratom-specific meetings, in your local time';
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={external && meeting ? () => recordJoin(meeting) : undefined}
        className={cn(
          'inline-flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2.5 text-center',
          isLive
            ? 'border-success bg-success text-success-foreground shadow-sm hover:bg-success/90'
            : 'border-border bg-card text-foreground hover:border-primary hover:bg-accent',
          className,
        )}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-base font-bold leading-tight" aria-live="polite">
          {isLive && <Radio className="size-4 shrink-0" aria-hidden="true" />}
          {headline}
          {external && <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />}
        </span>
        <span className="text-xs font-semibold leading-snug opacity-85">{sub}</span>
      </a>
    );
  }

  if (multiLive && now) {
    return <LiveRows live={live} now={now} className={className} />;
  }

  if (isLive && display && now && meeting) {
    const fellowship = FELLOWSHIPS[meeting.fellowship];
    const remaining = formatCountdown(display.end.getTime() - now.getTime());
    const platform = platformFromUrl(meeting.joinUrl);

    return (
      <div
        className={cn(
          LIVE_ROW_SHELL,
          'grid min-h-[6.5rem] grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5',
          className,
        )}
        aria-live="polite"
      >
        <span className="row-span-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-success text-success-foreground shadow-sm sm:row-span-1">
          <Radio className="size-5" aria-hidden="true" />
        </span>

        <span className="min-w-0">
          <span className={LIVE_PILL}>
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            Live now · 7-OH / kratom
          </span>
          <span className="mt-1.5 block font-bold leading-snug">
            {fellowship.shortName} — {meeting.format}
          </span>
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
            {remaining} remaining · {platform}
          </span>
        </span>

        <span className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-stretch sm:justify-center sm:gap-1.5">
          <JoinLiveButton meeting={meeting} />
          <a
            href="/next-kratom-support-meeting"
            className="inline-flex min-h-9 items-center justify-center rounded-md px-1.5 text-xs font-bold text-primary hover:bg-accent"
          >
            Full schedule
          </a>
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-[4.75rem] flex-wrap items-center gap-3 px-4 py-3 text-foreground hover:bg-muted/55 sm:px-5', className)}>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/12 text-success">
        <CalendarDays className="size-5" aria-hidden="true" />
      </span>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={external && meeting ? () => recordJoin(meeting) : undefined}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md outline-offset-4"
      >
        <span className="min-w-0 flex-1" aria-live="polite">
          <span className="block font-bold leading-snug">{label}</span>
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{detail}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </a>
      <a
        href="/next-kratom-support-meeting"
        aria-label="All 7-OH and kratom meetings"
        className="ml-[3.25rem] inline-flex min-h-11 w-full items-center rounded-md px-2 text-sm font-bold text-primary hover:bg-accent sm:ml-0 sm:w-auto"
      >
        <span className="sm:hidden">Full schedule</span>
        <span className="hidden sm:inline">All 7-OH/kratom meetings</span>
      </a>
    </div>
  );
}
