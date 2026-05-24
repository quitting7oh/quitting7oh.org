import * as React from 'react';
import type { MarkdownHeading } from 'astro';
import { cn } from '~/lib/utils';

interface Props {
  headings: MarkdownHeading[];
}

export function Toc({ headings }: Props) {
  // Only H2 and H3 — H1 is the page title.
  const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3);
  if (filtered.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1.5 border-l border-border">
        {filtered.map((h) => (
          <li key={h.slug}>
            <a
              href={`#${h.slug}`}
              className={cn(
                '-ml-px block border-l border-transparent pl-3 text-muted-foreground transition hover:border-primary hover:text-foreground',
                h.depth === 3 && 'pl-6 text-muted-foreground/80',
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
