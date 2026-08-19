import * as React from 'react';
import type { MarkdownHeading } from 'astro';
import { cn } from '~/lib/utils';

interface Props {
  headings: MarkdownHeading[];
}

/* The reader's current section is the last heading whose top edge has
   crossed this line. Sits just below where anchored headings land
   (scroll-margin-top: 5rem in global.css), so a heading the reader
   just clicked to registers as active. */
const READING_LINE_PX = 88;

function useActiveSlug(slugs: string[]): string | null {
  const [active, setActive] = React.useState<string | null>(null);
  const key = slugs.join('\n');

  React.useEffect(() => {
    const targets = slugs
      .map((slug) => document.getElementById(slug))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // At the very bottom of the page, the last section is the one
      // being read even if its heading never reaches the reading line.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(targets[targets.length - 1].id);
        return;
      }
      let current: string | null = null;
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= READING_LINE_PX) {
          current = el.id;
        } else {
          break;
        }
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}

export function Toc({ headings }: Props) {
  // Only H2 and H3 — H1 is the page title.
  const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3);
  const active = useActiveSlug(filtered.map((h) => h.slug));
  const listRef = React.useRef<HTMLUListElement>(null);

  // On long pages the list scrolls internally; keep the active entry
  // inside its visible band as the reader moves through the page.
  // Scroll the list only, never the window.
  React.useEffect(() => {
    const list = listRef.current;
    if (!list || !active || list.scrollHeight <= list.clientHeight) return;
    const link = list.querySelector(`a[href="#${CSS.escape(active)}"]`);
    if (!(link instanceof HTMLElement)) return;
    const listRect = list.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (linkRect.top < listRect.top || linkRect.bottom > listRect.bottom) {
      list.scrollTop +=
        linkRect.top -
        listRect.top -
        listRect.height / 2 +
        linkRect.height / 2;
    }
  }, [active]);

  if (filtered.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="eyebrow mb-4 !text-muted-foreground">
        On this page
      </p>
      <ul
        ref={listRef}
        className="scrollbar-none max-h-[calc(100vh-11rem)] space-y-0.5 overflow-y-auto overscroll-contain border-l border-border py-1"
      >
        {filtered.map((h) => (
          <li key={h.slug}>
            <a
              href={`#${h.slug}`}
              aria-current={active === h.slug ? 'location' : undefined}
              className={cn(
                'relative -ml-px block border-l-2 border-transparent py-1.5 pl-3 text-[0.8rem] leading-snug text-muted-foreground transition-colors hover:text-foreground',
                h.depth === 3 && 'pl-6 text-muted-foreground/75',
                active === h.slug && 'border-primary font-bold text-primary',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
