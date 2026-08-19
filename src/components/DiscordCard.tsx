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
  online: 'bg-success',
  idle: 'bg-signal',
  dnd: 'bg-destructive',
  offline: 'bg-muted-foreground',
};

/** Custom Discord widget for /about/the-community. Pulls live data
 *  from Discord's widget JSON endpoint (CORS allowed for our origin)
 *  and renders a styled card that follows the site's theme tokens,
 *  so the light and dark reading themes match. No iframe,
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
      <div className="not-prose field-card my-5 max-w-md p-5">
        <a
          href={INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-3 font-bold text-primary hover:text-primary/80"
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
        className="not-prose field-card my-5 h-[28rem] w-full max-w-md animate-pulse bg-muted/35"
        aria-label="Loading Discord widget"
      />
    );
  }

  return (
    <div className="not-prose field-card my-5 flex w-full max-w-md flex-col overflow-hidden">
      {/* Header: server name + live online count */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-xl font-medium text-foreground">quitting7oh</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full bg-success motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <span>{data.presence_count} online</span>
        </div>
      </div>

      {/* Member list: avatars + names + status dots */}
      <div className="flex flex-col">
        <div className="px-5 pt-4 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.13em] text-muted-foreground">
          Members online
        </div>
        <ul className="m-0 max-h-72 list-none space-y-0.5 overflow-y-auto p-0 px-2 pb-2">
          {data.members.map((m) => (
            <li
              key={m.id}
              className="m-0 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/60"
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
        className="block border-t border-primary/30 bg-primary px-5 py-3.5 text-center text-sm font-bold text-primary-foreground no-underline transition hover:bg-primary/90"
      >
        Join the Discord →
      </a>
    </div>
  );
}
