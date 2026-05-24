/** Walks the same ordering the sidebar uses (categories in their declared
 *  order, then by `sort` then alphabetical within a category) to compute
 *  the prev/next doc page for a given URL path. Used by DocLayout to
 *  render the bottom-of-page pagination strip. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES } from '~/lib/categories';

export interface PaginationNeighbor {
  href: string;
  title: string;
  categoryTitle: string;
}

interface FlatPage extends PaginationNeighbor {}

let flatCache: FlatPage[] | null = null;

async function flattenDocs(): Promise<FlatPage[]> {
  if (flatCache) return flatCache;
  const docs = await getCollection('docs', (d: CollectionEntry<'docs'>) => !d.data.draft);
  const flat: FlatPage[] = [];
  for (const cat of CATEGORIES) {
    const inCat = docs
      .filter((d) => d.data.category === cat.slug)
      .sort((a, b) => {
        const sa = a.data.sort ?? 999;
        const sb = b.data.sort ?? 999;
        if (sa !== sb) return sa - sb;
        return a.data.title.localeCompare(b.data.title);
      });
    for (const d of inCat) {
      const slug = d.id.replace(/\.(md|mdx)$/, '').split('/').pop()!;
      flat.push({
        href: `/${cat.slug}/${slug}`,
        title: d.data.title,
        categoryTitle: cat.title,
      });
    }
  }
  flatCache = flat;
  return flat;
}

export async function getPrevNext(currentPath: string): Promise<{
  prev?: PaginationNeighbor;
  next?: PaginationNeighbor;
}> {
  const flat = await flattenDocs();
  // Normalize trailing slash to match generated hrefs.
  const norm = currentPath.replace(/\/$/, '');
  const idx = flat.findIndex((p) => p.href === norm);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? flat[idx - 1] : undefined,
    next: idx < flat.length - 1 ? flat[idx + 1] : undefined,
  };
}
