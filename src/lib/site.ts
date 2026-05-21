export const SITE = {
  title: 'quitting7oh',
  domain: 'quitting7oh.org',
  url: 'https://quitting7oh.org',
  description:
    'Community recovery information for people quitting 7-OH, kratom synthetics, and related opioid dependence.',
  // Repo used for "Edit this page on GitHub" links. Update once the repo is created.
  repo: 'https://github.com/quitting7oh/quitting7oh.org',
  branch: 'main',
  // Path inside the repo where content lives. Used to construct edit links.
  contentRoot: 'src/content',
} as const;

export function editOnGithubUrl(filePath: string): string {
  // filePath looks like "start-here/welcome.md"
  return `${SITE.repo}/edit/${SITE.branch}/${SITE.contentRoot}/${filePath}`;
}
