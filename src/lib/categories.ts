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
    blurb: 'Helper meds, supplements, quit-kit stacks, SR-17, naltrexone (normal, low, ultra-low), tapering with leaf.',
    Icon: Wrench,
    section: 'recovery',
  },
  {
    slug: 'post-acute',
    title: 'Post-Acute',
    blurb: 'PAWS, sleep recovery, dopamine recovery, cravings, hormones.',
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
    title: 'About This Site',
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
