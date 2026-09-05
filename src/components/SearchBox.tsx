import * as React from 'react';
import { ArrowRight, LoaderCircle, Search, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  SEARCH_CATEGORY_OPTIONS,
  SEARCH_EXAMPLE_QUERIES,
  SEARCH_QUICK_LINKS,
  SEARCH_TYPE_OPTIONS,
  type SearchResultType,
  type StoredSearchResult,
} from '~/lib/search-config';
import { preloadSearchIndex, searchSite, type SearchResponse } from '~/lib/search-client';
import type { PinnedSearchResult } from '~/lib/search-policy';
import { cn } from '~/lib/utils';

interface Props {
  variant?: 'header' | 'hero' | 'inline' | 'page';
  placeholder?: string;
}

type Result = StoredSearchResult | PinnedSearchResult;
type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

function useDebouncedValue(value: string, delay = 120) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function isPinned(result: Result): result is PinnedSearchResult {
  return 'pinned' in result && result.pinned;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter((term) => term.length >= 3)
    .sort((left, right) => right.length - left.length);

  if (!terms.length) return <>{text}</>;
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const pieces = text.split(pattern);

  return (
    <>
      {pieces.map((piece, index) =>
        terms.some((term) => term.toLocaleLowerCase('en-US') === piece.toLocaleLowerCase('en-US')) ? (
          <mark key={`${piece}-${index}`} className="rounded-sm bg-primary/16 px-0.5 text-foreground">
            {piece}
          </mark>
        ) : (
          <React.Fragment key={`${piece}-${index}`}>{piece}</React.Fragment>
        ),
      )}
    </>
  );
}

interface ResultsProps {
  activeIndex: number;
  className?: string;
  emptyState?: React.ReactNode;
  onActiveIndexChange: (index: number) => void;
  onQueryChange: (query: string) => void;
  query: string;
  response: SearchResponse;
  resolvedQuery: string;
  resultsId: string;
  status: SearchStatus;
  variant: 'dialog' | 'embedded' | 'page';
}

