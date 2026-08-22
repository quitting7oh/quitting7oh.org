import * as React from 'react';
import { ArrowRight, CalendarDays, ExternalLink } from 'lucide-react';
import { FELLOWSHIPS, findDisplayMeeting } from '~/data/meetings';
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

export function MeetingQuickLink({ variant = 'row', className }: Props) {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const display = now ? findDisplayMeeting(now) : null;
  const meeting = display?.meeting;
  const isLive = display?.status === 'live-now' || display?.status === 'meeting-starting';
  const href = meeting?.joinUrl ?? '/next-kratom-support-meeting';
  const external = Boolean(meeting);
  const label = display && now
    ? isLive
      ? '7-OH/kratom meeting live now'
      : `Next 7-OH/kratom meeting · in ${formatCountdown(display.start.getTime() - now.getTime())}`
    : 'Find the next live meeting';
  const detail = display
    ? `${FELLOWSHIPS[meeting!.fellowship].shortName} · ${formatDay(display.start, now!)} ${formatTime(display.start)} · ${meeting!.format}`
    : 'Kratom-specific meetings in your local time';

  function recordJoin() {
    if (!meeting) return;
    recordMeetingJoin({
      provider: meeting.fellowship,
      meetingId: meeting.id,
      name: `${FELLOWSHIPS[meeting.fellowship].shortName} — ${meeting.format}`,
      joinUrl: meeting.joinUrl,
    });
  }

  if (variant === 'button') {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={recordJoin}
        className={cn('inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-center text-base font-bold text-foreground hover:border-primary hover:bg-accent', className)}
      >
        <span aria-live="polite">{label}</span>
        {external && <ExternalLink className="size-4" aria-hidden="true" />}
      </a>
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
        onClick={recordJoin}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md outline-offset-4"
      >
        <span className="min-w-0 flex-1" aria-live="polite">
          <span className="block font-bold leading-snug">{label}</span>
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{detail}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </a>
      <a
        href="/resources/meeting-schedules"
        aria-label="All 7-OH and kratom meetings"
        className="ml-[3.25rem] inline-flex min-h-11 w-full items-center rounded-md px-2 text-sm font-bold text-primary hover:bg-accent sm:ml-0 sm:w-auto"
      >
        <span className="sm:hidden">Full schedule</span>
        <span className="hidden sm:inline">All 7-OH/kratom meetings</span>
      </a>
    </div>
  );
}
