import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { useMeetingHistory } from '~/hooks/use-meeting-history';
import {
  meetingHistoryKey,
  recordMeetingJoin,
  type MeetingProvider,
} from '~/lib/meeting-history';
import { cn } from '~/lib/utils';

interface Props {
  provider: MeetingProvider;
  meetingId: string;
  name: string;
  joinUrl: string;
  label: string;
  variant?: 'text' | 'button';
}
function formatJoinedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TrackedMeetingLink({
  provider,
  meetingId,
  name,
  joinUrl,
  label,
  variant = 'text',
}: Props) {
  const history = useMeetingHistory();
  const key = meetingHistoryKey(provider, meetingId);
  const joined = history.find(
    (entry) => meetingHistoryKey(entry.provider, entry.meetingId) === key,
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
      <a
        href={joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordMeetingJoin({ provider, meetingId, name, joinUrl })}
        className={cn(
          'inline-flex min-h-11 items-center gap-1 font-bold',
          variant === 'button'
            ? 'rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground hover:bg-primary/90'
            : 'text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary',
        )}
      >
        {label}
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
      {joined && (
        <span className="text-[0.68rem] font-bold leading-tight text-primary">
          Previously joined · {formatJoinedDate(joined.lastJoinedAt)}
          {joined.joinCount > 1 ? ` · ${joined.joinCount} times` : ''}
        </span>
      )}
    </div>
  );
}
