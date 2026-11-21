// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from './src/lib/rehype/externalLinks.mjs';
import rehypeHeadingAnchors from './src/lib/rehype/headingAnchors.mjs';
import rehypeNormalizeHeadings from './src/lib/rehype/normalizeHeadings.mjs';
import rehypeTableWrappers from './src/lib/rehype/tableWrappers.mjs';
import { contentLastModified } from './src/lib/sitemap-lastmod.mjs';

const lastModByPath = contentLastModified('./src/content');

// https://astro.build/config
export default defineConfig({
  site: 'https://quitting7oh.org',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // Emit `foo.html` rather than `foo/index.html`. With trailingSlash
    // 'never', canonicals and the sitemap use /foo; Cloudflare Pages serves
    // foo.html at /foo and 308s /foo/ and /foo.html to it. The directory
    // format made every canonical URL a redirect to /foo/.
    format: 'file',
    inlineStylesheets: 'always',
  },
  integrations: [mdx(), react(), sitemap({
    filter: (page) => !/^\/(?:mod-tools|labs)(?:\/|$)/.test(new URL(page).pathname),
    serialize(item) {
      const path = new URL(item.url).pathname.replace(/\/+$/, '') || '/';
      const lastmod = lastModByPath.get(path);
      if (lastmod) item.lastmod = lastmod;
      return item;
    },
  })],
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
    processor: unified({
      smartypants: true,
      gfm: true,
      rehypePlugins: [
        rehypeNormalizeHeadings,
        rehypeSlug,
        rehypeHeadingAnchors,
        rehypeExternalLinks,
        rehypeTableWrappers,
      ],
    }),
  },
});
