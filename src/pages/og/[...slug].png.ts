import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES, getCategory } from '~/lib/categories';
import { renderOgCard } from '~/lib/og-image';

// Pre-render one OG card for every content page, every category index, and
// the homepage. Astro picks these up via getStaticPaths at build time and
// writes them out as static PNGs under /og/<path>.png.
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs', (d) => !d.data.draft);

  const docPaths = docs.map((doc) => {
    const slugTail = doc.id.split('/').pop()!;
    const slug = `${doc.data.category}/${slugTail}`;
    const cat = getCategory(doc.data.category);
    return {
      params: { slug },
      props: {
        title: doc.data.title,
        kicker: cat?.title ?? doc.data.category,
        description: doc.data.description,
      },
    };
  });

  const categoryPaths = CATEGORIES.map((cat) => ({
    params: { slug: cat.slug },
    props: {
      title: cat.title,
      kicker: 'Category',
      description: cat.blurb,
    },
  }));

  // The site root — used by the homepage og:image.
  const home = {
    params: { slug: 'index' },
    props: {
      title: 'A calm reference for getting off 7-OH and kratom synthetics.',
      kicker: 'quitting7oh.org',
      description:
        'Community-compiled information from people who have been through it, for people going through it now and the people who love them.',
    },
  };

  return [home, ...categoryPaths, ...docPaths];
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard({
    title: props.title as string,
    kicker: props.kicker as string | undefined,
    description: props.description as string | undefined,
  });
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
