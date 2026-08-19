import * as React from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '~/lib/utils';

type PagefindResult = {
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: { title: string; [key: string]: string };
    filters?: Record<string, string[]>;
  }>;
};

type Pagefind = {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
};

type SearchResult = Awaited<ReturnType<PagefindResult['data']>>;
let pagefindPromise: Promise<Pagefind | null> | null = null;

function getPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = import(/* @vite-ignore */ `${window.location.origin}/pagefind/pagefind.js`)
      .then((module) => module as Pagefind)
      .catch(() => null);
  }
  return pagefindPromise;
}

function useDebouncedValue(value: string, delay = 130) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface Props {
  variant?: 'header' | 'hero';
  placeholder?: string;
}

export function SearchBox({ variant = 'header', placeholder }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [resolvedQuery, setResolvedQuery] = React.useState('');
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(query);
  const isHero = variant === 'hero';

  React.useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  React.useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) {
      setResults([]);
      setResolvedQuery('');
      setActiveIndex(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      const pagefind = await getPagefind();
      if (cancelled) return;
      if (!pagefind) {
        setAvailable(false);
        setResolvedQuery(trimmed);
        return;
      }
      setAvailable(true);
      const response = await pagefind.search(trimmed);
      const loaded = await Promise.all(response.results.slice(0, 8).map((result) => result.data()));
      const next = loaded.map((result) => ({
        ...result,
        url: result.url === '/' ? '/' : result.url.replace(/\/+$/, ''),
      }));
      if (cancelled) return;
      setResults(next);
      setResolvedQuery(trimmed);
      setActiveIndex(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const searching = query.trim().length > 0 && query.trim() !== resolvedQuery && available !== false;

  const navigate = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    }
    if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      window.location.href = results[activeIndex].url;
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex items-center border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-accent',
            isHero
              ? 'h-14 w-full justify-between rounded-xl px-4 text-left shadow-sm sm:px-5'
              : 'size-10 justify-center rounded-full xl:h-10 xl:w-auto xl:gap-2 xl:px-4',
          )}
          aria-label="Search the site"
        >
          <span className={cn('flex items-center', isHero ? 'gap-3' : 'xl:gap-2')}>
            <Search className={cn('shrink-0 text-primary', isHero ? 'size-5' : 'size-[1.05rem]')} aria-hidden="true" />
            <span className={cn(isHero ? 'text-base text-muted-foreground' : 'hidden text-sm font-bold xl:inline')}>
              {placeholder ?? 'Search the guide'}
            </span>
          </span>
          {isHero && <span className="hidden rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline">⌘ K</span>}
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[8vh] z-50 flex max-h-[84vh] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl sm:top-[12vh]"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search quitting7oh.org</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search all guides, calculators, compounds, and resources.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-border px-4 sm:px-5">
            <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={navigate}
              placeholder="What do you need help with?"
              autoComplete="off"
              aria-label="Search all pages"
              aria-controls="site-search-results"
              aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
              className="h-16 min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground sm:h-[4.5rem] sm:text-xl"
            />
            <DialogPrimitive.Close asChild>
              <button type="button" className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close search">
                <X className="size-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div id="site-search-results" className="min-h-32 overflow-y-auto" role="listbox" aria-label="Search results">
            {!query.trim() ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                Search treatment paths, symptoms, medicines, meetings, or a compound name.
              </div>
            ) : available === false ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                The search index is created by the production build. Use the preview server to test it locally.
              </div>
            ) : searching ? (
              <div className="space-y-3 px-5 py-6" aria-live="polite">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            ) : results.length === 0 ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">No pages matched “{resolvedQuery}”.</div>
            ) : (
              <ul className="divide-y divide-border">
                {results.map((result, index) => {
                  const category = result.filters?.category?.[0];
                  return (
                    <li key={result.url}>
                      <a
                        id={`search-result-${index}`}
                        href={result.url}
                        onClick={(event) => {
                          event.preventDefault();
                          window.location.href = result.url;
                        }}
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseMove={() => setActiveIndex(index)}
                        className={cn(
                          'group flex items-start gap-3 px-4 py-4 sm:px-5',
                          index === activeIndex && 'bg-accent',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          {category && <div className="eyebrow mb-1">{category}</div>}
                          <div className="font-bold text-foreground">{result.meta.title || result.url}</div>
                          <div className="mt-1 line-clamp-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: result.excerpt }} />
                        </div>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-aria-selected:opacity-100" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="hidden items-center justify-between border-t border-border bg-muted/50 px-5 py-2.5 text-xs text-muted-foreground sm:flex">
            <span>↑ ↓ to move · Enter to open</span>
            <span>Esc to close</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