function SearchResults({
  activeIndex,
  className,
  emptyState,
  onActiveIndexChange,
  onQueryChange,
  query,
  response,
  resolvedQuery,
  resultsId,
  status,
  variant,
}: ResultsProps) {
  const hasQuery = Boolean(query.trim());
  const searching = hasQuery && (status === 'loading' || query.trim() !== resolvedQuery);

  if (!hasQuery && !emptyState) return null;

  return (
    <div id={resultsId} className={className} aria-live="polite">
      {!hasQuery ? (
        emptyState
      ) : status === 'error' ? (
        <div className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
          Search could not load. You can still browse the <a href="/sitemap" className="font-bold text-primary underline underline-offset-4">complete site map</a>.
        </div>
      ) : searching ? (
        <div className="flex items-center gap-3 px-5 py-7 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          Searching the guide…
        </div>
      ) : response.results.length === 0 ? (
        <div className="px-5 py-8">
          <p className="font-bold text-foreground">No pages matched “{resolvedQuery}”.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a medicine name, symptom, compound, or a shorter phrase.</p>
          {response.suggestions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Suggested searches">
              {response.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onQueryChange(suggestion)}
                  className="min-h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:bg-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {variant === 'page' && (
            <div className="border-b border-border py-3 text-sm text-muted-foreground" role="status">
              {response.total.toLocaleString()} {response.total === 1 ? 'page' : 'pages'} matched “{resolvedQuery}”
            </div>
          )}
          <ul className="divide-y divide-border" role="listbox" aria-label="Search results">
            {response.results.map((result, index) => {
              const pinned = isPinned(result);
              const urgent = pinned && result.emphasis === 'urgent';
              return (
                <li key={`${result.id}-${result.url}`}>
                  <a
                    id={`${resultsId}-result-${index}`}
                    href={result.url}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseMove={() => onActiveIndexChange(index)}
                    className={cn(
                      'group relative flex items-start gap-3 text-left transition-colors',
                      variant === 'page' ? 'py-5 sm:py-6' : 'px-4 py-4 sm:px-5',
                      index === activeIndex && variant !== 'page' && 'bg-accent',
                      urgent && 'before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-primary/70',
                      urgent && variant === 'page' && 'pl-4',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="eyebrow mb-1 block">
                        {urgent ? result.pinLabel : `${result.categoryLabel} · ${result.type}`}
                      </span>
                      <span className="block font-bold leading-snug text-foreground">
                        <HighlightedText text={result.title} query={query} />
                      </span>
                      {result.section && (
                        <span className="mt-0.5 block text-sm font-semibold text-primary">
                          <HighlightedText text={result.section} query={query} />
                        </span>
                      )}
                      <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                        <HighlightedText text={result.excerpt} query={query} />
                      </span>
                    </span>
                    <ArrowRight
                      className={cn(
                        'mt-1 size-4 shrink-0 text-primary transition-[opacity,transform] group-hover:translate-x-0.5',
                        variant === 'page' ? 'opacity-70' : 'opacity-0 group-hover:opacity-100 group-aria-selected:opacity-100',
                      )}
                      aria-hidden="true"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function EmptyDialogState({ onQueryChange }: { onQueryChange: (query: string) => void }) {
  return (
    <div className="px-4 py-5 sm:px-5 sm:py-6">
      <p className="text-sm leading-relaxed text-muted-foreground">Search symptoms, treatments, medicines, meetings, or a compound name.</p>
      <nav aria-label="Common search destinations" className="mt-4 grid gap-1 sm:grid-cols-2">
        {SEARCH_QUICK_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="group flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-accent">
            <span>
              <span className="block text-sm font-bold text-foreground">{link.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{link.detail}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        ))}
      </nav>
      <div className="mt-5 border-t border-border pt-4">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Try a search</span>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {SEARCH_EXAMPLE_QUERIES.map((example) => (
            <button key={example} type="button" onClick={() => onQueryChange(example)} className="text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const EMPTY_RESPONSE: SearchResponse = {
  results: [],
  suggestions: [],
  total: 0,
  pageCount: 0,
  recordCount: 0,
};

export function SearchBox({ variant = 'header', placeholder }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [response, setResponse] = React.useState<SearchResponse>(EMPTY_RESPONSE);
  const [resolvedQuery, setResolvedQuery] = React.useState('');
  const [status, setStatus] = React.useState<SearchStatus>('idle');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [category, setCategory] = React.useState('');
  const [type, setType] = React.useState<SearchResultType | ''>('');
  const [pageReady, setPageReady] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const requestRef = React.useRef(0);
  const resultsId = React.useId();
  const debounced = useDebouncedValue(query);
  const isPage = variant === 'page';
  const isEmbedded = variant === 'inline' || variant === 'hero' || isPage;
  const resultLimit = isPage ? 60 : variant === 'header' ? 8 : 6;

  const warmIndex = React.useCallback(() => {
    if (status !== 'idle') return;
    setStatus('loading');
    void preloadSearchIndex()
      .then(() => setStatus((current) => (current === 'loading' ? 'ready' : current)))
      .catch(() => setStatus('error'));
  }, [status]);

  React.useEffect(() => {
    if (!isPage) return;
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setCategory(params.get('topic') ?? '');
    const requestedType = params.get('type');
    setType(SEARCH_TYPE_OPTIONS.includes(requestedType as SearchResultType) ? (requestedType as SearchResultType) : '');
    setPageReady(true);
  }, [isPage]);

  React.useEffect(() => {
    if (!isPage || !pageReady) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('topic', category);
    if (type) params.set('type', type);
    const nextUrl = params.size ? `/search?${params.toString()}` : '/search';
    window.history.replaceState(null, '', nextUrl);
  }, [category, isPage, pageReady, query, type]);

  React.useEffect(() => {
    if (isEmbedded) return;
    const onShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
        warmIndex();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [isEmbedded, warmIndex]);

  React.useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) {
      setResponse(EMPTY_RESPONSE);
      setResolvedQuery('');
      setActiveIndex(0);
      return;
    }

    const request = ++requestRef.current;
    setStatus('loading');
    void searchSite(trimmed, { category, type }, resultLimit)
      .then((nextResponse) => {
        if (request !== requestRef.current) return;
        setResponse(nextResponse);
        setResolvedQuery(trimmed);
        setActiveIndex(0);
        setStatus('ready');
      })
      .catch(() => {
        if (request !== requestRef.current) return;
        setResponse(EMPTY_RESPONSE);
        setResolvedQuery(trimmed);
        setStatus('error');
      });
  }, [category, debounced, resultLimit, type]);

  const navigate = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && response.results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % response.results.length);
    }
    if (event.key === 'ArrowUp' && response.results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + response.results.length) % response.results.length);
    }
    if (event.key === 'Enter' && response.results[activeIndex]) {
      event.preventDefault();
      window.location.href = response.results[activeIndex].url;
    }
    if (event.key === 'Escape' && isEmbedded && query) {
      event.preventDefault();
      setQuery('');
    }
  };

  const searchInput = (className: string) => (
    <input
      ref={inputRef}
      type="text"
      inputMode="search"
      value={query}
      onFocus={warmIndex}
      onChange={(event) => setQuery(event.target.value)}
      onKeyDown={navigate}
      placeholder={placeholder ?? 'Search the guide'}
      autoComplete="off"
      spellCheck="false"
      aria-label="Search all pages"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={Boolean(query.trim())}
      aria-controls={resultsId}
      aria-activedescendant={response.results[activeIndex] ? `${resultsId}-result-${activeIndex}` : undefined}
      className={className}
    />
  );

  if (isEmbedded) {
    return (
      <div className={cn(isPage && 'w-full')}>
        <div className={cn(
          'flex items-center gap-3 border border-border bg-card text-left shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
          isPage ? 'h-16 rounded-xl px-4 sm:px-5' : 'h-14 rounded-xl px-4 sm:px-5',
        )}>
          <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
          {searchInput(cn('h-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground', isPage ? 'text-lg' : 'text-base'))}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">Type to search</span>
          )}
        </div>

        {isPage && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Search filters">
            <label className="grid gap-1.5 text-sm font-bold text-foreground">
              Topic
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
                <option value="">All topics</option>
                {SEARCH_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-foreground">
              Result type
              <select value={type} onChange={(event) => setType(event.target.value as SearchResultType | '')} className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
                <option value="">All types</option>
                {SEARCH_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        )}

        <SearchResults
          activeIndex={activeIndex}
          className={cn(isPage ? 'mt-5' : 'mt-2 max-h-[min(30rem,62dvh)] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl')}
          onActiveIndexChange={setActiveIndex}
          onQueryChange={(nextQuery) => {
            setQuery(nextQuery);
            inputRef.current?.focus();
          }}
          query={query}
          response={response}
          resolvedQuery={resolvedQuery}
          resultsId={resultsId}
          status={status}
          variant={isPage ? 'page' : 'embedded'}
        />
      </div>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) warmIndex();
    }}>
      <DialogPrimitive.Trigger asChild>
        <a
          href="/search"
          onPointerEnter={warmIndex}
          onFocus={warmIndex}
          onClick={(event) => {
            event.preventDefault();
            setOpen(true);
          }}
          className="group inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-accent xl:w-auto xl:gap-2 xl:px-4"
          aria-label={placeholder ?? 'Search the guide'}
        >
          <Search className="size-[1.05rem] shrink-0 text-primary" aria-hidden="true" />
          <span className="hidden text-sm font-bold xl:inline">{placeholder ?? 'Search the guide'}</span>
        </a>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-popover pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-[8dvh] sm:h-auto sm:max-h-[84dvh] sm:w-[calc(100%-1.5rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:rounded-xl sm:border sm:border-border"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search quitting7oh.org</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search guides, calculators, compounds, meetings, and resources.</DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-border px-4 sm:px-5">
            <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
            {searchInput('h-16 min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground sm:h-[4.5rem] sm:text-xl')}
            {query && (
              <button type="button" onClick={() => setQuery('')} className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-border hover:text-foreground" aria-label="Clear search">
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
            <DialogPrimitive.Close asChild>
              <button type="button" className="ml-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close search">
                <X className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </DialogPrimitive.Close>
          </div>

          <SearchResults
            activeIndex={activeIndex}
            className="min-h-32 overflow-y-auto"
            emptyState={<EmptyDialogState onQueryChange={(nextQuery) => setQuery(nextQuery)} />}
            onActiveIndexChange={setActiveIndex}
            onQueryChange={(nextQuery) => setQuery(nextQuery)}
            query={query}
            response={response}
            resolvedQuery={resolvedQuery}
            resultsId={resultsId}
            status={status}
            variant="dialog"
          />

          {query.trim() && status === 'ready' && response.results.length > 0 && (
            <a href={`/search?q=${encodeURIComponent(query.trim())}`} className="flex min-h-12 items-center justify-between border-t border-border px-5 text-sm font-bold text-primary hover:bg-accent">
              View all {response.total.toLocaleString()} results
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          )}
          <div className="hidden items-center justify-between border-t border-border bg-muted/50 px-5 py-2.5 text-xs text-muted-foreground sm:flex">
            <span>↑ ↓ to move · Enter to open</span>
            <span>Esc to close</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
