import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

const GUILD_ID = '1366097989382307901';
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;
const INVITE_URL = 'https://discord.gg/quitting7oh';

interface DiscordMember {
  id: string;
  username: string;
  avatar_url: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

interface DiscordWidget {
  name: string;
  presence_count: number;
  members: DiscordMember[];
}

const STATUS_COLOR: Record<string, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-rose-500',
  offline: 'bg-zinc-400',
};

/** Custom Discord widget for /about/the-community. Pulls live data
 *  from Discord's widget JSON endpoint (CORS allowed for our origin)
 *  and renders a styled card that follows the site's theme tokens,
 *  so the 8 color variants and light/dark modes all match. No iframe,
 *  no Discord JS, just one fetch + a render. */
export function DiscordCard() {
  const [data, setData] = useState<DiscordWidget | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(WIDGET_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('discord widget'))))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (errored) {
    return (
      <div className="not-prose my-4 max-w-sm rounded-lg border border-border bg-card p-4">
        <a
          href={INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 font-semibold text-foreground hover:text-primary"
        >
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          Join the Discord →
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="not-prose my-4 h-[28rem] w-full max-w-sm animate-pulse rounded-lg border border-border bg-muted/30"
        aria-label="Loading Discord widget"
      />
    );
  }

  return (
    <div className="not-prose my-4 flex w-full max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {/* Header: server name + live online count */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-semibold text-foreground">quitting7oh</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          <span>{data.presence_count} online</span>
        </div>
      </div>

      {/* Member list: avatars + names + status dots */}
      <div className="flex flex-col">
        <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members online
        </div>
        <ul className="m-0 max-h-72 list-none space-y-0.5 overflow-y-auto p-0 px-2 pb-2">
          {data.members.map((m) => (
            <li
              key={m.id}
              className="m-0 flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/40"
            >
              <div className="relative shrink-0">
                <img
                  src={m.avatar_url}
                  alt=""
                  loading="lazy"
                  className="m-0 block h-8 w-8 rounded-full bg-muted"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                    STATUS_COLOR[m.status] ?? STATUS_COLOR.offline
                  }`}
                  aria-hidden="true"
                />
              </div>
              <span className="truncate text-sm text-foreground">
                {m.username}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA: full-width Join button */}
      <a
        href={INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t border-border bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white no-underline transition hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
      >
        Join the Discord →
      </a>
    </div>
  );
}
