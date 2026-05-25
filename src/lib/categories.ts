// Canonical category list. Order here = order in nav + homepage.
// Folder name under src/content/ = slug here.

import {
  Compass,
  Heart,
  Pill,
  Wrench,
  Sprout,
  Users,
  TestTube,
  Microscope,
  Link2,
  Info,
  type LucideIcon,
} from 'lucide-react';

export interface Category {
  slug: string;
  title: string;
  blurb: string;
  Icon: LucideIcon;
}

export const CATEGORIES = [
  {
    slug: 'start-here',
    title: 'Start Here',
    blurb: 'Welcome, how to use the site, withdrawal help, craving moments.',
    Icon: Compass,
  },
  {
    slug: 'for-you',
    title: 'For You',
    blurb: 'Treatment, work protections, mutual aid, sober living — for the person in recovery.',
    Icon: Heart,
  },
  {
    slug: 'mat-suboxone',
    title: 'MAT / Suboxone',
    blurb: 'COWS, induction, tapers, risks, custom dosing.',
    Icon: Pill,
  },
  {
    slug: 'other-tools',
    title: 'Helpful Medications / Supplements',
    blurb: 'Helper meds, supplements, quit-kit stacks, SR-17, naltrexone (normal, low, ultra-low), tapering with leaf.',
    Icon: Wrench,
  },
  {
    slug: 'post-acute',
    title: 'Post-Acute',
    blurb: 'PAWS, sleep recovery, dopamine recovery, cravings, hormones.',
    Icon: Sprout,
  },
  {
    slug: 'for-loved-ones',
    title: 'For Loved Ones',
    blurb: 'For family, partners, and friends of someone struggling — what to expect, how to help, how to stay safe.',
    Icon: Users,
  },
  {
    slug: 'compounds',
    title: 'Compounds',
    blurb: '7-OH, pseudo, MGM-15, MIT-A, mitragynine, cat’s claw.',
    Icon: TestTube,
  },
  {
    slug: 'pharmacology',
    title: 'Pharmacology',
    blurb: 'Deeper science — receptor binding, structure-activity, minor alkaloids.',
    Icon: Microscope,
  },
  {
    slug: 'resources',
    title: 'Resources',
    blurb: 'Telehealth providers, meetings, finding help.',
    Icon: Link2,
  },
  {
    slug: 'about',
    title: 'About This Site',
    blurb: 'What this site is, who runs it, how to contribute or send feedback.',
    Icon: Info,
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
