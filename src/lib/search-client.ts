import type MiniSearch from 'minisearch';
import type { SearchResult } from 'minisearch';
import {
  getMiniSearchOptions,
  SEARCH_OPTIONS,
  type SearchDocument,
  type SearchSection,
  type SearchResultType,
  type StoredSearchResult,
} from './search-config';
import { getPinnedSearchResults, queryForSearchIndex, type PinnedSearchResult } from './search-policy';

interface SearchIndexPayload {
  version: number;
  pageCount: number;
  recordCount: number;
  index: unknown;
}

interface LoadedSearchIndex {
  miniSearch: MiniSearch<SearchDocument>;
  pageCount: number;
  recordCount: number;
}

export interface SearchFilters {
  category?: string;
  type?: SearchResultType | '';
}

export interface SearchResponse {
  results: Array<StoredSearchResult | PinnedSearchResult>;
  suggestions: string[];
  total: number;
  pageCount: number;
  recordCount: number;
}

let enginePromise: Promise<LoadedSearchIndex> | null = null;

export function preloadSearchIndex(): Promise<LoadedSearchIndex> {
  if (!enginePromise) {
    enginePromise = Promise.all([
      import('minisearch'),
      fetch('/search-index.json', { headers: { Accept: 'application/json' } }).then(async (response) => {
        if (!response.ok) throw new Error(`Search index returned HTTP ${response.status}`);
        return (await response.json()) as SearchIndexPayload;
      }),
    ])
      .then(async ([module, payload]) => {
        if (payload.version !== 1) throw new Error('Search index version is not supported');
        const miniSearch = await module.default.loadJSONAsync<SearchDocument>(
          JSON.stringify(payload.index),
          getMiniSearchOptions(),
        );
        return {
          miniSearch,
          pageCount: payload.pageCount,
          recordCount: payload.recordCount,
        };
      })
      .catch((error) => {
        enginePromise = null;
        throw error;
      });
  }

  return enginePromise;
}

function bestSection(query: string, sections: SearchSection[]): SearchSection | null {
  const normalizedQuery = query.toLocaleLowerCase('en-US').replace(/[^a-z0-9\s-]/g, ' ');
  const terms = [...new Set(normalizedQuery.split(/\s+/).filter((term) => term.length >= 2))];
  let best: { section: SearchSection; score: number } | null = null;

  for (const section of sections) {
    const heading = section.title.toLocaleLowerCase('en-US');
    const sectionText = `${heading} ${section.excerpt.toLocaleLowerCase('en-US')}`;
    let score = heading.includes(normalizedQuery) ? 12 : 0;
    for (const term of terms) {
      if (heading.includes(term)) score += 4;
      else if (sectionText.includes(term)) score += 1;
    }
    if (!best || score > best.score) best = { section, score };
  }

  const minimumScore = terms.length <= 1 ? 4 : Math.min(7, terms.length * 2);
  return best && best.score >= minimumScore ? best.section : null;
}

function storedResult(result: SearchResult, query: string): StoredSearchResult {
  const sections = Array.isArray(result.sections) ? (result.sections as SearchSection[]) : [];
  const section = bestSection(query, sections);
  return {
    id: String(result.id),
    pageUrl: String(result.pageUrl),
    url: section?.url ?? String(result.url),
    title: String(result.title),
    section: section?.title ?? String(result.section ?? ''),
    excerpt: section?.excerpt ?? String(result.excerpt ?? ''),
    category: String(result.category),
    categoryLabel: String(result.categoryLabel),
    type: result.type as SearchResultType,
    priority: Number(result.priority) || 1,
  };
}

export async function searchSite(
  rawQuery: string,
  filters: SearchFilters = {},
  limit = 10,
): Promise<SearchResponse> {
  const query = rawQuery.trim().replace(/\s+/g, ' ');
  if (!query) {
    const loaded = await preloadSearchIndex();
    return {
      results: [],
      suggestions: [],
      total: 0,
      pageCount: loaded.pageCount,
      recordCount: loaded.recordCount,
    };
  }

  const loaded = await preloadSearchIndex();
  const indexQuery = queryForSearchIndex(query) || query;
  const rawResults = loaded.miniSearch.search(indexQuery, SEARCH_OPTIONS);
  const highScore = rawResults[0]?.score ?? 0;
  const relevanceFloor = Math.max(1.5, highScore * 0.08);
  const relevantResults = rawResults.filter((result) => result.score >= relevanceFloor).slice(0, 80);
  const pinned = getPinnedSearchResults(query).filter((result) => {
    if (filters.category && result.category !== filters.category) return false;
    if (filters.type && result.type !== filters.type) return false;
    return true;
  });

  const pinnedPages = new Set(pinned.map((result) => result.pageUrl));
  const bestByPage = new Map<string, { score: number; result: StoredSearchResult }>();

  for (const rawResult of relevantResults) {
    const result = storedResult(rawResult, query);
    if (pinnedPages.has(result.pageUrl)) continue;
    if (filters.category && result.category !== filters.category) continue;
    if (filters.type && result.type !== filters.type) continue;

    const previous = bestByPage.get(result.pageUrl);
    if (!previous || rawResult.score > previous.score) {
      bestByPage.set(result.pageUrl, { score: rawResult.score, result });
    }
  }

  const ranked = [...bestByPage.values()]
    .sort((left, right) => right.score - left.score)
    .map(({ result }) => result);
  const hasUrgentPin = pinned.some((result) => result.emphasis === 'urgent');
  const visibleRanked = hasUrgentPin ? ranked.slice(0, 4) : ranked;
  const total = pinned.length + visibleRanked.length;

  const suggestions = loaded.miniSearch
    .autoSuggest(indexQuery, {
      fuzzy: (term) => (term.length >= 8 ? 0.2 : term.length >= 5 ? 1 : false),
      prefix: true,
      boost: SEARCH_OPTIONS.boost,
    })
    .map(({ suggestion }) => suggestion.trim())
    .filter((suggestion, index, all) => {
      return (
        suggestion.length > 2 &&
        suggestion.toLocaleLowerCase('en-US') !== query.toLocaleLowerCase('en-US') &&
        all.indexOf(suggestion) === index
      );
    })
    .slice(0, 4);

  return {
    results: [...pinned, ...visibleRanked].slice(0, limit),
    suggestions,
    total,
    pageCount: loaded.pageCount,
    recordCount: loaded.recordCount,
  };
}
