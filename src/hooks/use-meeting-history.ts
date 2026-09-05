import * as React from 'react';
import {
  MEETING_HISTORY_EVENT,
  MEETING_HISTORY_STORAGE_KEY,
  readMeetingHistory,
  type MeetingHistoryEntry,
} from '~/lib/meeting-history';

export function useMeetingHistory(): MeetingHistoryEntry[] {
  const [entries, setEntries] = React.useState<MeetingHistoryEntry[]>([]);

  React.useEffect(() => {
    const refresh = () => setEntries(readMeetingHistory());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === MEETING_HISTORY_STORAGE_KEY || event.key === null) refresh();
    };
    const handleLocalChange = (event: Event) => {
      const detail = (event as CustomEvent<MeetingHistoryEntry[]>).detail;
      setEntries(Array.isArray(detail) ? detail : readMeetingHistory());
    };

    refresh();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(MEETING_HISTORY_EVENT, handleLocalChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(MEETING_HISTORY_EVENT, handleLocalChange);
    };
  }, []);

  return entries;
}
