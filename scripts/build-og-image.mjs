#!/usr/bin/env node
// One-off OG / Twitter card image generator.
//
// Renders a 1200×630 PNG with the Lift Cup mark + quitting7oh.org
// wordmark on the stone-light brand background. Writes the SVG
// source and the PNG to public/. Re-run when the brand design
// changes:
//
//   node scripts/build-og-image.mjs
//
// We use @resvg/resvg-js for rasterization because libvips/librsvg
// (Sharp's SVG backend) doesn't resolve @font-face, and Fraunces
// isn't installed system-wide. Resvg loads the actual font files
// out of node_modules and renders genuine Fraunces 600 + Inter 500
// glyphs — same fonts the live site ships.

import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Stone-light palette (matches the default theme + favicon defaults).
const BG = '#f6f1ea';
const FG = '#261f17';
const PRIMARY = '#604020';
const MUTED = '#756657';

// Lockup layout. Mark + wordmark sit on a baseline near the canvas
// vertical centre, with the tagline below.
const MARK_X = 180;
const MARK_Y = 180;
const MARK_SCALE = 3.5;        // 64 → 224
const WORDMARK_X = 400;        // tucked close to the mark
const WORDMARK_BASELINE = 340;
const WORDMARK_SIZE = 108;
const TLD_SIZE = 50;
const TAGLINE_BASELINE = 430;
const TAGLINE_SIZE = 28;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${BG}"/>
  <g transform="translate(${MARK_X}, ${MARK_Y}) scale(${MARK_SCALE})">
    <path d="M20 33 V39 a12 12 0 0 0 24 0 V33" stroke="${FG}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M32 37 V14" stroke="${PRIMARY}" stroke-width="8" stroke-linecap="round"/>
    <path d="M23 24 L32 11 L41 24" stroke="${PRIMARY}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="${WORDMARK_X}" y="${WORDMARK_BASELINE}"
        font-family="Fraunces" font-weight="700" font-size="${WORDMARK_SIZE}"
        letter-spacing="-2" fill="${FG}">quitting<tspan fill="${PRIMARY}">7</tspan>oh<tspan dx="6" font-family="Inter" font-size="${TLD_SIZE}" font-weight="600" fill="${MUTED}">.org</tspan></text>
  <text x="${WORDMARK_X}" y="${TAGLINE_BASELINE}"
        font-family="Inter" font-weight="500" font-size="${TAGLINE_SIZE}"
        fill="${MUTED}">Community recovery information.</text>
</svg>`;

// Vendored TTFs (variable fonts, full name tables intact). The
// fontsource subset woff2 files in node_modules ship with stripped
// name tables, so Resvg can't match them by family name. These two
// files together cover both the wordmark and the tagline.
const [frauncesBuf, interBuf] = await Promise.all([
  readFile(join(root, 'scripts/og-fonts/Fraunces.ttf')),
  readFile(join(root, 'scripts/og-fonts/Inter.ttf')),
]);

const resvg = new Resvg(svg, {
  font: {
    fontBuffers: [frauncesBuf, interBuf],
    loadSystemFonts: false,
    defaultFontFamily: 'Fraunces',
  },
  fitTo: { mode: 'width', value: 1200 },
});

const png = resvg.render().asPng();

await writeFile(join(root, 'public/og-image.svg'), svg);
await writeFile(join(root, 'public/og-image.png'), png);

console.log(`Wrote public/og-image.svg (${svg.length} bytes) and public/og-image.png (${png.length} bytes)`);
