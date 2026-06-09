import * as React from 'react';
import {
  ExternalLink,
  Search,
  Filter as FilterIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Info,
} from 'lucide-react';
import { cn } from '~/lib/utils';

const TICK_MS = 60_000;
const LIVE_WINDOW_MIN = 60;
// SMART's Pathminder gateway opens the meeting room 15 minutes before
// the scheduled start. Clicking Join before that window bounces back
// to the meeting's detail page. Match the "Starting soon" window to
// when the link is actually functional so the Join button never
// disappoints — anything 15-60 min out lives in "Later today" until
// it's joinable.
const SOON_WINDOW_MIN = 15;
const MAX_ROWS_PER_PANE = 60;
const ASSUMED_DURATION_MIN = 90; // SMART meetings run ~90 min by published schedule

// ─── Data types (mirror src/data/smart-meetings.generated.json shape) ─

interface NormalizedMeeting {
  id: string;
  name: string;
  facilitator: string;
  program: string;
  audiences: string[];
  languages: string[];
  utcStart: string; // ISO timestamp for next occurrence
  hostCity: string;
  hostState: string;
  titleLocation: string;
  schedule: string;
  passcode: string;
  pathminderUrl: string;
  detailUrl: string;
}

export interface SmartMeetingsBundle {
  fetched_at: string;
  source: string;
  attribution: string;
  search_cities: string[];
  search_radius_mi: number;
  city_counts: Record<string, { pages: number; rows: number }>;
  total: number;
  program_counts: Record<string, number>;
  audience_counts: Record<string, number>;
  language_counts: Record<string, number>;
  meetings: NormalizedMeeting[];
}

// ─── Classification ─────────────────────────────────────────────────

type Bucket = 'live' | 'soon' | 'today' | 'tomorrow';

interface Occurrence {
  meeting: NormalizedMeeting;
  start: Date;
  end: Date;
}

function classify(occ: Occurrence, now: Date): Bucket | null {
  const diffMin = (occ.start.getTime() - now.getTime()) / 60_000;
  if (diffMin <= 0 && diffMin > -LIVE_WINDOW_MIN) return 'live';
  if (diffMin > 0 && diffMin <= SOON_WINDOW_MIN) return 'soon';

  // Viewer-local calendar-day comparison for today/tomorrow.
  const startDay = new Date(occ.start);
  const todayLocal = new Date(now);
  startDay.setHours(0, 0, 0, 0);
  todayLocal.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startDay.getTime() - todayLocal.getTime()) / 86_400_000);

  if (dayDiff === 0 && diffMin > SOON_WINDOW_MIN) return 'today';
  if (dayDiff === 1) return 'tomorrow';
  return null;
}

function buildOccurrence(meeting: NormalizedMeeting): Occurrence | null {
  const start = new Date(meeting.utcStart);
  if (isNaN(start.getTime())) return null;
  return {
    meeting,
    start,
    end: new Date(start.getTime() + ASSUMED_DURATION_MIN * 60_000),
  };
}

// ─── Filter logic ───────────────────────────────────────────────────

interface FilterState {
  programs: Set<string>; // OR
  audiences: Set<string>; // a meeting matches if it carries ANY of these
  languages: Set<string>; // OR
  search: string;
}

