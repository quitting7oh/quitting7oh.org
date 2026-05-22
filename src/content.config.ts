import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_SLUGS } from './lib/categories';

const docsSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  category: z.enum(CATEGORY_SLUGS),
  last_updated: z.coerce.date().optional(),
  source_channel: z.string().optional(),
  sort: z.number().optional(),
  draft: z.boolean().optional().default(false),
  // When true, the ingest pipeline will NOT overwrite this file even if its
  // source channel appears in /imports/. Use for pages that have been
  // editorially restructured beyond what a raw Discord export produces.
  manual: z.boolean().optional().default(false),
  // When true, the page renders without the left category sidebar or
  // right TOC — the main column gets the full container width. Use for
  // reference docs (charts, tables, diagrams) that need horizontal space.
  wide: z.boolean().optional().default(false),
});

const docs = defineCollection({
  loader: glob({
    // README.md is content-authoring docs, not a page; exclude it.
    pattern: ['**/*.{md,mdx}', '!**/README.md'],
    base: './src/content',
  }),
  schema: docsSchema,
});

export const collections = { docs };
