// Schema.org JSON-LD builders. BaseLayout always emits the site-wide
// Organization + WebSite graph; page layouts pass extra nodes that point
// back at those through stable @ids.

import { SITE } from './site';

export const ORGANIZATION_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

type Node = Record<string, unknown>;

export interface BreadcrumbItem {
  label: string;
  /** Site-relative path. Omit for the current page (uses `pageUrl`). */
  href?: string;
}

/** Absolute URL in the canonical no-trailing-slash form. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** `YYYY-MM-DD` from a front-matter date (parsed as UTC midnight). */
export function isoDate(date: Date | undefined): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function siteGraph(): Node[] {
  return [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: `${SITE.title}.org`,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/favicons/stone/icon-512.png'),
        width: 512,
        height: 512,
      },
      sameAs: ['https://discord.gg/FDJuEPcQz5', 'https://www.reddit.com/r/quitting7oh/'],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: `${SITE.title}.org`,
      url: SITE.url,
      description: SITE.description,
      inLanguage: 'en',
      publisher: { '@id': ORGANIZATION_ID },
      // /search reads ?q= on load and runs the query (SearchBox.tsx).
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE.url}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export function breadcrumbNode(pageUrl: string, crumbs: BreadcrumbItem[]): Node {
  const all: BreadcrumbItem[] = [{ label: 'Home', href: '/' }, ...crumbs];
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: all.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: crumb.href ? absoluteUrl(crumb.href) : pageUrl,
    })),
  };
}

export function pageNode(opts: {
  type: 'WebPage' | 'MedicalWebPage' | 'CollectionPage';
  url: string;
  name: string;
  description?: string;
  dateModified?: Date;
  breadcrumb?: boolean;
}): Node {
  const node: Node = {
    '@type': opts.type,
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    headline: opts.type === 'CollectionPage' ? undefined : opts.name,
    description: opts.description || undefined,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    dateModified: isoDate(opts.dateModified),
    breadcrumb: opts.breadcrumb ? { '@id': `${opts.url}#breadcrumb` } : undefined,
  };
  // JSON.stringify drops undefined values; strip them here too so the
  // object is clean for anyone inspecting it.
  for (const key of Object.keys(node)) if (node[key] === undefined) delete node[key];
  return node;
}

/** Categories whose pages are health/medical reference content. */
const MEDICAL_CATEGORIES = new Set([
  'start-here',
  'mat-suboxone',
  'medications-supplements',
  'post-acute',
  'compounds',
  'pharmacology',
]);

export function pageTypeFor(category: string): 'WebPage' | 'MedicalWebPage' {
  return MEDICAL_CATEGORIES.has(category) ? 'MedicalWebPage' : 'WebPage';
}

/** Serialize for a <script type="application/ld+json"> body. Escaping `<`
 *  keeps content like "</script>" from closing the tag early. */
export function serializeJsonLd(nodes: Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(
    /</g,
    '\\u003c',
  );
}
