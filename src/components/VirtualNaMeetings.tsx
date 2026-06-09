import * as React from 'react';
import {
  ExternalLink,
  Phone as PhoneIcon,
  Search,
  Filter as FilterIcon,
  Star,
  ChevronDown,
  Copy as CopyIcon,
  Check as CheckIcon,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { wallClockToUTC, todayInTimezone, addDays } from '~/lib/tz';

const TICK_MS = 60_000;
const LIVE_WINDOW_MIN = 60; // a meeting is "live" for this many minutes after start
const SOON_WINDOW_MIN = 60; // a meeting is "starting soon" if start is within next N min
const MAX_ROWS_PER_PANE = 60; // cap each pane so the page doesn't render thousands of cards
const ASSUMED_DURATION_MIN = 60;

// ─── Data types (mirror src/data/na-meetings.generated.json shape) ──────

interface NormalizedMeeting {
  id: string;
  name: string;
  formatTags: string[];
  closed: 'Open' | 'Closed';
  day: number; // 0=Sun..6=Sat, in the meeting's native tz
  hour: number;
  minute: number;
  timezone: string;
  platform: string;
  joinUrl: string;
  passcode: string;
  hasEmbeddedPasscode: boolean;
  roomNumber: string;
  notes: string;
  state: string;
  city: string;
}

interface FeaturedMeeting extends NormalizedMeeting {
  is24x7: true;
}

export interface MeetingsBundle {
  fetched_at: string;
  source: string;
  attribution: string;
  filters: Record<string, string>;
  raw_total: number;
  filtered_total: number;
  tag_counts: Record<string, number>;
  platform_counts: Record<string, number>;
  featured: FeaturedMeeting | null;
  meetings: NormalizedMeeting[];
}

// ─── Occurrence math (per-meeting, scoped to a 48-hour viewer window) ────

interface Occurrence {
  meeting: NormalizedMeeting;
  start: Date;
  end: Date;
}

/** Compute the soonest occurrence for one meeting whose end has not yet
 *  passed, within ~36h of now. Returns null if we can't find one in the
 *  window (extremely rare — the meeting recurs weekly). */
function computeOccurrence(meeting: NormalizedMeeting, now: Date): Occurrence | null {
  const today = todayInTimezone(now, meeting.timezone);
  for (let offset = -1; offset <= 8; offset++) {
    const day = addDays(today.y, today.m, today.d, offset);
    if (day.dow !== meeting.day) continue;
    const startMs = wallClockToUTC(
      day.y,
      day.m,
      day.d,
      meeting.hour,
      meeting.minute,
      meeting.timezone,
    );
    const endMs = startMs + ASSUMED_DURATION_MIN * 60_000;
    if (endMs > now.getTime()) {
      return { meeting, start: new Date(startMs), end: new Date(endMs) };
    }
  }
  return null;
}

// ─── Filter and bucket logic ────────────────────────────────────────────

type OpenClosedFilter = 'all' | 'open' | 'closed';

interface FilterState {
  tags: Set<string>; // a meeting must carry every selected tag (AND, not OR)
  platforms: Set<string>; // a meeting matches if its platform is ANY of these (OR)
  openClosed: OpenClosedFilter;
  search: string; // case-insensitive match on name / city / state
}

function matchesFilters(meeting: NormalizedMeeting, f: FilterState): boolean {
  if (f.openClosed === 'open' && meeting.closed !== 'Open') return false;
  if (f.openClosed === 'closed' && meeting.closed !== 'Closed') return false;

  if (f.tags.size > 0) {
    for (const tag of f.tags) {
      if (!meeting.formatTags.includes(tag)) return false;
    }
  }

  // Platforms are mutually exclusive on a meeting — a meeting is on
  // ONE platform. So multi-select means "show meetings on any of
  // these platforms" (OR), not AND.
  if (f.platforms.size > 0 && !f.platforms.has(meeting.platform)) {
    return false;
  }

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay =
      meeting.name.toLowerCase() +
      ' ' +
      meeting.city.toLowerCase() +
      ' ' +
      meeting.state.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

type Bucket = 'live' | 'soon' | 'today' | 'tomorrow';

/** Classify an occurrence relative to `now` and the viewer's local calendar day. */
function classify(occ: Occurrence, now: Date): Bucket | null {
  const diffMin = (occ.start.getTime() - now.getTime()) / 60_000;
  if (diffMin <= 0 && diffMin > -LIVE_WINDOW_MIN) return 'live';
  if (diffMin > 0 && diffMin <= SOON_WINDOW_MIN) return 'soon';

  // For "today" vs "tomorrow", compare viewer-local calendar dates.
  const startDay = new Date(occ.start);
  const todayLocal = new Date(now);
  startDay.setHours(0, 0, 0, 0);
  todayLocal.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startDay.getTime() - todayLocal.getTime()) / 86_400_000);

  if (dayDiff === 0 && diffMin > SOON_WINDOW_MIN) return 'today';
  if (dayDiff === 1) return 'tomorrow';
  return null;
}

