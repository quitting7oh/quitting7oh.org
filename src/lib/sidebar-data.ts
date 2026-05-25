/** Helper to assemble the prop shape AppSidebar expects from the content
 *  collection. Called from Astro pages/layouts at build time. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES } from '~/lib/categories';
import type { SidebarCategory } from '~/components/AppSidebar';

export async function getSidebarCategories(): Promise<SidebarCategory[]> {
  const docs = await getCollection('docs', (d: CollectionEntry<'docs'>) => !d.data.draft);
  return CATEGORIES.map((cat) => ({
    slug: cat.slug,
    title: cat.title,
    items: docs
      .filter((d: CollectionEntry<'docs'>) => d.data.category === cat.slug)
      .sort((a: CollectionEntry<'docs'>, b: CollectionEntry<'docs'>) => {
        const sa = a.data.sort ?? 999;
        const sb = b.data.sort ?? 999;
        if (sa !== sb) return sa - sb;
        return a.data.title.localeCompare(b.data.title);
      })
      .map((d: CollectionEntry<'docs'>) => {
        const slug = d.id.replace(/\.(md|mdx)$/, '').split('/').pop()!;
        return {
          href: `/${cat.slug}/${slug}`,
          title: d.data.title,
        };
      }),
  }));
}
