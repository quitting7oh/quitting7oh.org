// Build-time map of page path -> last_updated, for the sitemap's <lastmod>.
// astro.config.mjs can't import astro:content, so this reads front-matter
// straight off disk and mirrors the route in src/pages/[category]/[slug].astro:
// /<front-matter category>/<file basename>, skipping drafts and README.md.

import { globSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Read one top-level scalar from a YAML front-matter block. */
function field(yaml, key) {
  const match = yaml.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  if (!match) return undefined;
  return match[1].replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2') || undefined;
}

/** @returns {Map<string, string>} e.g. "/compounds/7-oh" -> "2026-08-28" */
export function contentLastModified(contentDir) {
  const map = new Map();
  for (const rel of globSync('**/*.{md,mdx}', { cwd: contentDir })) {
    if (basename(rel) === 'README.md') continue;
    const yaml = readFileSync(join(contentDir, rel), 'utf8').match(FRONT_MATTER)?.[1];
    if (!yaml) continue;
    if (field(yaml, 'draft') === 'true') continue;
    const category = field(yaml, 'category');
    const updated = field(yaml, 'last_updated');
    if (!category || !updated) continue;
    const date = new Date(updated);
    if (Number.isNaN(date.getTime())) continue;
    const slug = basename(rel, extname(rel));
    map.set(`/${category}/${slug}`, date.toISOString().slice(0, 10));
  }
  return map;
}