// ─── Time formatting ────────────────────────────────────────────────────

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

// ─── Copy-to-clipboard helper ───────────────────────────────────────────

const DAY_NAMES_FULL = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
];

/** Build a plaintext snippet a reader can paste into Notes / Reminders /
 *  a calendar to remember a meeting. Day-of-week framing (not specific
 *  date) since meetings recur weekly. */
function buildCopyText(meeting: NormalizedMeeting | FeaturedMeeting, start: Date): string {
  const lines: string[] = [];
  lines.push(`NA Meeting: ${meeting.name}`);

  const fmt = meeting.formatTags.length > 0 ? meeting.formatTags.join(', ') : 'Format varies';
  lines.push(`${fmt} · ${meeting.closed}`);

  if ('is24x7' in meeting && meeting.is24x7) {
    lines.push('24/7 — join any time');
  } else {
    const day = DAY_NAMES_FULL[start.getDay()];
    const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    lines.push(`${day} at ${time} (your local time)`);
  }

  const connectionBits: string[] = [meeting.platform];
  if (meeting.roomNumber) connectionBits.push(`Room ${meeting.roomNumber}`);
  if (meeting.passcode) {
    const label = meeting.platform === 'Phone Call' ? 'Access code' : 'Passcode';
    connectionBits.push(`${label} ${meeting.passcode}`);
  }
  lines.push(connectionBits.join(' · '));

  if (meeting.joinUrl) lines.push(meeting.joinUrl);

  return lines.join('\n');
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback.
  }
  // Fallback for environments without the async clipboard API.
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
  } catch {
    return false;
  }
}

// ─── Pre-built filter chip groups ───────────────────────────────────────

const TAG_CHIPS: { label: string; tag: string }[] = [
  { label: 'Newcomer', tag: 'Newcomer' },
  { label: 'Discussion', tag: 'Discussion' },
  { label: 'Speaker', tag: 'Speaker' },
  { label: 'JFT Study', tag: 'Just For Today Study' },
  { label: 'Basic Text Study', tag: 'Basic Text Study' },
  { label: 'Step Study', tag: 'Step Study' },
  { label: 'Literature Study', tag: 'Literature Study' },
  { label: 'Meditation', tag: 'Meditation' },
  { label: 'Topic', tag: 'Topic' },
  { label: 'Women', tag: 'Women' },
  { label: 'Men', tag: 'Men' },
  { label: 'LGBTQ+', tag: 'LGBTQ+' },
  { label: 'Young People', tag: 'Young People' },
  { label: 'Hybrid', tag: 'Hybrid Meeting' },
];

// ─── Sub-components ─────────────────────────────────────────────────────

