/** Builders for /llms.txt and /llms-full.txt (https://llmstxt.org).
 *
 *  Both files list the docs collection grouped by category, in the order
 *  the sidebar uses. llms-full.txt adds each page's markdown source,
 *  cleaned of MDX imports, interactive components, and layout HTML so a
 *  model reads prose instead of JSX. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, CATEGORY_GROUPS } from '~/lib/categories';
import { SITE } from '~/lib/site';

type Doc = CollectionEntry<'docs'>;

/** Low-priority pages that go under the spec's `## Optional` heading
 *  instead of their category. Tools that need a shorter context can skip
 *  that section. */
const OPTIONAL_IDS = new Set([
  'about/changelog',
  'about/acknowledgments',
]);

/** Pages whose body is too long and too internal to belong in
 *  llms-full.txt. They stay listed with a link. */
const FULL_TEXT_SKIP = new Set(['about/changelog']);

function slugOf(doc: Doc): string {
  return doc.id.split('/').pop()!;
}

export function pageUrl(doc: Doc): string {
  return `${SITE.url}/${doc.data.category}/${slugOf(doc)}`;
}

function compareSort(a: Doc, b: Doc): number {
  const sa = a.data.sort ?? 999;
  const sb = b.data.sort ?? 999;
  if (sa !== sb) return sa - sb;
  return a.data.title.localeCompare(b.data.title);
}

/** Sidebar order: grouped categories follow CATEGORY_GROUPS, flat ones
 *  follow `sort`. Unlike the sidebar, pages missing from a group list are
 *  appended rather than dropped, so the index stays complete. */
function orderCategory(slug: string, docs: Doc[]): Doc[] {
  const sorted = [...docs].sort(compareSort);
  const groups = CATEGORY_GROUPS[slug];
  if (!groups) return sorted;
  const bySlug = new Map(sorted.map((d) => [slugOf(d), d]));
  const ordered: Doc[] = [];
  for (const group of groups) {
    for (const s of group.slugs) {
      const doc = bySlug.get(s);
      if (doc) {
        ordered.push(doc);
        bySlug.delete(s);
      }
    }
  }
  return [...ordered, ...sorted.filter((d) => bySlug.has(slugOf(d)))];
}

export interface LlmsSection {
  title: string;
  blurb?: string;
  docs: Doc[];
}

export async function getLlmsSections(): Promise<LlmsSection[]> {
  // Only published docs. Unlisted / noindex pages (e.g. /mod-tools/*) live
  // outside the docs collection and never reach this list.
  const docs = await getCollection('docs', (d) => !d.data.draft);
  const sections: LlmsSection[] = CATEGORIES.map((cat) => ({
    title: cat.title,
    blurb: cat.blurb,
    docs: orderCategory(
      cat.slug,
      docs.filter((d) => d.data.category === cat.slug && !OPTIONAL_IDS.has(d.id)),
    ),
  })).filter((s) => s.docs.length > 0);

  const optional = docs.filter((d) => OPTIONAL_IDS.has(d.id)).sort(compareSort);
  if (optional.length > 0) sections.push({ title: 'Optional', docs: optional });
  return sections;
}

function header(variant: 'index' | 'full'): string {
  const fileNote =
    variant === 'index'
      ? `The full text of every page below is in [llms-full.txt](${SITE.url}/llms-full.txt).`
      : `This file holds the full markdown text of every page listed in [llms.txt](${SITE.url}/llms.txt). Calculators, meeting tables, and other interactive tools only work on the site itself.`;

  return [
    `# ${SITE.domain}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.domain} is a community-maintained reference for the [quitting7oh Discord](https://discord.gg/FDJuEPcQz5) and [r/quitting7oh](https://www.reddit.com/r/quitting7oh/) community. It documents several ways off 7-OH and the kratom-derived synthetics, including tapering with kratom leaf, stopping with helper medications, and buprenorphine, without ranking them. It is not medical advice.`,
    '',
    `For someone in crisis in the U.S.: the [988 Suicide & Crisis Lifeline](https://988lifeline.org) answers calls and texts at 988, and the [SAMHSA National Helpline](https://www.samhsa.gov/find-help/national-helpline) (1-800-662-4357) gives free, confidential treatment referrals at any hour. The site's [crisis hotlines page](${SITE.url}/resources/crisis-hotlines) and [active-withdrawal page](${SITE.url}/start-here/7-oh-withdrawal-help) carry the full routing.`,
    '',
    fileNote,
  ].join('\n');
}

function indexLine(doc: Doc): string {
  const description = doc.data.description.trim();
  return `- [${doc.data.title}](${pageUrl(doc)})${description ? `: ${description}` : ''}`;
}

export function buildLlmsIndex(sections: LlmsSection[]): string {
  const parts = [header('index')];
  for (const section of sections) {
    const lines = [`## ${section.title}`, ''];
    if (section.blurb) lines.push(section.blurb, '');
    lines.push(...section.docs.map(indexLine));
    parts.push(lines.join('\n'));
  }
  return `${parts.join('\n\n')}\n`;
}

// ---------------------------------------------------------------------------
// Markdown / MDX cleanup for llms-full.txt

