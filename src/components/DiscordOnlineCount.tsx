import { useEffect, useState } from 'react';

const GUILD_ID = '1366097989382307901';
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

/** Renders " · N online" inline (with a pulsing dot) when the Discord
 *  widget JSON reports an online count. Renders nothing while loading
 *  or on fetch failure, so the surrounding copy stays clean. */
export function DiscordOnlineCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(WIDGET_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.presence_count === 'number') {
          setCount(data.presence_count);
        }
      })
      .catch(() => {
        /* Discord rate-limited, widget disabled, or offline. Render
         * nothing rather than show an error. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null || count <= 0) return null;

  return (
    <span className="ml-1 inline-flex items-center gap-1 align-middle text-xs font-normal text-emerald-700 dark:text-emerald-300">
      <span
        className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400"
        aria-hidden="true"
      />
      {count} online
    </span>
  );
}
