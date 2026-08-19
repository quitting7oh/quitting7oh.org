import * as React from 'react';
import type { MarkdownHeading } from 'astro';
import { ChevronDown, ListTree } from 'lucide-react';
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
      className="rounded-xl border border-border bg-background/65 xl:hidden"
    >
      <CollapsibleTrigger className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-foreground hover:bg-accent">
        <span className="flex items-center gap-2">
          <ListTree className="size-4 text-primary" aria-hidden="true" />
          <span>On this page</span>
          <span className="font-normal text-muted-foreground">
            {filtered.length}
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
          className="border-t border-border px-4 py-4 text-sm"
        >
          <ul className="space-y-2 border-l border-border">
            {filtered.map((h) => (
              <li key={h.slug}>
                <a
                  href={`#${h.slug}`}
                  className={cn(
                    '-ml-px block border-l-2 border-transparent pl-3 leading-snug text-foreground transition-colors hover:border-primary hover:text-primary',
                    h.depth === 3 && 'pl-6 text-muted-foreground',
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
