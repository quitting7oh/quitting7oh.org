import * as React from 'react';
import type { MarkdownHeading } from 'astro';
import { ChevronDown, ListTree } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { useActiveSlug } from '~/components/Toc';
import { cn } from '~/lib/utils';

interface Props {
  headings: MarkdownHeading[];
}

export function TocMobile({ headings }: Props) {
  // Match the right-rail TOC: H2 and H3 only.
  const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3);
  const active = useActiveSlug(filtered.map((h) => h.slug));
  const [open, setOpen] = React.useState(false);
  if (filtered.length === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border border-border bg-background/55 xl:hidden"
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
          className="px-3 pb-4 text-sm"
        >
          <ul className="space-y-1">
            {filtered.map((h) => (
              <li key={h.slug}>
                <a
                  href={`#${h.slug}`}
                  aria-current={active === h.slug ? 'location' : undefined}
                  className={cn(
                    'block rounded-sm px-3 py-2 font-medium leading-snug text-foreground transition-colors hover:text-primary',
                    h.depth === 3 && 'pl-6 text-muted-foreground',
                    active === h.slug && 'bg-primary/[0.07] text-primary',
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
