import * as React from 'react';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
} from '~/components/ui/command';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

type PagefindResult = {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: { title: string; [k: string]: string };
    filters?: Record<string, string[]>;
  }>;
};

type Pagefind = {
  search: (q: string) => Promise<{ results: PagefindResult[] }>;
};

type ResolvedResult = Awaited<ReturnType<PagefindResult['data']>>;

let pagefindPromise: Promise<Pagefind | null> | null = null;

function loadPagefind(): Promise<Pagefind | null> {
  if (pagefindPromise) return pagefindPromise;
  pagefindPromise = (async () => {
    try {
      // Pagefind writes /pagefind/pagefind.js as a post-Astro-build step,
      // so it doesn't exist when Vite is bundling the client. Construct
      // the URL at runtime to keep Rollup from trying to resolve it.
      const url = window.location.origin + '/pagefind/pagefind.js';
      const pf = (await import(/* @vite-ignore */ url)) as Pagefind;
      return pf;
    } catch {
      return null;
    }
  })();
  return pagefindPromise;
}

interface Props {
  variant?: 'header' | 'hero';
  placeholder?: string;
}

export function SearchBox({ variant = 'header', placeholder }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ResolvedResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [pagefindAvailable, setPagefindAvailable] = React.useState<boolean | null>(null);

  // Open with Cmd/Ctrl+K from anywhere.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Run a search whenever the query changes.
  React.useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    (async () => {
      const pf = await loadPagefind();
      if (cancelled) return;
      if (!pf) {
        setPagefindAvailable(false);
        setResults([]);
        setSearching(false);
        return;
      }
      setPagefindAvailable(true);
      const { results: hits } = await pf.search(trimmed);
      const top = await Promise.all(hits.slice(0, 8).map((r) => r.data()));
      if (cancelled) return;
      setResults(top);
      setSearching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [query, open]);

  const isHero = variant === 'hero';
  const triggerPlaceholder = placeholder ?? 'Search the site…';

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          'relative h-9 justify-start gap-2 text-sm text-muted-foreground',
          isHero ? 'w-full max-w-2xl px-4 py-3 text-base' : 'w-full max-w-xs',
        )}
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">{triggerPlaceholder}</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search the site"
        description="Find pages by topic, drug name, or symptom."
      >
        <CommandInput
          placeholder="Type to search…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* cmdk filters items by string match; we override by always showing
              the Pagefind results we computed, regardless of cmdk's internal filter. */}
          {searching && <CommandEmpty>Searching…</CommandEmpty>}
          {!searching && query.trim() && results.length === 0 && (
            <CommandEmpty>
              {pagefindAvailable === false
                ? 'Search is only available on the deployed site. To test locally, run `npm run build && npm run preview`.'
                : 'No results.'}
            </CommandEmpty>
          )}
          {!query.trim() && (
            <CommandEmpty>Type to search the site.</CommandEmpty>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((r) => {
                const category = r.filters?.category?.[0] ?? '';
                return (
                  <CommandItem
                    key={r.url}
                    value={`${r.meta.title} ${r.url}`}
                    onSelect={() => {
                      window.location.href = r.url;
                    }}
                    className="flex flex-col items-start gap-1"
                  >
                    {category && (
                      <span className="text-xs uppercase tracking-wide text-primary">
                        {category}
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {r.meta.title || r.url}
                    </span>
                    <span
                      className="text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
