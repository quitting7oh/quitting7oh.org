import * as React from 'react';
import { ExternalLink, Radio } from 'lucide-react';
import { useMeetingHistory } from '~/hooks/use-meeting-history';
import {
  chooseLiveMeeting,
  liveMeetingChoiceKey,
  type LiveMeetingChoice,
  type LiveMeetingIndex,
} from '~/lib/live-meeting-index';
import { meetingHistoryKey, recordMeetingJoin } from '~/lib/meeting-history';

const SESSION_KEY = 'quitting7oh:next-page-live-choice:v1:NA';

function remainingLabel(choice: LiveMeetingChoice, now: Date): string {
  if (choice.fallback || !choice.end) return 'Always open';
  const minutes = Math.max(1, Math.ceil((choice.end.getTime() - now.getTime()) / 60_000));
  return `${minutes} min remaining`;
}

function choiceFromSession(
  index: LiveMeetingIndex,
  now: Date,
): LiveMeetingChoice | null {
  let preferred: string | null = null;
  try {
    preferred = window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    // A random live choice still works when session storage is unavailable.
  }

  const choice = chooseLiveMeeting(index, now, preferred);
  if (choice) {
    try {
      window.sessionStorage.setItem(
        SESSION_KEY,
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
        <span>Narcotics Anonymous</span>
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
  const [choice, setChoice] = React.useState<LiveMeetingChoice | null>(null);
  const [loading, setLoading] = React.useState(true);

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
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!index) return;
    setChoice(choiceFromSession(index, now));
    setLoading(false);
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
            No KA or TIAWO meeting is live right now. You can check for a live NA meeting below.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          Checking live NA meetings…
        </p>
      ) : choice ? (
        <div className="mt-4" aria-live="polite">
          <MeetingOption choice={choice} now={now} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          No additional live meeting is listed at this moment.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-primary">
        <a href="/virtual-na-meetings-now" className="hover:underline">Browse all NA meetings</a>
      </div>
    </aside>
  );
}
