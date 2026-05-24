import * as React from 'react';
import type { MarkdownHeading } from 'astro';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { cn } from '~/lib/utils';

interface Props {
  headings: MarkdownHeading[];
}

export function TocMobile({ headings }: Props) {
  // Match the right-rail TOC: H2 and H3 only.
  const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3);
  const [open, setOpen] = React.useState(false);
  if (filtered.length === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mb-6 rounded-md border border-border bg-muted/50 xl:hidden"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:text-foreground/80">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">📑</span>
          <span>On this page</span>
          <span className="font-normal lowercase tracking-normal text-muted-foreground">
            {`${filtered.length} ${filtered.length === 1 ? 'heading' : 'headings'}`}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <nav
          aria-label="Table of contents"
          className="border-t border-border px-3.5 py-3 text-sm"
        >
          <ul className="space-y-1.5">
            {filtered.map((h) => (
              <li key={h.slug}>
                <a
                  href={`#${h.slug}`}
                  className={cn(
                    'block text-foreground transition hover:text-primary',
                    h.depth === 3 && 'pl-4 text-muted-foreground',
                  )}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}
