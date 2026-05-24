import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
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
      const url = window.location.origin + '/pagefind/pagefind.js';
      const pf = (await import(/* @vite-ignore */ url)) as Pagefind;
      return pf;
    } catch {
      return null;
    }
  })();
  return pagefindPromise;
}

function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Props {
  variant?: 'header' | 'hero';
  placeholder?: string;
}

export function SearchBox({ variant = 'header', placeholder }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ResolvedResult[]>([]);
  // The query string the current `results` were computed from. Used to
  // detect when results are stale relative to what the user has typed,
  // so we can show a skeleton instead of a misleading "No results."
  const [resultsFor, setResultsFor] = React.useState('');
  const [pagefindAvailable, setPagefindAvailable] = React.useState<boolean | null>(null);
  const [open, setOpen] = React.useState(false);
  const debouncedQuery = useDebouncedValue(query, 150);

  // Focus input on ⌘/Ctrl+K from anywhere.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close results on outside click.
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Run search when the debounced query changes.
  React.useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setResultsFor('');
      return;
    }
    let cancelled = false;
    (async () => {
      const pf = await loadPagefind();
      if (cancelled) return;
      if (!pf) {
        setPagefindAvailable(false);
        setResults([]);
        setResultsFor(trimmed);
        return;
      }
      setPagefindAvailable(true);
      const { results: hits } = await pf.search(trimmed);
      const top = await Promise.all(hits.slice(0, 8).map((r) => r.data()));
      if (cancelled) return;
      setResults(top);
      setResultsFor(trimmed);
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const isHero = variant === 'hero';
  const ph = placeholder ?? 'Search the site…';
  const trimmedQuery = query.trim();
  const showDropdown =
    open && (trimmedQuery.length > 0 || pagefindAvailable === false);
  // Search is in flight whenever what the user has typed doesn't match
  // the query that produced the current results. Covers the debounce
  // window, the Pagefind dynamic import, and the search itself.
  const searching =
    trimmedQuery.length > 0 &&
    trimmedQuery !== resultsFor &&
    pagefindAvailable !== false;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative',
        isHero ? 'w-full max-w-2xl' : 'w-full max-w-xs',
      )}
    >
      <Search
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
          isHero ? 'h-5 w-5' : 'h-4 w-4',
        )}
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setOpen(true);
          loadPagefind();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            inputRef.current?.blur();
            setOpen(false);
          }
        }}
        placeholder={ph}
        autoComplete="off"
        className={cn(
          'pl-9',
          isHero ? 'h-12 text-base pl-11' : 'h-9',
        )}
        aria-label="Search the site"
      />
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
          role="listbox"
        >
          {pagefindAvailable === false ? (
            <p className="p-4 text-sm text-muted-foreground">
              Search is only available on the deployed site. To test locally,
              run{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                npm run build &amp;&amp; npm run preview
              </code>
              .
            </p>
          ) : searching && results.length === 0 ? (
            <ul className="divide-y divide-border" aria-busy="true" aria-label="Searching…">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="space-y-2 p-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No results.</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((r) => {
                const category = r.filters?.category?.[0] ?? '';
                return (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      className="block p-3 transition hover:bg-accent hover:text-accent-foreground"
                    >
                      {category && (
                        <div className="text-xs uppercase tracking-wide text-primary">
                          {category}
                        </div>
                      )}
                      <div className="text-sm font-medium">
                        {r.meta.title || r.url}
                      </div>
                      <div
                        className="mt-1 text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: r.excerpt }}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