function FeaturedCard({ meeting }: { meeting: FeaturedMeeting }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    const ok = await writeToClipboard(buildCopyText(meeting, new Date()));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-6 shadow-sm dark:border-emerald-700/70 dark:bg-emerald-950/30 sm:p-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950">
          <Star className="h-3 w-3" aria-hidden="true" />
          Always available
        </span>
        <span className="text-sm font-medium text-foreground/80">
          24/7 — join any time
        </span>
      </div>
      <h2 className="m-0 text-2xl font-semibold text-foreground sm:text-3xl">
        {meeting.name}
      </h2>
      {meeting.notes && (
        <p className="mt-2 text-sm text-muted-foreground">{meeting.notes}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>{meeting.platform}</span>
        {meeting.roomNumber && <span>Room {meeting.roomNumber}</span>}
        {meeting.passcode && <span>Passcode {meeting.passcode}</span>}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={meeting.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-base font-medium text-background hover:opacity-90"
        >
          Join the 24/7 room
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-emerald-100/40 dark:border-emerald-800 dark:hover:bg-emerald-950/40"
          aria-label="Copy meeting details to clipboard"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4" aria-hidden="true" />
              Copy details
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            meeting.closed === 'Open'
              ? 'bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-100'
              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
          )}
        >
          {meeting.closed}
        </span>
      </div>

      <div className="mt-2 font-medium text-foreground">{meeting.name}</div>

      {meeting.formatTags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          {meeting.formatTags.map((t, i) => (
            <span key={i} className="rounded bg-muted/60 px-1.5 py-0.5">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        {(meeting.city || meeting.state) && (
          <span>
            {meeting.city}
            {meeting.city && meeting.state ? ', ' : ''}
            {meeting.state}
            {' · '}
          </span>
        )}
        {meeting.platform}
        {meeting.roomNumber && <span> · Room {meeting.roomNumber}</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {meeting.joinUrl ? (
          <a
            href={meeting.joinUrl}
            target={meeting.platform === 'Phone Call' ? undefined : '_blank'}
            rel={meeting.platform === 'Phone Call' ? undefined : 'noopener noreferrer'}
            className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            {meeting.platform === 'Phone Call' ? `Call ${meeting.roomNumber}` : `Join ${meeting.platform}`}
            {meeting.platform === 'Phone Call' ? (
              <PhoneIcon className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            )}
          </a>
        ) : (
          <span className="text-xs italic text-muted-foreground">
            Connection details unavailable — check{' '}
            <a
              href="https://na.org/meetingsearch/virtual-meeting-search/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              na.org
            </a>
          </span>
        )}
        {meeting.passcode && !meeting.hasEmbeddedPasscode && (
          <span className="text-xs text-muted-foreground">
            {meeting.platform === 'Phone Call' ? 'Access code' : 'Passcode'}:{' '}
            <code className="rounded bg-muted/60 px-1 py-0.5">{meeting.passcode}</code>
          </span>
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
              {hidden.toLocaleString()} more {hidden === 1 ? 'meeting' : 'meetings'} in this window — refine filters or search to narrow.
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────

export function VirtualNaMeetings({ bundle }: { bundle: MeetingsBundle }) {
  const [now, setNow] = React.useState<Date | null>(null);
  const [filterState, setFilterState] = React.useState<FilterState>({
    tags: new Set(),
    platforms: new Set(),
    openClosed: 'all',
    search: '',
  });
  const [showAllChips, setShowAllChips] = React.useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = React.useState(false);

  // The three platforms most readers want first. Everything else stays
  // behind the "Show all" affordance, matching the meeting-type chip
  // pattern. Order within the visible-by-default set is by count desc.
  const DEFAULT_VISIBLE_PLATFORMS = React.useMemo(
    () => new Set(['Zoom', 'Phone Call', 'Google Meet']),
    [],
  );

  // Build the platform chip list from the data, sorted by count desc.
  // Splits into a default-visible subset (the three above) and the rest
  // so the chip row can collapse when not expanded.
  const { visiblePlatforms, hiddenPlatforms } = React.useMemo(() => {
    const sorted = Object.entries(bundle.platform_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return {
      visiblePlatforms: sorted.filter((p) => DEFAULT_VISIBLE_PLATFORMS.has(p.name)),
      hiddenPlatforms: sorted.filter((p) => !DEFAULT_VISIBLE_PLATFORMS.has(p.name)),
    };
  }, [bundle.platform_counts, DEFAULT_VISIBLE_PLATFORMS]);

  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  // Bucket meetings into the 4 panes. Recompute when `now` ticks or
  // filters change. With ~4k meetings this takes a few ms — fine.
  const buckets = React.useMemo(() => {
    if (!now) return null;
    const filtered = bundle.meetings.filter((m) => matchesFilters(m, filterState));
    const live: Occurrence[] = [];
    const soon: Occurrence[] = [];
    const today: Occurrence[] = [];
    const tomorrow: Occurrence[] = [];
    for (const m of filtered) {
      const occ = computeOccurrence(m, now);
      if (!occ) continue;
      const b = classify(occ, now);
      if (b === 'live') live.push(occ);
      else if (b === 'soon') soon.push(occ);
      else if (b === 'today') today.push(occ);
      else if (b === 'tomorrow') tomorrow.push(occ);
    }
    const byStart = (a: Occurrence, b: Occurrence) =>
      a.start.getTime() - b.start.getTime();
    live.sort(byStart);
    soon.sort(byStart);
    today.sort(byStart);
    tomorrow.sort(byStart);
    return { live, soon, today, tomorrow };
  }, [now, bundle.meetings, filterState]);

  function toggleTag(tag: string) {
    setFilterState((prev) => {
      const next = new Set(prev.tags);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return { ...prev, tags: next };
    });
  }

  function togglePlatform(name: string) {
    setFilterState((prev) => {
      const next = new Set(prev.platforms);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...prev, platforms: next };
    });
  }

  function setOpenClosed(v: OpenClosedFilter) {
    setFilterState((prev) => ({ ...prev, openClosed: v }));
  }

  function clearFilters() {
    setFilterState({ tags: new Set(), platforms: new Set(), openClosed: 'all', search: '' });
  }

  const filtersActive =
    filterState.tags.size > 0 ||
    filterState.platforms.size > 0 ||
    filterState.openClosed !== 'all' ||
    filterState.search.trim().length > 0;

  const visibleChips = showAllChips ? TAG_CHIPS : TAG_CHIPS.slice(0, 7);

  return (
    <div className="space-y-10">
      {bundle.featured && <FeaturedCard meeting={bundle.featured} />}

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
          <span className="self-center text-xs font-medium text-muted-foreground">Meeting type:</span>
          {visibleChips.map(({ label, tag }) => {
            const active = filterState.tags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:border-foreground/40',
                )}
              >
                {label}
              </button>
            );
          })}
          {!showAllChips && TAG_CHIPS.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAllChips(true)}
              className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <ChevronDown className="inline h-3 w-3" aria-hidden="true" /> Show all
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Open / Closed:</span>
          {(['all', 'open', 'closed'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setOpenClosed(v)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition',
                filterState.openClosed === v
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:border-foreground/40',
              )}
            >
              {v === 'all' ? 'All' : v}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-muted-foreground">Platform:</span>
          {[...visiblePlatforms, ...(showAllPlatforms ? hiddenPlatforms : [])].map(({ name, count }) => {
            const active = filterState.platforms.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => togglePlatform(name)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:border-foreground/40',
                )}
              >
                {name}{' '}
                <span
                  className={cn(
                    'tabular-nums',
                    active ? 'text-background/70' : 'text-muted-foreground',
                  )}
                >
                  ({count.toLocaleString()})
                </span>
              </button>
            );
          })}
          {!showAllPlatforms && hiddenPlatforms.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllPlatforms(true)}
              className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <ChevronDown className="inline h-3 w-3" aria-hidden="true" /> Show all
            </button>
          )}
        </div>

        <div className="mt-3">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by group name, city, or state…"
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
            description="Meetings currently in session — join any time in the next hour."
            occurrences={buckets.live}
            bucket="live"
            now={now}
          />
          <Pane
            title="Starting soon"
            description={`Meetings beginning in the next ${SOON_WINDOW_MIN} minutes.`}
            occurrences={buckets.soon}
            bucket="soon"
            now={now}
          />
          <Pane
            title="Later today"
            description="Meetings starting later in your local day."
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

      {/* Footer / attribution */}
      <footer className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="m-0">
          Meeting data © Narcotics Anonymous World Services, Inc., pulled
          weekly from{' '}
          <a
            href={bundle.source}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            na.org's virtual meeting search
          </a>{' '}
          and used with permission. <strong className="font-semibold text-foreground">
            quitting7oh.org is not affiliated with Narcotics Anonymous
            World Services or any NA group.
          </strong>{' '}
          To report a missing or incorrect meeting, use{' '}
          <a
            href={bundle.source}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            na.org's meeting search
          </a>{' '}
          (the page has a "Submit Update" button next to each meeting) —
          we don't maintain the underlying list.
        </p>
        <p className="m-0 mt-2">
          Showing {bundle.meetings.length.toLocaleString()} US
          English-language meetings plus the 24/7 always-on room; last
          refreshed{' '}
          {new Date(bundle.fetched_at).toLocaleDateString(undefined, {
            dateStyle: 'medium',
          })}
          .
        </p>
      </footer>
    </div>
  );
}
