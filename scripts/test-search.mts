import fs from 'node:fs';
import MiniSearch from 'minisearch';
import {
  getMiniSearchOptions,
  SEARCH_OPTIONS,
  type SearchDocument,
} from '../src/lib/search-config.ts';
import { getPinnedSearchResults, queryForSearchIndex } from '../src/lib/search-policy.ts';

interface Payload {
  version: number;
  index: unknown;
}

const indexPath = new URL('../dist/search-index.json', import.meta.url);
if (!fs.existsSync(indexPath)) {
  throw new Error('dist/search-index.json does not exist. Run npm run build before npm run test:search.');
}

const payload = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as Payload;
const miniSearch = MiniSearch.loadJSON<SearchDocument>(
  JSON.stringify(payload.index),
  getMiniSearchOptions(),
);

function rankedPages(query: string): string[] {
  const pinned = getPinnedSearchResults(query).map((result) => result.pageUrl);
  const pages = miniSearch.search(queryForSearchIndex(query) || query, SEARCH_OPTIONS).map((result) => String(result.pageUrl));
  return [...new Set([...pinned, ...pages])];
}

const rankingCases = [
  ['withdrawal tonight', '/start-here/7-oh-withdrawal-guide'],
  ['helper medications', '/medications-supplements/helper-meds'],
  ['clondine', '/medications-supplements/helper-meds'],
  ['precipitated withdrawl', '/mat-suboxone/sows-cows-induction-guide'],
  ['sleep after quitting', '/post-acute/sleep-recovery'],
  ['MGM15', '/compounds/mgm15'],
  ['pseudo', '/compounds/mitragynine-pseudoindoxyl'],
  ['taper calculator', '/resources/taper-calculator'],
  ['NA meeting', '/virtual-na-meetings-now'],
  ['SMART recovery', '/virtual-smart-meetings-now'],
  ['job protection', '/for-you/fmla-ada-job'],
  ['craving right now', '/start-here/cravings-and-relapse-thoughts'],
  ['I feel depressed but I am not suicidal', '/post-acute/depression-and-anhedonia'],
] as const;

const safetyCases = [
  ['I want to kill myself', '/resources/crisis-hotlines'],
  ['mixed 7oh with xanax and very sleepy', '/resources/crisis-hotlines'],
  ['my partner threatened me with a gun at home', '/for-loved-ones/safety'],
] as const;

const failures: string[] = [];

for (const [query, expected] of [...rankingCases, ...safetyCases]) {
  const actual = rankedPages(query)[0];
  const passed = actual === expected;
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${query} -> ${actual ?? '(none)'}`);
  if (!passed) failures.push(`“${query}” expected ${expected}, received ${actual ?? '(none)'}`);
}

for (const query of ['I feel depressed but I am not suicidal', 'general anxiety help', 'withdrawal help']) {
  const pins = getPinnedSearchResults(query);
  const passed = pins.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'}  no urgent pin for: ${query}`);
  if (!passed) failures.push(`“${query}” unexpectedly triggered ${pins[0]?.pageUrl}`);
}

const changelogPresent = miniSearch.search('changelog', SEARCH_OPTIONS)
  .some((result) => result.pageUrl === '/about/changelog');
console.log(`${changelogPresent ? 'FAIL' : 'PASS'}  changelog route excluded from the index`);
if (changelogPresent) failures.push('The public changelog appeared in MiniSearch results.');

if (failures.length) {
  console.error(`\n${failures.length} search regression${failures.length === 1 ? '' : 's'} failed:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`\nAll ${rankingCases.length + safetyCases.length + 4} search regressions passed.`);
}
