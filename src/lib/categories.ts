// Canonical category list. Order here = order in nav + homepage.
// Folder name under src/content/ = slug here.

export interface Category {
  slug: string;
  title: string;
  blurb: string;
  emoji: string;
}

export const CATEGORIES = [
  {
    slug: 'start-here',
    title: 'Start Here',
    blurb: 'Welcome, what to expect, SOS, scams to avoid.',
    emoji: '🧭',
  },
  {
    slug: 'for-you',
    title: 'For You',
    blurb: 'Treatment, work protections, mutual aid, sober living — for the person in recovery.',
    emoji: '💚',
  },
  {
    slug: 'mat-suboxone',
    title: 'MAT / Suboxone',
    blurb: 'COWS, induction, tapers, risks, custom dosing.',
    emoji: '💊',
  },
  {
    slug: 'other-tools',
    title: 'Helpful Medications / Supplements',
    blurb: 'Helper meds, supplements, quit-kit stacks, SR-17, low-dose naltrexone, tapering with leaf.',
    emoji: '🛠️',
  },
  {
    slug: 'post-acute',
    title: 'Post-Acute',
    blurb: 'PAWS, sleep recovery, dopamine recovery, cravings, hormones.',
    emoji: '🌱',
  },
  {
    slug: 'for-loved-ones',
    title: 'For Loved Ones',
    blurb: 'For family, partners, and friends of someone struggling — what to expect, how to help, how to stay safe.',
    emoji: '🫂',
  },
  {
    slug: 'compounds',
    title: 'Compounds',
    blurb: '7-OH, pseudo, MGM-15, MIT-A, mitragynine, cat’s claw.',
    emoji: '🧪',
  },
  {
    slug: 'pharmacology',
    title: 'Pharmacology',
    blurb: 'Deeper science — receptor binding, structure-activity, minor alkaloids.',
    emoji: '🔬',
  },
  {
    slug: 'resources',
    title: 'Resources',
    blurb: 'QuickMD and other telehealth, meetings, finding help.',
    emoji: '🔗',
  },
  {
    slug: 'about',
    title: 'About This Site',
    blurb: 'What this site is, who runs it, how to contribute or send feedback.',
    emoji: 'ℹ️',
  },
] as const satisfies readonly Category[];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [
  (typeof CATEGORIES)[number]['slug'],
  ...(typeof CATEGORIES)[number]['slug'][],
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