function absolutize(href: string): string {
  return href.startsWith('/') && !href.startsWith('//') ? `${SITE.url}${href}` : href;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function attr(source: string, name: string): string | undefined {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{["']([^"']*)["']\\})`));
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

/** Inline HTML that can appear inside prose, outside a layout block. */
function convertInlineHtml(text: string): string {
  return text
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (_m, attrs: string, inner: string) => {
      const href = attr(attrs, 'href');
      const label = stripTags(inner);
      return href ? `[${label}](${absolutize(href)})` : label;
    })
    .replace(/<img\b([^>]*?)\/?>/g, (_m, attrs: string) => {
      const src = attr(attrs, 'src');
      return src ? `![${attr(attrs, 'alt') ?? ''}](${absolutize(src)})` : '';
    })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/g, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/g, '*$2*')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?(sub|sup|span|small|abbr)\b[^>]*>/g, '');
}

/** A layout block (div / details / figure ...) starting at column 0.
 *  Converts the structural pieces worth keeping, drops wrappers, and
 *  dedents the result so it doesn't turn into an indented code block. */
function convertHtmlBlock(block: string): string {
  const converted = block
    .replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g, (_m, inner: string) => {
      const img = inner.match(/<img\b([^>]*?)\/?>/);
      const caption = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? '';
      const parts = [...caption.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/g)].map((m) => stripTags(m[1]));
      const label = parts.length > 0 ? parts : [stripTags(caption)].filter(Boolean);
      const [name, ...rest] = label;
      const src = img ? attr(img[1], 'src') : undefined;
      const alt = img ? attr(img[1], 'alt') ?? name ?? '' : '';
      const text = [name ? `**${name}**` : '', rest.join('. ')].filter(Boolean).join(': ');
      return `\n- ${text}${src ? ` ![${alt}](${absolutize(src)})` : ''}\n`;
    })
    .replace(
      /<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/g,
      (_m, term: string, def: string) => `\n- **${stripTags(term)}:** ${stripTags(def)}\n`,
    )
    .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/g, (_m, inner: string) => `\n**${stripTags(inner)}**\n`)
    .replace(/<\/?(div|details|figure|figcaption|dl|dt|dd|p|aside|section|article)\b[^>]*>/g, '\n');

  return convertInlineHtml(converted)
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const BLOCK_OPEN = /^<(div|details|figure|dl|aside|section)\b/;

function convertHtmlBlocks(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(BLOCK_OPEN);
    if (!open) {
      out.push(lines[i]);
      continue;
    }
    const tag = open[1];
    const openRe = new RegExp(`<${tag}\\b`, 'g');
    const closeRe = new RegExp(`</${tag}>`, 'g');
    let depth = 0;
    const block: string[] = [];
    for (; i < lines.length; i++) {
      block.push(lines[i]);
      depth += (lines[i].match(openRe)?.length ?? 0) - (lines[i].match(closeRe)?.length ?? 0);
      if (depth <= 0) break;
    }
    out.push('', convertHtmlBlock(block.join('\n')), '');
  }
  return out.join('\n');
}

export function cleanBody(raw: string): string {
  // Park code so its contents (often literal tags) survive untouched.
  const parked: string[] = [];
  const park = (match: string) => `\u0000${parked.push(match) - 1}\u0000`;
  let text = raw.replace(/^([^\S\n]*)(```|~~~)[\s\S]*?^\1\2[^\S\n]*$/gm, park).replace(/`[^`\n]+`/g, park);

  text = text
    // MDX module syntax.
    .replace(/^(?:import|export)\s[^\n]*$/gm, '')
    .replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, '')
    // Link rows carry real content: turn them into list items.
    .replace(/<QuickstartLinkRow\b([\s\S]*?)\/>/g, (_m, attrs: string) => {
      const title = attr(attrs, 'title') ?? '';
      const href = attr(attrs, 'href');
      const description = attr(attrs, 'description');
      const link = href ? `[${title}](${absolutize(href)})` : title;
      return `- ${link}${description ? `: ${description}` : ''}`;
    })
    // Other self-closing components are interactive widgets: drop them.
    .replace(/^[^\S\n]*<[A-Z][\w.]*\b[^>]*?\/>[^\S\n]*$/gm, '')
    .replace(/<[A-Z][\w.]*\b[^>]*?\/>/g, '')
    // Wrapper components keep their children.
    .replace(/^[^\S\n]*<\/?[A-Z][\w.]*\b[^>]*>[^\S\n]*$/gm, '')
    .replace(/<\/?[A-Z][\w.]*\b[^>]*>/g, '');

  text = convertInlineHtml(convertHtmlBlocks(text))
    // Root-relative markdown links and reference definitions.
    .replace(/(\]\()(\/(?!\/)[^)\s]*)/g, (_m, lead: string, href: string) => `${lead}${absolutize(href)}`)
    .replace(/^(\s*\[[^\]]+\]:\s*)(\/(?!\/)\S*)/gm, (_m, lead: string, href: string) => `${lead}${absolutize(href)}`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text.replace(/\u0000(\d+)\u0000/g, (_m, index: string) => parked[Number(index)]);
}

function isoDate(date: Date | undefined): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function fullPage(doc: Doc): string {
  const lines = [`# ${doc.data.title}`, '', `Source: ${pageUrl(doc)}`];
  const updated = isoDate(doc.data.last_updated);
  if (updated) lines.push(`Last updated: ${updated}`);
  if (doc.data.description.trim()) lines.push('', `> ${doc.data.description.trim()}`);

  const body = FULL_TEXT_SKIP.has(doc.id) ? '' : cleanBody(doc.body ?? '');
  if (FULL_TEXT_SKIP.has(doc.id)) {
    lines.push('', 'Full text omitted here; read it at the source URL.');
  } else if (body) {
    lines.push('', body);
  } else {
    lines.push('', 'This page is built from a dedicated layout rather than markdown; read it at the source URL.');
  }
  return lines.join('\n');
}

export function buildLlmsFull(sections: LlmsSection[]): string {
  const pages = sections.flatMap((s) => s.docs).map(fullPage);
  return `${[header('full'), ...pages].join('\n\n---\n\n')}\n`;
}

export function textResponse(body: string): Response {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
