import type { Options, SearchOptions } from 'minisearch';

export type SearchResultType = 'Guide' | 'Calculator' | 'Meeting' | 'Compound' | 'Science' | 'Site';

export interface SearchSection {
  title: string;
  url: string;
  excerpt: string;
}

export interface SearchDocument {
  id: string;
  pageUrl: string;
  url: string;
  title: string;
  section: string;
  description: string;
  content: string;
  aliases: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  type: SearchResultType;
  priority: number;
  sections: SearchSection[];
}

export interface StoredSearchResult {
  id: string;
  pageUrl: string;
  url: string;
  title: string;
  section: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  type: SearchResultType;
  priority: number;
}

export const SEARCH_FIELDS = ['title', 'section', 'description', 'aliases', 'content'] as const;
export const SEARCH_STORE_FIELDS = [
  'id',
  'pageUrl',
  'url',
  'title',
  'section',
  'excerpt',
  'category',
  'categoryLabel',
  'type',
  'priority',
  'sections',
] as const;

/** Keep this term normalizer identical during index creation and client loading. */
export function normalizeSearchTerm(term: string): string {
  return term
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .toLocaleLowerCase('en-US');
}

export function getMiniSearchOptions(): Options<SearchDocument> {
  return {
    fields: [...SEARCH_FIELDS],
    storeFields: [...SEARCH_STORE_FIELDS],
    processTerm: normalizeSearchTerm,
  };
}

export const SEARCH_OPTIONS: SearchOptions = {
  boost: {
    title: 7,
    section: 5,
    aliases: 4.5,
    description: 2.25,
    content: 1,
  },
  prefix: (term) => term.length >= 2,
  fuzzy: (term) => (term.length >= 8 ? 0.2 : term.length >= 5 ? 1 : false),
  maxFuzzy: 2,
  combineWith: 'OR',
  boostDocument: (_id, _term, storedFields) => {
    const priority = Number(storedFields?.priority);
    return Number.isFinite(priority) && priority > 0 ? priority : 1;
  },
};

interface AliasRule {
  test: RegExp;
  aliases: string;
}

const ALIAS_RULES: AliasRule[] = [
  {
    test: /7-oh|7oh|withdrawal|start-here/,
    aliases: '7oh 7 oh 7-hydroxymitragynine seven oh krotom withdrawal withdrawl withdrawel wd detox',
  },
  {
    test: /suboxone|buprenorphine|sows-cows|bernese|sublocade|brixadi/,
    aliases: 'sub subs suboxone suboxen bupe bup buprenorphine buprenorfine MAT medication assisted treatment',
  },
  {
    test: /sows-cows|induction|precipitated|suboxone-isnt-working/,
    aliases: 'SOWS COWS PWD precipitated withdrawal precip withdrawl microinduction micro induction Bernese timing',
  },
  {
    test: /helper-meds|vitamins-supplements|mega-dose-vitamin-c|quit-kit/,
    aliases: 'helper meds helper medicine supplements vitamins clonidine clondine gabapentin gabapenten trazodone trazadone ondansetron zofran baclofen restless legs RLS vitamin c megadose ascorbic acid',
  },
  {
    test: /paws|post-acute|dopamine|anhedonia|depression|impending-doom|sleep-recovery/,
    aliases: 'PAWS post acute withdrawal anhedonia depression depressed doom anxiety panic sleep insomnia recovery timeline',
  },
  {
    test: /sr-17|sr-17018/,
    aliases: 'SR17 SR-17 SR17018 SR-17018 reset mode cross taper',
  },
  {
    test: /naltrexone|vivitrol/,
    aliases: 'LDN ULDN low dose naltrexone ultra low dose naltrexone Vivitrol opioid blocker',
  },
  {
    test: /crisis-hotlines|naloxone|narcan|safety/,
    aliases: 'emergency overdose overdosed narcan naloxone crisis suicidal suicide poison control not breathing blue lips unresponsive',
  },
  {
    test: /meeting|mutual-aid|community/,
    aliases: 'meeting meetings KA Kratom Anonymous NA Narcotics Anonymous SMART Recovery TIAWO support group zoom discord fellowship',
  },
  {
    test: /fmla|workplace|ada/,
    aliases: 'FMLA ADA work job leave disability employment medical leave',
  },
  { test: /mgm-?15/, aliases: 'MGM15 MGM-15 7-acetoxy mitragynine synthetic' },
  { test: /mgm-?16/, aliases: 'MGM16 MGM-16 synthetic' },
  { test: /mit-a|dhm|dihydromitragynine/, aliases: 'MITA MIT-A DHM dihydromitragynine synthetic' },
  { test: /pseudoindoxyl|pseudo/, aliases: 'pseudo pseudoindoxyl mitragynine pseudoindoxyl MP metabolite' },
  {
    test: /taper|tapering/,
    aliases: 'taper tapering tapper tappering schedule dose dosing reduction calculator',
  },
  {
    test: /cravings-and-relapse|kindling/,
    aliases: 'craving cravings relapse redose use again fuck its thinking about using urge',
  },
];

export function aliasesForSearchDocument(url: string, title: string, _body: string): string {
  // Attach aliases to the page they name, not every page that happens to
  // mention the same medicine or compound in its prose.
  const haystack = `${url} ${title}`.toLocaleLowerCase('en-US');
  return ALIAS_RULES.filter(({ test }) => test.test(haystack))
    .map(({ aliases }) => aliases)
    .join(' ');
}

export const SEARCH_QUICK_LINKS = [
  { href: '/start-here/7-oh-withdrawal-help', label: 'Withdrawal help', detail: 'A simple plan for the next hour' },
  { href: '/start-here/how-to-quit-7-oh', label: 'Compare quitting options', detail: 'See the documented paths off 7-OH' },
  { href: '/next-kratom-support-meeting', label: 'Find a meeting', detail: '7-OH and kratom support in your time zone' },
  { href: '/resources/taper-calculator', label: 'Taper calculators', detail: 'Build and adjust a dosing schedule' },
] as const;

export const SEARCH_EXAMPLE_QUERIES = [
  'withdrawal tonight',
  'helper medications',
  'Suboxone induction',
  'sleep after quitting',
] as const;

export const SEARCH_CATEGORY_OPTIONS = [
  { value: 'start-here', label: 'Start Here' },
  { value: 'for-you', label: 'For You' },
  { value: 'for-loved-ones', label: 'For Loved Ones' },
  { value: 'mat-suboxone', label: 'MAT / Suboxone' },
  { value: 'medications-supplements', label: 'Meds & Supplements' },
  { value: 'post-acute', label: 'Post-Acute' },
  { value: 'compounds', label: 'Compounds' },
  { value: 'pharmacology', label: 'Pharmacology' },
  { value: 'resources', label: 'Resources' },
  { value: 'about', label: 'Site & Community' },
] as const;

export const SEARCH_TYPE_OPTIONS: SearchResultType[] = [
  'Guide',
  'Calculator',
  'Meeting',
  'Compound',
  'Science',
  'Site',
];
