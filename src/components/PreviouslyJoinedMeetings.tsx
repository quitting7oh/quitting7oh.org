import * as React from 'react';
import { Clock3, ExternalLink, Trash2 } from 'lucide-react';
import { useMeetingHistory } from '~/hooks/use-meeting-history';
import {
  clearMeetingHistory,
  recordMeetingJoin,
  type MeetingProvider,
} from '~/lib/meeting-history';

interface Props {
  providers?: MeetingProvider[];
}
const PROVIDER_LABELS: Record<MeetingProvider, string> = {
  KA: 'Kratom Anonymous',
  KQS: 'TIAWO',
  NA: 'NA',
  SMART: 'SMART',
};

function formatJoinedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

export function PreviouslyJoinedMeetings({ providers }: Props) {
  const history = useMeetingHistory();
  const allowed = React.useMemo(
    () => (providers ? new Set<MeetingProvider>(providers) : null),
    [providers],
  );
  const entries = history
    .filter((entry) => !allowed || allowed.has(entry.provider))
    .slice(0, 5);

  if (entries.length === 0) return null;

  return (
    <section className="not-prose field-card mb-8 p-4 sm:p-5" aria-labelledby="previously-joined-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="previously-joined-title" className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Clock3 className="size-4 text-primary" aria-hidden="true" />
            Previously joined
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Saved only in this browser.</p>
        </div>
        <button
          type="button"
          onClick={clearMeetingHistory}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Clear history
        </button>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={`${entry.provider}:${entry.meetingId}`}>
            <a
              href={entry.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                recordMeetingJoin({
                  provider: entry.provider,
                  meetingId: entry.meetingId,
                  name: entry.name,
                  joinUrl: entry.joinUrl,
                })
              }
              className="group flex min-h-12 items-center justify-between gap-3 rounded-lg bg-muted/45 px-3 py-2 hover:bg-accent"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-foreground group-hover:text-primary">{entry.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {PROVIDER_LABELS[entry.provider]} · {formatJoinedDate(entry.lastJoinedAt)}
                  {entry.joinCount > 1 ? ` · ${entry.joinCount} joins` : ''}
                </span>
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
