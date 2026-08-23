import MiniSearch from 'minisearch';
import { getCollection, render } from 'astro:content';
import { getCategory } from '~/lib/categories';
import {
  aliasesForSearchDocument,
  getMiniSearchOptions,
  type SearchDocument,
  type SearchResultType,
} from '~/lib/search-config';

export const prerender = true;

interface SpecialPage {
  url: string;
  title: string;
  description: string;
  content: string;
  aliases: string;
  category: string;
  categoryLabel: string;
  type: SearchResultType;
  priority: number;
}

const SPECIAL_PAGES: SpecialPage[] = [
  {
    url: '/next-kratom-support-meeting',
    title: 'Next 7-OH and kratom support meeting',
    description: 'See the next live Kratom Anonymous or TIAWO meeting in your local time and join from any device.',
    content: 'Live virtual 7-OH and kratom recovery support. Free, no signup, local timezone, Kratom Anonymous, TIAWO.',
    aliases: 'meeting meetings live now KA Kratom Anonymous TIAWO There Is A Way Out 7OH support zoom',
    category: 'resources',
    categoryLabel: 'Resources',
    type: 'Meeting',
    priority: 1.55,
  },
  {
    url: '/virtual-na-meetings-now',
    title: 'Virtual NA meetings happening now',
    description: 'Find a Narcotics Anonymous meeting that is live or starting soon in your local time zone.',
    content: 'Virtual Narcotics Anonymous meetings, open and closed meetings, Zoom, 24 hours a day, local time.',
    aliases: 'NA Narcotics Anonymous meeting meetings live now 24 7 24x7 zoom mutual aid support group',
    category: 'resources',
    categoryLabel: 'Resources',
    type: 'Meeting',
    priority: 1.45,
  },
  {
    url: '/virtual-smart-meetings-now',
    title: 'Virtual SMART Recovery meetings happening now',
    description: 'Find a SMART Recovery meeting that is live or starting soon in your local time zone.',
    content: 'Virtual SMART Recovery meetings, non-12-step mutual aid, online meeting, local time.',
    aliases: 'SMART SMART Recovery meeting meetings live now non 12 step online mutual aid support group',
    category: 'resources',
    categoryLabel: 'Resources',
    type: 'Meeting',
    priority: 1.4,
  },
  {
    url: '/sitemap',
    title: 'Complete site map',
    description: 'Browse every guide, reference page, calculator, and community resource on quitting7oh.org.',
    content: 'All pages, complete guide index, site directory, browse by topic.',
    aliases: 'sitemap site map all pages index directory browse everything',
    category: 'about',
    categoryLabel: 'Site & Community',
    type: 'Site',
    priority: 0.85,
  },
];

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#')) {
      const hexadecimal = code[1]?.toLowerCase() === 'x';
      const numeric = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function markdownToText(markdown: string): string {
  return decodeEntities(markdown)
    .replace(/^---[\s\S]*?---\s*/m, ' ')
    .replace(/^\s*(?:import|export)\s+.*$/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}(?:[-+*]|\d+[.)])\s+/gm, '')
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, ' ')
    .replace(/[|]/g, ' ')
    .replace(/[*_~`>#]/g, ' ')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(text: string, maximum = 280): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maximum) return clean;
  const shortened = clean.slice(0, maximum + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > maximum * 0.7 ? lastSpace : maximum).trim()}…`;
}

function resultType(url: string, category: string, title: string): SearchResultType {
  if (/calculator/i.test(url) || /calculator/i.test(title)) return 'Calculator';
  if (/meeting/i.test(url) || /meeting/i.test(title)) return 'Meeting';
  if (category === 'compounds') return 'Compound';
  if (category === 'pharmacology') return 'Science';
  if (category === 'about') return 'Site';
  return 'Guide';
}

function resultPriority(url: string): number {
  if (url === '/resources/crisis-hotlines') return 1.9;
  if (url === '/start-here/7-oh-withdrawal-help') return 1.75;
  if (url === '/start-here/7-oh-withdrawal-guide') return 1.65;
  if (url === '/start-here/7-oh-withdrawal-quickstart') return 1.2;
  if (url === '/start-here/how-to-quit-7-oh') return 1.55;
  if (url === '/resources/taper-calculator') return 1.4;
  if (url === '/medications-supplements/helper-meds') return 1.35;
  if (url === '/mat-suboxone/sows-cows-induction-guide') return 1.35;
  return 1;
}

export async function GET() {
  const entries = await getCollection('docs', (doc) => !doc.data.draft && doc.id !== 'about/changelog');
  const documents: SearchDocument[] = [];

  for (const doc of entries) {
    const slug = doc.id.split('/').pop()!;
    const pageUrl = `/${doc.data.category}/${slug}`;
    const categoryLabel = getCategory(doc.data.category)?.title ?? doc.data.category;
    const body = doc.body ?? '';
    const plainBody = markdownToText(body);
    const aliases = aliasesForSearchDocument(pageUrl, doc.data.title, plainBody);
    const type = resultType(pageUrl, doc.data.category, doc.data.title);
    const priority = resultPriority(pageUrl);

    const rendered = await render(doc);
    const h2Headings = rendered.headings.filter((heading) => heading.depth === 2);
    const headingMatches = [...body.matchAll(/^##\s+(.+)$/gm)];
    const sections = headingMatches.flatMap((match, index) => {
      const heading = h2Headings[index];
      if (!heading) return [];
      const sectionStart = (match.index ?? 0) + match[0].length;
      const sectionEnd = headingMatches[index + 1]?.index ?? body.length;
      const sectionContent = markdownToText(body.slice(sectionStart, sectionEnd));
      if (sectionContent.length < 32) return [];
      return [{
        title: heading.text,
        url: `${pageUrl}#${heading.slug}`,
        excerpt: excerpt(sectionContent, 190),
      }];
    });

    documents.push({
      id: `page:${doc.id}`,
      pageUrl,
      url: pageUrl,
      title: doc.data.title,
      section: '',
      description: doc.data.description,
      content: plainBody,
      aliases,
      excerpt: doc.data.description || excerpt(plainBody),
      category: doc.data.category,
      categoryLabel,
      type,
      priority,
      sections,
    });
  }

  for (const page of SPECIAL_PAGES) {
    documents.push({
      id: `special:${page.url}`,
      pageUrl: page.url,
      url: page.url,
      title: page.title,
      section: '',
      description: page.description,
      content: page.content,
      aliases: page.aliases,
      excerpt: page.description,
      category: page.category,
      categoryLabel: page.categoryLabel,
      type: page.type,
      priority: page.priority,
      sections: [],
    });
  }

  const miniSearch = new MiniSearch<SearchDocument>(getMiniSearchOptions());
  miniSearch.addAll(documents);

  const payload = JSON.stringify({
    version: 1,
    pageCount: entries.length + SPECIAL_PAGES.length,
    recordCount: documents.length,
    index: miniSearch.toJSON(),
  });

  return new Response(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  });
}
