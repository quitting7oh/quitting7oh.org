export const SITE = {
  title: 'quitting7oh',
  domain: 'quitting7oh.org',
  url: 'https://quitting7oh.org',
  description:
    'Recovery information for people coming off 7-OH, MGM-15, and kratom-derived synthetics — taper plans, MAT options, helper meds, PAWS guides.',
  // Repo used for the "View source on GitHub" links. Readers can hit the
  // pencil icon themselves on GitHub if they want to propose a PR.
  repo: 'https://github.com/quitting7oh/quitting7oh.org',
  branch: 'main',
  // Path inside the repo where content lives. Used to construct view links.
  contentRoot: 'src/content',
} as const;

export function viewOnGithubUrl(filePath: string): string {
  // filePath looks like "start-here/welcome.md"
  return `${SITE.repo}/blob/${SITE.branch}/${SITE.contentRoot}/${filePath}`;
}
