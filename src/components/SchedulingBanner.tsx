import * as React from 'react';
import { Megaphone, X } from 'lucide-react';

/** Bump this suffix if the banner's message changes materially and it
 *  should reappear for readers who dismissed the old one. */
const DISMISS_KEY = 'scheduling-banner-dismissed-2026-07';

const PAGE_URL = '/compounds/7-oh-ban';

export function SchedulingBanner() {
  // Hidden during SSR so it never flashes for readers who dismissed it.
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    // No banner on the page it links to.
    if (window.location.pathname.replace(/\/$/, '') === PAGE_URL) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
      setHidden(false);
    } catch {
      // Storage blocked → show it; a time-sensitive notice should
      // default to visible.
      setHidden(false);
    }
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  if (hidden) return null;

  return (
    <div className="relative border-b border-primary/20 bg-primary text-primary-foreground">
      <a
        href={PAGE_URL}
        className="block px-4 py-2.5 pr-12 text-center text-sm leading-snug hover:underline sm:px-12"
      >
        <Megaphone
          className="mr-1.5 inline-block h-4 w-4 -translate-y-px"
          aria-hidden="true"
        />
        <span className="font-semibold">
          DEA has filed notice to schedule 7-OH, pseudo, MGM-15, and
          MGM-16.
        </span>{' '}
        <span className="opacity-90">
          Earliest ban date: August 5, 2026. What's happening and what it
          means&nbsp;&rarr;
        </span>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
