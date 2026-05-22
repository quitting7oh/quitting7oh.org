// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from './src/lib/rehype/externalLinks.mjs';
import rehypeHeadingAnchors from './src/lib/rehype/headingAnchors.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://quitting7oh.org',
  // Static-only build. Documented explicitly so a future change doesn't
  // accidentally flip on SSR / Cloudflare adapter, which would otherwise
  // make the deploy invoke a Pages Function on every request.
  output: 'static',
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
    smartypants: true,
    gfm: true,
    rehypePlugins: [rehypeSlug, rehypeHeadingAnchors, rehypeExternalLinks],
  },
});
