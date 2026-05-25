/** Helper to assemble the prop shape AppSidebar expects from the content
 *  collection. Called from Astro pages/layouts at build time.
 *
 *  Long categories (mat-suboxone, for-loved-ones, other-tools, post-acute)
 *  get rendered with sub-group sub-headings declared in CATEGORY_GROUPS.
 *  Pages in those categories that aren't listed in any group are dropped
 *  from the sidebar — if you add a page, add it to the group list too. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, CATEGORY_GROUPS } from '~/lib/categories';
import type {
  SidebarCategory,
  SidebarGroup,
  SidebarItem,
} from '~/components/AppSidebar';

function slugOf(d: CollectionEntry<'docs'>): string {
  return d.id.replace(/\.(md|mdx)$/, '').split('/').pop()!;
}

function compareSort(a: CollectionEntry<'docs'>, b: CollectionEntry<'docs'>): number {
  const sa = a.data.sort ?? 999;
  const sb = b.data.sort ?? 999;
  if (sa !== sb) return sa - sb;
  return a.data.title.localeCompare(b.data.title);
}

function toItem(catSlug: string, d: CollectionEntry<'docs'>): SidebarItem {
  return {
    href: `/${catSlug}/${slugOf(d)}`,
    title: d.data.title,
  };
}

export async function getSidebarCategories(): Promise<SidebarCategory[]> {
  const docs = await getCollection('docs', (d: CollectionEntry<'docs'>) => !d.data.draft);

  return CATEGORIES.map((cat): SidebarCategory => {
    const catDocs = docs
      .filter((d) => d.data.category === cat.slug)
      .sort(compareSort);

    const groupDefs = CATEGORY_GROUPS[cat.slug];
    if (!groupDefs) {
      // Flat category: just list items in sort order.
      return {
        slug: cat.slug,
        title: cat.title,
        items: catDocs.map((d) => toItem(cat.slug, d)),
      };
    }

    // Grouped category: bucket pages by group, drop anything not listed.
    const bySlug = new Map(catDocs.map((d) => [slugOf(d), d]));
    const groups: SidebarGroup[] = groupDefs.map((g) => ({
      name: g.name,
      items: g.slugs
        .map((s) => bySlug.get(s))
        .filter((d): d is CollectionEntry<'docs'> => d !== undefined)
        .map((d) => toItem(cat.slug, d)),
    }));

    return {
      slug: cat.slug,
      title: cat.title,
      items: [],
      groups,
    };
  });
}
