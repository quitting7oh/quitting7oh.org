import { useEffect, useState } from 'react';

const GUILD_ID = '1366097989382307901';
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

interface DiscordOnlineCountProps {
  showOnlineLabel?: boolean;
}

/** Show the Discord widget's current online count when it is available. */
export function DiscordOnlineCount({ showOnlineLabel = false }: DiscordOnlineCountProps) {
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
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap align-middle text-xs font-semibold tabular-nums text-success"
      aria-label={`${count} members online`}
    >
      <span
        className="inline-block h-2 w-2 rounded-full bg-success motion-safe:animate-pulse"
        aria-hidden="true"
      />
      {count}
      <span className={showOnlineLabel ? undefined : 'hidden min-[900px]:inline'}> online</span>
    </span>
  );
}
