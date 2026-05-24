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
    blurb: 'Welcome, what to expect, scams to avoid.',
    emoji: '🧭',
  },
  {
    slug: 'for-you',
    title: 'For You',
    blurb: 'Treatment, work protections, mutual aid, sober living — for the person in recovery.',
    emoji: '💚',
  },
  {
    slug: 'for-loved-ones',
    title: 'For Loved Ones',
    blurb: 'For family, partners, and friends of someone struggling — what to expect, how to help, how to stay safe.',
    emoji: '🫂',
  },
  {
    slug: 'active-withdrawal',
    title: 'Active Withdrawal',
    blurb: 'SOS resources, day 1–3, symptoms, supplements, helper meds.',
    emoji: '🆘',
  },
  {
    slug: 'compounds',
    title: 'Compounds',
    blurb: '7-OH, pseudo, MGM-15, MIT-A, mitragynine, cat’s claw.',
    emoji: '🧪',
  },
  {
    slug: 'mat-suboxone',
    title: 'MAT / Suboxone',
    blurb: 'COWS, induction, tapers, risks, custom dosing.',
    emoji: '💊',
  },
  {
    slug: 'other-tools',
    title: 'Other Tools',
    blurb: 'SR-17018, low-dose naltrexone, vitamin C, tapering with leaf.',
    emoji: '🛠️',
  },
  {
    slug: 'post-acute',
    title: 'Post-Acute',
    blurb: 'PAWS, sleep recovery, dopamine recovery, cravings, hormones.',
    emoji: '🌱',
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
] as const satisfies readonly Category[];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [
  (typeof CATEGORIES)[number]['slug'],
  ...(typeof CATEGORIES)[number]['slug'][],
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
