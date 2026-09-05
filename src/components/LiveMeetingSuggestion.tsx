import * as React from 'react';
import { ArrowRight, ExternalLink, Radio } from 'lucide-react';
import {
  chooseLiveMeeting,
  liveMeetingChoiceKey,
  type LiveMeetingChoice,
  type LiveMeetingIndex,
} from '~/lib/live-meeting-index';
import { meetingHistoryKey, recordMeetingJoin } from '~/lib/meeting-history';
import { useMeetingHistory } from '~/hooks/use-meeting-history';

const TICK_MS = 60_000;
const SESSION_KEY = 'quitting7oh:live-meeting-choice:v1';

function providerLabel(provider: 'NA' | 'SMART'): string {
  return provider === 'NA' ? 'Narcotics Anonymous' : 'SMART Recovery';
}

export function LiveMeetingSuggestion() {
  const [index, setIndex] = React.useState<LiveMeetingIndex | null>(null);
  const [now, setNow] = React.useState<Date | null>(null);
  const [choice, setChoice] = React.useState<LiveMeetingChoice | null>(null);
  const history = useMeetingHistory();

  React.useEffect(() => {
    let cancelled = false;
    fetch('/live-meeting-index.json', { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Meeting index returned ${response.status}`);
        return response.json() as Promise<LiveMeetingIndex>;
      })
      .then((nextIndex) => {
        if (!cancelled) setIndex(nextIndex);
      })
      .catch(() => {
        if (!cancelled) setIndex(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!index || !now) return;
    let preferred: string | null = null;
    try {
      preferred = window.sessionStorage.getItem(SESSION_KEY);
    } catch {
      // Session storage is an enhancement; selection can still work without it.
    }
    const next = chooseLiveMeeting(index, now, preferred);
    setChoice(next);
    if (next) {
      try {
        window.sessionStorage.setItem(SESSION_KEY, liveMeetingChoiceKey(next));
      } catch {
        // Keep the in-memory choice when storage is unavailable.
      }
    }
  }, [index, now]);

  const joined = choice
    ? history.find(
        (entry) =>
          meetingHistoryKey(entry.provider, entry.meetingId) ===
          meetingHistoryKey(choice.meeting.provider, choice.meeting.id),
      )
    : null;

  if (!choice) {
    return (
      <div className="flex min-h-[4.75rem] items-center gap-3 px-4 py-3 text-foreground sm:px-5" aria-live="polite">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Radio className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug">Need a meeting now?</span>
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">NA has virtual meetings available 24 hours a day.</span>
        </span>
        <a href="/virtual-na-meetings-now" className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-bold text-primary hover:bg-accent">
          Browse NA <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    );
  }

  const { meeting, fallback } = choice;
  return (
    <div className="grid min-h-[5.25rem] grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3 text-foreground sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-y-1 sm:px-5" aria-live="polite">
      <span className="row-span-3 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:row-span-2">
        <Radio className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold leading-snug">
          Join a meeting now
          {joined && <span className="text-[0.68rem] uppercase tracking-[0.08em] text-primary">Previously joined</span>}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
          {providerLabel(meeting.provider)} · {meeting.name}{fallback ? ' · always open' : ''}
        </span>
      </span>
      <a
        href={meeting.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          recordMeetingJoin({
            provider: meeting.provider,
            meetingId: meeting.id,
            name: meeting.name,
            joinUrl: meeting.joinUrl,
          })
        }
        className="col-start-2 row-start-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:col-start-3 sm:row-start-1 sm:row-end-3 sm:w-auto sm:self-center"
      >
        Join
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
      <span className="col-start-2 row-start-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-primary sm:col-end-4 sm:row-start-2 sm:text-xs">
        <a href="/virtual-na-meetings-now" className="inline-flex min-h-8 items-center hover:underline">Browse NA</a>
        <a href="/virtual-smart-meetings-now" className="inline-flex min-h-8 items-center hover:underline">Browse SMART</a>
        <span className="font-medium text-muted-foreground">NA runs virtually 24/7</span>
      </span>
    </div>
  );
}
