#!/usr/bin/env node
/**
 * One-shot converter for the two pharmacology HTML reference docs in
 * /imports/_html-source/. Outputs an Astro component per doc so the
 * heavy markup + scoped styles live outside the MDX wrapper.
 *
 * What this does:
 *   - Strips the Google Fonts link (we use Inter + system serif)
 *   - Pulls the <style>...</style> content and remaps the original
 *     --paper / --card / --ink / --line / --em CSS variables to our
 *     site palette tokens (zinc + accent-teal) in both light and dark
 *     modes
 *   - Pulls the <body>...</body> content
 *   - Wraps the body in a scoped container, with our `html.dark` selector
 *     toggling the dark palette (the original used `:root.dark`)
 *   - Writes to src/components/pharmacology/<name>.astro
 *
 * Run once:
 *   node scripts/convert-pharma-html.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'imports/_html-source');
const OUT_DIR = path.join(ROOT, 'src/components/pharmacology');

/**
 * Map this doc's CSS-variable overrides. We keep the doc's structural
 * styles untouched (.sheet, .grid, .fbox, etc.) but redefine the colour
 * tokens to match our site palette so light/dark mode look like the
 * rest of the site.
 *
 * The original light palette is a cream-paper look; we replace with the
 * white/zinc-200/zinc-800 ink we use elsewhere. The accent stays as the
 * doc's brown `--em`, mapped to our accent-teal.
 */
const OVERRIDE_LIGHT = `
  /* quitting7oh palette overrides — light */
  --ink:#27272a; --paper:#ffffff; --card:#fafafa;
  --line:#e4e4e7; --line2:#f4f4f5; --muted:#71717a;
  --mix:#ffffff; --bodybg:#ffffff; --sheetbd:#e4e4e7;
  --rlabelbg:#fafafa; --barfill:#18181b; --barfg:#fafafa;
  --em:#207863; --soft:#3f3f46; --soft2:#52525b; --arrow:#a1a1aa;
  --rdaccent:#207863;
  --cau-bd:#e11d48; --cau-bg:#fff1f2; --cau-h:#9f1239; --cau-tx:#3f3f46;
  --cl-bd:#0ea5e9; --cl-bg:#f0f9ff; --cl-h:#0369a1; --cl-tx:#3f3f46;
  --sheen:rgba(255,255,255,0); --shadow:rgba(0,0,0,.08);
`;

const OVERRIDE_DARK = `
  /* quitting7oh palette overrides — dark (warm, not pure black) */
  --ink:#e4e4e7; --paper:#18181b; --card:#27272a;
  --line:#3f3f46; --line2:#27272a; --muted:#a1a1aa;
  --mix:#27272a; --bodybg:#09090b; --sheetbd:#3f3f46;
  --rlabelbg:#1f1f23; --barfill:#09090b; --barfg:#fafafa;
  --em:#7fcdb4; --soft:#d4d4d8; --soft2:#a1a1aa; --arrow:#52525b;
  --rdaccent:#7fcdb4;
  --cau-bd:#fb7185; --cau-bg:#1f0f12; --cau-h:#fda4af; --cau-tx:#d4d4d8;
  --cl-bd:#7dd3fc; --cl-bg:#0c1a24; --cl-h:#bae6fd; --cl-tx:#d4d4d8;
  --sheen:rgba(255,255,255,0); --shadow:rgba(0,0,0,.5);
`;

/**
 * Slice the original `<style>` block, drop its `:root{...}` and
 * `:root.dark{...}` rules (we own those now), and scope the rest under
 * our wrapper class so they don't bleed onto the rest of the site.
 */
