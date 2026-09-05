export type MeetingProvider = 'KA' | 'KQS' | 'NA' | 'SMART';

export interface MeetingHistoryEntry {
  provider: MeetingProvider;
  meetingId: string;
  name: string;
  joinUrl: string;
  firstJoinedAt: string;
  lastJoinedAt: string;
  joinCount: number;
}
export interface MeetingHistoryInput {
  provider: MeetingProvider;
  meetingId: string;
  name: string;
  joinUrl: string;
}

export const MEETING_HISTORY_STORAGE_KEY = 'quitting7oh:meeting-history:v1';
export const MEETING_HISTORY_EVENT = 'quitting7oh:meeting-history-change';

const MAX_HISTORY_ENTRIES = 250;

export function meetingHistoryKey(provider: MeetingProvider, meetingId: string): string {
  return `${provider}:${meetingId}`;
}

function isProvider(value: unknown): value is MeetingProvider {
  return value === 'KA' || value === 'KQS' || value === 'NA' || value === 'SMART';
}

function isHistoryEntry(value: unknown): value is MeetingHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<MeetingHistoryEntry>;
  return (
    isProvider(entry.provider) &&
    typeof entry.meetingId === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.joinUrl === 'string' &&
    typeof entry.firstJoinedAt === 'string' &&
    typeof entry.lastJoinedAt === 'string' &&
    typeof entry.joinCount === 'number' &&
    Number.isFinite(entry.joinCount) &&
    entry.joinCount >= 1
  );
}

export function readMeetingHistory(): MeetingHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MEETING_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isHistoryEntry)
      .sort((a, b) => Date.parse(b.lastJoinedAt) - Date.parse(a.lastJoinedAt));
  } catch {
    return [];
  }
}

function announceMeetingHistory(entries: MeetingHistoryEntry[]): void {
  window.dispatchEvent(
    new CustomEvent<MeetingHistoryEntry[]>(MEETING_HISTORY_EVENT, { detail: entries }),
  );
}

export function recordMeetingJoin(input: MeetingHistoryInput): MeetingHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const now = new Date().toISOString();
  const key = meetingHistoryKey(input.provider, input.meetingId);
  const existing = readMeetingHistory();
  const previous = existing.find(
    (entry) => meetingHistoryKey(entry.provider, entry.meetingId) === key,
  );
  const nextEntry: MeetingHistoryEntry = previous
    ? {
        ...previous,
        name: input.name,
        joinUrl: input.joinUrl,
        lastJoinedAt: now,
        joinCount: previous.joinCount + 1,
      }
    : {
        ...input,
        firstJoinedAt: now,
        lastJoinedAt: now,
        joinCount: 1,
      };
  const next = [
    nextEntry,
    ...existing.filter((entry) => meetingHistoryKey(entry.provider, entry.meetingId) !== key),
  ].slice(0, MAX_HISTORY_ENTRIES);

  try {
    window.localStorage.setItem(MEETING_HISTORY_STORAGE_KEY, JSON.stringify(next));
    announceMeetingHistory(next);
  } catch {
    // Browsing modes that block storage still get a working meeting link.
  }
  return next;
}

export function clearMeetingHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(MEETING_HISTORY_STORAGE_KEY);
    announceMeetingHistory([]);
  } catch {
    // Storage may be unavailable; there is nothing else to clear.
  }
}
