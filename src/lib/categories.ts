// Canonical category list. Order here = order in nav + homepage.
// Folder name under src/content/ = slug here.

import {
  Compass,
  Heart,
  Users,
  Pill,
  Wrench,
  Sprout,
  TestTube,
  Microscope,
  Link2,
  Info,
  type LucideIcon,
} from 'lucide-react';

/** Two-mode site structure: 'recovery' categories carry the active
 *  what-to-do-right-now content; 'reference' categories are deeper
 *  pharmacology, compound info, external resources, and meta. The
 *  sidebar uses this to draw a visual separator between modes. */
export type CategorySection = 'recovery' | 'reference';

export interface Category {
  slug: string;
  title: string;
  blurb: string;
  Icon: LucideIcon;
  section: CategorySection;
}

export const CATEGORIES = [
  {
    slug: 'start-here',
    title: 'Start Here',
    blurb: 'Welcome, how to use the site, withdrawal help, craving moments.',
    Icon: Compass,
    section: 'recovery',
  },
  {
    slug: 'for-you',
    title: 'For You',
    blurb: 'Treatment, work protections, mutual aid, sober living, for the person in recovery.',
    Icon: Heart,
    section: 'recovery',
  },
  {
    slug: 'for-loved-ones',
    title: 'For Loved Ones',
    blurb: 'For family, partners, and friends of someone struggling: what to expect, how to help, how to stay safe.',
    Icon: Users,
    section: 'recovery',
  },
  {
    slug: 'mat-suboxone',
    title: 'MAT / Suboxone',
    blurb: 'COWS, induction, tapers, risks, custom dosing.',
    Icon: Pill,
    section: 'recovery',
  },
  {
    slug: 'other-tools',
    title: 'Adjuncts & Supplements',
    blurb: 'Helper meds, supplements, quit-kit stacks, SR-17, NAD+ IV, peptides, tapering with leaf.',
    Icon: Wrench,
    section: 'recovery',
  },
  {
    slug: 'post-acute',
    title: 'Post-Acute',
    blurb: 'PAWS, sleep recovery, dopamine recovery, endocrine recovery, naltrexone.',
    Icon: Sprout,
    section: 'recovery',
  },
  {
    slug: 'compounds',
    title: 'Compounds',
    blurb: '7-OH, pseudo, MGM-15, MIT-A, mitragynine, cat’s claw.',
    Icon: TestTube,
    section: 'reference',
  },
  {
    slug: 'pharmacology',
    title: 'Pharmacology',
    blurb: 'Deeper science: receptor binding, structure-activity, minor alkaloids.',
    Icon: Microscope,
    section: 'reference',
  },
  {
    slug: 'resources',
    title: 'Resources',
    blurb: 'Telehealth providers, meetings, finding help.',
    Icon: Link2,
    section: 'reference',
  },
  {
    slug: 'about',
    title: 'Site & Community',
    blurb: 'What this site is, who runs it, how to contribute or send feedback.',
    Icon: Info,
    section: 'reference',
  },
] as const satisfies readonly Category[];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [
  (typeof CATEGORIES)[number]['slug'],
  ...(typeof CATEGORIES)[number]['slug'][],
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Client-safe icon lookup: AppSidebar receives JSON-serializable props
 *  (slug strings), then resolves the icon component locally. Avoids
 *  trying to send a React component reference across the Astro→React
 *  client:load bridge, which silently breaks hydration. */
export function getCategoryIcon(slug: string): LucideIcon | undefined {
  return CATEGORIES.find((c) => c.slug === slug)?.Icon;
}

/** Same JSON-bridge concern as getCategoryIcon: AppSidebar reads section
 *  here rather than receiving it via props. */
export function getCategorySection(slug: string): CategorySection | undefined {
  return CATEGORIES.find((c) => c.slug === slug)?.section;
}

/** Pinned at the top of the sidebar on every page. Mirrors the homepage
 *  funnel for cross-page persistence so a reader doesn't have to navigate
 *  back to / to find the high-traffic destinations again. Keep this list
 *  short (6 max) — these are shortcuts, not a nav tree. */
export const PINNED_PAGES: { href: string; title: string }[] = [
  { href: '/start-here/7-oh-withdrawal-help', title: 'In active withdrawal' },
  { href: '/other-tools/vitamins-supplements', title: 'Vitamins & Supplements' },
  { href: '/other-tools/mega-dose-vitamin-c', title: 'Mega-Dose Vitamin C' },
  { href: '/other-tools/helper-meds', title: 'Helper Medications' },
  { href: '/other-tools/quit-7-oh-with-kratom-leaf', title: 'Quit 7-OH with Kratom' },
  { href: '/mat-suboxone/suboxone-for-7oh', title: 'Suboxone' },
  { href: '/start-here/cravings-and-relapse-thoughts', title: 'Thinking about using?' },
];

/** Sub-groupings inside long categories. Each entry maps a group name
 *  to the page slugs (just the file basename, without .md) that belong
 *  to that group, in display order.
 *
 *  Categories not listed here render flat. Pages not listed in any group
 *  are dropped from the sidebar — keep these lists in sync when adding
 *  pages to a grouped category. */
export const CATEGORY_GROUPS: Record<string, { name: string; slugs: string[] }[]> = {
  'mat-suboxone': [
    { name: 'Getting on bupe', slugs: ['suboxone-for-7oh', 'sows-cows-induction-guide', 'suboxone-bernese-method'] },
    { name: 'Coming off', slugs: ['suboxone-rapid-taper', 'suboxone-custom-dose'] },
    { name: 'Long-term', slugs: ['sublocade-brixadi', 'long-term-suboxone-risks'] },
    { name: 'Troubleshooting', slugs: ['why-suboxone-isnt-working'] },
  ],
  'for-loved-ones': [
    { name: 'Orientation', slugs: ['welcome', 'what-to-expect', 'how-to-talk'] },
    { name: 'Boundaries & safety', slugs: ['boundaries', 'safety', 'asking-them-to-leave'] },
    { name: 'Day-to-day', slugs: ['at-home-recovery', 'rehabilitation-centers', 'fmla-workplace'] },
    { name: 'For yourself', slugs: ['taking-care-of-yourself', 'support-groups'] },
  ],
  'other-tools': [
    { name: 'Helper meds & supplements', slugs: ['helper-meds', 'vitamins-supplements', 'quit-kit', 'mega-dose-vitamin-c', 'nad-iv-therapy', 'peptides-for-withdrawal'] },
    { name: 'Other ways off 7-OH', slugs: ['quit-7-oh-with-kratom-leaf', 'quit-7-oh-with-mitragynine', 'sr-17'] },
    { name: 'Lifestyle', slugs: ['cannabis-thc-in-recovery'] },
  ],
  'post-acute': [
    { name: 'The map', slugs: ['paws-post-acute-withdrawal'] },
    { name: 'Specific symptoms', slugs: ['pink-cloud', 'dopamine-recovery', 'depression-and-anhedonia', 'impending-doom-anxiety', 'sleep-recovery', 'endocrine-recovery'] },
    { name: 'Naltrexone', slugs: ['naltrexone', 'naltrexone-normal-dose', 'naltrexone-low-dose', 'naltrexone-ultra-low-dose'] },
    { name: 'Long view', slugs: ['kindling-and-relapse', '7-oh-recovery-timeline'] },
  ],
};