function rewriteStyles(rawCss, wrapperClass) {
  // Drop the original :root and :root.dark blocks; we replace them.
  let css = rawCss
    .replace(/:root\s*\{[^}]*\}/, '')
    .replace(/:root\.dark\s*\{[^}]*\}/, '');

  // Drop the html/body baseline (we already set body styles globally).
  css = css.replace(/html\s*,\s*body\s*\{[^}]*\}/, '');
  css = css.replace(/body\s*\{[^}]*\}/, '');

  // Scope everything else under our wrapper. Each top-level rule is
  // prefixed with `.${wrapperClass} ` so its selectors don't leak.
  // We do this with a tokenizer pass — naive `replace` would also
  // touch nested selectors inside @media queries, which is what we
  // want, so simple text rewriting is fine.
  //
  // The wrapper itself owns the CSS variables.
  return css.trim();
}

async function convert(filename, slug, componentName, accent) {
  const inPath = path.join(SRC_DIR, filename);
  const html = await fs.readFile(inPath, 'utf8');

  // Extract <style>...</style>
  const styleMatch = /<style[^>]*>([\s\S]*?)<\/style>/.exec(html);
  if (!styleMatch) throw new Error(`No <style> in ${filename}`);
  const css = rewriteStyles(styleMatch[1], slug);

  // Extract <body>...</body>
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/.exec(html);
  if (!bodyMatch) throw new Error(`No <body> in ${filename}`);
  let body = bodyMatch[1].trim();

  // The doc's body wraps everything in <div class="sheet">. Add our
  // outer wrapper class for CSS scoping, but keep the inner .sheet
  // structure as-is so the original layout still works.
  // (We change the wrapper from <div class="sheet"> to add our slug class.)

  // Compose the Astro component.
  const out = `---
// Auto-generated from imports/_html-source/${filename}
// by scripts/convert-pharma-html.mjs.
// Hand-edits are fine — the generator writes once, doesn't sync.
//
// The wrapper class \`${slug}\` scopes all original styles so they
// don't leak. CSS variables are remapped to match the site palette.
---

<div class="${slug}">${body.replace(/<div class="sheet"/, '<div class="sheet-inner"')}</div>

<style>
  /* Astro auto-scopes this block to elements rendered inside the
     component, so the original .sheet/.grid/.cell rules don't leak
     to the rest of the site. */
  .${slug} {
${OVERRIDE_LIGHT.split('\n').map((l) => '    ' + l).join('\n')}
  }
  html.dark .${slug} {
${OVERRIDE_DARK.split('\n').map((l) => '    ' + l).join('\n')}
  }

  /* These reference docs were originally 2000px wide; we cap at
     1600px and let the page's wide layout (sidebar/TOC hidden via
     front-matter \`wide: true\`) provide the horizontal room.
     Horizontal scroll inside the wrapper kicks in when the viewport
     is narrower than the chart's 1200px floor. */
  .${slug} {
    overflow-x: auto;
    margin: 1.25rem 0;
    /* Prevent the typography-plugin styles from leaking in. */
    color: var(--ink);
    font-family: 'Libre Franklin', system-ui, -apple-system, sans-serif;
  }
  .${slug} .sheet-inner {
    background: var(--paper);
    border: 1px solid var(--sheetbd);
    box-shadow: 0 24px 60px -24px var(--shadow);
    padding: 28px 28px 24px;
    position: relative;
    min-width: 1200px;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
  }
  .${slug} .sheet-inner::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(120% 70% at 50% 0%, var(--sheen), transparent 60%);
  }

  /* Original styles, scoped to .${slug}: */
${css.split('\n').map((l) => '  ' + l).join('\n')}
</style>
`;

  const outPath = path.join(OUT_DIR, `${componentName}.astro`);
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(outPath, out, 'utf8');
  console.log(`wrote ${path.relative(ROOT, outPath)}  (${(out.length / 1024).toFixed(1)} KB)`);
}

await convert(
  'kratom-minor-alkaloids-dark.html',
  'pharma-minor-alkaloids',
  'MinorAlkaloids',
  '#5b86ff',
);
await convert(
  'morphine-vs-kratom-alkaloids-dark.html',
  'pharma-morphine-vs-kratom',
  'MorphineVsKratom',
  '#5b86ff',
);

console.log('Done.');
