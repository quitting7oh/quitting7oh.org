import { SITE } from './site.ts';

export const REDDIT_POST_ROWS = [
  [
    {
      label: 'Mega-Dose Vitamin C',
      path: '/medications-supplements/mega-dose-vitamin-c',
    },
  ],
  [
    {
      label: 'Helper medications',
      path: '/medications-supplements/helper-meds',
    },
  ],
  [
    {
      label: 'Quitting with kratom leaf',
      path: '/medications-supplements/quit-7-oh-with-kratom-leaf',
    },
  ],
  [
    {
      label: 'Buprenorphine/Suboxone guide',
      path: '/mat-suboxone/suboxone-for-7oh',
    },
    {
      label: 'SOWS/COWS induction timing',
      path: '/mat-suboxone/sows-cows-induction-guide',
    },
  ],
  [
    {
      label: 'Taper calculators',
      path: '/resources/taper-calculator',
    },
    {
      label: '7-OH and kratom support meetings',
      path: '/next-kratom-support-meeting',
    },
  ],
] as const;

export function buildQuickstartRedditPost(): string {
  const rows = REDDIT_POST_ROWS.map((links) => {
    const linkedItems = links.map(
      ({ label, path }) => `[${label}](${SITE.url}${path})`,
    );
    return `- ${linkedItems.join(' and ')}`;
  });

  return ['**7-OH withdrawal: getting-started links**', '', ...rows].join('\n');
}