function matchesFilters(m: NormalizedMeeting, f: FilterState): boolean {
  if (f.programs.size > 0 && !f.programs.has(m.program)) return false;
  if (f.audiences.size > 0) {
    let any = false;
    for (const a of m.audiences) if (f.audiences.has(a)) { any = true; break; }
    if (!any) return false;
  }
  if (f.languages.size > 0) {
    let any = false;
    for (const l of m.languages) if (f.languages.has(l)) { any = true; break; }
    if (!any) return false;
  }
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay = (
      m.name + ' ' + m.facilitator + ' ' + m.hostCity + ' ' + m.hostState
    ).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

// ─── Time formatting ────────────────────────────────────────────────

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(start: Date, now: Date): string {
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin <= -LIVE_WINDOW_MIN) return 'started over an hour ago';
  if (diffMin < 0) return `started ${Math.abs(diffMin)} min ago`;
  if (diffMin === 0) return 'starting now';
  if (diffMin < 60) return `in ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const min = diffMin % 60;
  if (hours < 24) return min > 0 ? `in ${hours}h ${min}m` : `in ${hours}h`;
  return start.toLocaleDateString(undefined, { weekday: 'short' });
}

// ─── Copy snippet ───────────────────────────────────────────────────

const DAY_NAMES_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function buildCopyText(m: NormalizedMeeting, start: Date): string {
  const lines: string[] = [];
  lines.push(`SMART Recovery: ${m.name}`);
  if (m.audiences.length > 0) lines.push(m.audiences.join(', '));
  const day = DAY_NAMES_FULL[start.getDay()];
  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  lines.push(`${day} at ${time} (your local time)`);
  if (m.schedule) lines.push(`Schedule: ${m.schedule}`);
  if (m.passcode) lines.push(`Passcode: ${m.passcode}`);
  lines.push(`Details: ${m.detailUrl}`);
  return lines.join('\n');
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// ─── Pre-built audience chips ───────────────────────────────────────

const AUDIENCE_CHIPS = [
  'Adults Welcome',
  'All Welcome',
  'Family & Friends Only',
  'LGBTQIA+',
  'Women',
  'Men',
  'BIPOC',
  'Military, Veterans & First Responders',
  'Young Adults (18-30)',
  'Teens (13-17)',
];

// ─── Card sub-component ─────────────────────────────────────────────

function MeetingCard({
  occurrence,
  bucket,
  now,
}: {
  occurrence: Occurrence;
  bucket: Bucket;
  now: Date;
}) {
  const { meeting, start } = occurrence;
  const isJoinable = bucket === 'live' || bucket === 'soon';
  const isLive = bucket === 'live';
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    const ok = await writeToClipboard(buildCopyText(meeting, start));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <li className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/40">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold tabular-nums text-foreground">
          {formatLocalTime(start)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatRelative(start, now)}
        </span>
        {isLive && (
          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-emerald-400 dark:text-emerald-950">
            Live now
          </span>
        )}
      </div>

      <div className="mt-2 font-medium text-foreground">
        {meeting.program}
        {meeting.facilitator && (
          <span className="font-normal text-muted-foreground"> — {meeting.facilitator}</span>
        )}
      </div>

      {meeting.audiences.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          {meeting.audiences.map((a, i) => (
            <span key={i} className="rounded bg-muted/60 px-1.5 py-0.5">{a}</span>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        Hosted from {meeting.hostCity}
        {meeting.hostCity && meeting.hostState ? ', ' : ''}
        {meeting.hostState}
        {meeting.languages.length > 0 && (
          <span> · {meeting.languages.join(', ')}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isJoinable ? (
          <a
            href={meeting.pathminderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            title="Opens SMART's join gateway; redirects to the meeting room"
          >
            Join Online
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : (
          <a
            href={meeting.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40"
          >
            View on SMART Recovery
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
        {isJoinable && (
          <a
            href={meeting.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            More info
          </a>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/40"
          aria-label="Copy meeting details to clipboard"
          title="Copy meeting details"
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3 w-3" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
    </li>
  );
}

function Pane({
  title,
  description,
  occurrences,
  bucket,
  now,
}: {
  title: string;
  description: string;
  occurrences: Occurrence[];
  bucket: Bucket;
  now: Date;
}) {
  const shown = occurrences.slice(0, MAX_ROWS_PER_PANE);
  const hidden = Math.max(0, occurrences.length - shown.length);
  return (
    <section>
      <header className="mb-4 border-b border-border pb-2">
        <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}{' '}
          <span className="font-normal text-muted-foreground">
            ({occurrences.length.toLocaleString()})
          </span>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {occurrences.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          Nothing in this window matches your filters.
        </p>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((occ) => (
              <MeetingCard key={occ.meeting.id} occurrence={occ} bucket={bucket} now={now} />
            ))}
          </ul>
          {hidden > 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {hidden.toLocaleString()} more {hidden === 1 ? 'meeting' : 'meetings'} in this window — refine filters to narrow.
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

export function VirtualSmartMeetings({ bundle }: { bundle: SmartMeetingsBundle }) {
  const [now, setNow] = React.useState<Date | null>(null);
  const [filterState, setFilterState] = React.useState<FilterState>({
    programs: new Set(),
    audiences: new Set(),
    languages: new Set(),
    search: '',
  });
  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  // Counts that reflect what's actually visible across the four panes
  // (live / soon / today / tomorrow). The build-time counts in the
  // bundle describe the whole dataset of ~445 meetings, but at any
  // given moment only meetings whose next occurrence falls inside the
  // ~36-hour viewer window classify into a pane. Showing the dataset
  // count on the chip is misleading: a tag with "9" total can yield 2
  // when the rest are on Sat/Sun/Mon, etc.
  //
  // These counts ignore other active filters — they represent "if
  // you picked just this chip, how many would you see right now?"
  // Faceted-search systems often show counts that respect other
  // filters too; that's more sophisticated and can confuse more than
  // help. The simple version here is honest about the time-window cap.
  const visibleCounts = React.useMemo(() => {
    const programs: Record<string, number> = {};
    const audiences: Record<string, number> = {};
    const languages: Record<string, number> = {};
    if (!now) return { programs, audiences, languages };
    for (const m of bundle.meetings) {
      const occ = buildOccurrence(m);
      if (!occ) continue;
      const b = classify(occ, now);
      if (b === null) continue; // outside all four panes
      programs[m.program] = (programs[m.program] || 0) + 1;
      for (const a of m.audiences) audiences[a] = (audiences[a] || 0) + 1;
      for (const l of m.languages) languages[l] = (languages[l] || 0) + 1;
    }
    return { programs, audiences, languages };
  }, [now, bundle.meetings]);

  const programChips = React.useMemo(
    () =>
      Object.entries(bundle.program_counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => ({ name, count: visibleCounts.programs[name] ?? 0 })),
    [bundle.program_counts, visibleCounts.programs],
  );

  // Russian intentionally excluded from the language filter list —
  // even when meetings carry the tag they're not useful for this
  // site's audience. The Russian-tagged meetings still show up in the
  // panes if they also match other selected filters.
  const HIDDEN_LANGUAGES = React.useMemo(() => new Set(['Russian']), []);

  const languageChips = React.useMemo(
    () =>
      Object.entries(bundle.language_counts)
        .filter(([name]) => !HIDDEN_LANGUAGES.has(name))
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => ({ name, count: visibleCounts.languages[name] ?? 0 })),
    [bundle.language_counts, visibleCounts.languages, HIDDEN_LANGUAGES],
  );

  const buckets = React.useMemo(() => {
    if (!now) return null;
    const live: Occurrence[] = [];
    const soon: Occurrence[] = [];
    const today: Occurrence[] = [];
    const tomorrow: Occurrence[] = [];
    for (const m of bundle.meetings) {
      if (!matchesFilters(m, filterState)) continue;
      const occ = buildOccurrence(m);
      if (!occ) continue;
      const b = classify(occ, now);
      if (b === 'live') live.push(occ);
      else if (b === 'soon') soon.push(occ);
      else if (b === 'today') today.push(occ);
      else if (b === 'tomorrow') tomorrow.push(occ);
    }
    const byStart = (a: Occurrence, b: Occurrence) => a.start.getTime() - b.start.getTime();
    live.sort(byStart); soon.sort(byStart); today.sort(byStart); tomorrow.sort(byStart);
    return { live, soon, today, tomorrow };
  }, [now, bundle.meetings, filterState]);

  function toggleSet(field: 'programs' | 'audiences' | 'languages', value: string) {
    setFilterState((prev) => {
      const next = new Set(prev[field]);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...prev, [field]: next };
    });
  }

  function clearFilters() {
    setFilterState({
      programs: new Set(),
      audiences: new Set(),
      languages: new Set(),
      search: '',
    });
  }

  const filtersActive =
    filterState.programs.size > 0 ||
    filterState.audiences.size > 0 ||
    filterState.languages.size > 0 ||
    filterState.search.trim().length > 0;

  // Audience chips show every option SMART exposes — zero-count chips
  // hide themselves below, so the row stays clean without a Show-all
  // toggle. The full list is short enough to fit.
  const visibleAudienceChips = AUDIENCE_CHIPS;

  return (
    <div className="space-y-10">
      {/* SMART's gateway behavior note — the Join button only appears on
          live/soon meetings because the Pathminder URL only redirects to
          the actual room during the active window. */}
      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Info className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
        SMART Recovery routes every join through its own gateway, which
        opens 15 minutes before the meeting starts. We show a one-click{' '}
        <strong className="font-semibold text-foreground">Join Online</strong>{' '}
        button only inside that window (15 minutes before through an
        hour after start). Outside it, the gateway can't open the room,
        so we link to the meeting's full page on
        meetings.smartrecovery.org instead.
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Filter meetings</span>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-muted-foreground">Program:</span>
          {programChips.map(({ name, count }) => {
            const active = filterState.programs.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleSet('programs', name)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:border-foreground/40',
                )}
              >
                {name}{' '}
                <span className={cn('tabular-nums', active ? 'text-background/70' : 'text-muted-foreground')}>
                  ({count.toLocaleString()})
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-muted-foreground">Audience:</span>
          {visibleAudienceChips.map((name) => {
            const active = filterState.audiences.has(name);
            const count = visibleCounts.audiences[name] ?? 0;
            // Hide chips with no current visible meetings unless already
            // active. Tags like "BIPOC" or "Teens" can flicker in and out
            // as the day progresses — that's the honest signal.
            if (count === 0 && !active) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleSet('audiences', name)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:border-foreground/40',
                )}
              >
                {name}
                {count > 0 && (
                  <span className={cn(' tabular-nums', active ? 'text-background/70' : 'text-muted-foreground')}>
                    {' '}({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {languageChips.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="self-center text-xs font-medium text-muted-foreground">Language:</span>
            {languageChips.map(({ name, count }) => {
              const active = filterState.languages.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleSet('languages', name)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:border-foreground/40',
                  )}
                >
                  {name}{' '}
                  <span className={cn('tabular-nums', active ? 'text-background/70' : 'text-muted-foreground')}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by facilitator or host city…"
              value={filterState.search}
              onChange={(e) => setFilterState((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
              aria-label="Search meetings"
            />
          </label>
        </div>
      </div>

      {/* Panes */}
      {!now || !buckets ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Loading the meeting list…
        </div>
      ) : (
        <div className="space-y-12">
          <Pane
            title="Live now"
            description="Meetings currently in session — click Join Online to enter through SMART's gateway."
            occurrences={buckets.live}
            bucket="live"
            now={now}
          />
          <Pane
            title="Starting soon"
            description="Meetings beginning in the next 15 minutes — SMART's gateway has opened, so Join Online works."
            occurrences={buckets.soon}
            bucket="soon"
            now={now}
          />
          <Pane
            title="Later today"
            description="Meetings starting later in your local day. View the meeting page; Join Online opens closer to start time."
            occurrences={buckets.today}
            bucket="today"
            now={now}
          />
          <Pane
            title="Tomorrow"
            description="Meetings on your next local day."
            occurrences={buckets.tomorrow}
            bucket="tomorrow"
            now={now}
          />
        </div>
      )}

      <footer className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="m-0">
          Meeting data © SMART Recovery, pulled daily from{' '}
          <a
            href={bundle.source}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            meetings.smartrecovery.org
          </a>
          {' '}and used with permission. <strong className="font-semibold text-foreground">
            quitting7oh.org is not affiliated with SMART Recovery.
          </strong>{' '}
          To report a missing or incorrect meeting, use SMART's own
          meeting search — we don't maintain the underlying list.
        </p>
        <p className="m-0 mt-2">
          Showing {bundle.meetings.length.toLocaleString()} online
          English-language-default meetings; last refreshed{' '}
          {new Date(bundle.fetched_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}.
          Coverage assembled from four 1,000-mile-radius searches
          ({bundle.search_cities.join(' · ')}), deduplicated by meeting ID.
        </p>
      </footer>
    </div>
  );
}
