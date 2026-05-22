#!/usr/bin/env node
/**
 * Walk src/content/ and auto-link the first mention of each known compound
 * (7-OH, MGM-15, MIT-A/DHM, pseudoindoxyl, Cat's Claw, etc.) to its compound
 * page on the site.
 *
 * Usage:
 *   node scripts/link-compounds.mjs            # apply changes in place
 *   node scripts/link-compounds.mjs --dry-run  # show what would change
 *
 * Idempotent: re-running on already-linked content is a no-op.
 * Safe to run repeatedly after editing pages.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { linkCompounds } from './lib/compound-linker.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content');

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Split a markdown file into front-matter and body. Only the body is touched.
 */
function splitFrontMatter(text) {
  const m = /^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/.exec(text);
  if (!m) return { fm: '', body: text };
  return { fm: m[1], body: m[2] };
}

async function walkMarkdown(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkMarkdown(p)));
    else if (/\.(md|mdx)$/i.test(entry.name) && entry.name !== 'README.md') {
      out.push(p);
    }
  }
  return out;
}

const files = await walkMarkdown(CONTENT_DIR);
let changed = 0;
let unchanged = 0;

for (const file of files) {
  const rel = path.relative(PROJECT_ROOT, file);
  const text = await fs.readFile(file, 'utf8');
  const { fm, body } = splitFrontMatter(text);
  // selfUrl: the absolute site path this file renders at, so the linker
  // can avoid creating self-links (e.g., "7-OH" on /compounds/7-oh).
  const fileRel = path.relative(CONTENT_DIR, file);
  const selfUrl = '/' + fileRel.replace(/\.(md|mdx)$/i, '');
  const linked = linkCompounds(body, { selfUrl });
  if (linked === body) {
    unchanged++;
    continue;
  }
  const newText = fm + linked;
  if (DRY_RUN) {
    console.log(`[dry-run] would update ${rel}`);
  } else {
    await fs.writeFile(file, newText, 'utf8');
    console.log(`updated ${rel}`);
  }
  changed++;
}

console.log(
  `\n${DRY_RUN ? '[dry-run] ' : ''}${changed} changed, ${unchanged} unchanged (${files.length} scanned).`,
);
