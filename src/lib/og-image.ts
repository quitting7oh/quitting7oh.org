import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Resolve fonts relative to the project root. Works in both `astro build`
// and `astro dev`; the OG cards are only rendered at build time so this
// file is only ever loaded by a Node process running from project root.
const fontDir = join(process.cwd(), 'src/assets/fonts');
const interRegular = readFileSync(join(fontDir, 'Inter-Regular.ttf'));
const interBold = readFileSync(join(fontDir, 'Inter-Bold.ttf'));

export interface OgCardProps {
  /** Big text on the card (page title, or site tagline on the home card). */
  title: string;
  /** Small uppercase line above the title (category name, or "quitting7oh.org" on the home card). */
  kicker?: string;
  /** Smaller text below the title (page description). */
  description?: string;
}

// Site teal accent strip on the left edge. Matches the primary token of the
// default accent-teal variant in src/styles/global.css.
const ACCENT = '#0d9488';
const BG = '#0a0a0a';
const FG = '#fafafa';
const MUTED = '#a1a1aa';

/**
 * Render a 1200×630 OG card to PNG. Used by /og/[...slug].png and /og.png
 * to pre-render social-share images at build time.
 */
export async function renderOgCard(props: OgCardProps): Promise<Uint8Array> {
  const node = buildNode(props);

  const svg = await satori(node, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
  return new Uint8Array(png);
}

// satori takes JSX or a JSON tree describing the layout. We build the tree
// directly so the file doesn't need a JSX runtime.
function buildNode({ title, kicker, description }: OgCardProps) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '1200px',
        height: '630px',
        backgroundColor: BG,
        color: FG,
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Left accent strip.
        {
          type: 'div',
          props: {
            style: {
              width: '16px',
              height: '630px',
              backgroundColor: ACCENT,
            },
          },
        },
        // Main column.
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '64px 72px',
              flex: 1,
              minWidth: 0,
            },
            children: [
              // Top: kicker line.
              {
                type: 'div',
                props: {
                  style: {
                    color: ACCENT,
                    fontSize: '24px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  },
                  children: kicker ?? 'quitting7oh.org',
                },
              },
              // Middle: title + description.
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: titleSize(title),
                          fontWeight: 700,
                          lineHeight: 1.1,
                          letterSpacing: '-0.02em',
                          // Constrain to roughly the readable region.
                          maxWidth: '1000px',
                        },
                        children: title,
                      },
                    },
                    description
                      ? {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '28px',
                              lineHeight: 1.4,
                              color: MUTED,
                              maxWidth: '1000px',
                            },
                            children: clamp(description, 180),
                          },
                        }
                      : null,
                  ].filter(Boolean),
                },
              },
              // Bottom: branding row.
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: MUTED,
                    fontSize: '24px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '14px',
                          height: '14px',
                          borderRadius: '7px',
                          backgroundColor: ACCENT,
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { color: FG, fontWeight: 700 },
                        children: 'quitting7oh',
                      },
                    },
                    {
                      type: 'div',
                      props: { children: '.org' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// Scale font size down for very long titles so they don't overflow.
function titleSize(title: string): string {
  const len = title.length;
  if (len <= 28) return '88px';
  if (len <= 50) return '72px';
  if (len <= 80) return '56px';
  return '48px';
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}
