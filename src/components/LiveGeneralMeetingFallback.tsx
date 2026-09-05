import * as React from 'react';
import { ExternalLink, Radio } from 'lucide-react';
import { useMeetingHistory } from '~/hooks/use-meeting-history';
import {
  chooseLiveMeetingForProvider,
  liveMeetingChoiceKey,
  type LiveMeetingChoice,
  type LiveMeetingIndex,
  type LiveMeetingRecord,
} from '~/lib/live-meeting-index';
import { meetingHistoryKey, recordMeetingJoin } from '~/lib/meeting-history';

const SESSION_KEY_PREFIX = 'quitting7oh:next-page-live-choice:v1';

function providerName(provider: LiveMeetingRecord['provider']): string {
  return provider === 'NA' ? 'Narcotics Anonymous' : 'SMART Recovery';
}

function remainingLabel(choice: LiveMeetingChoice, now: Date): string {
  if (choice.fallback || !choice.end) return 'Always open';
  const minutes = Math.max(1, Math.ceil((choice.end.getTime() - now.getTime()) / 60_000));
  return `${minutes} min remaining`;
}

function choiceFromSession(
  index: LiveMeetingIndex,
  provider: LiveMeetingRecord['provider'],
  now: Date,
): LiveMeetingChoice | null {
  let preferred: string | null = null;
  try {
    preferred = window.sessionStorage.getItem(`${SESSION_KEY_PREFIX}:${provider}`);
  } catch {
    // A random live choice still works when session storage is unavailable.
  }

  const choice = chooseLiveMeetingForProvider(index, provider, now, preferred);
  if (choice) {
    try {
      window.sessionStorage.setItem(
        `${SESSION_KEY_PREFIX}:${provider}`,
        liveMeetingChoiceKey(choice),
      );
    } catch {
      // Keep the in-memory choice when session storage is unavailable.
    }
  }
  return choice;
}

function MeetingOption({ choice, now }: { choice: LiveMeetingChoice; now: Date }) {
  const history = useMeetingHistory();
  const { meeting } = choice;
  const joined = history.some(
    (entry) =>
      meetingHistoryKey(entry.provider, entry.meetingId) ===
      meetingHistoryKey(meeting.provider, meeting.id),
  );

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-[0.08em] text-primary">
        <span>{providerName(meeting.provider)}</span>
        <span className="text-muted-foreground" aria-hidden="true">·</span>
        <span className="text-muted-foreground">{remainingLabel(choice, now)}</span>
        {joined && <span className="normal-case tracking-normal">Previously joined</span>}
      </div>
      <h3 className="mt-2 text-base font-bold leading-snug text-foreground">
        {meeting.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{meeting.platform}</p>
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
        className="mt-4 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
      >
        Join meeting
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    </article>
  );
}

export function LiveGeneralMeetingFallback({ now }: { now: Date }) {
  const [index, setIndex] = React.useState<LiveMeetingIndex | null>(null);
  const [choices, setChoices] = React.useState<LiveMeetingChoice[] | null>(null);

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
        if (!cancelled) setChoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!index) return;
    setChoices(
      (['NA', 'SMART'] as const).flatMap((provider) => {
        const choice = choiceFromSession(index, provider, now);
        return choice ? [choice] : [];
      }),
    );
  }, [index, now]);

  return (
    <aside className="rounded-2xl bg-accent/35 p-4 sm:p-5" aria-labelledby="live-general-meetings-heading">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Radio className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="live-general-meetings-heading" className="text-base font-bold text-foreground">
            Need a meeting before the next 7-OH/kratom meeting?
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            No KA or TIAWO meeting is live right now. These general recovery meetings are joinable now.
          </p>
        </div>
      </div>

      {choices === null ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          Checking live NA and SMART meetings…
        </p>
      ) : choices.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite">
          {choices.map((choice) => (
            <MeetingOption
              key={liveMeetingChoiceKey(choice)}
              choice={choice}
              now={now}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          No additional live meeting is listed at this moment.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-primary">
        <a href="/virtual-na-meetings-now" className="hover:underline">Browse all NA meetings</a>
        <a href="/virtual-smart-meetings-now" className="hover:underline">Browse all SMART meetings</a>
      </div>
    </aside>
  );
}
